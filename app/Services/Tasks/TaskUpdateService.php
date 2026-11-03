<?php

namespace App\Services\Tasks;

use App\Models\Project;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\TagRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Services\ProjectService;
use App\Services\TagService;
use App\Services\TaskAuthorization;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskUpdateService
{
    public function __construct(
        private TaskRepositoryInterface $tasks,
        private ProjectRepositoryInterface $projects,
        private ProjectService $projectService,
        private TagService $tags,
        private TagRepositoryInterface $tagRepository,
        private TaskAuthorization $authorization,
        private TaskAssigneeService $assignees,
        private TaskDescriptionService $descriptions,
    ) {}

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

            if (array_key_exists('description', $data)) {
                $data['description'] = $this->descriptions->sanitizeDescription(
                    $data['description']
                );
            }

            [$attributes, $changes] = $this->descriptions->scalarChanges($locked, $data);

            // Assignees: မပါရင် မထိဘူး၊ [] ဆိုရင် အားလုံးဖယ်မယ်
            $currentAssignees = $this->tasks->assigneeIds($locked);
            $assigneeIds = $currentAssignees;

            if (array_key_exists('assignee_ids', $data) && is_array($data['assignee_ids'])) {
                $assigneeIds = $this->assignees->assertAssignees($project, $data['assignee_ids'], $currentAssignees);
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

            $pivotChanged = $addedAssignees || $removedAssignees || $addedTags || $removedTags;

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
                    'added' => $this->labelled($addedAssignees, $names),
                    'removed' => $this->labelled($removedAssignees, $names),
                ]);
            }

            if ($addedTags || $removedTags) {
                $names = $this->tagRepository->findMany(array_merge($addedTags, $removedTags))->pluck('name', 'id')->all();

                $this->tasks->record($locked, $actor->id, TaskActivity::TAGS_CHANGED, [
                    'added' => $this->labelled($addedTags, $names),
                    'removed' => $this->labelled($removedTags, $names),
                ]);
            }

            return $locked->load(['assignees:id,name', 'tags:id,name,color']);
        });
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
