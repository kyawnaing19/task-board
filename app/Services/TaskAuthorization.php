<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class TaskAuthorization
{
    public function __construct(
        protected ProjectAccess $access
    ) {}

    /** Super Admin သို့မဟုတ် Project ရဲ့ effective member။ Task ဆောက်ခွင့်၊ ကြည့်ခွင့်။ */
    public function canViewProject(User $user, Project $project): bool
    {
        return $user->isSuperAdmin() || $this->access->hasAccess($user, $project);
    }

    /** Project ထဲမှာ မပါရင် 404 (project ရှိကြောင်းတောင် မသိစေဘူး) */
    public function assertCanCreate(User $user, Project $project): void
    {
        abort_unless($this->canViewProject($user, $project), 404);
    }

    /**
     * ပြင်/assign/ရွှေ့/archive/restore လုပ်ခွင့်:
     * Super Admin၊ ဒါမှမဟုတ် Project access ရှိနေတုန်း Creator သို့မဟုတ် လက်ရှိ Assignee။
     * Membership ဆုံးရှုံးရင် Creator ဖြစ်နေရင်တောင် ချက်ချင်း authority ပျောက်မယ်။
     */
    public function canManage(User $user, Task $task): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if (! $this->access->hasAccess($user, $task->project)) {
            return false;
        }

        return $task->created_by === $user->id
            || $task->assignees()->where('users.id', $user->id)->exists();
    }

    public function assertCanManage(User $user, Task $task): void
    {
        if ($this->canManage($user, $task)) {
            return;
        }

        abort(
            $this->canViewProject($user, $task->project) ? 403 : 404,
            'Only the task creator, its current assignees or a Super Admin can change this task.'
        );
    }

    /** Project ထဲမှာ မပါရင် 404 */
    public function assertCanView(User $user, Project $project): void
    {
        abort_unless($this->canViewProject($user, $project), 404);
    }

    /**
     * Creator သို့မဟုတ် Assignee လား (eager load ပြီးသား assignees ကို သုံးတာမို့ query မထပ်ဘူး)။
     * Project access ကို caller က စစ်ပြီးသားဖြစ်ရမယ်။
     */
    public function ownsLoaded(User $user, Task $task): bool
    {
        return $task->created_by === $user->id
            || $task->assignees->contains('id', $user->id);
    }



}