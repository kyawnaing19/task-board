<?php

namespace App\Http\Controllers;

use App\Enums\GroupColor;
use App\Http\Requests\TaskGroup\ArchiveTaskGroupRequest;
use App\Http\Requests\TaskGroup\ChangeGroupFlagRequest;
use App\Http\Requests\TaskGroup\ReorderTaskGroupsRequest;
use App\Http\Requests\TaskGroup\RestoreTaskGroupRequest;
use App\Http\Requests\TaskGroup\StoreTaskGroupRequest;
use App\Http\Requests\TaskGroup\UpdateTaskGroupRequest;
use App\Models\TaskGroup;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use App\Services\TaskGroupFlagService;
use App\Services\TaskGroupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;


class TaskGroupController extends Controller
{
    public function __construct(
        protected TaskGroupService $service,
        protected TaskGroupFlagService $flags,
        protected TaskGroupRepositoryInterface $groups
    ) {}

    public function index(Request $request): Response
{
    $archived = $request->query('status') === 'archived';

    $active = $this->groups->list(false);

    $shape = fn ($g) => [
        'id'           => $g->id,
        'name'         => $g->name,
        'color'        => $g->color,
        'sort_order'   => $g->sort_order,
        'is_initial'   => $g->is_initial,
        'is_completed' => $g->is_completed,
        'archived_at'  => $g->archived_at,
    ];

    return Inertia::render('TaskGroups/Index', [
        'groups'       => ($archived ? $this->groups->list(true) : $active)->map($shape)->values(),
        // Restore မှာ နာမည်တူနေလားကို client က ကြိုစစ်ဖို့
        'active_names' => $active->pluck('name')->values(),
        'colors'       => array_column(GroupColor::cases(), 'value'),
        'filters'      => ['status' => $archived ? 'archived' : 'active'],
    ]);
    }
    public function store(StoreTaskGroupRequest $request): RedirectResponse
    {
        $group = $this->service->create($request->user(), $request->validated());

        return back()->with('success', "Group \"{$group->name}\" created.");
    }

    public function update(UpdateTaskGroupRequest $request, TaskGroup $taskGroup): RedirectResponse
    {
        $this->service->update($taskGroup, $request->validated());

        return back()->with('success', 'Group updated.');
    }

    public function reorder(ReorderTaskGroupsRequest $request): RedirectResponse
    {
        $this->service->reorder($request->validated('ids'));

        return back()->with('success', 'Group order saved.');
    }

    public function archivePreview(TaskGroup $taskGroup): JsonResponse
    {
        return response()->json([
            'blockers'     => $this->service->archiveBlockers($taskGroup),
            'impact'       => $this->service->archiveImpact($taskGroup),
            'replacements' => $this->service->replacementCandidates($taskGroup),
        ]);
    }

    public function archive(ArchiveTaskGroupRequest $request, TaskGroup $taskGroup): RedirectResponse
    {
        $this->service->archive($request->user(), $taskGroup, (int) $request->validated('replacement_group_id'));

        return back()->with('success', "Group \"{$taskGroup->name}\" archived.");
    }

    public function restore(RestoreTaskGroupRequest $request, TaskGroup $taskGroup): RedirectResponse
    {
        $group = $this->service->restore($taskGroup, $request->validated('name'));

        return back()->with('success', "Group \"{$group->name}\" restored.");
    }

    public function previewFlag(ChangeGroupFlagRequest $request, string $flag): JsonResponse
    {
        $target = TaskGroup::findOrFail($request->validated('target_group_id'));

        return response()->json($this->flags->preview($flag, $target));
    }

    public function changeFlag(ChangeGroupFlagRequest $request, string $flag): RedirectResponse
    {
        $target = TaskGroup::findOrFail($request->validated('target_group_id'));

        $group = $this->flags->change($request->user(), $flag, $target);

        return back()->with('success', "\"{$group->name}\" is now the ".ucfirst($flag).' group.');
    }
}