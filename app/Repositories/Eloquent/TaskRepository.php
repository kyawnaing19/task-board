<?php

namespace App\Repositories\Eloquent;

use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\User;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Support\Facades\DB;
use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Carbon\CarbonInterface;
use App\Support\TaskFilters;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;


class TaskRepository implements TaskRepositoryInterface
{
    public function create(array $data): Task
    {
        return Task::create($data);
    }

    public function nextPosition(int $projectId, int $groupId, ?int $excludeTaskId = null): int
    {
        return ((int) Task::query()
            ->where('project_id', $projectId)
            ->where('group_id', $groupId)
            ->whereNull('archived_at')
            ->when($excludeTaskId, fn ($q) => $q->where('id', '!=', $excludeTaskId))
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

    public function findPlaced(int $projectId, int $groupId, int $taskId): ?Task
    {
        return Task::query()
            ->whereKey($taskId)
            ->where('project_id', $projectId)
            ->where('group_id', $groupId)
            ->whereNull('archived_at')
            ->first();
    }

    public function nextSibling(Task $task): ?Task
    {
        return Task::query()
            ->where('project_id', $task->project_id)
            ->where('group_id', $task->group_id)
            ->whereNull('archived_at')
            ->where('sort_position', '>', $task->sort_position)
            ->orderBy('sort_position')
            ->first(['id']);
    }

    public function shiftFrom(int $projectId, int $groupId, int $fromPosition, int $excludeTaskId): void
    {
        // Eloquent increment က updated_at ကိုပါ ပြင်လို့ query builder နဲ့ တိုက်ရိုက်လုပ်မယ်
        DB::table('tasks')
            ->where('project_id', $projectId)
            ->where('group_id', $groupId)
            ->whereNull('archived_at')
            ->where('sort_position', '>=', $fromPosition)
            ->where('id', '!=', $excludeTaskId)
            ->increment('sort_position');
    }

    public function currentGroupId(int $taskId): ?int
    {
        $id = Task::query()->whereKey($taskId)->value('group_id');

        return $id === null ? null : (int) $id;
    }

    public function countOpen(Project $project): int
    {
        return Task::query()
            ->where('project_id', $project->id)
            ->whereNull('archived_at')
            ->whereNotIn('group_id', fn ($q) => $q->select('id')->from('task_groups')->where('is_completed', 1))
            ->count();
    }

    public function paginateArchived(Project $project, int $perPage = 20): LengthAwarePaginator
    {
        return Task::query()
            ->where('project_id', $project->id)
            ->whereNotNull('archived_at')
            ->with([
                'group:id,name,color,is_completed',
                'assignees:id,name,avatar_path,status',
                'tags:id,name,color,archived_at',
            ])
            ->orderByDesc('archived_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }


    public function countInGroup(int $groupId): int
    {
        return Task::query()->where('group_id', $groupId)->count();
    }

    public function appendGroupTasks(int $fromGroupId, int $toGroupId): void
    {
        $projectIds = DB::table('tasks')
            ->where('group_id', $fromGroupId)
            ->whereNull('archived_at')
            ->distinct()
            ->pluck('project_id');

        foreach ($projectIds as $projectId) {
            // Destination မှာ ဒီ project ရဲ့ ရှိပြီးသား နောက်ဆုံး position
            $position = (int) DB::table('tasks')
                ->where('project_id', $projectId)
                ->where('group_id', $toGroupId)
                ->whereNull('archived_at')
                ->max('sort_position');

            $ids = DB::table('tasks')
                ->where('project_id', $projectId)
                ->where('group_id', $fromGroupId)
                ->whereNull('archived_at')
                ->orderBy('sort_position')
                ->orderBy('id')
                ->pluck('id');

            foreach ($ids->chunk(500) as $chunk) {
                // CASE ကို int ချည်းပဲ ဆောက်တာမို့ (int cast) injection မဖြစ်နိုင်ဘူး
                $cases = '';

                foreach ($chunk as $id) {
                    $position++;
                    $cases .= sprintf(' WHEN %d THEN %d', (int) $id, $position);
                }

                // whereNull('archived_at'): ကြားထဲမှာ archive ဖြစ်သွားတဲ့ task ကို position မထည့်မိအောင်
                // (ဒီ query builder ကြောင့် updated_at ကိုလည်း မထိဘူး)
                DB::table('tasks')
                    ->whereIn('id', $chunk->all())
                    ->whereNull('archived_at')
                    ->update([
                        'group_id'      => $toGroupId,
                        'sort_position' => DB::raw('CASE id'.$cases.' END'),
                    ]);
            }
        }

        // ကျန်တာက archived task တွေ (position NULL အတိုင်း)၊ group ပဲ ပြောင်းမယ်
        DB::table('tasks')->where('group_id', $fromGroupId)->update(['group_id' => $toGroupId]);
    }

    public function setCompletedAtInGroup(int $groupId, CarbonInterface $at): void
    {
        DB::table('tasks')->where('group_id', $groupId)->update(['completed_at' => $at]);
    }

    public function fillMissingCompletedAt(int $groupId, CarbonInterface $at): void
    {
        DB::table('tasks')->where('group_id', $groupId)->whereNull('completed_at')->update(['completed_at' => $at]);
    }

    

    public function boardPage(Project $project, int $groupId, TaskFilters $filters, int $viewerId, ?int $after, int $limit): Collection
    {
        return $this->applyFilters(
            Task::query()
                ->where('project_id', $project->id)
                ->where('group_id', $groupId)
                ->whereNull('archived_at'),
            $filters,
            $viewerId
        )
            ->when($after !== null, fn ($q) => $q->where('sort_position', '>', $after))
            ->orderBy('sort_position')
            ->orderBy('id')
            ->limit($limit + 1)
            ->with([
                'group:id,name,color,is_completed',
                'assignees:id,name,avatar_path,status',
                'tags:id,name,color,archived_at',
            ])
            ->get();
    }

    public function groupTotals(Project $project, TaskFilters $filters, int $viewerId): array
    {
        return $this->applyFilters(
            Task::query()->where('project_id', $project->id)->whereNull('archived_at'),
            $filters,
            $viewerId
        )
            ->selectRaw('group_id, COUNT(*) as aggregate')
            ->groupBy('group_id')
            ->pluck('aggregate', 'group_id')
            ->map(fn ($n) => (int) $n)
            ->all();
    }

    public function matchesFilters(Task $task, TaskFilters $filters, int $viewerId): bool
    {
        return $this->applyFilters(
            Task::query()->whereKey($task->id)->whereNull('archived_at'),
            $filters,
            $viewerId
        )->exists();
    }

    public function activities(Task $task, ?int $before, int $limit): Collection
    {
        return TaskActivity::query()
            ->where('task_id', $task->id)
            ->when($before !== null, fn ($q) => $q->where('id', '<', $before))
            ->with('actor:id,name,avatar_path')
            ->orderByDesc('id')
            ->limit($limit + 1)
            ->get();
    }

    protected function applyFilters(Builder $query, TaskFilters $filters, int $viewerId): Builder
    {
        if ($filters->q !== null) {
            // LOWER() နဲ့ ယှဉ်လို့ MySQL / PostgreSQL ကွာခြားမှု မရှိဘူး
            $term = '%'.addcslashes(mb_strtolower($filters->q), '%_\\').'%';

            $query->where(fn ($q) => $q
                ->whereRaw('LOWER(title) LIKE ?', [$term])
                ->orWhereRaw('LOWER(code) LIKE ?', [$term]));
        }

        if ($filters->assignee === 'unassigned') {
            $query->whereDoesntHave('assignees');
        } elseif ($filters->assignee !== null) {
            $userId = $filters->assignee === 'me' ? $viewerId : (int) $filters->assignee;

            $query->whereHas('assignees', fn ($q) => $q->where('users.id', $userId));
        }

        if ($filters->priority) {
            $query->whereIn('priority', $filters->priority);
        }

        if ($filters->tagIds) {
            $query->whereHas('tags', fn ($q) => $q->whereIn('tags.id', $filters->tagIds));
        }

        if ($filters->groupIds) {
            $query->whereIn('group_id', $filters->groupIds);
        }

        // ရက်စွဲ overlap: ရက်တစ်ခုပဲရှိရင် အဲဒီရက်ကို span အဖြစ်ယူ၊ နှစ်ခုလုံးမရှိရင် COALESCE က NULL ဖြစ်လို့ ဖယ်ထွက်မယ်
        if ($filters->dateFrom !== null) {
            $query->whereRaw('COALESCE(end_date, start_date) >= ?', [$filters->dateFrom]);
        }

        if ($filters->dateTo !== null) {
            $query->whereRaw('COALESCE(start_date, end_date) <= ?', [$filters->dateTo]);
        }

        return $query;
    }

}