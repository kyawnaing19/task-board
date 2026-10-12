<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;


class ProjectAccess
{
    
    protected function viaTeams(Project $project): Builder
    {
        return DB::table('team_members as tm')
            ->join('project_teams as pt', 'pt.team_id', '=', 'tm.team_id')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->join('users as u', 'u.id', '=', 'tm.user_id')
            ->where('pt.project_id', $project->id)
            ->whereNull('pt.removed_at')
            ->whereNull('tm.removed_at')
            ->whereNull('t.archived_at')
            ->where('u.role', UserRole::EMPLOYEE->value)
            ->where('u.status', UserStatus::ACTIVE->value);
    }

    public function teamMemberIds(array $teamIds): array
    {
        return $this->ids(
            DB::table('team_members as tm')
                ->join('teams as t', 't.id', '=', 'tm.team_id')
                ->join('users as u', 'u.id', '=', 'tm.user_id')
                ->whereIn('tm.team_id', $teamIds)
                ->whereNull('tm.removed_at')
                ->whereNull('t.archived_at')
                ->where('u.role', UserRole::EMPLOYEE->value)
                ->where('u.status', UserStatus::ACTIVE->value)
        );
    }

    /** Project ရဲ့ effective member (user id) အားလုံး */
    public function memberIds(Project $project): array
    {
        return $this->ids($this->viaTeams($project));
    }

    public function hasAccess(User $user, Project $project): bool
    {
        return $this->viaTeams($project)->where('tm.user_id', $user->id)->exists();
    }

    /** Team တွေကို ထည့်လိုက်ရင် access အသစ်ရမယ့် Employee အရေအတွက် */
    public function gainedBy(Project $project, array $teamIds): int
    {
        return count(array_diff($this->teamMemberIds($teamIds), $this->memberIds($project)));
    }

    /** Team တစ်ခုကို ဖယ်လိုက်ရင် access ဆုံးရှုံးမယ့် Employee အရေအတွက် (တခြား source ကနေ မရတော့သူများ) */
    public function lostWithout(Project $project, int $teamId): int
    {
        $leaving = $this->teamMemberIds([$teamId]);

        $remaining = $this->ids($this->viaTeams($project)->where('tm.team_id', '!=', $teamId));

        return count(array_diff($leaving, $remaining));
    }

    protected function ids(Builder $query): array
    {
        return $query->distinct()->pluck('tm.user_id')->map(fn ($id) => (int) $id)->all();
    }
}