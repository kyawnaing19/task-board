<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Project;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;

class TaskController extends Controller
{
    public function __construct(
        protected TaskService $service
    ) {}

    public function store(StoreTaskRequest $request, Project $project): RedirectResponse
    {
        $task = $this->service->create($request->user(), $project, $request->validated());

        return back()->with('success', "Task {$task->code} created.");
    }
    

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $this->service->update($request->user(), $task, $request->validated());

        return back()->with('success', 'Task updated.');
    }

}