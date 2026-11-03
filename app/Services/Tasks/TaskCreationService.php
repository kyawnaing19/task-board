<?php

namespace App\Services\Tasks;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Services\ProjectAccess;
use App\Services\ProjectService;
use App\Services\TagService;
use App\Services\TaskAuthorization;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskCreationService
{
    public function __construct(
        private TaskRepositoryInterface $tasks,
        private TaskGroupRepositoryInterface $groups,
        private ProjectRepositoryInterface $projects,
        private ProjectService $projectService,
        private ProjectAccess $access,
        private TagService $tags,
        private TaskAuthorization $authorization,
        private TaskAssigneeService $assignees,
        private TaskDescriptionService $descriptions,
    ) {}

    public function create(User $actor, Project $project, array $data): Task
    {
        $this->authorization->assertCanCreate($actor, $project);

        return DB::transaction(function () use ($actor, $project, $data) {
            // Lock အစဉ်: group → project (Group စီမံတာကလည်း group ကို အရင် lock လုပ်လို့ deadlock မဖြစ်စေဖို့)
            $group = $this->groups->lockForPlacement($data['group_id'] ?? null);

            if (! $group || $group->isArchived()) {
                throw ValidationException::withMessages([
                    'group_id' => 'Choose an active group for the task.',
                ]);
            }

            $locked = $this->projects->lock($project);

            // Active project မှာပဲ ဆောက်လို့ရမယ် (Completed/Archived ဆို read-only error)
            $this->projectService->assertEditable($locked);

            $assigneeIds = $this->assignees->assertAssignees($locked, $data['assignee_ids'] ?? []);
            $tagIds = $this->tags->assertAssignable($data['tag_ids'] ?? []);
            $priority = TaskPriority::tryFrom($data['priority'] ?? '') ?? TaskPriority::NORMAL;

            // Failure ဖြစ်ရင် sequence မလောင်အောင် validation အားလုံးပြီးမှ ခွဲပေးမယ်
            $sequence = $this->projects->nextTaskSequence($locked);
            $completed = $group->is_completed;

            $task = $this->tasks->create([
                'project_id' => $locked->id,
                'sequence' => $sequence,
                'code' => "{$locked->code}-{$sequence}",
                'title' => $data['title'],
                // 'description'   => $data['description'] ?? null,
                'description' => $this->descriptions->sanitizeDescription($data['description'] ?? null),
                'priority' => $priority,
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'group_id' => $group->id,
                'sort_position' => $this->tasks->nextPosition($locked->id, $group->id),
                // Completed group ထဲ တိုက်ရိုက်ဆောက်ရင် ဆောက်တဲ့အချိန်ကို completed_at လို့ သတ်မှတ်မယ်
                'completed_at' => $completed ? now() : null,
                // Creator ကို authenticated actor ကနေ အလိုအလျောက်၊ Assignee အဖြစ်တော့ အလိုအလျောက်မထည့်ဘူး
                'created_by' => $actor->id,
            ]);

            // Auto-assign creator if no assignees provided and creator is a valid project member
            // Superadmins are excluded from memberIds, so they won't be auto-assigned
            $effectiveAssigneeIds = $assigneeIds;
            if (empty($assigneeIds)) {
                $memberIds = $this->access->memberIds($locked);
                if (in_array($actor->id, $memberIds, true)) {
                    $effectiveAssigneeIds = [$actor->id];
                }
            }

            $this->tasks->attachAssignees($task, $effectiveAssigneeIds, $actor->id);
            $this->tasks->attachTags($task, $tagIds);

            // Initial state ကို created history မှာပဲ မှတ်မယ်၊ move event မဖန်တီးဘူး
            $this->tasks->record($task, $actor->id, TaskActivity::CREATED, [
                'group' => ['id' => $group->id, 'name' => $group->name],
                'completed' => $completed,
                'priority' => $priority->value,
                'assignee_ids' => $effectiveAssigneeIds,
                'tag_ids' => $tagIds,
            ]);

            return $task->load(['assignees:id,name', 'tags:id,name,color']);
        });
    }

    /**
     * - အသစ်ထပ်ထည့်တာ (requested - current) က Project ရဲ့ active effective Employee member ဖြစ်ရမယ်။
     *   Super Admin၊ inactive၊ membership ဆုံးရှုံးသူကို အသစ်ထည့်လို့မရဘူး။
     * - $current ထဲက ရှိပြီးသား assignee ကို requested မှာ ဆက်ပါနေရင် inactive/non-member ဖြစ်နေလည်း ဆက်ထားမယ်။
     * - Requested မှာ မပါတော့တာက explicit removal လို့ ယူမယ်။
     *
     * @param  int[]  $requested
     * @param  int[]  $current
     * @return int[]
     */
}
