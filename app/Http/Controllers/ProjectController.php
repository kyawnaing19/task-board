<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Http\Requests\Project\ChangeProjectStatusRequest;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Models\Project;
use App\Repositories\Contracts\ProjectMemberRepositoryInterface;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\ProjectTeamRepositoryInterface;
use App\Services\AdminProjectListService;
use App\Services\ProjectAccess;
use App\Services\ProjectCreationService;
use App\Services\ProjectService;
use App\Support\ProjectListFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(
        protected ProjectService $service,
        protected ProjectRepositoryInterface $projects,
        protected ProjectTeamRepositoryInterface $teamLinks,
        protected ProjectMemberRepositoryInterface $memberLinks,
        protected ProjectAccess $access,
        protected ProjectCreationService $creation,
        protected AdminProjectListService $list

    ) {}

    // public function index(Request $request): Response
    // {
    //     $status = $request->query('status');
    //     $filter = in_array($status, ['completed', 'archived'], true) ? $status : 'active';

    //     $type = trim((string) $request->query('type', ''));
    //     $type = $type !== '' ? mb_substr($type, 0, 100) : null;

    //     return Inertia::render('Projects/Index', [
    //         'projects'         => $this->projects->paginate($filter, 15, null, $type),
    //         'filters'          => ['status' => $filter, 'type' => $type],
    //         'type_suggestions' => $this->projects->types(),
    //     ]);
    // }

    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $status = in_array($status, ['completed', 'archived'], true) ? $status : 'active';

        $filters = ProjectListFilters::fromArray($request->query());
        $perPage = is_numeric($request->query('per_page'))
            ? (int) $request->query('per_page')
            : AdminProjectListService::DEFAULT_PER_PAGE;

        return Inertia::render('Projects/Index', [
            'projects'         => $this->list->list($status, $filters, $perPage),
            'filters'          => array_merge($filters->toArray(), ['status' => $status]),
            'filter_options'   => $this->list->options($filters),
            'type_suggestions' => $this->projects->types(),
        ]);
    }



    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = $this->creation->create($request->user(), $request->validated());

        // Leader ကို ဆောက်ပြီးတဲ့ project ဆီ၊ Super Admin ကို list ဆီ ပိုမယ်
        if ($request->user()->isSuperAdmin()) {
            return redirect()->route('projects.index')->with('success', "Project {$project->code} created.");
        }

        return redirect()->route('my-projects.show', $project->id)->with('success', "Project {$project->code} created.");
    }

    public function createOptions(Request $request): JsonResponse
    {
        return response()->json($this->creation->options($request->user()));
    }


    public function show(Project $project): Response
    {
        $project->load(['creator:id,name', 'archiver:id,name']);

        $individuals = $this->memberLinks->members($project);
        $sources = $this->access->teamSources($project, $individuals->pluck('user_id')->all());

        return Inertia::render('Projects/Show', [
            'project'   => $project,
            'read_only' => $project->isReadOnly(),
            'teams'     => $this->teamLinks->linkedTeams($project)->map(fn ($team) => [
                'id'            => $team->id,
                'name'          => $team->name,
                'description'   => $team->description,
                'members_count' => $team->members_count,
                'archived'      => $team->archived_at !== null,
            ])->values(),
            'members'   => $individuals->map(fn ($m) => [
                'id'         => $m->user->id,
                'name'       => $m->user->name,
                'email'      => $m->user->email,
                'job_title'  => $m->user->job_title,
                'avatar_url' => $m->user->avatar_url,
                'status'     => $m->user->status,
                'added_at'   => $m->added_at,
                'via_teams'  => $sources[$m->user_id] ?? [],
            ])->values(),
            // Source နှစ်ခု ပေါင်းပြီး distinct ရေတွက်ထားတဲ့ effective member အရေအတွက်
            'access_count' => count($this->access->memberIds($project)),
            'type_suggestions' => $this->projects->types(),
        ]);
    }


    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $this->service->update($request->user(), $project, $request->validated());

        return back()->with('success', 'Project updated.');
    }


    public function changeStatus(ChangeProjectStatusRequest $request, Project $project): RedirectResponse
    {
        $target = ProjectStatus::from($request->validated('status'));

        $this->service->changeStatus($request->user(), $project, $target);

        return back()->with('success', $target === ProjectStatus::COMPLETED
            ? 'Project marked as completed.'
            : 'Project reopened.');
    }

    public function archive(Request $request, Project $project): RedirectResponse
    {
        $this->service->archive($request->user(), $project);

        return back()->with('success', "Project {$project->code} archived.");
    }

    public function restore(Project $project): RedirectResponse
    {
        $this->service->restore($project);

        return back()->with('success', "Project {$project->code} restored as completed.");
    }
}