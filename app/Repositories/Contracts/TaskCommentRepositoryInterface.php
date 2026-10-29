<?php

namespace App\Repositories\Contracts;

use App\Models\Task;
use App\Models\TaskComment;
use Illuminate\Support\Collection;

interface TaskCommentRepositoryInterface
{
    /** Newest first၊ tombstone ပါ ပါမယ်။ $limit + 1 ခု ပြန်မယ် */
    public function page(Task $task, ?int $before, int $limit): Collection;

    /** ဖျက်မထားတဲ့ comment အရေအတွက် */
    public function countVisible(Task $task): int;

    public function create(array $data): TaskComment;

    public function lock(TaskComment $comment): TaskComment;

    public function update(TaskComment $comment, array $data): TaskComment;
}