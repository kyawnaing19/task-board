<?php

namespace App\Services;

use App\Models\Team;
use App\Models\User;
use App\Repositories\Contracts\TeamMemberRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeamMemberService
{
   
    public function __construct(
    protected TeamMemberRepositoryInterface $members,
    protected ProjectAccess $access,
    protected TeamLeadership $leadership
    ) {}


    public function candidates(Team $team, ?string $search = null): Collection
    {
        $this->assertEditable($team);

        return $this->members->candidates($team, $search);
    }

    /**
     * @return array{employees: int, projects: int}
     */
    // 
    /**
 * ထည့်မယ့် impact။ projects = ဒီ Team နဲ့ ချိတ်ထားတဲ့ Project အားလုံး (Active/Completed/Archived)၊
 * access_grants = access အသစ်ရမယ့် (employee, project) အရေအတွက်။
 *
 * @return array{employees: int, projects: int, access_grants: int}
 */
    public function addImpact(Team $team, array $userIds): array
    {
        $userIds = $this->normalize($userIds);
        $this->assertEditable($team);
        $this->assertEligible($team, $userIds);

        $impact = $this->access->grantsFromTeamAdd($team->id, $userIds);

        return [
            'employees'     => count($userIds),
            'projects'      => $impact['projects'],
            'access_grants' => $impact['grants'],
        ];
    }

    /**
     * ဖယ်မယ့် impact။ Task assignment နဲ့ history ကို မထိဘူး။
     *
     * @return array{projects: int, projects_losing_access: int}
     */
    public function removeImpact(Team $team, User $user): array
    {
        $this->assertEditable($team);

        if (! $this->members->findActive($team, $user->id)) {
            throw $this->notMember();
        }

        $impact = $this->access->lossOnTeamMemberRemoval($team->id, $user->id);

        return [
            'projects'               => $impact['projects'],
            'projects_losing_access' => $impact['losing'],
        ];
    }


    public function add(User $actor, Team $team, array $userIds): int
    {
        $userIds = $this->normalize($userIds);

        return DB::transaction(function () use ($actor, $team, $userIds) {
            // Team row ကို lock လုပ်ပြီး archive/duplicate race ကို ကာကွယ်မယ်
            $locked = Team::query()->whereKey($team->id)->lockForUpdate()->firstOrFail();

            $this->assertEditable($locked);
            $this->assertEligible($locked, $userIds);

            $this->members->addMany($locked, $userIds, $actor->id);

            return count($userIds);
        });
    }

    public function remove(User $actor, Team $team, User $user): void
    {
        DB::transaction(function () use ($actor, $team, $user) {
            $locked = Team::query()->whereKey($team->id)->lockForUpdate()->firstOrFail();

            $this->assertEditable($locked);

            $membership = $this->members->findActive($locked, $user->id, lock: true);

            if (! $membership) {
                throw $this->notMember();
            }

            // not hard delete //do end-date 
            $this->members->end($membership, $actor->id);
            // Leader ကို team ကနေ ဖယ်ရင် leader ဖြစ်ခွင့်လည်း အလိုအလျောက်ပျောက်မယ်
            $this->leadership->clearIfLeader($locked, $user->id);
        });
    }

    protected function normalize(array $userIds): array
    {
        return array_values(array_unique(array_map('intval', $userIds)));
    }

    protected function assertEditable(Team $team): void
    {
        if ($team->isArchived()) {
            throw ValidationException::withMessages([
                'team' => 'Archived teams cannot be changed. Restore the team first.',
            ]);
        }
    }

    protected function assertEligible(Team $team, array $userIds): void
    {
        if (count($this->members->eligibleEmployeeIds($userIds)) !== count($userIds)) {
            throw ValidationException::withMessages([
                'user_ids' => 'Only active employees can be added to a team.',
            ]);
        }

        if ($this->members->activeMemberIds($team, $userIds)) {
            throw ValidationException::withMessages([
                'user_ids' => 'Some selected employees are already members of this team.',
            ]);
        }
    }

    protected function notMember(): ValidationException
    {
        return ValidationException::withMessages([
            'team' => 'This employee is not an active member of the team.',
        ]);
    }
}