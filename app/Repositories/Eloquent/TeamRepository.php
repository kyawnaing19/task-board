<?php

namespace App\Repositories\Eloquent;

use App\Models\Team;
use App\Repositories\Contracts\TeamRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
}