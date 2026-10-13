<?php

namespace App\Http\Controllers;

use App\Http\Requests\Project\AddProjectMembersRequest;
use App\Models\Project;
use App\Models\User;
use App\Services\ProjectMemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    public function __construct(
        protected ProjectMemberService $service
    ) {}

    public function candidates(Request $request, Project $project): JsonResponse
    {
        $request->validate(['search' => ['nullable', 'string', 'max:100']]);

        return response()->json(
            $this->service->candidates($project, $request->query('search'))
        );
    }

    public function previewAdd(AddProjectMembersRequest $request, Project $project): JsonResponse
    {
        return response()->json(
            $this->service->addImpact($project, $request->validated('user_ids'))
        );
    }

    public function store(AddProjectMembersRequest $request, Project $project): RedirectResponse
    {
        $count = $this->service->add($request->user(), $project, $request->validated('user_ids'));

        return back()->with('success', $count === 1
            ? '1 employee added to the project.'
            : "{$count} employees added to the project.");
    }

    public function previewRemove(Project $project, User $user): JsonResponse
    {
        return response()->json($this->service->removeImpact($project, $user));
    }

    public function destroy(Request $request, Project $project, User $user): RedirectResponse
    {
        $this->service->remove($request->user(), $project, $user);

        return back()->with('success', "{$user->name} removed from the project.");
    }
}