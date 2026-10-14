<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskGroup;
use App\Models\User;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
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
        protected TaskGroupRepositoryInterface $groups
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

        return DB::transaction(function () use ($flag, $column, $target) {
            // Group row အားလုံးကို lock လုပ်ပြီးမှ state ကို ပြန်စစ်မယ်
            $this->groups->lockAll();

            $fresh = $target->fresh();
            $current = $this->groups->holderOf($column);
            $impact = $this->impact($flag, $current, $fresh);

            if ($blockers = $this->blockers($flag, $current, $fresh, $impact)) {
                throw ValidationException::withMessages(['group' => $blockers[0]]);
            }

            if ($flag === 'completed') {
                // Flag မလွှဲခင် task တွေကို ရွှေ့မယ်၊ အားလုံး transaction တစ်ခုတည်းထဲမှာ
                $this->migrateCompletedTasks($current, $fresh, now());
            }

            $this->groups->moveFlag($column, $current, $fresh);

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

    /**
     * TODO (Tasks module): group ထဲက task အရေအတွက်။ Archived task နဲ့ Completed/Archived project ထဲက task ပါ ပါမယ်။
     */
    protected function countTasks(TaskGroup $group): int
    {
        return Task::query()->where('group_id', $group->id)->count();
    }

    /**
     * TODO (Tasks module): $from ထဲက task အားလုံးကို $to ဆီ ရွှေ့မယ်။
     *   - System-level: Archived task နဲ့ Completed/Archived project ထဲက task ပါ ပါမယ်၊ read-only စည်းမျဉ်းကို ကျော်မယ်။
     *   - ရွှေ့တဲ့ task တွေရဲ့ ရှိပြီးသား completed_at ကို မပြောင်းဘူး။
     *   - $to ထဲမှာ အရင်ကတည်းက ရှိနေတဲ့ task တွေရဲ့ completed_at ကို $now (migration time) အဖြစ် သတ်မှတ်မယ်။
     *   - ရွှေ့တဲ့ task တွေကို $to ရဲ့ နောက်ဆုံးနေရာကနေ ဆက်စီမယ် (sort position)။
     */
    protected function migrateCompletedTasks(?TaskGroup $from, TaskGroup $to, CarbonInterface $now): void
    {
        // ယာယီ guard: Task ရွှေ့တာနဲ့ completed_at သတ်မှတ်တာကို Step 10 မှာ ရေးမယ်။
        $ids = array_filter([$from?->id, $to->id]);

        if (Task::query()->whereIn('group_id', $ids)->exists()) {
            throw ValidationException::withMessages([
                'group' => 'Changing the Completed group is not available yet while tasks exist in the groups involved.',
            ]);
        }
    }

    protected function column(string $flag): string
    {
        return self::COLUMNS[$flag] ?? throw new InvalidArgumentException("Unknown group flag [{$flag}].");
    }
}