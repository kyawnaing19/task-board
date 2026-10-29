<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\TaskCommentRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskCommentService
{
    public const MAX_BODY = 5000;
    public const DEFAULT_LIMIT = 25;
    public const MAX_LIMIT = 100;

    public function __construct(
        protected TaskCommentRepositoryInterface $comments,
        protected TaskRepositoryInterface $tasks,
        protected ProjectRepositoryInterface $projects,
        protected TaskAuthorization $authorization,
        protected ProjectAccess $access,
        protected TaskPresenter $presenter
    ) {}

    /**
     * Super Admin နဲ့ project ရဲ့ effective member အားလုံး ဖတ်လို့ရတယ် (archived task / archived project ပါ)။
     * Project ထဲမှာ မပါရင် 404။
     */
    public function list(User $viewer, Task $task, ?int $before = null, int $limit = self::DEFAULT_LIMIT): array
    {
        $project = $task->project;

        $this->authorization->assertCanView($viewer, $project);

        $limit = min(max($limit, 1), self::MAX_LIMIT);
        $rows = $this->comments->page($task, $before, $limit);
        $hasMore = $rows->count() > $limit;
        $page = $rows->take($limit)->values();

        $memberIds = $this->access->memberIds($project);
        $gate = $this->readOnlyReason($task, $project);

        return [
            'data'                   => $page->map(fn (TaskComment $c) => $this->present($viewer, $c, $memberIds, $gate))->all(),
            // ဒီ id ထက်ငယ်တာတွေကို နောက် page အဖြစ် တောင်းမယ်
            'next_cursor'            => $hasMore ? (int) $page->last()->id : null,
            'total'                  => $this->comments->countVisible($task),
            'can_comment'            => $gate === null,
            'comment_blocked_reason' => $gate,
        ];
    }

    public function create(User $actor, Task $task, string $body): array
    {
        return DB::transaction(function () use ($actor, $task, $body) {
            // Lock အစဉ်: project (shared) → task၊ အခြား service တွေနဲ့ တူအောင်
            $project = $this->projects->lockShared($task->project);
            $locked = $this->tasks->lock($task);
            $locked->setRelation('project', $project);

            $this->authorization->assertCanView($actor, $project);
            $this->assertWritable($locked, $project);

            $comment = $this->comments->create([
                'task_id'   => $locked->id,
                'author_id' => $actor->id,
                'body'      => $body,
            ]);

            // Comment အသစ်က task ရဲ့ user-visible activity (ပြင်/ဖျက်တာက မတိုးဘူး)
            $this->tasks->touch($locked);

            return $this->present($actor, $comment, $this->access->memberIds($project), null);
        });
    }

    public function update(User $actor, TaskComment $comment, string $body): array
    {
        return DB::transaction(function () use ($actor, $comment, $body) {
            [$task, $project, $locked] = $this->lockForChange($comment);

            $this->authorization->assertCanView($actor, $project);

            if ($locked->isDeleted()) {
                throw ValidationException::withMessages(['comment' => 'This comment has been deleted.']);
            }

            // ကိုယ့် comment ကိုပဲ ပြင်လို့ရတယ် (Super Admin ကတောင် တခြားသူ့ဟာကို မပြင်ရ)
            if ($locked->author_id !== $actor->id) {
                abort(403, 'You can only edit your own comments.');
            }

            $this->assertWritable($task, $project);

            if ($body !== $locked->body) {
                $locked = $this->comments->update($locked, ['body' => $body, 'edited_at' => now()]);
            }

            return $this->present($actor, $locked, $this->access->memberIds($project), null);
        });
    }
    public function delete(User $actor, TaskComment $comment): array
    {
        return DB::transaction(function () use ($actor, $comment) {
            [$task, $project, $locked] = $this->lockForChange($comment);

            $this->authorization->assertCanView($actor, $project);

            if ($locked->isDeleted()) {
                throw ValidationException::withMessages(['comment' => 'This comment has already been deleted.']);
            }

            if ($locked->author_id !== $actor->id && ! $actor->isSuperAdmin()) {
                abort(403, 'You can only delete your own comments.');
            }

            $this->assertWritable($task, $project);

            $locked = $this->comments->update($locked, ['deleted_at' => now(), 'deleted_by' => $actor->id]);

            return $this->present($actor, $locked, [], null);
        });
    }

    /** @return array{0: Task, 1: Project, 2: TaskComment} */
    protected function lockForChange(TaskComment $comment): array
    {
        $task = $comment->task;                    // task က immutable မို့ lock မယူခင် ဖတ်လို့ရတယ်
        $project = $this->projects->lockShared($task->project);
        $locked = $this->comments->lock($comment);
        $task->setRelation('project', $project);

        return [$task, $project, $locked];
    }

    protected function assertWritable(Task $task, Project $project): void
    {
        if ($reason = $this->readOnlyReason($task, $project)) {
            throw ValidationException::withMessages(['comment' => $reason]);
        }
    }

    protected function readOnlyReason(Task $task, Project $project): ?string
    {
        return match (true) {
            $project->isArchived()  => 'This project is archived, so comments are read-only.',
            $project->isCompleted() => 'This project is completed, so comments are read-only.',
            $task->isArchived()     => 'This task is archived, so comments are read-only.',
            default                 => null,
        };
    }

    protected function present(User $viewer, TaskComment $comment, array $memberIds, ?string $gate): array
    {
        $deleted = $comment->isDeleted();
        $mine = $comment->author_id === $viewer->id;

        return [
            'id'         => $comment->id,
            'is_deleted' => $deleted,
            // ဖျက်ထားတာဆို body နဲ့ author ကို မပို့ဘူး
            'body'       => $deleted ? null : $comment->body,
            'author'     => ($deleted || ! $comment->author) ? null : $this->presenter->person($comment->author, $memberIds),
            'created_at' => $comment->created_at,
            'edited_at'  => $deleted ? null : $comment->edited_at,
            'deleted_at' => $comment->deleted_at,
            'can_edit'   => ! $deleted && $gate === null && $mine,
            'can_delete' => ! $deleted && $gate === null && ($mine || $viewer->isSuperAdmin()),
        ];
    }
}