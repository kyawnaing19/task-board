<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskGroup;
use App\Models\TaskGroupEvent;
use App\Models\User;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskGroupService
{
    public const MIN_ACTIVE_GROUPS = 2;

    public function __construct(
    protected TaskGroupRepositoryInterface $groups,
    protected TaskRepositoryInterface $tasks
) {}

    public function create(User $actor, array $data): TaskGroup
    {
        return DB::transaction(function () use ($actor, $data) {
            $this->groups->lockAll();

            $this->assertNameAvailable($data['name']);

            // Flag မပါဘဲ အစွန်ဆုံးမှာ ဖန်တီးမယ်
            return $this->groups->create([
                'name'       => $data['name'],
                'color'      => $data['color'],
                'sort_order' => $this->groups->nextSortOrder(),
                'created_by' => $actor->id,
            ]);
        });
    }

    /** နာမည်နဲ့ အရောင်ပဲ ပြင်လို့ရမယ်။ Flag နဲ့ နေရာကို မထိဘူး။ */
    public function update(TaskGroup $group, array $data): TaskGroup
    {
        return DB::transaction(function () use ($group, $data) {
            $this->groups->lockAll();

            $fresh = $group->fresh();
            $this->assertActive($fresh, 'Archived groups cannot be edited. Restore the group first.');
            $this->assertNameAvailable($data['name'], $fresh->id);

            return $this->groups->update($fresh, [
                'name'  => $data['name'],
                'color' => $data['color'],
            ]);
        });
    }

    /**
     * Active group အားလုံးရဲ့ id စာရင်းကို လိုချင်တဲ့အစဉ်အတိုင်း ပို့မယ်။
     * တစ်ခုတလေ ပျောက်နေရင်/ပိုနေရင် ပယ်မယ် (ကြားထဲမှာ တခြားသူ archive လုပ်သွားတာမျိုး)။
     *
     * @param int[] $ids
     */
    public function reorder(array $ids): void
    {
        $ids = array_values(array_map('intval', $ids));

        DB::transaction(function () use ($ids) {
            $active = $this->groups->lockAll()->filter(fn (TaskGroup $g) => ! $g->isArchived());

            $expected = $active->pluck('id')->sort()->values()->all();
            $given = collect($ids)->sort()->values()->all();

            if ($expected !== $given) {
                throw ValidationException::withMessages([
                    'ids' => 'The group list is out of date. Reload the page and try again.',
                ]);
            }

            //$this->groups->setSortOrders(array_flip(array_map(fn ($i) => $i, $ids)) === [] ? [] : $this->toOrders($ids));
            $this->groups->setSortOrders($this->toOrders($ids));
        });
    }

    /**
     * Archive လုပ်ခွင့်ကို တားမယ့် အကြောင်းရင်းများ။
     *
     * @return string[]
     */
    public function archiveBlockers(TaskGroup $group): array
    {
        $blockers = [];

        if ($group->isArchived()) {
            $blockers[] = 'This group is already archived.';

            return $blockers;
        }

        if ($group->is_initial) {
            $blockers[] = 'This is the Initial group. Use "Change Initial group" to move the flag first.';
        }

        if ($group->is_completed) {
            $blockers[] = 'This is the Completed group. Use "Change Completed group" to move the flag first.';
        }

        $activeCount = TaskGroup::query()->active()->count();

        if ($activeCount <= self::MIN_ACTIVE_GROUPS) {
            $blockers[] = 'At least '.self::MIN_ACTIVE_GROUPS.' active groups must remain.';
        }
        $taskCount = $this->tasks->countInGroup($group->id);
        $limit = TaskGroupFlagService::MAX_MIGRATION_TASKS;

        if ($taskCount > $limit) {
            $blockers[] = sprintf(
                'This group holds %s tasks, which is above the limit of %s for a single change. '
                .'Move some of them to another group first.',
                number_format($taskCount),
                number_format($limit)
            );
        }

        return $blockers;
    }


    /** Replacement အဖြစ် ရွေးလို့ရတဲ့ group များ (Active၊ ကိုယ်တိုင်မဟုတ်) */
    public function replacementCandidates(TaskGroup $group)
    {
        return TaskGroup::query()
            ->active()
            ->where('id', '!=', $group->id)
            ->ordered()
            ->get(['id', 'name', 'color', 'is_initial', 'is_completed']);
    }

    /**
     * @return array{tasks: int, limit: int, exceeds_limit: bool}
     */
    public function archiveImpact(TaskGroup $group): array
    {
        // Archived task နဲ့ Completed/Archived project ထဲက task ပါ ရေတွက်မယ်
        $tasks = $this->tasks->countInGroup($group->id);
        $limit = TaskGroupFlagService::MAX_MIGRATION_TASKS;

        return ['tasks' => $tasks, 'limit' => $limit, 'exceeds_limit' => $tasks > $limit];
    }

    public function archive(User $actor, TaskGroup $group, int $replacementId): TaskGroup
    {
        return DB::transaction(function () use ($actor, $group, $replacementId) {
            $this->groups->lockAll();

            $fresh = $group->fresh();

            if ($blockers = $this->archiveBlockers($fresh)) {
                throw ValidationException::withMessages(['group' => $blockers[0]]);
            }

            $replacement = TaskGroup::query()->find($replacementId);

            if (! $replacement || $replacement->isArchived() || $replacement->id === $fresh->id) {
                throw ValidationException::withMessages([
                    'replacement_group_id' => 'Choose a different active group as the replacement.',
                ]);
            }

            $moved = $this->moveTasks($fresh, $replacement);

            $archived = $this->groups->update($fresh, [
                'archived_at' => now(),
                'archived_by' => $actor->id,
            ]);

            $this->groups->recordEvent($archived, $actor->id, TaskGroupEvent::ARCHIVED, [
                'replacement'      => ['id' => $replacement->id, 'name' => $replacement->name],
                'tasks_moved'      => $moved,
                'marked_completed' => $replacement->is_completed ? $moved : 0,
            ]);

            return $archived;
        });
    }

    /**
     * Group ထဲက task အားလုံးကို Replacement group ဆီ ရွှေ့မယ် (System-level)။
     * Replacement က Completed group ဆိုရင် ရွှေ့တဲ့ task အားလုံး (archived ပါ) ကို migration time နဲ့ completed ဖြစ်စေမယ်။
     * (Archive လုပ်တဲ့ group က flag မကိုင်ရတာမို့ ရွှေ့မယ့် task တွေက completed မဟုတ်ခဲ့ဘူး။)
     *
     * @return int ရွှေ့လိုက်တဲ့ task အရေအတွက်
     */
    protected function moveTasks(TaskGroup $from, TaskGroup $to): int
    {
        $count = $this->tasks->countInGroup($from->id);

        if ($count === 0) {
            return 0;
        }

        $this->tasks->appendGroupTasks($from->id, $to->id);

        if ($to->is_completed) {
            $this->tasks->fillMissingCompletedAt($to->id, now());
        }

        return $count;
    }

    /**
     * Restore။ နာမည်တူနေရင် Rename & Restore (အသစ်ပေးမှ) လုပ်ရမယ်။
     * အစွန်ဆုံးနေရာမှာ၊ flag မပါဘဲ ပြန်ဝင်မယ်။
     */
    public function restore(TaskGroup $group, ?string $newName = null): TaskGroup
    {
        return DB::transaction(function () use ($group, $newName) {
            $this->groups->lockAll();

            $fresh = $group->fresh();

            if (! $fresh->isArchived()) {
                throw ValidationException::withMessages(['group' => 'This group is not archived.']);
            }

            $name = $newName ?: $fresh->name;

            if ($this->groups->activeNameExists($name)) {
                throw ValidationException::withMessages([
                    'name' => $newName
                        ? 'An active group with this name already exists.'
                        : "An active group named \"{$name}\" already exists. Choose a new name to restore this group.",
                ]);
            }

            return $this->groups->update($fresh, [
                'name'        => $name,
                'sort_order'  => $this->groups->nextSortOrder(),
                'is_initial'  => false,
                'is_completed' => false,
                'archived_at' => null,
                'archived_by' => null,
            ]);
        });
    }

    protected function toOrders(array $ids): array
    {
        $orders = [];

        foreach ($ids as $index => $id) {
            $orders[$id] = $index + 1;
        }

        return $orders;
    }

    protected function assertActive(TaskGroup $group, string $message): void
    {
        if ($group->isArchived()) {
            throw ValidationException::withMessages(['group' => $message]);
        }
    }

    protected function assertNameAvailable(string $name, ?int $ignoreId = null): void
    {
        if ($this->groups->activeNameExists($name, $ignoreId)) {
            throw ValidationException::withMessages([
                'name' => 'An active group with this name already exists.',
            ]);
        }
    }
}