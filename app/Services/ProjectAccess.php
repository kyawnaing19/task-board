<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * The single source of truth class for calculating an employee's effective access to a project.
 *
 * Sources: Team-based and individual. If a user is present in both sources, they are counted only once.
 */

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

// Active individual membership row AND user is an active EMPLOYEE
    protected function viaIndividuals(Project $project): Builder
    {
        return DB::table('project_members as pm')
            ->join('users as u', 'u.id', '=', 'pm.user_id')
            ->where('pm.project_id', $project->id)
            ->whereNull('pm.removed_at')
            ->where('u.role', UserRole::EMPLOYEE->value)
            ->where('u.status', UserStatus::ACTIVE->value);
    }

    /** Project ရဲ့ effective member (user id) အားလုံး၊ source နှစ်ခု ပေါင်းပြီး distinct */
    public function memberIds(Project $project): array
    {
        return array_values(array_unique(array_merge(
            $this->ids($this->viaTeams($project), 'tm.user_id'),
            $this->ids($this->viaIndividuals($project), 'pm.user_id'),
        )));
    }

    public function hasAccess(User $user, Project $project): bool
    {
        return $this->viaTeams($project)->where('tm.user_id', $user->id)->exists()
            || $this->viaIndividuals($project)->where('pm.user_id', $user->id)->exists();
    }

    /**
     * Team ကနေ access ရနေတဲ့ user များနဲ့ အဲဒီ Team နာမည်များ။
     *
     * @return array<int, string[]> user_id => team names
     */
    public function teamSources(Project $project, array $userIds): array
    {
        if (! $userIds) {
            return [];
        }

        return $this->viaTeams($project)
            ->whereIn('tm.user_id', $userIds)
            ->get(['tm.user_id', 't.name'])
            ->groupBy('user_id')
            ->map(fn ($rows) => $rows->pluck('name')->unique()->sort()->values()->all())
            ->all();
    }

    /** ပေးထားတဲ့ team တွေရဲ့ active member (archive လုပ်ထားတဲ့ team ဆိုရင် မပါ) */
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
                ->where('u.status', UserStatus::ACTIVE->value),
            'tm.user_id'
        );
    }

    // ---------- Project ↔ Team linkage impact ----------

    /** Team တွေကို ချိတ်လိုက်ရင် access အသစ်ရမယ့် Employee အရေအတွက် */
    public function gainedBy(Project $project, array $teamIds): int
    {
        return count(array_diff($this->teamMemberIds($teamIds), $this->memberIds($project)));
    }

    /** Team တစ်ခုကို ဖယ်လိုက်ရင် access ဆုံးရှုံးမယ့် Employee အရေအတွက် (တခြား source ကနေ မရတော့သူများ) */
    public function lostWithout(Project $project, int $teamId): int
    {
        return count(array_diff(
            $this->teamMemberIds([$teamId]),
            $this->remainingIds($project, $teamId)
        ));
    }

    // ---------- Individual membership impact ----------

    /** Individual အဖြစ် ထပ်ထည့်ရင် access အသစ်ရမယ့် user id များ (Team ကနေ ရပြီးသားသူ မပါ) */
    public function newlyGranted(Project $project, array $userIds): array
    {
        return array_values(array_diff($userIds, $this->memberIds($project)));
    }

    public function losesAccessWhenIndividualRemoved(Project $project, int $userId): bool
    {
        return $this->viaIndividuals($project)->where('pm.user_id', $userId)->exists()
            && ! $this->viaTeams($project)->where('tm.user_id', $userId)->exists();
    }

    // ---------- Team membership / archive impact ----------

    /**
     * Team ထဲ user တွေ ထည့်ရင် ထို Team နဲ့ ချိတ်ထားတဲ့ Project (status/archive မရွေး) တွေမှာ
     * access အသစ်ရမယ့် (user, project) အရေအတွက်။
     *
     * @return array{projects: int, grants: int}
     */
    public function grantsFromTeamAdd(int $teamId, array $userIds): array
    {
        $grants = 0;
        $projects = $this->linkedProjects($teamId);

        foreach ($projects as $project) {
            $grants += count(array_diff($userIds, $this->memberIds($project)));
        }

        return ['projects' => $projects->count(), 'grants' => $grants];
    }

    /**
     * Team ကနေ user တစ်ယောက်ကို ဖယ်ရင် ချိတ်ထားတဲ့ Project တွေထဲက access ဆုံးရှုံးမယ့် Project အရေအတွက်။
     * တခြား Team (သူပါဝင်တဲ့) သို့မဟုတ် individual source ရှိရင် မဆုံးရှုံးဘူး။
     *
     * @return array{projects: int, losing: int}
     */
    public function lossOnTeamMemberRemoval(int $teamId, int $userId): array
    {
        $losing = 0;
        $projects = $this->linkedProjects($teamId);

        foreach ($projects as $project) {
            $other = $this->viaTeams($project)
                    ->where('tm.user_id', $userId)
                    ->where('tm.team_id', '!=', $teamId)
                    ->exists()
                || $this->viaIndividuals($project)->where('pm.user_id', $userId)->exists();

            if (! $other) {
                $losing++;
            }
        }

        return ['projects' => $projects->count(), 'losing' => $losing];
    }

    /**
     * Team ကို archive လုပ်ရင် access ဆုံးရှုံးမယ့် Employee နဲ့ Project အရေအတွက်။
     * (ဒီ Team ကတစ်ခုတည်းသော source ဖြစ်နေသူများကိုပဲ ရေတွက်)
     *
     * @return array{employees: int, projects: int}
     */
    public function lossOnTeamArchive(int $teamId): array
    {
        $members = $this->teamMemberIds([$teamId]);
        $employees = [];
        $projectCount = 0;

        foreach ($this->linkedProjects($teamId) as $project) {
            $lost = array_diff($members, $this->remainingIds($project, $teamId));

            if ($lost) {
                $projectCount++;
                $employees = array_merge($employees, $lost);
            }
        }

        return ['employees' => count(array_unique($employees)), 'projects' => $projectCount];
    }

    // ---------- helpers ----------

    /** ဒီ Team တစ်ခုကို မထည့်တွက်ရင် ကျန်တဲ့ source တွေကနေ access ရနေသူများ */
    protected function remainingIds(Project $project, int $excludeTeamId): array
    {
        return array_values(array_unique(array_merge(
            $this->ids($this->viaTeams($project)->where('tm.team_id', '!=', $excludeTeamId), 'tm.user_id'),
            $this->ids($this->viaIndividuals($project), 'pm.user_id'),
        )));
    }

    protected function linkedProjects(int $teamId)
    {
        return Project::query()
            ->whereIn(
                'id',
                DB::table('project_teams')->where('team_id', $teamId)->whereNull('removed_at')->select('project_id')
            )
            ->get(['id']);
    }
    protected function ids(Builder $query, string $column): array
    {
        return $query->distinct()->pluck($column)->map(fn ($id) => (int) $id)->all();
    }

    /**
 * Employee တစ်ယောက်ရဲ့ effective access ရှိတဲ့ Project id အားလုံး (source နှစ်ခု ပေါင်း၊ distinct)။
 * Super Admin နဲ့ inactive user ဆိုရင် အလွတ်ပြန်မယ်။
 *
 * @return int[]
 */
    public function projectIdsFor(User $user): array
    {
        if ($user->isSuperAdmin() || ! $user->isActive()) {
            return [];
        }

        $viaTeams = DB::table('team_members as tm')
            ->join('project_teams as pt', 'pt.team_id', '=', 'tm.team_id')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->where('tm.user_id', $user->id)
            ->whereNull('tm.removed_at')
            ->whereNull('pt.removed_at')
            ->whereNull('t.archived_at')
            ->pluck('pt.project_id');

        $individual = DB::table('project_members')
            ->where('user_id', $user->id)
            ->whereNull('removed_at')
            ->pluck('project_id');

        return $viaTeams->merge($individual)
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
 * Project များစွာရဲ့ effective member id ကို query ၂ ခုနဲ့ တွက်မယ်။
 *
 * @param  int[]  $projectIds
 * @return array<int, int[]> project id => user ids
 */
    public function memberIdsByProject(array $projectIds): array
    {
        if (! $projectIds) {
            return [];
        }

        $viaTeams = DB::table('team_members as tm')
            ->join('project_teams as pt', 'pt.team_id', '=', 'tm.team_id')
            ->join('teams as t', 't.id', '=', 'tm.team_id')
            ->join('users as u', 'u.id', '=', 'tm.user_id')
            ->whereIn('pt.project_id', $projectIds)
            ->whereNull('pt.removed_at')
            ->whereNull('tm.removed_at')
            ->whereNull('t.archived_at')
            ->where('u.role', UserRole::EMPLOYEE->value)
            ->where('u.status', UserStatus::ACTIVE->value)
            ->get(['pt.project_id', 'tm.user_id']);

        $individual = DB::table('project_members as pm')
            ->join('users as u', 'u.id', '=', 'pm.user_id')
            ->whereIn('pm.project_id', $projectIds)
            ->whereNull('pm.removed_at')
            ->where('u.role', UserRole::EMPLOYEE->value)
            ->where('u.status', UserStatus::ACTIVE->value)
            ->get(['pm.project_id', 'pm.user_id']);

        return $viaTeams->concat($individual)
            ->groupBy('project_id')
            ->map(fn ($rows) => $rows->pluck('user_id')->map(fn ($id) => (int) $id)->unique()->values()->all())
            ->all();
    }
}