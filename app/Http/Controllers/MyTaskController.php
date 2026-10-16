<?php

namespace App\Http\Controllers;

use App\Http\Requests\Task\MyTasksRequest;
use App\Services\MyTaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyTaskController extends Controller
{
    public function __construct(
        protected MyTaskService $service
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        // Super Admin ဘက်ကို နောက်မှ ထည့်မယ်
        if ($request->user()->isSuperAdmin()) {
            return redirect()->route('projects.index');
        }

        return Inertia::render('MyTasks/Index');
    }

    public function list(MyTasksRequest $request): JsonResponse
    {
        return response()->json(
            $this->service->list($request->user(), $request->scope(), $request->filters(), $request->perPage())
        );
    }

    public function options(Request $request): JsonResponse
    {
        return response()->json($this->service->options($request->user()));
    }
}