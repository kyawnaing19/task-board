<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Task;
use App\Models\User;

class TaskPresenter
{
    /**
     * Relation တွေကို eager load ပြီးသားဖြစ်ရမယ်: group၊ assignees၊ tags
     * Compact card: title၊ assignees၊ priority၊ dates၊ tags၊ group သာ။
     *
     * @param  int[]  $memberIds  Project ရဲ့ effective member ids (request တစ်ခုမှာ တစ်ကြိမ်ပဲ တွက်)
     */
    public function card(Task $task, array $memberIds): array
    {
        return [
            'id'         => $task->id,
            'code'       => $task->code,
            'title'      => $task->title,
            'priority'   => $task->priority->value,
            'start_date' => $task->start_date?->toDateString(),
            'end_date'   => $task->end_date?->toDateString(),
            'group'      => $task->group ? [
                'id'           => $task->group->id,
                'name'         => $task->group->name,
                'color'        => $task->group->color,
                'is_completed' => $task->group->is_completed,
            ] : null,
            'assignees'  => $task->assignees->map(fn (User $u) => $this->person($u, $memberIds))->values()->all(),
            'tags'       => $task->tags->sortBy('name')->map(fn ($t) => [
                'id'       => $t->id,
                'name'     => $t->name,
                'color'    => $t->color,
                'inactive' => $t->archived_at !== null,
            ])->values()->all(),
        ];
    }

    /**
     * Drawer အတွက်။ Description၊ creator၊ timestamps၊ project၊ permission တွေ ထပ်ပါမယ်။
     * Relation: group၊ creator၊ assignees၊ tags၊ project ကို load ပြီးသားဖြစ်ရမယ်။
     */
    public function detail(Task $task, array $memberIds, array $permissions): array
    {
        $project = $task->project;

        return array_merge($this->card($task, $memberIds), [
            'description'  => $task->description,   // plain text၊ UI က စာသားအဖြစ်ပဲ ပြရမယ် (HTML render မလုပ်)
            'creator'      => $task->creator ? $this->person($task->creator, $memberIds) : null,
            'created_at'   => $task->created_at,
            'updated_at'   => $task->updated_at,
            'completed_at' => $task->completed_at,
            'archived_at'  => $task->archived_at,
            'is_archived'  => $task->isArchived(),
            'project'      => [
                'id'        => $project->id,
                'code'      => $project->code,
                'name'      => $project->name,
                'status'    => $project->status->value,
                'archived'  => $project->isArchived(),
                'read_only' => $project->isReadOnly(),
            ],
            'permissions'  => $permissions,
        ]);
    }

    /** Name / avatar သာ။ email၊ role မပါဘူး */
    public function person(User $user, array $memberIds): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'avatar_url' => $user->avatar_url,
            'label'      => $this->personLabel($user, $memberIds),
        ];
    }

    /** Inactive / project member မဟုတ်တော့တဲ့သူကို label ဖြင့် ဆက်ပြမယ် (မဖယ်ဘူး) */
   public function personLabel(User $user, array $memberIds): ?string
    {
        // Super Admin က project member မဖြစ်နိုင်လို့ "non_member" လို့ မတပ်ရဘူး
        if (($user->getAttributes()['role'] ?? null) === UserRole::SUPER_ADMIN->value) {
            return $this->statusLabel($user);
        }

        if ($label = $this->statusLabel($user)) {
            return $label;
        }

        return in_array($user->id, $memberIds, true) ? null : 'non_member';
    }

    protected function statusLabel(User $user): ?string
    {
        return $user->status !== UserStatus::ACTIVE->value ? 'inactive' : null;
    }
}