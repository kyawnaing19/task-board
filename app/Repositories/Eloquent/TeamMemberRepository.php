<?php

namespace App\Repositories\Eloquent;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use App\Repositories\Contracts\TeamMemberRepositoryInterface;
use Illuminate\Support\Collection;

class TeamMemberRepository implements TeamMemberRepositoryInterface
{
    public function candidates(Team $team, ?string $search = null, int $limit = 20): Collection
    {
        $term = $search ? addcslashes(trim($search), '%_\\') : null;

        return User::query()
            ->where('role', UserRole::EMPLOYEE->value)
            ->where('status', UserStatus::ACTIVE->value)
            ->whereNotIn(
                'id',
                TeamMembership::query()->active()->where('team_id', $team->id)->select('user_id')
            )
            ->when($term, fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")))
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'email', 'job_title', 'avatar_path']);
    }

    public function eligibleEmployeeIds(array $userIds): array
    {
        return User::query()
            ->whereIn('id', $userIds)
            ->where('role', UserRole::EMPLOYEE->value)
            ->where('status', UserStatus::ACTIVE->value)
            ->pluck('id')
            ->all();
    }

    public function activeMemberIds(Team $team, array $userIds): array
    {
        return TeamMembership::query()
            ->active()
            ->where('team_id', $team->id)
            ->whereIn('user_id', $userIds)
            ->pluck('user_id')
            ->all();
    }

    public function addMany(Team $team, array $userIds, int $actorId): void
    {
        $now = now();

        TeamMembership::insert(array_map(fn ($userId) => [
            'team_id'  => $team->id,
            'user_id'  => $userId,
            'added_at' => $now,
            'added_by' => $actorId,
        ], $userIds));
    }

    public function findActive(Team $team, int $userId, bool $lock = false): ?TeamMembership
    {
        return TeamMembership::query()
            ->active()
            ->where('team_id', $team->id)
            ->where('user_id', $userId)
            ->when($lock, fn ($q) => $q->lockForUpdate())
            ->first();
    }

    public function end(TeamMembership $membership, int $actorId): void
    {
        $membership->update([
            'removed_at' => now(),
            'removed_by' => $actorId,
        ]);
    }
}