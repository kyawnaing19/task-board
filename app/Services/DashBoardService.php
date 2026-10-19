<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public const PREVIEW_LIMIT = 10;
    public const DUE_SOON_DAYS = 6;        // ဒီနေ့ ကနေ ဒီနေ့ + 6 အထိ (နှစ်ဖက်စလုံး ပါ)
    public const SETTLE_SECONDS = 1;       // assigned_at က စက္ကန့်အထိပဲ သိမ်းလို့ ပြီးဆုံးပြီးသား စက္ကန့်ကိုပဲ checkpoint လုပ်မယ်

    public function __construct(
        protected ProjectAccess $access,
        protected TaskPresenter $presenter
    ) {}

    public function employee(User $user): array
    {
        // as_of ကို query တွေမလုပ်ခင် အရင်ထုတ်မယ် (checkpoint က assignment တစ်ခုကို မျိုမပစ်စေဖို့)
        $asOf = $this->settledNow();
        $checkpoint = $this->checkpointFor($user);

        $today = Carbon::today();                                   // application timezone
        $todayStr = $today->toDateString();
        $soonEndStr = $today->copy()->addDays(self::DUE_SOON_DAYS)->toDateString();

        // Active / Completed၊ archive မလုပ်ရသေးတဲ့ project (ကိုယ် effective member)
        $visible = Project::query()
            ->whereIn('id', $this->access->projectIdsFor($user))
            ->whereNull('archived_at')
            ->get(['id', 'status']);

        $visibleIds = $visible->pluck('id')->all();
        $activeIds = $visible->filter(fn (Project $p) => $p->status === ProjectStatus::ACTIVE)->pluck('id')->all();

        $with = [
            'project:id,code,name,status,archived_at',
            'group:id,name,color,is_completed',
            'assignees:id,name,avatar_path,status',
            'tags:id,name,color,archived_at',
        ];

        // My Open Tasks: ကိုယ်ဆီ assign၊ non-archived၊ Completed group မဟုတ်၊ Active project
        $open = fn (): Builder => Task::query()
            ->whereIn('tasks.project_id', $activeIds)
            ->whereNull('tasks.archived_at')
            ->whereNotIn('tasks.group_id', fn ($q) => $q->select('id')->from('task_groups')->where('is_completed', 1))
            ->whereHas('assignees', fn ($a) => $a->where('users.id', $user->id));

        $totals = $open()->toBase()->selectRaw(
            'COUNT(*) as open_total, '
            .'COALESCE(SUM(CASE WHEN tasks.end_date >= ? AND tasks.end_date <= ? THEN 1 ELSE 0 END), 0) as due_soon, '
            .'COALESCE(SUM(CASE WHEN tasks.end_date < ? THEN 1 ELSE 0 END), 0) as overdue',
            [$todayStr, $soonEndStr, $todayStr]
        )->first();

        $limit = self::PREVIEW_LIMIT;

        $openItems = $open()->with($with)
            ->orderByDesc('tasks.updated_at')->orderByDesc('tasks.id')->limit($limit)->get();

        $dueItems = $open()->whereBetween('tasks.end_date', [$todayStr, $soonEndStr])->with($with)
            ->orderBy('tasks.end_date')->orderBy('tasks.id')->limit($limit)->get();

        $overdueItems = $open()->where('tasks.end_date', '<', $todayStr)->with($with)
            ->orderBy('tasks.end_date')->orderBy('tasks.id')->limit($limit)->get();

        // Recently Updated: ကိုယ် access ရှိတဲ့ Active/Completed project တွေထဲက task အားလုံး
        $updatedItems = Task::query()
            ->whereIn('tasks.project_id', $visibleIds)
            ->whereNull('tasks.archived_at')
            ->with($with)
            ->orderByDesc('tasks.updated_at')->orderByDesc('tasks.id')->limit($limit)->get();

        // Recently Assigned: Active project၊ လက်ရှိ assign၊ non-archived၊ assigned_at <= as_of
        $assigned = fn () => DB::table('task_assignees as ta')
            ->join('tasks as t', 't.id', '=', 'ta.task_id')
            ->where('ta.user_id', $user->id)
            ->where('ta.assigned_at', '<=', $asOf)
            ->whereIn('t.project_id', $activeIds)
            ->whereNull('t.archived_at');

        $assignedRows = $assigned()
            ->orderByDesc('ta.assigned_at')->orderByDesc('t.id')->limit($limit)
            ->get(['t.id as task_id', 'ta.assigned_at']);
$assignedTasks = Task::query()
            ->whereIn('id', $assignedRows->pluck('task_id')->all())
            ->with($with)
            ->get()
            ->keyBy('id');

        $newlyAssigned = (int) $assigned()->where('ta.assigned_at', '>', $checkpoint)->distinct()->count('t.id');

        // My Projects (preview)
        $projectItems = Project::query()
            ->whereIn('id', $visibleIds)
            ->orderByDesc('updated_at')->orderByDesc('id')->limit($limit)
            ->get(['id', 'code', 'name', 'status', 'due_date', 'updated_at']);

        $openByProject = $open()->toBase()
            ->selectRaw('tasks.project_id as project_id, COUNT(*) as aggregate')
            ->groupBy('tasks.project_id')
            ->pluck('aggregate', 'project_id');

        // Assignee label (inactive / non_member) အတွက် project တစ်ခုချင်းစီ query မလုပ်ဘဲ batch
        $all = $openItems->concat($dueItems)->concat($overdueItems)->concat($updatedItems)->concat($assignedTasks->values());
        $members = $this->access->memberIdsByProject($all->pluck('project_id')->unique()->values()->all());

        $row = fn (Task $t, array $extra = []) => $this->row($t, $members[$t->project_id] ?? [], $extra);

        return [
            'generated_at'      => Carbon::now()->toIso8601String(),
            'today'             => $todayStr,
            'timezone'          => config('app.timezone'),
            // Dashboard render အောင်မြင်ပြီးမှ ack လုပ်ဖို့။ GET က checkpoint ကို မထိဘူး
            'assignments_as_of' => $asOf->toIso8601String(),
            'checkpoint'        => $checkpoint->toIso8601String(),

            'my_projects' => [
                'total'     => count($visibleIds),
                'active'    => count($activeIds),
                'completed' => count($visibleIds) - count($activeIds),
                'items'     => $projectItems->map(fn (Project $p) => [
                    'id'         => $p->id,
                    'code'       => $p->code,
                    'name'       => $p->name,
                    'status'     => $p->status->value,
                    'due_date'   => $p->due_date?->toDateString(),
                    'open_tasks' => (int) ($openByProject[$p->id] ?? 0),
                ])->values()->all(),
            ],

            'open_tasks' => [
                'count' => (int) ($totals->open_total ?? 0),
                'items' => $openItems->map($row)->values()->all(),
            ],
            'due_soon' => [
                'count' => (int) ($totals->due_soon ?? 0),
                'from'  => $todayStr,
                'to'    => $soonEndStr,
                'items' => $dueItems->map($row)->values()->all(),
            ],
            'overdue' => [
                'count' => (int) ($totals->overdue ?? 0),
                'items' => $overdueItems->map($row)->values()->all(),
            ],
            'recently_updated' => [
                'items' => $updatedItems->map($row)->values()->all(),
            ],
            'recently_assigned' => [
                'newly_assigned' => $newlyAssigned,
                'items'          => $assignedRows->map(function ($r) use ($assignedTasks, $row, $checkpoint) {
                    $task = $assignedTasks->get($r->task_id);

                    if (! $task) {
                        return null;     // query ၂ ခုကြားထဲ archive / ဖျက်ခံရရင်
                    }

                    $assignedAt = Carbon::parse($r->assigned_at);

                    return $row($task, [
                        'assigned_at' => $assignedAt,
                        'is_new'      => $assignedAt->greaterThan($checkpoint),
                    ]);
                })->filter()->values()->all(),
            ],

            'links' => [
                'my_tasks'          => route('my-tasks.index'),
'created_by_me'     => route('my-tasks.index', ['mode' => 'created']),
                'my_projects'       => route('my-projects.index'),
                'archived_projects' => route('my-projects.index', ['status' => 'archived']),
            ],
        ];
    }

    /**
     * Dashboard render ပြီးတဲ့နောက် client က ခေါ်တဲ့ acknowledgement။
     * checkpoint = max(current, as_of)။ Duplicate / stale ack က နောက်ပြန်မရွှေ့ဘူး။
     */
    public function acknowledgeAssignments(User $user, CarbonInterface $requested): Carbon
    {
        $limit = $this->settledNow();

        $asOf = Carbon::instance($requested)->setTimezone(config('app.timezone'))->startOfSecond();

        // Client က အနာဂတ်အချိန် ပို့လာရင် လက်ရှိ settled အချိန်အထိပဲ လက်ခံမယ်
        if ($asOf->greaterThan($limit)) {
            $asOf = $limit;
        }

        // Account ဖန်တီးချိန်အောက် မဆင်းဘူး
        $floor = $user->created_at ? $user->created_at->copy() : Carbon::createFromTimestamp(0);
        $target = $asOf->greaterThan($floor) ? $asOf : $floor;

        // Atomic max: တစ်ပြိုင်နက် ack နှစ်ခုလာလည်း နောက်ပြန်မရွှေ့ဘူး
        DB::table('users')
            ->where('id', $user->id)
            ->where(fn ($q) => $q
                ->whereNull('dashboard_assignments_seen_at')
                ->orWhere('dashboard_assignments_seen_at', '<', $target))
            ->update(['dashboard_assignments_seen_at' => $target]);

        return $this->checkpointFor($user->fresh());
    }

    public function checkpointFor(User $user): Carbon
    {
        return ($user->dashboard_assignments_seen_at ?? $user->created_at ?? Carbon::createFromTimestamp(0))->copy();
    }

    /** ပြီးဆုံးပြီးသား နောက်ဆုံးစက္ကန့် */
    public function settledNow(): Carbon
    {
        return Carbon::now()->startOfSecond()->subSeconds(self::SETTLE_SECONDS);
    }

    protected function row(Task $task, array $memberIds, array $extra = []): array
    {
        $project = $task->project;

        return array_merge($this->presenter->card($task, $memberIds), [
            'updated_at' => $task->updated_at,
            'project'    => [
                'id'        => $project->id,
                'code'      => $project->code,
                'name'      => $project->name,
                'status'    => $project->status->value,
                'read_only' => $project->isReadOnly(),
            ],
        ], $extra);
    }
}