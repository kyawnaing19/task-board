<?php

namespace App\Repositories\Contracts;

use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\Project;
use App\Models\User;
use App\Support\MyTaskScope;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Carbon\CarbonInterface;
use App\Support\TaskFilters;
use Illuminate\Support\Collection;


interface TaskRepositoryInterface
{
    public function create(array $data): Task;

    /** Group ထဲက archive မလုပ်ရသေးတဲ့ task တွေရဲ့ အဆုံးနောက်က နေရာ ($excludeTaskId ကို မထည့်တွက်ဘူး) */
    public function nextPosition(int $projectId, int $groupId, ?int $excludeTaskId = null): int;

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


    /** Group ထဲမှာ ရှိနေတဲ့ archive မလုပ်ရသေးတဲ့ task (anchor စစ်ဖို့) */
    public function findPlaced(int $projectId, int $groupId, int $taskId): ?Task;

    /** Task ရဲ့ group ထဲမှာ ကိုယ့်ကို ထပ်ပြီး ချက်ချင်းနောက်က task */
    public function nextSibling(Task $task): ?Task;

    /** Group ထဲက $fromPosition နဲ့ အောက်က task တွေကို +1 တိုးမယ် ($excludeTaskId မပါ၊ updated_at မထိ) */
    public function shiftFrom(int $projectId, int $groupId, int $fromPosition, int $excludeTaskId): void;

    /** Lock မယူဘဲ Task ရဲ့ group id ကို ဖတ်မယ် (group ကို အရင် lock လုပ်ဖို့) */
    public function currentGroupId(int $taskId): ?int;

    /** Archive မလုပ်ရသေးတဲ့ task တွေထဲက Completed group ထဲမှာ မရှိတာ (open task) အရေအတွက် */
    public function countOpen(Project $project): int;

    public function paginateArchived(Project $project, int $perPage = 20): LengthAwarePaginator;


    /** Group ထဲက task အားလုံး (archived ပါ၊ project status မရွေး) */
    public function countInGroup(int $groupId): int;

    /**
     * $fromGroupId ထဲက task အားလုံးကို $toGroupId ဆီ ရွှေ့မယ် (System-level)။
     * Live task တွေကို project တစ်ခုချင်းစီရဲ့ ရှိပြီးသား order ရဲ့ အဆုံးမှာ မူလ order အတိုင်း ဆက်စီမယ်၊
     * archived task ရဲ့ position က NULL အတိုင်း၊ completed_at / updated_at ကို မထိဘူး။
     */
    public function appendGroupTasks(int $fromGroupId, int $toGroupId): void;

    /** Group ထဲက task အားလုံးရဲ့ completed_at ကို သတ်မှတ်မယ် (ရှိပြီးသားကိုပါ ပြောင်းမယ်) */
    public function setCompletedAtInGroup(int $groupId, CarbonInterface $at): void;

    /** Group ထဲမှာ completed_at မရှိသေးတဲ့ task တွေကိုပဲ သတ်မှတ်မယ် */
    public function fillMissingCompletedAt(int $groupId, CarbonInterface $at): void;

    /** Group တစ်ခုရဲ့ board page။ $limit + 1 ခု ပြန်မယ် (နောက်ထပ် ရှိမရှိ သိဖို့)။ Archived task မပါ */
    public function boardPage(Project $project, int $groupId, TaskFilters $filters, int $viewerId, ?int $after, int $limit): Collection;

    /** @return array<int, int> group id => filter နဲ့ ကိုက်တဲ့ task အရေအတွက် */
    public function groupTotals(Project $project, TaskFilters $filters, int $viewerId): array;

    public function matchesFilters(Task $task, TaskFilters $filters, int $viewerId): bool;

    /** History (newest first)။ $limit + 1 ခု ပြန်မယ် */
    public function activities(Task $task, ?int $before, int $limit): Collection;

    /**
    * My Tasks။ Project access ($projectIds)၊ ownership mode၊ archive 2×2၊ filter အားလုံး AND။
    * Sort: updated_at desc၊ id desc (stable tie-break)
    */
    public function paginateMine(User $user, array $projectIds, MyTaskScope $scope, TaskFilters $filters, int $perPage): LengthAwarePaginator;

}