<?php

namespace App\Repositories\Contracts;

use App\Models\Project;
use App\Models\ProjectTeam;
use App\Models\Team;
use Illuminate\Support\Collection;

interface ProjectTeamRepositoryInterface
{
/** Project and currently active linked teams (includes archived teams) */
    public function linkedTeams(Project $project): Collection;

/** Available teams to link (not archived, not yet linked to this project) */
    public function candidates(Project $project, ?string $search = null, int $limit = 20): Collection;

/** IDs of the given IDs that exist and are not archived */
    public function assignableTeamIds(array $teamIds): array;

/** IDs from the given IDs that are already actively linked to this project */
    public function activeLinkedTeamIds(Project $project, array $teamIds): array;

    public function addMany(Project $project, array $teamIds, int $actorId): void;

    public function findActive(Project $project, int $teamId, bool $lock = false): ?ProjectTeam;

    public function end(ProjectTeam $link, int $actorId): void;

/** Teams that have an active link with the project but are archived */
    public function archivedLinkedTeams(Project $project): Collection;

/** Number of active (not archived) projects linked to the team */
    public function activeProjectCountForTeam(Team $team): int;
}