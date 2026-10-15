<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskGroup;
use App\Models\TaskGroupEvent;
use App\Models\User;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class TaskGroupFlagService
{
    /** တစ်ကြိမ်တည်း migration မှာ ထိတွေ့နိုင်တဲ့ task အများဆုံး (MVP မှာ background job မရှိသေးလို့) */
    public const MAX_MIGRATION_TASKS = 5000;

    private const COLUMNS = [
        'initial'   => 'is_initial',
        'completed' => 'is_completed',
    ];

    public function __construct(
    protected TaskGroupRepositoryInterface $groups,
    protected TaskRepositoryInterface $tasks
    ) {}

    /**
     * Confirm မတိုင်ခင် ပြမယ့် preview။
     *
     * @return array{
     *     flag: string,
     *     current: array{id: int, name: string}|null,
     *     target: array{id: int, name: string},
     *     blockers: string[],
     *     impact: array<string, mixed>
     * }
     */
    public function preview(string $flag, TaskGroup $target): array
    {
        $column = $this->column($flag);
        $current = $this->groups->holderOf($column);
        $impact = $this->impact($flag, $current, $target);

        return [
            'flag'     => $flag,
            'current'  => $current ? ['id' => $current->id, 'name' => $current->name] : null,
            'target'   => ['id' => $target->id, 'name' => $target->name],
            'blockers' => $this->blockers($flag, $current, $target, $impact),
            'impact'   => $impact,
        ];
    }

    public function change(User $actor, string $flag, TaskGroup $target): TaskGroup
    {
        $column = $this->column($flag);

        return DB::transaction(function () use ($actor, $flag, $column, $target) {
            $this->groups->lockAll();

            $fresh = $target->fresh();
            $current = $this->groups->holderOf($column);
            $impact = $this->impact($flag, $current, $fresh);

            if ($blockers = $this->blockers($flag, $current, $fresh, $impact)) {
                throw ValidationException::withMessages(['group' => $blockers[0]]);
            }

            $moved = 0;
            $marked = 0;

            if ($flag === 'completed') {
                // Flag မလွှဲခင် task တွေကို ရွှေ့မယ်၊ အားလုံး transaction တစ်ခုတည်းထဲမှာ
                [$moved, $marked] = $this->migrateCompletedTasks($current, $fresh, now());
            }

            $this->groups->moveFlag($column, $current, $fresh);

            $this->groups->recordEvent(
                $fresh,
                $actor->id,
                $flag === 'initial' ? TaskGroupEvent::INITIAL_CHANGED : TaskGroupEvent::COMPLETED_CHANGED,
                [
                    'from'                   => $current ? ['id' => $current->id, 'name' => $current->name] : null,
                    'to'                     => ['id' => $fresh->id, 'name' => $fresh->name],
                    'tasks_moved'            => $moved,
                    'tasks_marked_completed' => $marked,
                ]
            );

            return $fresh->refresh();
        });
    }

    /**
     * @return array{
     *     moves_tasks: bool,
     *     tasks_to_move: int,
     *     tasks_becoming_completed: int,
     *     total_migrated: int,
     *     limit: int,
     *     exceeds_limit: bool
     * }
     */
    protected function impact(string $flag, ?TaskGroup $current, TaskGroup $target): array
    {
        // Initial ပြောင်းတာက task မရွှေ့ဘူး၊ flag ပဲ လွှဲတာ
        if ($flag === 'initial') {
            return [
                'moves_tasks'              => false,
                'tasks_to_move'            => 0,
                'tasks_becoming_completed' => 0,
                'total_migrated'           => 0,
                'limit'                    => self::MAX_MIGRATION_TASKS,
                'exceeds_limit'            => false,
            ];
        }

        $toMove = $current ? $this->countTasks($current) : 0;
        $becoming = $this->countTasks($target);
        $total = $toMove + $becoming;

        return [
            'moves_tasks'              => true,
            'tasks_to_move'            => $toMove,
            'tasks_becoming_completed' => $becoming,
            'total_migrated'           => $total,
            'limit'                    => self::MAX_MIGRATION_TASKS,
            'exceeds_limit'            => $total > self::MAX_MIGRATION_TASKS,
        ];
    }

    /**
     * @return string[]
     */
    protected function blockers(string $flag, ?TaskGroup $current, TaskGroup $target, array $impact): array
    {
        $label = ucfirst($flag);
        $blockers = [];
        if ($target->isArchived()) {
            $blockers[] = 'Only an active group can be chosen.';

            return $blockers;
        }

        if ($current && $current->id === $target->id) {
            $blockers[] = "This group is already the {$label} group.";

            return $blockers;
        }

        // Group တစ်ခုတည်းက Initial ရော Completed ရော မဖြစ်ရ
        if ($flag === 'initial' && $target->is_completed) {
            $blockers[] = 'The Completed group cannot also be the Initial group. Change the Completed group first.';
        }

        if ($flag === 'completed' && $target->is_initial) {
            $blockers[] = 'The Initial group cannot also be the Completed group. Change the Initial group first.';
        }

        if ($impact['exceeds_limit']) {
            $blockers[] = sprintf(
                'This change would move or update %s tasks, which is above the limit of %s for a single change. '
                .'Reduce the number of tasks in these groups first.',
                number_format($impact['total_migrated']),
                number_format($impact['limit'])
            );
        }

        return $blockers;
    }

    protected function countTasks(TaskGroup $group): int
    {
        return $this->tasks->countInGroup($group->id);
    }

    /**
     * @return array{0: int, 1: int} [ရွှေ့လိုက်တဲ့ task အရေအတွက်, completed_at အသစ်သတ်မှတ်ခံရတဲ့ task အရေအတွက်]
     */
    protected function migrateCompletedTasks(?TaskGroup $from, TaskGroup $to, CarbonInterface $now): array
    {
        // ၁။ Group အသစ်ထဲမှာ ရှိပြီးသား task တွေကို migration time နဲ့ completed ဖြစ်စေမယ်။
        //    ရွှေ့မယ့် task တွေ မဝင်ခင် အရင်လုပ်ရမယ် (မဟုတ်ရင် ရွှေ့လာတဲ့ task တွေရဲ့ မူလ completed_at ပါ ပျက်မယ်)
        $marked = $this->tasks->countInGroup($to->id);
        $this->tasks->setCompletedAtInGroup($to->id, $now);

        // ၂။ မူလ Completed group ထဲက task အားလုံး (archived ပါ) ကို ရွှေ့မယ်၊ completed_at မထိဘူး
        $moved = 0;

        if ($from) {
            $moved = $this->tasks->countInGroup($from->id);
            $this->tasks->appendGroupTasks($from->id, $to->id);
        }

        return [$moved, $marked];
    }

    protected function column(string $flag): string
    {
        return self::COLUMNS[$flag] ?? throw new InvalidArgumentException("Unknown group flag [{$flag}].");
    }
}