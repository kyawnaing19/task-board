<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\ProjectTeam;
use App\Models\User;

/**
 * Project ပေါ်က Super Admin / Team leader permission အားလုံးကို ဒီနေရာတစ်ခုတည်းမှာ ကိုင်မယ်။
 * Leader ရဲ့ ခွင့်ပြုချက်ကို ပြောင်းချင်ရင် ဒီ class ထဲက method တွေကိုပဲ ပြင်ပါ။
 */
class ProjectAuthorization
{
    public function __construct(
        protected TeamLeadership $leadership,
        protected ProjectAccess $access
    ) {}

    public function canCreate(User $user): bool
    {
        return $user->isSuperAdmin() || $this->leadership->leadsAny($user);
    }

    public function assertCanCreate(User $user): void
    {
        abort_unless($this->canCreate($user), 403, 'Only a Super Admin or a team leader can create projects.');
    }

    /**
     * Project ကို စီမံခွင့် (metadata၊ Completed ပြောင်း၊ individual member)။
     * Super Admin၊ ဒါမှမဟုတ် Project access ရှိတဲ့ effective leader ဖြစ်ပြီး
     * Project ကို ကိုယ်ဆောက်ထားတာ / ကိုယ်ဦးဆောင်တဲ့ team နဲ့ ချိတ်ထားတာ ဖြစ်ရမယ်။
     */
    public function canManage(User $user, Project $project): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        $led = $this->leadership->ledTeamIds($user);

        if ($led === [] || ! $this->access->hasAccess($user, $project)) {
            return false;
        }

        return $project->created_by === $user->id || $this->linkedToAny($project, $led);
    }

    public function assertCanManage(User $user, Project $project): void
    {
        if ($this->canManage($user, $project)) {
            return;
        }

        // Project access မရှိရင် 404 (ရှိကြောင်းတောင် မသိစေဘူး)
        abort(
            $this->access->hasAccess($user, $project) ? 403 : 404,
            'Only a Super Admin or the leader of one of its teams can change this project.'
        );
    }

    /** Leader က Completed ပြောင်းလို့ရတယ်၊ Reopen က Super Admin သီးသန့် */
    public function assertCanChangeStatus(User $user, Project $project, ProjectStatus $target): void
    {
        $this->assertCanManage($user, $project);

        abort_if(
            ! $user->isSuperAdmin() && $target !== ProjectStatus::COMPLETED,
            403,
            'Only a Super Admin can reopen a project.'
        );
    }

    /** UI က ခလုတ်ပြ/မပြ ဆုံးဖြတ်ဖို့ */
    public function abilities(User $user, Project $project): array
    {
        $manage = $this->canManage($user, $project);
        $editable = $project->isActive() && ! $project->isArchived();

        return [
            'can_edit'           => $manage && $editable,
            'can_complete'       => $manage && $editable,
            'can_manage_members' => $manage && $editable,
        ];
    }

    protected function linkedToAny(Project $project, array $teamIds): bool
    {
        return ProjectTeam::query()
            ->active()
            ->where('project_id', $project->id)
            ->whereIn('team_id', $teamIds)
            ->exists();
    }
}