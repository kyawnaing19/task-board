<?php

namespace App\Services;

use App\Models\TaskGroup;
use App\Models\User;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskGroupService
{
    public const MIN_ACTIVE_GROUPS = 2;

    public function __construct(
        protected TaskGroupRepositoryInterface $groups
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

        return $blockers;
    }

    /**
     * Archive confirmation မှာ ပြမယ့် impact။
     *
     * TODO (Tasks module): ဒီ group ထဲက task အားလုံး (Archived task နဲ့ Completed/Archived project ထဲက task ပါ)
     * အရေအတွက်ကို ရေတွက်မယ်။
     *
     * @return array{tasks: int}
     */
    public function archiveImpact(TaskGroup $group): array
    {
        return ['tasks' => 0];
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

            $this->moveTasks($fresh, $replacement);

            return $this->groups->update($fresh, [
                'archived_at' => now(),
                'archived_by' => $actor->id,
            ]);
        });
    }

    /**
     * Group ထဲက task အားလုံးကို Replacement group ဆီ ရွှေ့မယ် (System-level၊ Archived task နဲ့
     * Completed/Archived project ထဲက task ပါ ပါမယ်၊ read-only စည်းမျဉ်းကို ကျော်မယ်)။
     *
     * TODO (Tasks module): Task ရှိလာမှ ရေးမယ်။ Replacement က Completed group ဖြစ်နေရင်
     * ရွှေ့တဲ့ task တွေရဲ့ completed_at ကို ဘယ်လိုကိုင်မလဲ ဆုံးဖြတ်ရမယ်။
     */
    protected function moveTasks(TaskGroup $from, TaskGroup $to): void
    {
        //
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