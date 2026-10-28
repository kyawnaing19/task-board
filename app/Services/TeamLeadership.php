<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeamLeadership
{
    /**
     * User က လက်ရှိ effective leader ဖြစ်တဲ့ team id များ (live check)။
     * leader_id ဖြစ်၊ team archive မလုပ်ရသေး၊ user active Employee၊ team ရဲ့ active member ဖြစ်ရမယ်။
     *
     * @return int[]
     */
    public function ledTeamIds(User $user): array
    {
        if ($user->isSuperAdmin() || ! $user->isActive()) {
            return [];
        }

        return Team::query()
            ->where('leader_id', $user->id)
            ->whereNull('archived_at')
            ->whereIn('id', TeamMembership::query()->active()->where('user_id', $user->id)->select('team_id'))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function leadsAny(User $user): bool
    {
        return $this->ledTeamIds($user) !== [];
    }

    /** Super Admin သီးသန့်။ $userId = null ဆိုရင် leader ကို ဖယ်မယ် */
    public function assign(User $actor, Team $team, ?int $userId): Team
    {
        abort_unless($actor->isSuperAdmin(), 403);

        return DB::transaction(function () use ($actor, $team, $userId) {
            // TeamMemberService::add / remove ကလည်း team row ကို lock လုပ်လို့ membership ပြောင်းတာနဲ့ serialize ဖြစ်မယ်
            $locked = Team::query()->whereKey($team->id)->lockForUpdate()->firstOrFail();

            if ($locked->isArchived()) {
                throw ValidationException::withMessages([
                    'team' => 'Archived teams cannot be changed. Restore the team first.',
                ]);
            }

            if ($userId === null) {
                $this->write($locked, null, null);

                return $locked->refresh();
            }

            if ((int) $locked->leader_id === $userId) {
                return $locked;   // ပြောင်းစရာမရှိ
            }

            $eligible = TeamMembership::query()
                ->active()
                ->where('team_id', $locked->id)
                ->where('user_id', $userId)
                ->whereHas('user', fn ($u) => $u
                    ->where('role', UserRole::EMPLOYEE->value)
                    ->where('status', UserStatus::ACTIVE->value))
                ->exists();

            if (! $eligible) {
                throw ValidationException::withMessages([
                    'user_id' => 'The leader must be an active employee who is a member of this team.',
                ]);
            }

            $this->write($locked, $userId, $actor->id);

            return $locked->refresh();
        });
    }

    /** Team row ကို lock လုပ်ပြီးသား transaction ထဲမှာ ခေါ်ရမယ် */
    public function clearIfLeader(Team $team, int $userId): void
    {
        if ((int) $team->leader_id === $userId) {
            $this->write($team, null, null);
        }
    }

    public function clearAllFor(User $user): int
    {
        return Team::query()->where('leader_id', $user->id)->update([
            'leader_id'          => null,
            'leader_assigned_at' => null,
            'leader_assigned_by' => null,
        ]);
    }

    protected function write(Team $team, ?int $leaderId, ?int $actorId): void
    {
        Team::query()->whereKey($team->id)->update([
            'leader_id'          => $leaderId,
            'leader_assigned_at' => $leaderId ? now() : null,
            'leader_assigned_by' => $actorId,
        ]);
    }
}