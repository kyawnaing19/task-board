<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\BoardRequest;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskGroup;
use App\Services\TaskBoard;
use App\Services\TaskDetail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskBoardController extends Controller
{
    public function __construct(
        protected TaskBoard $board,
        protected TaskDetail $detail
    ) {}

    public function board(BoardRequest $request, Project $project): JsonResponse
    {
        return response()->json(
            $this->board->board($request->user(), $project, $request->filters(), $request->limit())
        );
    }

    public function group(BoardRequest $request, Project $project, TaskGroup $taskGroup): JsonResponse
    {
        abort_if($taskGroup->isArchived(), 404);

        return response()->json($this->board->group(
            $request->user(), $project, $taskGroup, $request->filters(), $request->limit(), $request->afterCursor()
        ));
    }

    public function options(Request $request, Project $project): JsonResponse
    {
        return response()->json($this->board->options($request->user(), $project));
    }

    public function show(Request $request, Task $task): JsonResponse
    {
        return response()->json($this->detail->detail($request->user(), $task));
    }

    public function history(Request $request, Task $task): JsonResponse
    {
        $request->validate(['before' => ['nullable', 'integer', 'min:1']]);

        $before = $request->filled('before') ? $request->integer('before') : null;

        return response()->json($this->detail->history($request->user(), $task, $before));
    }
}