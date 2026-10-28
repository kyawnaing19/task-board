<?php

namespace App\Repositories\Eloquent;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\TeamMembership;
use App\Models\User;
use App\Repositories\Contracts\ProjectMemberRepositoryInterface;
use Illuminate\Support\Collection;

class ProjectMemberRepository implements ProjectMemberRepositoryInterface
{
    public function members(Project $project): Collection
    {
        return ProjectMember::query()
            ->active()
            ->where('project_id', $project->id)
            ->with('user:id,name,email,job_title,avatar_path,status')
            ->orderByDesc('added_at')
            ->get();
    }

    // public function candidates(Project $project, ?string $search = null, int $limit = 20): Collection
    // {
    //     $term = $search ? addcslashes(trim($search), '%_\\') : null;

    //     return User::query()
    //         ->where('role', UserRole::EMPLOYEE->value)
    //         ->where('status', UserStatus::ACTIVE->value)
    //         ->whereNotIn(
    //             'id',
    //             ProjectMember::query()->active()->where('project_id', $project->id)->select('user_id')
    //         )
    //         ->when($term, fn ($q) => $q->where(fn ($q) => $q
    //             ->where('name', 'like', "%{$term}%")
    //             ->orWhere('email', 'like', "%{$term}%")))
    //         ->orderBy('name')
    //         ->limit($limit)
    //         ->get(['id', 'name', 'email', 'job_title', 'avatar_path']);
    // }

    public function candidates(Project $project, ?string $search = null, int $limit = 20, ?array $teamIds = null): Collection
    {
        $term = $search ? addcslashes(trim($search), '%_\\') : null;

        return User::query()
            ->where('role', UserRole::EMPLOYEE->value)
            ->where('status', UserStatus::ACTIVE->value)
            ->whereNotIn(
                'id',
                ProjectMember::query()->active()->where('project_id', $project->id)->select('user_id')
            )
            // Leader ဆိုရင် ကိုယ်ဦးဆောင်တဲ့ team ရဲ့ member ပဲ
            ->when($teamIds !== null, fn ($q) => $q->whereIn(
                'id',
                TeamMembership::query()->active()->whereIn('team_id', $teamIds)->select('user_id')
            ))
            ->when($term, fn ($q) => $q->where(fn ($q) => $q
                ->where('name', 'like', "%{$term}%")
                ->orWhere('email', 'like', "%{$term}%")))
            ->orderBy('name')
            ->limit($limit)
            ->get(['id', 'name', 'email', 'job_title', 'avatar_path']);
    }

    public function userIdsInTeams(array $teamIds, array $userIds): array
    {
        if (! $teamIds || ! $userIds) {
            return [];
        }

        return TeamMembership::query()
            ->active()
            ->whereIn('team_id', $teamIds)
            ->whereIn('user_id', $userIds)
            ->distinct()
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->all();
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

    public function activeMemberIds(Project $project, array $userIds): array
    {
        return ProjectMember::query()
            ->active()
            ->where('project_id', $project->id)
            ->whereIn('user_id', $userIds)
            ->pluck('user_id')
            ->all();
    }

    public function addMany(Project $project, array $userIds, int $actorId): void
    {
        $now = now();

        ProjectMember::insert(array_map(fn ($userId) => [
            'project_id' => $project->id,
            'user_id'    => $userId,
            'added_at'   => $now,
            'added_by'   => $actorId,
        ], $userIds));
    }

    public function findActive(Project $project, int $userId, bool $lock = false): ?ProjectMember
    {
        return ProjectMember::query()
            ->active()
            ->where('project_id', $project->id)
            ->where('user_id', $userId)
            ->when($lock, fn ($q) => $q->lockForUpdate())
            ->first();
    }

    public function end(ProjectMember $member, int $actorId): void
    {
        $member->update([
            'removed_at' => now(),
            'removed_by' => $actorId,
        ]);
    }

    public function directory(array $userIds): Collection
    {
        return User::query()
            ->whereIn('id', $userIds)
            ->orderBy('name')
            ->get(['id', 'name', 'job_title', 'avatar_path']);
    }
}