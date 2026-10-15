<?php

namespace App\Repositories\Eloquent;

use App\Models\TaskGroup;
use App\Models\TaskGroupEvent;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use Illuminate\Support\Collection;

class TaskGroupRepository implements TaskGroupRepositoryInterface
{
    public function list(bool $archived = false): Collection
    {
        return TaskGroup::query()
            ->when($archived, fn ($q) => $q->archived()->latest('archived_at'), fn ($q) => $q->active()->ordered())
            ->get();
    }

    public function lockAll(): Collection
    {
        return TaskGroup::query()->orderBy('id')->lockForUpdate()->get();
    }

    public function activeNameExists(string $name, ?int $ignoreId = null): bool
    {
        return TaskGroup::query()
            ->active()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();
    }

    public function nextSortOrder(): int
    {
        return ((int) TaskGroup::query()->max('sort_order')) + 1;
    }

    public function create(array $data): TaskGroup
    {
        return TaskGroup::create($data);
    }

    public function update(TaskGroup $group, array $data): TaskGroup
    {
        $group->update($data);

        return $group->refresh();
    }

    public function setSortOrders(array $orders): void
    {
        foreach ($orders as $id => $order) {
            TaskGroup::query()->whereKey($id)->update(['sort_order' => $order]);
        }
    }

    public function holderOf(string $column): ?TaskGroup
    {
        return TaskGroup::query()->where($column, 1)->first();
    }

    public function moveFlag(string $column, ?TaskGroup $from, TaskGroup $to): void
    {
        // Query builder update ကို သုံးတာကြောင့် model setter ကို ကျော်မယ်၊ 1 သို့မဟုတ် NULL ကို တိုက်ရိုက်ရေးမယ်
        if ($from) {
            TaskGroup::query()->whereKey($from->id)->update([$column => null]);
        }

        TaskGroup::query()->whereKey($to->id)->update([$column => 1]);
    }

    public function lockForPlacement(?int $id): ?TaskGroup
    {
        return TaskGroup::query()
            ->when($id, fn ($q) => $q->whereKey($id), fn ($q) => $q->where('is_initial', 1))
            ->sharedLock()
            ->first();
    }

    public function lockCompleted(): ?TaskGroup
    {
        return TaskGroup::query()->where('is_completed', 1)->sharedLock()->first();
    }


    public function recordEvent(TaskGroup $group, ?int $actorId, string $type, array $payload = []): TaskGroupEvent
    {
        return TaskGroupEvent::create([
            'group_id'   => $group->id,
            'actor_id'   => $actorId,
            'type'       => $type,
            'payload'    => $payload ?: null,
            'created_at' => now(),
        ]);
    }
}