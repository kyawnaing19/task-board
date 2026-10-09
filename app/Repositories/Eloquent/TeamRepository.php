<?php

namespace App\Repositories\Eloquent;

use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use App\Repositories\Contracts\TeamRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class TeamRepository implements TeamRepositoryInterface
{
    public function paginate(bool $archived = false,int $perPage = 15,?string $search = null): LengthAwarePaginator 
    {
        return Team::query()
            ->with('creator')
            ->when(
                $archived,
                fn ($q) => $q->archived(),
                fn ($q) => $q->active()
            )
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('creator', function ($query) use ($search) {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function update(Team $team, array $data): Team
    {
        $team->update($data);

        return $team->refresh();
    }

    public function create(array $data): Team
    {
        return Team::create($data);
    }

    public function forMember(User $user): Collection
    {
        return Team::query()
            ->active()
            ->whereHas('memberships', fn ($q) => $q->active()->where('user_id', $user->id))
            ->withCount([
                'memberships as members_count' => fn ($q) => $q->active()->activeAccount(),
            ])
            ->orderBy('name')
            ->get();
    }

    public function findForMember(User $user, int $teamId): ?Team
    {
        return Team::query()
            ->active()
            ->whereKey($teamId)
            ->whereHas('memberships', fn ($q) => $q->active()->where('user_id', $user->id))
            ->first();
    }

    public function colleagues(Team $team): Collection
    {
        return User::query()
            ->whereIn(
                'id',
                TeamMembership::query()->active()->activeAccount()->where('team_id', $team->id)->select('user_id')
            )
            ->orderBy('name')
            ->get(['id', 'name', 'job_title', 'avatar_path']);
    }



}