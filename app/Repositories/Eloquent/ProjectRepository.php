<?php

namespace App\Repositories\Eloquent;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProjectRepository implements ProjectRepositoryInterface
{
    // public function paginate(string $filter = 'active', int $perPage = 15): LengthAwarePaginator
    // {
    //     return Project::query()
    //         ->with('creator:id,name')
    //         ->when(
    //             $filter === 'archived',
    //             fn ($q) => $q->archived(),
    //             fn ($q) => $q->notArchived()->where(
    //                 'status',
    //                 ($filter === 'completed' ? ProjectStatus::COMPLETED : ProjectStatus::ACTIVE)->value
    //             )
    //         )
    //         ->latest('id')
    //         ->paginate($perPage)
    //         ->withQueryString();
    // }
    public function paginate(string $filter = 'active', int $perPage = 15, ?array $projectIds = null): LengthAwarePaginator
    {
        return Project::query()
            ->when($projectIds === null, fn ($q) => $q->with('creator:id,name'))
            ->when($projectIds !== null, fn ($q) => $q->whereIn('id', $projectIds))
            ->when(
                $filter === 'archived',
                fn ($q) => $q->archived(),
                fn ($q) => $q->notArchived()->where(
                    'status',
                    ($filter === 'completed' ? ProjectStatus::COMPLETED : ProjectStatus::ACTIVE)->value
                )
            )
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function find(int $id): ?Project
    {
        return Project::query()->find($id);
    }

    public function create(array $data): Project
    {
        return Project::create($data);
    }

    public function update(Project $project, array $data): Project
    {
        $project->update($data);

        return $project->refresh();
    }

    public function lock(Project $project): Project
    {
        return Project::query()->whereKey($project->id)->lockForUpdate()->firstOrFail();
    }

    public function nextTaskSequence(Project $locked): int
    {
        $next = ((int) $locked->task_sequence) + 1;

        Project::query()->whereKey($locked->id)->update(['task_sequence' => $next]);

        return $next;
    }
}