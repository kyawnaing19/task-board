<?php

namespace App\Services\Tasks;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\TaskGroup;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Services\ProjectService;
use App\Services\TaskAuthorization;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskOrderingService
{
    public function __construct(
        private TaskRepositoryInterface $tasks,
        private TaskGroupRepositoryInterface $groups,
        private ProjectRepositoryInterface $projects,
        private ProjectService $projectService,
        private TaskAuthorization $authorization,
    ) {}

    public function move(User $actor, Task $task, int $groupId, ?int $beforeTaskId = null): Task
    {
        return DB::transaction(function () use ($actor, $task, $groupId, $beforeTaskId) {
            // Lock အစဉ်: destination group (shared) → project → task
            $destination = $this->groups->lockForPlacement($groupId);

            if (! $destination || $destination->isArchived()) {
                throw ValidationException::withMessages([
                    'group_id' => 'Choose an active group to move the task to.',
                ]);
            }

            $project = $this->projects->lock($task->project);
            $locked = $this->tasks->lock($task);
            $locked->setRelation('project', $project);

            $this->authorization->assertCanManage($actor, $locked);
            $this->projectService->assertEditable($project);

            if ($locked->isArchived()) {
                throw ValidationException::withMessages([
                    'task' => 'Archived tasks cannot be moved. Restore the task first.',
                ]);
            }

            $sameGroup = (int) $locked->group_id === (int) $destination->id;

            // Anchor: destination group ထဲက archive မလုပ်ရသေးတဲ့ အခြား task ဖြစ်ရမယ်
            $anchor = null;

            if ($beforeTaskId !== null) {
                if ($beforeTaskId === (int) $locked->id) {
                    if ($sameGroup) {
                        return $this->loaded($locked);   // ကိုယ့်ရှေ့ကိုယ်ချတာ = ဘာမှမပြောင်း
                    }

                    throw $this->boardOutOfDate();
                }

                $anchor = $this->tasks->findPlaced($project->id, $destination->id, $beforeTaskId);

                if (! $anchor) {
                    throw $this->boardOutOfDate();
                }
            }

            // ရှိပြီးသားနေရာမှာပဲ ပြန်ချတာဆိုရင် history မထည့်ဘဲ ပြန်မယ်
            if ($sameGroup) {
                $next = $this->tasks->nextSibling($locked);
                $alreadyThere = $anchor ? ($next !== null && (int) $next->id === (int) $anchor->id) : ($next === null);

                if ($alreadyThere) {
                    return $this->loaded($locked);
                }
            }

            // Position: anchor ရှေ့မှာ ထည့် (anchor နဲ့ အောက်ကို +1) သို့မဟုတ် အဆုံးမှာ append
            if ($anchor) {
                $position = (int) $anchor->sort_position;
                $this->tasks->shiftFrom($project->id, $destination->id, $position, $locked->id);
            } else {
                $position = $this->tasks->nextPosition($project->id, $destination->id, $locked->id);
            }

            $source = TaskGroup::query()->find($locked->group_id);
            $entering = ! $sameGroup && $destination->is_completed;
            $leaving = ! $sameGroup && (bool) $source?->is_completed;

            $attributes = [
                'group_id' => $destination->id,
                'sort_position' => $position,
            ];

            // Completed group ထဲဝင်ရင် ယခုအချိန်၊ ထွက်ရင် ရှင်းမယ်၊ Same-group reorder က မထိဘူး
            if ($entering) {
                $attributes['completed_at'] = now();
            } elseif ($leaving) {
                $attributes['completed_at'] = null;
            }

            $locked = $this->tasks->update($locked, $attributes);

            // ရွှေ့တဲ့ task အတွက်ပဲ မှတ်မယ်၊ collateral position ညှိချက်တွေ မမှတ်ဘူး
            if ($sameGroup) {
                $this->tasks->record($locked, $actor->id, TaskActivity::REORDERED, [
                    'group' => ['id' => $destination->id, 'name' => $destination->name],
                ]);
            } else {
                $this->tasks->record($locked, $actor->id, TaskActivity::MOVED, [
                    'from' => $source ? ['id' => $source->id, 'name' => $source->name] : null,
                    'to' => ['id' => $destination->id, 'name' => $destination->name],
                    'placement' => $anchor ? 'before' : 'end',
                    'completed' => $entering ? 'entered' : ($leaving ? 'left' : null),
                ]);
            }

            return $this->loaded($locked);
        });
    }

    /**
     * Archive: Task ကို board ကနေ ဖယ်မယ်၊ ဒါပေမယ့် group၊ completed_at၊ assignees၊ tags၊ history ကို မထိဘူး။
     * Position တွေကို ပြန်မစီဘူး (archived task ရဲ့ sort_position က NULL)။
     */
    protected function loaded(Task $task): Task
    {
        return $task->load(['assignees:id,name', 'tags:id,name,color']);
    }

    protected function boardOutOfDate(): ValidationException
    {
        return ValidationException::withMessages([
            'before_task_id' => 'The board changed since it was loaded. Reload and try again.',
        ]);
    }

    /**
 * Scalar field ၅ ခု (whitelist) ရဲ့ ပြောင်းလဲမှုကို တွက်မယ်။
 *
 * @return array{0: array<string, mixed>, 1: array<string, array{from: mixed, to: mixed}>}
 */
    /**
 * Scalar task fields တွေကို နှိုင်းယှဉ်ပြီး ပြောင်းလဲမှုများကို ပြန်ပေးမယ်။
 *
 * Description ကို HTML အဖြစ် သိမ်းမယ်။
 * History မှာတော့ plain-text excerpt ပဲ သိမ်းမယ်။
 *
 * @return array{0: array, 1: array}
 */
}
