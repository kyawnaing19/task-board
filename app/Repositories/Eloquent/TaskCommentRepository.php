<?php

namespace App\Repositories\Eloquent;

use App\Models\Task;
use App\Models\TaskComment;
use App\Repositories\Contracts\TaskCommentRepositoryInterface;
use Illuminate\Support\Collection;

class TaskCommentRepository implements TaskCommentRepositoryInterface
{
    private const AUTHOR = 'author:id,name,avatar_path,status,role';

    public function page(Task $task, ?int $before, int $limit): Collection
    {
        return TaskComment::query()
            ->where('task_id', $task->id)
            ->when($before !== null, fn ($q) => $q->where('id', '<', $before))
            ->with(self::AUTHOR)
            ->orderByDesc('id')                  // id က ဖန်တီးတဲ့အစဉ်၊ stable tie-break
            ->limit($limit + 1)
            ->get();
    }

    public function countVisible(Task $task): int
    {
        return TaskComment::query()->where('task_id', $task->id)->whereNull('deleted_at')->count();
    }

    public function create(array $data): TaskComment
    {
        return TaskComment::create($data)->load(self::AUTHOR);
    }

    public function lock(TaskComment $comment): TaskComment
    {
        return TaskComment::query()
            ->whereKey($comment->id)
            ->with(self::AUTHOR)
            ->lockForUpdate()
            ->firstOrFail();
    }

    public function update(TaskComment $comment, array $data): TaskComment
    {
        $comment->update($data);

        return $comment->refresh()->load(self::AUTHOR);
    }
}