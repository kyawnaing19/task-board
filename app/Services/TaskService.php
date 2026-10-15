<?php

namespace App\Services;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\TaskGroup;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\TagRepositoryInterface;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskService
{    
    public const RESTORE_BLOCKED_PROJECT = 'Project must be Active before this task can be restored';

    public function __construct(
        protected TaskRepositoryInterface $tasks,
        protected TaskGroupRepositoryInterface $groups,
        protected ProjectRepositoryInterface $projects,
        protected ProjectService $projectService,
        protected ProjectAccess $access,
        protected TagService $tags,
        protected TagRepositoryInterface $tagRepository,
        protected TaskAuthorization $authorization,
        protected TaskPresenter $presenter
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

            $assigneeIds = $this->assertAssignees($locked, $data['assignee_ids'] ?? []);
            $tagIds = $this->tags->assertAssignable($data['tag_ids'] ?? []);
            $priority = TaskPriority::tryFrom($data['priority'] ?? '') ?? TaskPriority::NORMAL;

            // Failure ဖြစ်ရင် sequence မလောင်အောင် validation အားလုံးပြီးမှ ခွဲပေးမယ်
            $sequence = $this->projects->nextTaskSequence($locked);
            $completed = $group->is_completed;

            $task = $this->tasks->create([
                'project_id'    => $locked->id,
                'sequence'      => $sequence,
                'code'          => "{$locked->code}-{$sequence}",
                'title'         => $data['title'],
                'description'   => $data['description'] ?? null,
                'priority'      => $priority,
                'start_date'    => $data['start_date'] ?? null,
                'end_date'      => $data['end_date'] ?? null,
                'group_id'      => $group->id,
                'sort_position' => $this->tasks->nextPosition($locked->id, $group->id),
                // Completed group ထဲ တိုက်ရိုက်ဆောက်ရင် ဆောက်တဲ့အချိန်ကို completed_at လို့ သတ်မှတ်မယ်
                'completed_at'  => $completed ? now() : null,
                // Creator ကို authenticated actor ကနေ အလိုအလျောက်၊ Assignee အဖြစ်တော့ အလိုအလျောက်မထည့်ဘူး
                'created_by'    => $actor->id,
            ]);

            $this->tasks->attachAssignees($task, $assigneeIds, $actor->id);
            $this->tasks->attachTags($task, $tagIds);

            // Initial state ကို created history မှာပဲ မှတ်မယ်၊ move event မဖန်တီးဘူး
            $this->tasks->record($task, $actor->id, TaskActivity::CREATED, [
                'group'        => ['id' => $group->id, 'name' => $group->name],
                'completed'    => $completed,
                'priority'     => $priority->value,
                'assignee_ids' => $assigneeIds,
                'tag_ids'      => $tagIds,
            ]);

            return $task->load(['assignees:id,name', 'tags:id,name,color']);
        });
    }

    /**
     * Assignee စစ်ဆေးချက်။ Edit (Step 7) မှာလည်း ပြန်သုံးမယ်။*
     * - အသစ်ထပ်ထည့်တာ (requested - current) က Project ရဲ့ active effective Employee member ဖြစ်ရမယ်။
     *   Super Admin၊ inactive၊ membership ဆုံးရှုံးသူကို အသစ်ထည့်လို့မရဘူး။
     * - $current ထဲက ရှိပြီးသား assignee ကို requested မှာ ဆက်ပါနေရင် inactive/non-member ဖြစ်နေလည်း ဆက်ထားမယ်။
     * - Requested မှာ မပါတော့တာက explicit removal လို့ ယူမယ်။
     *
     * @param  int[]  $requested
     * @param  int[]  $current
     * @return int[]
     */
    public function assertAssignees(Project $project, array $requested, array $current = []): array
    {
        $requested = array_values(array_unique(array_map('intval', $requested)));
        $newIds = array_diff($requested, array_map('intval', $current));

        if ($newIds && array_diff($newIds, $this->access->memberIds($project))) {
            throw ValidationException::withMessages([
                'assignee_ids' => 'Only active employees who are members of this project can be newly assigned.',
            ]);
        }

        return $requested;
    }

    /**
 * Title / description / priority / dates / assignees / tags ကို ပြင်မယ်။
 * Request ထဲမှာ ပါလာတဲ့ field ကိုပဲ ထိမယ်။ Group၊ position၊ completed_at ကို ဒီမှာ မပြောင်းဘူး။
 */
    public function update(User $actor, Task $task, array $data): Task
    {
        return DB::transaction(function () use ($actor, $task, $data) {
            // Lock အစဉ်: project → task (create နဲ့ ကိုက်အောင်)
            $project = $this->projects->lock($task->project);
            $locked = $this->tasks->lock($task);
            $locked->setRelation('project', $project);

            // Lock ယူပြီးမှ စစ်တာမို့ တစ်ပြိုင်နက် assignee ဖယ်တာ/project ပြောင်းတာနဲ့ မတိုက်ဘူး
            $this->authorization->assertCanManage($actor, $locked);
            $this->projectService->assertEditable($project);

            if ($locked->isArchived()) {
                throw ValidationException::withMessages([
                    'task' => 'Archived tasks cannot be edited. Restore the task first.',
                ]);
            }

            [$attributes, $changes] = $this->scalarChanges($locked, $data);

            // Assignees: မပါရင် မထိဘူး၊ [] ဆိုရင် အားလုံးဖယ်မယ်
            $currentAssignees = $this->tasks->assigneeIds($locked);
            $assigneeIds = $currentAssignees;

            if (array_key_exists('assignee_ids', $data) && is_array($data['assignee_ids'])) {
                $assigneeIds = $this->assertAssignees($project, $data['assignee_ids'], $currentAssignees);
            }

            $addedAssignees = array_values(array_diff($assigneeIds, $currentAssignees));
            $removedAssignees = array_values(array_diff($currentAssignees, $assigneeIds));

            // Tags: Archived tag ကို ရှိပြီးသားဆို ဆက်ထား၊ အသစ်ရွေးလို့မရ၊ payload မှာ မပါတော့ရင် explicit removal
            $currentTags = $this->tasks->tagIds($locked);
            $tagIds = $currentTags;

            if (array_key_exists('tag_ids', $data) && is_array($data['tag_ids'])) {
                $tagIds = $this->tags->assertAssignable($data['tag_ids'], $currentTags);
            }

            $addedTags = array_values(array_diff($tagIds, $currentTags));
            $removedTags = array_values(array_diff($currentTags, $tagIds));

            $pivotChanged = $addedAssignees ||  $removedAssignees ||  $addedTags || $removedTags;

            if (! $attributes && ! $pivotChanged) {
                return $locked->load(['assignees:id,name', 'tags:id,name,color']);   // ဘာမှ မပြောင်း၊ history မထည့်
            }

            if ($attributes) {
                $locked = $this->tasks->update($locked, $attributes);
            } else {
                $this->tasks->touch($locked);
            }

            $this->tasks->detachAssignees($locked, $removedAssignees);
            $this->tasks->attachAssignees($locked, $addedAssignees, $actor->id);
            $this->tasks->detachTags($locked, $removedTags);
            $this->tasks->attachTags($locked, $addedTags);

            if ($changes) {
                $this->tasks->record($locked, $actor->id, TaskActivity::UPDATED, ['changes' => $changes]);
            }

            if ($addedAssignees || $removedAssignees) {
                $names = $this->tasks->userNames(array_merge($addedAssignees, $removedAssignees));

                $this->tasks->record($locked, $actor->id, TaskActivity::ASSIGNEES_CHANGED, [
                    'added'   => $this->labelled($addedAssignees, $names),
                    'removed' => $this->labelled($removedAssignees, $names),
                ]);
            }

            if ($addedTags || $removedTags) {
                $names = $this->tagRepository->findMany(array_merge($addedTags, $removedTags))->pluck('name', 'id')->all();

                $this->tasks->record($locked, $actor->id, TaskActivity::TAGS_CHANGED, [
                    'added'   => $this->labelled($addedTags, $names),
                    'removed' => $this->labelled($removedTags, $names),
                ]);
            }

            return $locked->load(['assignees:id,name', 'tags:id,name,color']);
        });
    }

    /**
 * Task ကို group ထဲမှာ reorder လုပ်ခြင်း (before_task_id) သို့မဟုတ် တခြား active group ဆီ ရွှေ့ခြင်း။
 * before_task_id မပါရင် destination ရဲ့ အဆုံးမှာ append လုပ်မယ်။
 */
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
                'group_id'      => $destination->id,
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
                    'from'      => $source ? ['id' => $source->id, 'name' => $source->name] : null,
                    'to'        => ['id' => $destination->id, 'name' => $destination->name],
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
                'archived_at'   => now(),
                'archived_by'   => $actor->id,
                'sort_position' => null,
            ]);

            $this->tasks->record($locked, $actor->id, TaskActivity::ARCHIVED, [
                'archived'  => ['from' => false, 'to' => true],
                'group'     => $group ? ['id' => $group->id, 'name' => $group->name] : null,
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
                throw ValidationException::withMessages(['project' => self::RESTORE_BLOCKED_PROJECT]);
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
                'archived_at'   => null,
                'archived_by'   => null,
                'sort_position' => $this->tasks->nextPosition($project->id, $group->id, $locked->id),
            ];

            // Completed group ထဲမှာ မဟုတ်ရင် completed_at ကို ရှင်းမယ် (ဆက်ထားတာက Completed group ထဲမှာပဲ)
            if (! $inCompleted) {
                $attributes['completed_at'] = null;
            }

            $locked = $this->tasks->update($locked, $attributes);

            $this->tasks->record($locked, $actor->id, TaskActivity::RESTORED, [
                'archived'   => ['from' => true, 'to' => false],
                'group'      => ['id' => $group->id, 'name' => $group->name],
                'completion' => [
                    'in_completed_group' => $inCompleted,
                    'completed_at'       => $inCompleted ? ($hadCompletedAt ? 'retained' : 'none') : ($hadCompletedAt ? 'cleared' : 'none'),
                ],
                'placement'  => 'end',
            ]);return $this->loaded($locked);
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
                'archived_at'            => $task->archived_at,
                'can_manage'             => $canManage,
                'can_restore'            => $canManage && ! $readOnly,
                'restore_blocked_reason' => ($canManage && $readOnly) ? self::RESTORE_BLOCKED_PROJECT : null,
            ]);
        });
    }

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
    protected function scalarChanges(Task $task, array $data): array
    {
            $old = [
                'title'       => $task->title,
                'description' => $task->description,
                'priority'    => $task->priority->value,
                'start_date'  => $task->start_date?->toDateString(),
                'end_date'    => $task->end_date?->toDateString(),
            ];

            $attributes = [];
            $changes = [];

            foreach ($old as $field => $before) {
                if (! array_key_exists($field, $data)) {
                    continue;
                }

                $after = $data[$field];

                if ($after === $before) {
                    continue;
                }

                $attributes[$field] = $after;

                // Description ကို history မှာ ပထမ ၂၀၀ လုံးပဲ သိမ်းမယ် (၂၀,၀၀၀ လုံးကို edit တိုင်း ထပ်မသိမ်းဘူး)
                $changes[$field] = $field === 'description'
                    ? ['from' => $this->excerpt($before), 'to' => $this->excerpt($after)]
                    : ['from' => $before, 'to' => $after];
        }

        // Date နှစ်ခု နှိုင်းယှဉ်တာကို ပြောင်းပြီးသား တန်ဖိုး (မပါရင် DB ထဲက တန်ဖိုး) နဲ့ လုပ်မယ်
        $start = array_key_exists('start_date', $data) ? $data['start_date'] : $old['start_date'];
        $end = array_key_exists('end_date', $data) ? $data['end_date'] : $old['end_date'];

        if ($start && $end && $end < $start) {
            throw ValidationException::withMessages([
                'end_date' => 'The end date cannot be earlier than the start date.',
            ]);
        }

        return [$attributes, $changes];
    }

    protected function excerpt(?string $text): ?string
    {
        if ($text === null) {
            return null;
        }

        return mb_strlen($text) > 200 ? mb_substr($text, 0, 200).'…' : $text;
    }

    /**
     * @param  int[]  $ids
     * @param  array<int, string>  $names
     * @return array<int, array{id: int, name: ?string}>
     */
    protected function labelled(array $ids, array $names): array
    {
        return array_map(fn ($id) => ['id' => $id, 'name' => $names[$id] ?? null], $ids);
    }


}