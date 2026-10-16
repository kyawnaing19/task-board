<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Tag;
use App\Models\Task;
use App\Models\TaskGroup;
use App\Models\User;
use App\Enums\TaskPriority;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\TagRepositoryInterface;
use App\Repositories\Contracts\TaskGroupRepositoryInterface;
use App\Repositories\Contracts\TaskRepositoryInterface;
use App\Support\MyTaskScope;
use App\Support\TaskFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class MyTaskService
{
    public const DEFAULT_PER_PAGE = 25;
    public const MAX_PER_PAGE = 100;

    public function __construct(
        protected TaskRepositoryInterface $tasks,
        protected ProjectRepositoryInterface $projects,
        protected TaskGroupRepositoryInterface $groups,
        protected TagRepositoryInterface $tags,
        protected ProjectAccess $access,
        protected TaskPresenter $presenter
    ) {}

    public function list(User $viewer, MyTaskScope $scope, TaskFilters $filters, int $perPage = self::DEFAULT_PER_PAGE): LengthAwarePaginator
    {
        $perPage = min(max($perPage, 1), self::MAX_PER_PAGE);

        $page = $this->tasks->paginateMine(
            $viewer,
            $this->access->projectIdsFor($viewer),
            $scope,
            $filters,
            $perPage
        );

        // Page ထဲက project တွေရဲ့ member ကို query ၂ ခုနဲ့ တစ်ခါတည်း
        // $members = $this->access->memberIdsByProject(
        //     $page->getCollection()->pluck('project_id')->unique()->values()->all()
        // );
        $items = method_exists($page, 'getCollection') 
        ? $page->getCollection() 
        : (method_exists($page, 'items') ? collect($page->items()) : collect($page));

        $members = $this->access->memberIdsByProject(
            $items->pluck('project_id')->unique()->values()->all()
        );

        return $page->through(fn (Task $task) => $this->row($viewer, $task, $members[$task->project_id] ?? []));
    }

    /** Filter dropdown များအတွက် ရွေးစရာ (ကိုယ် access ရှိတဲ့ project တွေပဲ) */
    public function options(User $viewer): array
    {
        $projects = $this->projects->byIds($this->access->projectIdsFor($viewer));

        return [
            'projects'   => $projects->map(fn (Project $p) => [
                'id'       => $p->id,
                'code'     => $p->code,
                'name'     => $p->name,
                'status'   => $p->status->value,
                'archived' => $p->isArchived(),
            ])->values()->all(),
            'groups'     => $this->groups->list(false)->map(fn (TaskGroup $g) => [
                'id'    => $g->id,
                'name'  => $g->name,
                'color' => $g->color,
            ])->values()->all(),
            // Archived tag ကိုလည်း ပေးမယ် (ရှိပြီးသား task ပေါ်က inactive label ကို filter လုပ်လို့ရအောင်)
            'tags'       => $this->tags->list(false)->map(fn (Tag $t) => $this->tag($t, false))
                ->concat($this->tags->list(true)->map(fn (Tag $t) => $this->tag($t, true)))
                ->values()->all(),
            'priorities' => array_column(TaskPriority::cases(), 'value'),
            'page_size'  => ['default' => self::DEFAULT_PER_PAGE, 'max' => self::MAX_PER_PAGE],
        ];
    }

    protected function row(User $viewer, Task $task, array $memberIds): array
    {
        $project = $task->project;
        $projectReadOnly = $project->isReadOnly();
        $archivedTask = $task->isArchived();

        $reason = match (true) {
            $project->isArchived() => 'This project is archived, so the task is read-only.',
            $project->isCompleted() => 'This project is completed, so the task is read-only.',
            $archivedTask => 'This task is archived and read-only.',
            default => null,
        };

        return array_merge($this->presenter->card($task, $memberIds), [
            'archived_at'            => $task->archived_at,
            'updated_at'             => $task->updated_at,
            'completed_at'           => $task->completed_at,
            'project'                => ['id'       => $project->id,
                'code'     => $project->code,
                'name'     => $project->name,
                'status'   => $project->status->value,
                'archived' => $project->isArchived(),
            ],
            'is_creator'             => $task->created_by === $viewer->id,
            'is_assignee'            => $task->assignees->contains('id', $viewer->id),
            'read_only'              => $reason !== null,
            'read_only_reason'       => $reason,
            // Ownership mode ကြောင့် ဒီ list ထဲက task တိုင်းမှာ viewer က owner ဖြစ်တယ်၊ ဒါကြောင့် restore ခွင့်ကို project state နဲ့ပဲ ဆုံးဖြတ်တယ်
            'can_restore'            => $archivedTask && ! $projectReadOnly,
            'restore_blocked_reason' => ($archivedTask && $projectReadOnly) ? TaskService::RESTORE_BLOCKED_PROJECT : null,
        ]);
    }

    protected function tag(Tag $tag, bool $inactive): array
    {
        return ['id' => $tag->id, 'name' => $tag->name, 'color' => $tag->color, 'inactive' => $inactive];
    }
}