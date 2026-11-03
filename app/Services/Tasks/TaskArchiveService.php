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
use App\Services\ProjectAccess;
use App\Services\ProjectService;
use App\Services\TaskAuthorization;
use App\Services\TaskPresenter;
use App\Services\TaskService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskArchiveService
{
    public function __construct(
        private TaskRepositoryInterface $tasks,
        private TaskGroupRepositoryInterface $groups,
        private ProjectRepositoryInterface $projects,
        private TaskAuthorization $authorization,
        private ProjectService $projectService,
        private ProjectAccess $access,
        private TaskPresenter $presenter,
    ) {}

    public function archive(User $actor, Task $task): Task
    {
        return DB::transaction(function () use ($actor, $task) {
            // Lock အစဉ်: project → task (group ကို မထိလို့ group lock မလို)
            $project = $this->projects->lock($task->project);
            $locked = $this->tasks->lock($task);
            $locked->setRelation('project', $project);

            $this->authorization->assertCanManage($actor, $locked);
            $this->projectService->assertEditable($project);

            if ($locked->isArchived()) {
                throw ValidationException::withMessages(['task' => 'This task is already archived.']);
            }

            $group = TaskGroup::query()->find($locked->group_id);

            $locked = $this->tasks->update($locked, [
                'archived_at' => now(),
                'archived_by' => $actor->id,
                'sort_position' => null,
            ]);

            $this->tasks->record($locked, $actor->id, TaskActivity::ARCHIVED, [
                'archived' => ['from' => false, 'to' => true],
                'group' => $group ? ['id' => $group->id, 'name' => $group->name] : null,
                'completed' => $locked->completed_at !== null,
            ]);

            return $this->loaded($locked);
        });
    }

    /**
     * Restore: Active project မှာပဲ၊ ownership လိုတယ်။ လက်ရှိ group (Group maintenance ပြောင်းထားရင် post-migration state)
     * ရဲ့ အဆုံးမှာ append လုပ်မယ်။ လက်ရှိ Completed group ထဲဆိုရင် completed_at ကို ဆက်ထား၊ မဟုတ်ရင် ရှင်းမယ်။
     */
    public function restore(User $actor, Task $task): Task
    {
        return DB::transaction(function () use ($actor, $task) {
            // Lock အစဉ်: current group (shared) → project → task
            $groupId = (int) $this->tasks->currentGroupId($task->id);
            $group = $this->groups->lockForPlacement($groupId);

            $project = $this->projects->lock($task->project);
            $locked = $this->tasks->lock($task);
            $locked->setRelation('project', $project);

            // Group ကို lock မယူခင် ဖတ်ထားတာမို့ ကြားထဲမှာ ပြောင်းသွားရင် (Group maintenance) ပြန်ကြိုးစားခိုင်းမယ်
            if ((int) $locked->group_id !== $groupId) {
                throw ValidationException::withMessages([
                    'task' => 'The task changed while it was being restored. Please try again.',
                ]);
            }

            $this->authorization->assertCanManage($actor, $locked);

            if ($project->isReadOnly()) {
                throw ValidationException::withMessages(['project' => TaskService::RESTORE_BLOCKED_PROJECT]);
            }

            if (! $locked->isArchived()) {
                throw ValidationException::withMessages(['task' => 'This task is not archived.']);
            }

            if (! $group || $group->isArchived()) {
                throw ValidationException::withMessages([
                    'task' => 'The group of this task is no longer available. Please contact an administrator.',
                ]);
            }

            $inCompleted = $group->is_completed;
            $hadCompletedAt = $locked->completed_at !== null;

            $attributes = [
                'archived_at' => null,
                'archived_by' => null,
                'sort_position' => $this->tasks->nextPosition($project->id, $group->id, $locked->id),
            ];

            // Completed group ထဲမှာ မဟုတ်ရင် completed_at ကို ရှင်းမယ် (ဆက်ထားတာက Completed group ထဲမှာပဲ)
            if (! $inCompleted) {
                $attributes['completed_at'] = null;
            }

            $locked = $this->tasks->update($locked, $attributes);

            $this->tasks->record($locked, $actor->id, TaskActivity::RESTORED, [
                'archived' => ['from' => true, 'to' => false],
                'group' => ['id' => $group->id, 'name' => $group->name],
                'completion' => [
                    'in_completed_group' => $inCompleted,
                    'completed_at' => $inCompleted ? ($hadCompletedAt ? 'retained' : 'none') : ($hadCompletedAt ? 'cleared' : 'none'),
                ],
                'placement' => 'end',
            ]);

            return $this->loaded($locked);
        });
    }

    /**
     * Archived Tasks list (read-only)။ Super Admin နဲ့ Project ရဲ့ effective member အားလုံး ကြည့်လို့ရမယ်။
     * can_restore / restore_blocked_reason က owner (သို့) Super Admin အတွက်ပဲ ဆိုလိုရင်ဖြစ်ပြီး UI ရဲ့ disabled ခလုတ်အတွက်။
     */
    public function archivedTasks(User $viewer, Project $project): LengthAwarePaginator
    {
        $this->authorization->assertCanView($viewer, $project);

        $page = $this->tasks->paginateArchived($project);
        $memberIds = $this->access->memberIds($project);
        $readOnly = $project->isReadOnly();
        $isAdmin = $viewer->isSuperAdmin();

        return $page->through(function (Task $task) use ($viewer, $memberIds, $readOnly, $isAdmin) {
            $canManage = $isAdmin || $this->authorization->ownsLoaded($viewer, $task);

            return array_merge($this->presenter->card($task, $memberIds), [
                'archived_at' => $task->archived_at,
                'can_manage' => $canManage,
                'can_restore' => $canManage && ! $readOnly,
                'restore_blocked_reason' => ($canManage && $readOnly) ? TaskService::RESTORE_BLOCKED_PROJECT : null,
            ]);
        });
    }

    protected function loaded(Task $task): Task
    {
        return $task->load(['assignees:id,name', 'tags:id,name,color']);
    }
}
