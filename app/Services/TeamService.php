<?php

namespace App\Services;

use App\Models\Team;
use App\Models\User;
use App\Repositories\Contracts\ProjectTeamRepositoryInterface;
use App\Repositories\Contracts\TeamRepositoryInterface;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeamService
{
    public function __construct(
        protected TeamRepositoryInterface $teams,
        protected ProjectTeamRepositoryInterface $projectLinks
    ) {}

    public function create(User $actor, array $data): Team
    {
        try {
            return $this->teams->create([
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
                'created_by'  => $actor->id,
            ]);
        } catch (UniqueConstraintViolationException) {
            throw $this->duplicateNameException();
        }
    }

    public function update(Team $team, array $data): Team
    {
        if ($team->isArchived()) {
            throw ValidationException::withMessages([
                'team' => 'Archived teams cannot be edited. Restore the team first.',
            ]);
        }

        try {
            return $this->teams->update($team, [
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
            ]);
        } catch (UniqueConstraintViolationException) {
            throw $this->duplicateNameException();
        }
    }

    public function archive(User $actor, Team $team): Team
    {
        return DB::transaction(function () use ($actor, $team) {
            $locked = Team::query()->whereKey($team->id)->lockForUpdate()->firstOrFail();

            if ($locked->isArchived()) {
                throw ValidationException::withMessages([
                    'team' => 'This team is already archived.',
                ]);
            }

            if ($blockers = $this->archiveBlockers($locked)) {
                throw ValidationException::withMessages([
                    'team' => $blockers[0],
                ]);
            }

            return $this->teams->update($locked, [
                'archived_at' => now(),
                'archived_by' => $actor->id,
            ]);
        });
    }

    public function restore(Team $team): Team
    {
        if (! $team->isArchived()) {
            throw ValidationException::withMessages([
                'team' => 'This team is not archived.',
            ]);
        }

        return $this->teams->update($team, [
            'archived_at' => null,
            'archived_by' => null,
        ]);
    }

   
   public function archiveBlockers(Team $team): array
    {
        $count = $this->projectLinks->activeProjectCountForTeam($team);

        if ($count === 0) {
            return [];
        }

        return [
            "This team is linked to {$count} active project(s). "
            .'Remove the team from those projects or mark them as completed first.',
        ];
    }

   
    public function archiveImpact(Team $team): array
    {
        return ['employees' => 0, 'projects' => 0];
    }

    protected function duplicateNameException(): ValidationException
    {
        return ValidationException::withMessages([
            'name' => 'A team with this name already exists (it may be archived).',
        ]);
    }
}