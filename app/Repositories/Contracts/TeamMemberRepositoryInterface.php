<?php

namespace App\Repositories\Contracts;

use App\Models\Team;
use App\Models\TeamMembership;
use Illuminate\Support\Collection;

interface TeamMemberRepositoryInterface
{
    /** Active employees who are not yet in this team and can be added */

    public function candidates(Team $team, ?string $search = null, int $limit = 20): Collection;

    /** IDs of active employees who are eligible from the given IDs */

    public function eligibleEmployeeIds(array $userIds): array;

    /** Users from the given IDs who are already active members in this team */
    public function activeMemberIds(Team $team, array $userIds): array;

    public function addMany(Team $team, array $userIds, int $actorId): void;

    public function findActive(Team $team, int $userId, bool $lock = false): ?TeamMembership;

    public function end(TeamMembership $membership, int $actorId): void;
}