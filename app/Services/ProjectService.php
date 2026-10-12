<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\ProjectTeamRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProjectService
{
    public function __construct(
        protected ProjectRepositoryInterface $projects,
        protected ProjectCodeGenerator $codes,
        protected ProjectTeamRepositoryInterface $teamLinks,
    ) {}

    public function create(User $actor, array $data): Project
    {
        return DB::transaction(function () use ($actor, $data) {
            return $this->projects->create([
                'code'        => $this->codes->next(),
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
                'start_date'  => $data['start_date'] ?? null,
                'due_date'    => $data['due_date'] ?? null,
                'status'      => ProjectStatus::ACTIVE,
                'created_by'  => $actor->id,
            ]);
        });
    }

   
    public function update(Project $project, array $data): Project
    {
        return DB::transaction(function () use ($project, $data) {
            $locked = $this->projects->lock($project);

            $this->assertEditable($locked);

            return $this->projects->update($locked, [
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
                'start_date'  => $data['start_date'] ?? null,
                'due_date'    => $data['due_date'] ?? null,
            ]);
        });
    }

    
    public function changeStatus(Project $project, ProjectStatus $target): Project
    {
        return DB::transaction(function () use ($project, $target) {
            $locked = $this->projects->lock($project);

            if ($locked->isArchived()) {
                throw ValidationException::withMessages([
                    'status' => 'Archived projects cannot change status. Restore the project first.',
                ]);
            }

            if ($locked->status === $target) {
                throw ValidationException::withMessages([
                    'status' => 'The project is already '.strtolower($target->name).'.',
                ]);
            }

            $blockers = $target === ProjectStatus::COMPLETED
                ? $this->completionBlockers($locked)
                : $this->reopenBlockers($locked);

            if ($blockers) {
                throw ValidationException::withMessages(['status' => $blockers[0]]);
            }

            return $this->projects->update($locked, ['status' => $target]);
        });
    }

    public function archive(User $actor, Project $project): Project
    {
        return DB::transaction(function () use ($actor, $project) {
            $locked = $this->projects->lock($project);

            if ($locked->isArchived()) {
                throw ValidationException::withMessages([
                    'project' => 'This project is already archived.',
                ]);
            }

            if (! $locked->isCompleted()) {
                throw ValidationException::withMessages([
                    'project' => 'Only completed projects can be archived. Mark the project as completed first.',
                ]);
            }

            return $this->projects->update($locked, [
                'archived_at' => now(),
                'archived_by' => $actor->id,
            ]);
        });
    }

    public function restore(Project $project): Project
    {
        return DB::transaction(function () use ($project) {
            $locked = $this->projects->lock($project);

            if (! $locked->isArchived()) {
                throw ValidationException::withMessages([
                    'project' => 'This project is not archived.',
                ]);
            }

            // Archived → Completed။ Relationship record တွေကို ဘာမှ ပြန်မဆောက်ဘူး။
            return $this->projects->update($locked, [
                'archived_at' => null,
                'archived_by' => null,
                'status'      => ProjectStatus::COMPLETED,
            ]);
        });
    }

    /**
     * Completed / Archived project မှာ ဘာပြင်ပြင် (metadata, dates, team, member, task) မလုပ်ခင် ဒီ method ကို ခေါ်ရမယ်။
     * နောက်ပိုင်း Team linkage / member / task service တွေက ဒါကို ပြန်သုံးမယ်။
     */
    public function assertEditable(Project $project): void
    {
        if ($project->isArchived()) {
            throw ValidationException::withMessages([
                'project' => 'Archived projects are read-only. Restore the project first.',
            ]);
        }

        if ($project->isCompleted()) {
            throw ValidationException::withMessages([
                'project' => 'Completed projects are read-only. Reopen the project to make changes.',
            ]);
        }
    }

  
    public function completionBlockers(Project $project): array
    {
        return [];
    }

   
   public function reopenBlockers(Project $project): array
    {
        $teams = $this->teamLinks->archivedLinkedTeams($project);

        if ($teams->isEmpty()) {
            return [];
        }

        $names = $teams->pluck('name');
        $shown = $names->take(5)->implode(', ');
        $more = $names->count() > 5 ? ' and '.($names->count() - 5).' more' : '';

        return [
            "This project is linked to {$teams->count()} archived team(s): {$shown}{$more}. "
            .'Restore the team(s) or resolve the linkage before reopening.',
        ];
    }


}