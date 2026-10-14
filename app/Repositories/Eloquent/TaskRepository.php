<?php

namespace App\Repositories\Eloquent;

use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\User;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Support\Facades\DB;

class TaskRepository implements TaskRepositoryInterface
{
    public function create(array $data): Task
    {
        return Task::create($data);
    }

    public function nextPosition(int $projectId, int $groupId): int
    {
        return ((int) Task::query()
            ->where('project_id', $projectId)
            ->where('group_id', $groupId)
            ->whereNull('archived_at')
            ->max('sort_position')) + 1;
    }

    public function attachAssignees(Task $task, array $userIds, int $actorId): void
    {
        if (! $userIds) {
            return;
        }

        $now = now();

        DB::table('task_assignees')->insert(array_map(fn ($userId) => [
            'task_id'     => $task->id,
            'user_id'     => $userId,
            'assigned_at' => $now,
            'assigned_by' => $actorId,
        ], $userIds));
    }

    public function attachTags(Task $task, array $tagIds): void
    {
        if (! $tagIds) {
            return;
        }

        DB::table('task_tag')->insert(array_map(fn ($tagId) => [
            'task_id' => $task->id,
            'tag_id'  => $tagId,
        ], $tagIds));
    }

    public function record(Task $task, ?int $actorId, string $type, array $payload = []): TaskActivity
    {
        return TaskActivity::create([
            'task_id'    => $task->id,
            'actor_id'   => $actorId,
            'type'       => $type,
            'payload'    => $payload ?: null,
            'created_at' => now(),
        ]);
    }

    public function lock(Task $task): Task
    {
        return Task::query()->whereKey($task->id)->lockForUpdate()->firstOrFail();
    }

    public function update(Task $task, array $data): Task
    {
        $task->update($data);

        return $task->refresh();
    }

    public function touch(Task $task): void
    {
        $task->touch();
    }

    public function assigneeIds(Task $task): array
    {
        return DB::table('task_assignees')
            ->where('task_id', $task->id)
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function tagIds(Task $task): array
    {
        return DB::table('task_tag')
            ->where('task_id', $task->id)
            ->pluck('tag_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function detachAssignees(Task $task, array $userIds): void
    {
        if (! $userIds) {
            return;
        }

        DB::table('task_assignees')->where('task_id', $task->id)->whereIn('user_id', $userIds)->delete();
    }

    public function detachTags(Task $task, array $tagIds): void
    {
        if (! $tagIds) {
            return;
        }

        DB::table('task_tag')->where('task_id', $task->id)->whereIn('tag_id', $tagIds)->delete();
    }

    public function userNames(array $ids): array
    {
        if (! $ids) {
            return [];
        }

        return User::query()->whereIn('id', $ids)->pluck('name', 'id')->all();
    }


}