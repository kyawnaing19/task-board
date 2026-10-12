<?php

namespace App\Repositories\Eloquent;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProjectRepository implements ProjectRepositoryInterface
{
    public function paginate(string $filter = 'active', int $perPage = 15): LengthAwarePaginator
    {
        return Project::query()
            ->with('creator:id,name')
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
}