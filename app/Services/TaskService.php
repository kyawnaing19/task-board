<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\Tasks\TaskArchiveService;
use App\Services\Tasks\TaskAssigneeService;
use App\Services\Tasks\TaskCreationService;
use App\Services\Tasks\TaskOrderingService;
use App\Services\Tasks\TaskUpdateService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TaskService
{
    public const RESTORE_BLOCKED_PROJECT = 'Project must be Active before this task can be restored';

    public function __construct(
        private TaskCreationService $creation,
        private TaskUpdateService $updates,
        private TaskOrderingService $ordering,
        private TaskArchiveService $archives,
        private TaskAssigneeService $assignees,
    ) {}

    public function create(User $actor, Project $project, array $data): Task
    {
        return $this->creation->create($actor, $project, $data);
    }

    public function assertAssignees(Project $project, array $requested, array $current = []): array
    {
        return $this->assignees->assertAssignees($project, $requested, $current);
    }

    public function update(User $actor, Task $task, array $data): Task
    {
        return $this->updates->update($actor, $task, $data);
    }

    public function move(User $actor, Task $task, int $groupId, ?int $beforeTaskId = null): Task
    {
        return $this->ordering->move($actor, $task, $groupId, $beforeTaskId);
    }

    public function archive(User $actor, Task $task): Task
    {
        return $this->archives->archive($actor, $task);
    }

    public function restore(User $actor, Task $task): Task
    {
        return $this->archives->restore($actor, $task);
    }

    public function archivedTasks(User $viewer, Project $project): LengthAwarePaginator
    {
        return $this->archives->archivedTasks($viewer, $project);
    }
}
