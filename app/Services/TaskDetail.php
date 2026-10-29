<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Repositories\Contracts\TaskCommentRepositoryInterface;


class TaskDetail
{
    public const HISTORY_PAGE = 50;

    public function __construct(
        protected TaskRepositoryInterface $tasks,
        protected TaskAuthorization $authorization,
        protected ProjectAccess $access,
        protected TaskPresenter $presenter,
        protected TaskActivityPresenter $activities,
        protected TaskCommentRepositoryInterface $comments

    ) {}

    /**
     * Drawer အတွက်။ Archived task ကိုလည်း effective member (နဲ့ Super Admin) အားလုံး read-only ကြည့်လို့ရမယ်။
     * Project ထဲမှာ မပါရင် 404။
     */
    public function detail(User $viewer, Task $task): array
    {
        $project = $task->project;

        $this->authorization->assertCanView($viewer, $project);

        $task->load([
            'group:id,name,color,is_completed',
            'creator:id,name,avatar_path,status',
            'assignees:id,name,avatar_path,status',
            'tags:id,name,color,archived_at',
            'creator:id,name,avatar_path,status,role',
        ]);

        $owner = $viewer->isSuperAdmin() || $this->authorization->ownsLoaded($viewer, $task);
        $readOnly = $project->isReadOnly();
        $archived = $task->isArchived();
        $editable = $owner && ! $archived && ! $readOnly;

        $permissions = [
            'can_manage'             => $owner,
            'can_edit'               => $editable,
            'can_move'               => $editable,
            'can_archive'            => $editable,
            'can_restore'            => $owner && $archived && ! $readOnly,
            // Disabled restore ခလုတ်အတွက် reason (owner / Super Admin ကိုပဲ ပြမယ်)
            'restore_blocked_reason' => ($owner && $archived && $readOnly) ? TaskService::RESTORE_BLOCKED_PROJECT : null,
        ];

        // return [
        //     'task'    => $this->presenter->detail($task, $this->access->memberIds($project), $permissions),
        //     'history' => $this->historyPage($task, null, self::HISTORY_PAGE),
        // ];
        return [
            'task'    => array_merge(
                $this->presenter->detail($task, $this->access->memberIds($project), $permissions),
                ['comments_count' => $this->comments->countVisible($task)]
            ),
            'history' => $this->historyPage($task, null, self::HISTORY_PAGE),
        ];
    }

    public function history(User $viewer, Task $task, ?int $before = null, int $limit = self::HISTORY_PAGE): array
    {
        $this->authorization->assertCanView($viewer, $task->project);

        return $this->historyPage($task, $before, min(max($limit, 1), 100));
    }

    protected function historyPage(Task $task, ?int $before, int $limit): array
    {
        $rows = $this->tasks->activities($task, $before, $limit);
        $hasMore = $rows->count() > $limit;
        $page = $rows->take($limit)->values();

        return [
            'data'        => $page->map(fn ($a) => $this->activities->present($a))->all(),
            // ဒီ id ထက် ငယ်တာတွေကို နောက် page အဖြစ် တောင်းမယ်
            'next_cursor' => $hasMore ? (int) $page->last()->id : null,
        ];
    }
}