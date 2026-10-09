<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\TeamRepositoryInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyTeamController extends Controller
{
    public function __construct(
        protected TeamRepositoryInterface $teams
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return redirect()->route('teams.index');
        }

        return Inertia::render('MyTeams/Index', [
            'teams' => $this->teams->forMember($user)->map(fn ($team) => [
                'id'            => $team->id,
                'name'          => $team->name,
                'description'   => $team->description,
                'members_count' => $team->members_count,
            ])->values(),
        ]);
    }

    public function show(Request $request, int $team): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user->isSuperAdmin()) {
            return redirect()->route('teams.show', $team);
        }

        $found = $this->teams->findForMember($user, $team);

        // Member မဟုတ်၊ archived၊ မရှိ အားလုံး 404 တူတူပြမယ်
        abort_if($found === null, 404);

        return Inertia::render('MyTeams/Show', [
            'team' => [
                'id'          => $found->id,
                'name'        => $found->name,
                'description' => $found->description,
            ],
            'members' => $this->teams->colleagues($found)->map(fn ($m) => [
                'id'         => $m->id,
                'name'       => $m->name,
                'job_title'  => $m->job_title,
                'avatar_url' => $m->avatar_url,
                'is_me'      => $m->id === $user->id,
            ])->values(),
        ]);
    }
}
