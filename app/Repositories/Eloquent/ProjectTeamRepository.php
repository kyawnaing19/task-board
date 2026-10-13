<?php

namespace App\Repositories\Eloquent;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\ProjectTeam;
use App\Models\Team;
use App\Repositories\Contracts\ProjectTeamRepositoryInterface;
use Illuminate\Support\Collection;

class ProjectTeamRepository implements ProjectTeamRepositoryInterface
{
    public function linkedTeams(Project $project): Collection
    {
        return Team::query()
            ->whereIn('id', $this->activeLinkTeamIds($project))
            ->withCount(['memberships as members_count' => fn ($q) => $q->active()])
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'archived_at']);
    }

    public function candidates(Project $project, ?string $search = null, int $limit = 20): Collection
    {
        $term = $search ? addcslashes(trim($search), '%_\\') : null;

        return Team::query()
            ->active()
            ->whereNotIn('id', $this->activeLinkTeamIds($project))
            ->when($term, fn ($q) => $q->where('name', 'like', "%{$term}%"))
            ->withCount(['memberships as members_count' => fn ($q) => $q->active()])
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'description']);
    }

    public function assignableTeamIds(array $teamIds): array
    {
        return Team::query()
            ->active()
            ->whereIn('id', $teamIds)
            ->pluck('id')
            ->all();
    }

    public function activeLinkedTeamIds(Project $project, array $teamIds): array
    {
        return ProjectTeam::query()
            ->active()
            ->where('project_id', $project->id)
            ->whereIn('team_id', $teamIds)
            ->pluck('team_id')
            ->all();
    }

    public function addMany(Project $project, array $teamIds, int $actorId): void
    {
        $now = now();

        ProjectTeam::insert(array_map(fn ($teamId) => [
            'project_id' => $project->id,
            'team_id'    => $teamId,
            'added_at'   => $now,
            'added_by'   => $actorId,
        ], $teamIds));
    }

    public function findActive(Project $project, int $teamId, bool $lock = false): ?ProjectTeam
    {
        return ProjectTeam::query()
            ->active()
            ->where('project_id', $project->id)
            ->where('team_id', $teamId)
            ->when($lock, fn ($q) => $q->lockForUpdate())
            ->first();
    }

    public function end(ProjectTeam $link, int $actorId): void
    {
        $link->update([
            'removed_at' => now(),
            'removed_by' => $actorId,
        ]);
    }

    public function linkedProjects(Team $team): Collection
    {
        return Project::query()
            ->whereHas('teamLinks', fn ($q) => $q->active()->where('team_id', $team->id))
            ->orderByDesc('id')
            ->get(['id', 'code', 'name', 'status', 'archived_at']);
    }

    public function archivedLinkedTeams(Project $project): Collection
    {
        return Team::query()
            ->archived()
            ->whereIn('id', $this->activeLinkTeamIds($project))
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    public function activeProjectCountForTeam(Team $team): int
    {
        return Project::query()
            ->notArchived()
            ->where('status', ProjectStatus::ACTIVE->value)
            ->whereHas('teamLinks', fn ($q) => $q->active()->where('team_id', $team->id))
            ->count();
    }

    protected function activeLinkTeamIds(Project $project)
    {
        return ProjectTeam::query()->active()->where('project_id', $project->id)->select('team_id');
    }
}