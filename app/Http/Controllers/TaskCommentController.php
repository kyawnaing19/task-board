<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\ListTaskCommentsRequest;
use App\Http\Requests\Task\StoreTaskCommentRequest;
use App\Models\Task;
use App\Models\TaskComment;
use App\Services\TaskCommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskCommentController extends Controller
{
    public function __construct(
        protected TaskCommentService $service
    ) {}

    public function index(ListTaskCommentsRequest $request, Task $task): JsonResponse
    {
        return response()->json($this->service->list(
            $request->user(),
            $task,
            $request->filled('before') ? (int) $request->validated('before') : null,
            (int) ($request->validated('limit') ?? TaskCommentService::DEFAULT_LIMIT)
        ));
    }

    public function store(StoreTaskCommentRequest $request, Task $task): JsonResponse
    {
        return response()->json(
            ['comment' => $this->service->create($request->user(), $task, $request->validated('body'))],
            201
        );
    }

    public function update(StoreTaskCommentRequest $request, TaskComment $comment): JsonResponse
    {
        return response()->json(
            ['comment' => $this->service->update($request->user(), $comment, $request->validated('body'))]
        );
    }

    public function destroy(Request $request, TaskComment $comment): JsonResponse
    {
        return response()->json(['comment' => $this->service->delete($request->user(), $comment)]);
    }
}