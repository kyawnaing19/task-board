<?php

namespace App\Repositories\Contracts;

use App\Models\Task;
use App\Models\TaskActivity;

interface TaskRepositoryInterface
{
    public function create(array $data): Task;

    /** Group ထဲက archive မလုပ်ရသေးတဲ့ task တွေရဲ့ အဆုံးနောက်က နေရာ */
    public function nextPosition(int $projectId, int $groupId): int;

    public function attachAssignees(Task $task, array $userIds, int $actorId): void;

    public function attachTags(Task $task, array $tagIds): void;

    public function record(Task $task, ?int $actorId, string $type, array $payload = []): TaskActivity;

    /** Row ကို lock လုပ်ပြီး နောက်ဆုံး state နဲ့ ပြန်ယူမယ် */
    public function lock(Task $task): Task;

    public function update(Task $task, array $data): Task;

    /** Pivot ပဲ ပြောင်းတဲ့အခါ updated_at ကို အသစ်လုပ်မယ် */
    public function touch(Task $task): void;

    /** @return int[] */
    public function assigneeIds(Task $task): array;

    /** @return int[] */
    public function tagIds(Task $task): array;

    public function detachAssignees(Task $task, array $userIds): void;

    public function detachTags(Task $task, array $tagIds): void;

    /** @return array<int, string> user id => name */
    public function userNames(array $ids): array;


}