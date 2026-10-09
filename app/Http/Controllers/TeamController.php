<?php

namespace App\Http\Controllers;

use App\Http\Requests\Team\StoreTeamRequest;
use App\Http\Requests\Team\UpdateTeamRequest;
use App\Models\Team;
use App\Repositories\Contracts\TeamRepositoryInterface;
use App\Services\TeamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function __construct(
        protected TeamService $service,
        protected TeamRepositoryInterface $teams
    ) {}

    public function index(Request $request): Response
    {
        $archived = $request->query('status') === 'archived';

        return Inertia::render('Teams/Index', [
            'teams' => $this->teams->paginate(
                $archived,
                15,
                $request->input('search')
            ),

            'filters' => [
                'status' => $archived ? 'archived' : 'active',
                'search' => $request->input('search', ''),
            ],
        ]);
    }

    public function show(Team $team): Response
    {
        $team->load(['creator:id,name', 'archiver:id,name']);

        $members = $team->memberships()
            ->active()
            ->with('user:id,name,email,job_title,avatar_path,status')
            ->orderByDesc('added_at')
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->user->id,
                'name'       => $m->user->name,
                'email'      => $m->user->email,
                'job_title'  => $m->user->job_title,
                'avatar_url' => $m->user->avatar_url,
                'status'     => $m->user->status,
                'added_at'   => $m->added_at,
            ]);

        return Inertia::render('Teams/Show', [
            'team'    => $team,
            'members' => $members,
        ]);
    }

    public function store(StoreTeamRequest $request): RedirectResponse
    {
        $team = $this->service->create($request->user(), $request->validated());

        return redirect()
            ->route('teams.index')
            ->with('success', "Team \"{$team->name}\" created.");
    }

    public function update(UpdateTeamRequest $request, Team $team): RedirectResponse
    {
        $this->service->update($team, $request->validated());

        return back()->with('success', 'Team updated.');
    }

    public function archive(Request $request, Team $team): RedirectResponse
    {
        $this->service->archive($request->user(), $team);

        return back()->with('success', "Team \"{$team->name}\" archived.");
    }

    public function archivePreview(Team $team): JsonResponse
    {
        return response()->json([
            'blockers' => $this->service->archiveBlockers($team),
            'impact'   => $this->service->archiveImpact($team),
        ]);
    }

    public function restore(Team $team): RedirectResponse
    {
        $this->service->restore($team);

        return back()->with('success', "Team \"{$team->name}\" restored.");
    }


}