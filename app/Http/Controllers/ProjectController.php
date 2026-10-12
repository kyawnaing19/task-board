<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Http\Requests\Project\ChangeProjectStatusRequest;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Project;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Services\ProjectService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(
        protected ProjectService $service,
        protected ProjectRepositoryInterface $projects
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $filter = in_array($status, ['completed', 'archived'], true) ? $status : 'active';

        return Inertia::render('Projects/Index', [
            'projects' => $this->projects->paginate($filter),
            'filters'  => ['status' => $filter],
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = $this->service->create($request->user(), $request->validated());

        return redirect()
            ->route('projects.index')
            ->with('success', "Project {$project->code} created.");
    }

    public function show(Project $project): Response
    {
        $project->load(['creator:id,name', 'archiver:id,name']);

        return Inertia::render('Projects/Show', [
            'project'   => $project,
            'read_only' => $project->isReadOnly(),
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $this->service->update($project, $request->validated());

        return back()->with('success', 'Project updated.');
    }

    public function changeStatus(ChangeProjectStatusRequest $request, Project $project): RedirectResponse
    {
        $target = ProjectStatus::from($request->validated('status'));

        $this->service->changeStatus($project, $target);

        return back()->with('success', $target === ProjectStatus::COMPLETED
            ? 'Project marked as completed.'
            : 'Project reopened.');
    }
}