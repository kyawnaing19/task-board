<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\ProjectMemberRepositoryInterface;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\ProjectTeamRepositoryInterface;
use App\Repositories\Contracts\TeamRepositoryInterface;
use App\Services\ProjectAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyProjectController extends Controller
{
    public function __construct(
        protected ProjectRepositoryInterface $projects,
        protected ProjectTeamRepositoryInterface $teamLinks,
        protected ProjectMemberRepositoryInterface $memberLinks,
        protected TeamRepositoryInterface $teams,
        protected ProjectAccess $access
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return redirect()->route('projects.index');
        }

        $status = $request->query('status');
        $filter = in_array($status, ['completed', 'archived'], true) ? $status : 'active';

        $page = $this->projects->paginate($filter, 15, $this->access->projectIdsFor($user));

        return Inertia::render('MyProjects/Index', [
            'projects' => $page->through(fn ($p) => [
                'id'          => $p->id,
                'code'        => $p->code,
                'name'        => $p->name,
                'description' => $p->description,
                'start_date'  => $p->start_date?->toDateString(),
                'due_date'    => $p->due_date?->toDateString(),
                'status'      => $p->status,
                'archived_at' => $p->archived_at,
            ]),
            'filters' => ['status' => $filter],
        ]);
    }

    public function show(Request $request, int $project): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return redirect()->route('projects.show', $project);
        }

        $found = $this->projects->find($project);

        abort_if($found === null || ! $this->access->hasAccess($user, $found), 404);

        $viewableTeamIds = $this->teams->forMember($user)->pluck('id')->all();

        return Inertia::render('MyProjects/Show', [
            'project' => [
                'id'          => $found->id,
                'code'        => $found->code,
                'name'        => $found->name,
                'description' => $found->description,
                'start_date'  => $found->start_date?->toDateString(),
                'due_date'    => $found->due_date?->toDateString(),
                'status'      => $found->status,
                'archived_at' => $found->archived_at,
            ],
            'teams' => $this->teamLinks->linkedTeams($found)
                ->filter(fn ($t) => $t->archived_at === null)
                ->map(fn ($t) => [
                    'id'       => $t->id,
                    'name'     => $t->name,
                    'can_view' => in_array($t->id, $viewableTeamIds, true),
                ])->values(),
            // Effective member အားလုံး၊ name / avatar / job title သာ
            'members' => $this->memberLinks->directory($this->access->memberIds($found))
                ->map(fn ($u) => [
                    'id'         => $u->id,
                    'name'       => $u->name,
                    'job_title'  => $u->job_title,
                    'avatar_url' => $u->avatar_url,
                    'is_me'      => $u->id === $user->id,
                ])->values(),
        ]);
    }
}