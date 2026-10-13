<?php

namespace App\Http\Controllers;

use App\Http\Requests\Project\AddProjectTeamsRequest;
use App\Models\Project;
use App\Models\Team;
use App\Services\ProjectTeamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectTeamController extends Controller
{
    public function __construct(
        protected ProjectTeamService $service
    ) {}

    public function candidates(Request $request, Project $project): JsonResponse
    {
        $request->validate(['search' => ['nullable', 'string', 'max:100']]);

        return response()->json(
            $this->service->candidates($project, $request->query('search'))
        );
    }

    public function previewAdd(AddProjectTeamsRequest $request, Project $project): JsonResponse
    {
        return response()->json(
            $this->service->addImpact($project, $request->validated('team_ids'))
        );
    }

    public function store(AddProjectTeamsRequest $request, Project $project): RedirectResponse
    {
        $count = $this->service->add($request->user(), $project, $request->validated('team_ids'));

        return back()->with('success', $count === 1
            ? '1 team linked to the project.'
            : "{$count} teams linked to the project.");
    }

    public function previewRemove(Project $project, Team $team): JsonResponse
    {
        return response()->json($this->service->removeImpact($project, $team));
    }

    public function destroy(Request $request, Project $project, Team $team): RedirectResponse
    {
        $this->service->remove($request->user(), $project, $team);

        return back()->with('success', "Team \"{$team->name}\" removed from the project.");
    }

    public function resolveArchived(Request $request, Project $project): RedirectResponse
    {
        $count = $this->service->resolveArchivedLinkage($request->user(), $project);

        return back()->with('success', $count === 1
            ? '1 archived team linkage resolved.'
            : "{$count} archived team linkages resolved.");
    }
}