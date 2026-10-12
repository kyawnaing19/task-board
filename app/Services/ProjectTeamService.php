<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\ProjectTeamRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProjectTeamService
{
    public function __construct(
        protected ProjectTeamRepositoryInterface $links,
        protected ProjectRepositoryInterface $projects,
        protected ProjectService $projectService,
        protected ProjectAccess $access
    ) {}

    public function candidates(Project $project, ?string $search = null): Collection
    {
        $this->projectService->assertEditable($project);

        return $this->links->candidates($project, $search);
    }

    /** @return array{teams: int, employees_gaining_access: int} */
    public function addImpact(Project $project, array $teamIds): array
    {
        $teamIds = $this->normalize($teamIds);

        $this->projectService->assertEditable($project);
        $this->assertLinkable($project, $teamIds);

        return [
            'teams'                    => count($teamIds),
            'employees_gaining_access' => $this->access->gainedBy($project, $teamIds),
        ];
    }

    /** @return array{employees_losing_access: int} */
    public function removeImpact(Project $project, Team $team): array
    {
        $this->projectService->assertEditable($project);

        if (! $this->links->findActive($project, $team->id)) {
            throw $this->notLinked();
        }

        return [
            'employees_losing_access' => $this->access->lostWithout($project, $team->id),
        ];
    }

    public function add(User $actor, Project $project, array $teamIds): int
    {
        $teamIds = $this->normalize($teamIds);
        sort($teamIds);

        return DB::transaction(function () use ($actor, $project, $teamIds) {
            $locked = $this->projects->lock($project);

            $this->projectService->assertEditable($locked);

            // Team row တွေကို id အစဉ်လိုက် lock လုပ်ထားမှ ချိတ်နေတုန်း archive ဝင်လာတာကို ကာကွယ်နိုင်မယ်
            Team::query()->whereIn('id', $teamIds)->orderBy('id')->lockForUpdate()->get(['id']);

            $this->assertLinkable($locked, $teamIds);

            $this->links->addMany($locked, $teamIds, $actor->id);

            return count($teamIds);
        });
    }

    public function remove(User $actor, Project $project, Team $team): void
    {
        DB::transaction(function () use ($actor, $project, $team) {
            $locked = $this->projects->lock($project);

            $this->projectService->assertEditable($locked);

            $link = $this->links->findActive($locked, $team->id, lock: true);

            if (! $link) {
                throw $this->notLinked();
            }

            $this->links->end($link, $actor->id);
        });
    }

    protected function normalize(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }

    protected function assertLinkable(Project $project, array $teamIds): void
    {
        if (count($this->links->assignableTeamIds($teamIds)) !== count($teamIds)) {
            throw ValidationException::withMessages([
                'team_ids' => 'Only active (non-archived) teams can be linked to a project.',
            ]);
        }

        if ($this->links->activeLinkedTeamIds($project, $teamIds)) {
            throw ValidationException::withMessages([
                'team_ids' => 'Some selected teams are already linked to this project.',
            ]);
        }
    }

    protected function notLinked(): ValidationException
    {
        return ValidationException::withMessages([
            'project' => 'This team is not linked to the project.',
        ]);
    }
}