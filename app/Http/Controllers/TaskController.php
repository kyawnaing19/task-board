<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\MoveTaskRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Project;
use App\Models\Task;
use App\Services\TaskBoard;
use App\Services\TaskService;
use App\Support\TaskFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function __construct(
        protected TaskService $service,
        protected TaskBoard $board
    ) {}

    public function store(StoreTaskRequest $request, Project $project): RedirectResponse|JsonResponse
    {
        $task = $this->service->create($request->user(), $project, $request->validated());

        return $this->respond($request, $task, "Task {$task->code} created.", 201);
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse|JsonResponse
    {
        $task = $this->service->update($request->user(), $task, $request->validated());

        return $this->respond($request, $task, 'Task updated.');
    }

    public function move(MoveTaskRequest $request, Task $task): RedirectResponse|JsonResponse
    {
        $moved = $this->service->move(
            $request->user(),
            $task,
            (int) $request->validated('group_id'),
            $request->filled('before_task_id') ? (int) $request->validated('before_task_id') : null
        );

        $filters = TaskFilters::fromArray($request->validated('filters') ?? []);
        $matches = $this->board->matches($request->user(), $moved, $filters);

        return $this->respond($request, $moved, 'Task moved.', 200, [
            'matches_filters' => $matches,
            'notice'          => $matches ? null : TaskBoard::NOT_MATCHING_NOTICE,
        ]);
    }

    public function archive(Request $request, Task $task): RedirectResponse|JsonResponse
    {
        $task = $this->service->archive($request->user(), $task);

        return $this->respond($request, $task, "Task {$task->code} archived.");
    }

    public function restore(Request $request, Task $task): RedirectResponse|JsonResponse
    {
        $task = $this->service->restore($request->user(), $task);

        return $this->respond($request, $task, "Task {$task->code} restored.");
    }

    public function archived(Request $request, Project $project): JsonResponse
    {
        return response()->json($this->service->archivedTasks($request->user(), $project));
    }

    /** Inertia ဆိုရင် redirect၊ Accept: application/json ဆိုရင် card ပြန်မယ် */
    protected function respond(Request $request, Task $task, string $message, int $status = 200, array $extra = []): RedirectResponse|JsonResponse
    {
        if ($request->expectsJson()) {
            return response()->json(array_merge([
                'message' => $message,
                'task'    => $this->board->card($request->user(), $task),
            ], $extra), $status);
        }

        return back()->with('success', $message);
    }
}