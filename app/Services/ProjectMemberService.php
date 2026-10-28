<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use App\Repositories\Contracts\ProjectMemberRepositoryInterface;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProjectMemberService
{
    public function __construct(
        protected ProjectMemberRepositoryInterface $members,
        protected ProjectRepositoryInterface $projects,
        protected ProjectService $projectService,
        protected ProjectAccess $access,
        protected ProjectAuthorization $authorization,
        protected TeamLeadership $leadership
    ) {}

    /** Team ကနေ access ရပြီးသားသူကိုလည်း ထည့်လို့ရတယ်၊ via_teams နဲ့ မြင်သာအောင် ပြမယ် */
    public function candidates(User $actor, Project $project, ?string $search = null): Collection
    {
        $this->authorization->assertCanManage($actor, $project);
        $this->projectService->assertEditable($project);

        $users = $this->members->candidates($project, $search, 20, $this->restriction($actor));
        $sources = $this->access->teamSources($project, $users->pluck('id')->all());

        return $users->map(fn (User $u) => array_merge($u->toArray(), [
            'via_teams' => $sources[$u->id] ?? [],
        ]))->values();
    }

    /**
     * @return array{
     *     employees: int,
     *     employees_gaining_access: int,
     *     already_have_access: array<int, array{id: int, name: string, teams: string[]}>
     * }
     */
    public function addImpact(User $actor, Project $project, array $userIds): array
    {
        $userIds = $this->normalize($userIds);

        $this->authorization->assertCanManage($actor, $project);
        $this->projectService->assertEditable($project);
        $this->assertAddable($actor, $project, $userIds);

        $gaining = $this->access->newlyGranted($project, $userIds);
        $already = array_values(array_diff($userIds, $gaining));
        $sources = $this->access->teamSources($project, $already);
        $names = User::query()->whereIn('id', $already)->pluck('name', 'id');

        return [
            'employees'                => count($userIds),
            'employees_gaining_access' => count($gaining),
            'already_have_access'      => array_map(fn ($id) => [
                'id'    => $id,
                'name'  => $names[$id] ?? '',
                'teams' => $sources[$id] ?? [],
            ], $already),
        ];
    }

    /**
     * @return array{loses_access: bool, still_via_teams: string[]}
     */
    public function removeImpact(User $actor, Project $project, User $user): array
    {
        $this->authorization->assertCanManage($actor, $project);
        $this->projectService->assertEditable($project);

        if (! $this->members->findActive($project, $user->id)) {
            throw $this->notMember();
        }

        $this->assertWithinLedTeams($actor, [$user->id], 'project', 'remove');

        return [
            'loses_access'    => $this->access->losesAccessWhenIndividualRemoved($project, $user->id),
            'still_via_teams' => $this->access->teamSources($project, [$user->id])[$user->id] ?? [],
        ];
    }

    public function add(User $actor, Project $project, array $userIds): int
    {
        $userIds = $this->normalize($userIds);

        return DB::transaction(function () use ($actor, $project, $userIds) {
            $locked = $this->projects->lock($project);

            $this->authorization->assertCanManage($actor, $locked);
            $this->projectService->assertEditable($locked);
            $this->assertAddable($actor, $locked, $userIds);

            $this->members->addMany($locked, $userIds, $actor->id);

            return count($userIds);
        });
    }

    public function remove(User $actor, Project $project, User $user): void
    {
        DB::transaction(function () use ($actor, $project, $user) {
            $locked = $this->projects->lock($project);$this->authorization->assertCanManage($actor, $locked);
            $this->projectService->assertEditable($locked);

            $member = $this->members->findActive($locked, $user->id, lock: true);

            if (! $member) {
                throw $this->notMember();
            }

            $this->assertWithinLedTeams($actor, [$user->id], 'project', 'remove');

            // hard delete မလုပ်ဘူး၊ end-date ပဲလုပ်မယ်
            $this->members->end($member, $actor->id);
        });
    }

    /** Super Admin = null (ကန့်သတ်ချက်မရှိ)၊ Leader = ကိုယ်ဦးဆောင်တဲ့ team id များ */
    protected function restriction(User $actor): ?array
    {
        return $actor->isSuperAdmin() ? null : $this->leadership->ledTeamIds($actor);
    }

    protected function assertWithinLedTeams(User $actor, array $userIds, string $errorKey, string $verb): void
    {
        $led = $this->restriction($actor);

        if ($led === null) {
            return;
        }

        if (count($this->members->userIdsInTeams($led, $userIds)) !== count($userIds)) {
            throw ValidationException::withMessages([
                $errorKey => "You can only {$verb} members of the teams you lead.",
            ]);
        }
    }

    protected function normalize(array $ids): array
    {
        return array_values(array_unique(array_map('intval', $ids)));
    }

    protected function assertAddable(User $actor, Project $project, array $userIds): void
    {
        if (count($this->members->eligibleEmployeeIds($userIds)) !== count($userIds)) {
            throw ValidationException::withMessages([
                'user_ids' => 'Only active employees can be added to a project.',
            ]);
        }

        $this->assertWithinLedTeams($actor, $userIds, 'user_ids', 'add');

        // Individual row ထပ်နေတာကိုပဲ တားမယ်။ Team ကနေ access ရပြီးသားဆိုတာကို မတားဘူး။
        if ($this->members->activeMemberIds($project, $userIds)) {
            throw ValidationException::withMessages([
                'user_ids' => 'Some selected employees are already individual members of this project.',
            ]);
        }
    }

    protected function notMember(): ValidationException
    {
        return ValidationException::withMessages([
            'project' => 'This employee is not an individual member of the project.',
        ]);
    }
}