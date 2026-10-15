<?php

namespace App\Services;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Tag;
use App\Models\Task;
use App\Models\TaskGroup;
use App\Models\User;
use App\Repositories\Contracts\ProjectMemberRepositoryInterface;
use App\Repositories\Contracts\TagRepositoryInterface;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Support\TaskFilters;

class TaskBoard
{
    public const DEFAULT_LIMIT = 25;
    public const MAX_LIMIT = 100;
    public const NOT_MATCHING_NOTICE = 'Task moved; it no longer matches current filters';

    public function __construct(
        protected TaskRepositoryInterface $tasks,
        protected TaskGroupRepositoryInterface $groups,
        protected TagRepositoryInterface $tags,
        protected ProjectMemberRepositoryInterface $members,
        protected TaskAuthorization $authorization,
        protected ProjectAccess $access,
        protected TaskPresenter $presenter
    ) {}

    /**
     * Active group အားလုံးကို အစဉ်အတိုင်း၊ group တစ်ခုချင်းစီရဲ့ ပထမ page နဲ့။
     * filters_active နဲ့ group တစ်ခုချင်းရဲ့ fully_loaded ကို UI က FR-MOVE-02 (same-group reorder ပိတ်/ဖွင့်) အတွက် သုံးမယ်။
     */
    public function board(User $viewer, Project $project, TaskFilters $filters, int $limit): array
    {
        $this->authorization->assertCanView($viewer, $project);

        $memberIds = $this->access->memberIds($project);
        [$totals, $unfiltered] = $this->totals($viewer, $project, $filters);
        $readOnly = $project->isReadOnly();

        return [
            'read_only'      => $readOnly,
            'can_create'     => ! $readOnly,
            'filters_active' => $filters->isActive(),
            'filters'        => $filters->toArray(),
            'limit'          => $limit,
            'groups'         => $this->groups->list(false)
                ->map(fn (TaskGroup $g) => $this->column($viewer, $project, $g, $filters, $limit, null, $memberIds, $totals, $unfiltered))
                ->values()
                ->all(),
        ];
    }

    /** Group တစ်ခုရဲ့ နောက် page ($after = ယခင် page ရဲ့ next_cursor) */
    public function group(User $viewer, Project $project, TaskGroup $group, TaskFilters $filters, int $limit, ?int $after): array
    {
        $this->authorization->assertCanView($viewer, $project);

        [$totals, $unfiltered] = $this->totals($viewer, $project, $filters);

        return $this->column(
            $viewer, $project, $group, $filters, $limit, $after,
            $this->access->memberIds($project), $totals, $unfiltered
        );
    }

    /** Task form နဲ့ filter bar အတွက် ရွေးစရာများ */
    public function options(User $viewer, Project $project): array
    {
        $this->authorization->assertCanView($viewer, $project);

        $memberIds = $this->access->memberIds($project);

        return [
            'members'    => $this->members->directory($memberIds)->map(fn (User $u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'job_title'  => $u->job_title,
                'avatar_url' => $u->avatar_url,
            ])->values()->all(),
            'tags'       => $this->tags->list(false)->map(fn (Tag $t) => [
                'id'    => $t->id,
                'name'  => $t->name,
                'color' => $t->color,
            ])->values()->all(),
            'groups'     => $this->groups->list(false)->map(fn (TaskGroup $g) => [
                'id'           => $g->id,
                'name'         => $g->name,
                'color'        => $g->color,
                'is_initial'   => $g->is_initial,
                'is_completed' => $g->is_completed,
            ])->values()->all(),
            'priorities' => array_column(TaskPriority::cases(), 'value'),
        ];
    }
/** Mutation (create / edit / move / archive / restore) ပြီးနောက် ပြန်ပေးမယ့် card */
    public function card(User $viewer, Task $task): array
    {
        // Service က column အနည်းငယ်ပဲ load ထားတတ်လို့ card အတွက် လိုတာကို ပြန် load မယ်
        $task->load([
            'group:id,name,color,is_completed',
            'assignees:id,name,avatar_path,status',
            'tags:id,name,color,archived_at',
        ]);

        return $this->cardFor($viewer, $task, $this->access->memberIds($task->project));
    }

    /** ရွှေ့ပြီးနောက် task က လက်ရှိ filter နဲ့ ကိုက်သေးလား (filter မရှိရင် အမြဲ true) */
    public function matches(User $viewer, Task $task, TaskFilters $filters): bool
    {
        return ! $filters->isActive() || $this->tasks->matchesFilters($task, $filters, $viewer->id);
    }

    protected function column(
        User $viewer, Project $project, TaskGroup $group, TaskFilters $filters,
        int $limit, ?int $after, array $memberIds, array $totals, array $unfiltered
    ): array {
        $rows = $this->tasks->boardPage($project, $group->id, $filters, $viewer->id, $after, $limit);
        $hasMore = $rows->count() > $limit;
        $page = $rows->take($limit)->values();

        return [
            'id'               => $group->id,
            'name'             => $group->name,
            'color'            => $group->color,
            'is_initial'       => $group->is_initial,
            'is_completed'     => $group->is_completed,
            // Filter နဲ့ ကိုက်တဲ့ စုစုပေါင်း (load ထားတဲ့အရေအတွက် မဟုတ်ဘူး) နဲ့ filter မရှိရင် စုစုပေါင်း
            'total'            => $totals[$group->id] ?? 0,
            'unfiltered_total' => $unfiltered[$group->id] ?? 0,
            'tasks'            => $page->map(fn (Task $t) => $this->cardFor($viewer, $t, $memberIds))->values()->all(),
            // sort_position cursor: နောက် page တောင်းတဲ့အခါ ကြားထဲ task ရွှေ့/archive ဖြစ်လည်း ထပ်တာ/ကျန်တာ မရှိဘူး
            'next_cursor'      => $hasMore ? (int) $page->last()->sort_position : null,
            // ဒီ response ပြီးရင် ကျန်တာ မရှိတော့ဘူး (client က page တွေ ပေါင်းထားရင် group တစ်ခုလုံး load ပြီး)
            'fully_loaded'     => ! $hasMore,
        ];
    }

    protected function cardFor(User $viewer, Task $task, array $memberIds): array
    {
        return array_merge($this->presenter->card($task, $memberIds), [
            'archived_at' => $task->archived_at,
            // Drag handle / ခလုတ်တွေ ပြမပြ UI အတွက်။ Project read_only ကိုတော့ board.read_only နဲ့ တွဲကြည့်ရမယ်
            'can_manage'  => $viewer->isSuperAdmin() || $this->authorization->ownsLoaded($viewer, $task),
        ]);
    }

    /** @return array{0: array<int,int>, 1: array<int,int>} */
    protected function totals(User $viewer, Project $project, TaskFilters $filters): array
    {
        $totals = $this->tasks->groupTotals($project, $filters, $viewer->id);
        $unfiltered = $filters->isActive()
            ? $this->tasks->groupTotals($project, TaskFilters::none(), $viewer->id)
            : $totals;

        return [$totals, $unfiltered];
    }
}