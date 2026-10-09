<?php

namespace App\Http\Controllers;
use App\Http\Requests\Team\AddTeamMembersRequest;
use App\Models\Team;
use App\Models\User;
use App\Services\TeamMemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TeamMemberController extends Controller
{
    public function __construct(
        protected TeamMemberService $service
    ) {}

    public function candidates(Request $request, Team $team): JsonResponse
    {
        $request->validate(['search' => ['nullable', 'string', 'max:100']]);

        return response()->json(
            $this->service->candidates($team, $request->query('search'))
        );
    }

    public function previewAdd(AddTeamMembersRequest $request, Team $team): JsonResponse
    {
        return response()->json(
            $this->service->addImpact($team, $request->validated('user_ids'))
        );
    }

    public function store(AddTeamMembersRequest $request, Team $team): RedirectResponse
    {
        $count = $this->service->add($request->user(), $team, $request->validated('user_ids'));

        return back()->with('success', $count === 1
            ? '1 employee added to the team.'
            : "{$count} employees added to the team.");
    }

    public function previewRemove(Team $team, User $user): JsonResponse
    {
        return response()->json($this->service->removeImpact($team, $user));
    }

    public function destroy(Request $request, Team $team, User $user): RedirectResponse
    {
        $this->service->remove($request->user(), $team, $user);

        return back()->with('success', "{$user->name} removed from the team.");
    }
}