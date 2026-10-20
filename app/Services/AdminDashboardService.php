<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Project;
use App\Models\TaskGroup;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public const DEFAULT_PER_PAGE = 25;
    public const MAX_PER_PAGE = 100;

    /** တစ်ခါတည်း ပထမ page နှစ်ခုနဲ့အတူ dashboard တစ်ခုလုံးကို ပြန်ပေးမယ် */
    public function overview(int $perPage = self::DEFAULT_PER_PAGE): array
    {
        [$today, $soonEnd] = $this->dates();
        $completedId = $this->completedGroupId();

        // Task table ကိုပဲ ရေတွက်တာမို့ multi-assignee task က မများဘူး
        $totals = $this->openTasks($completedId)->selectRaw(
            'COUNT(*) as open_total, '
            .'COALESCE(SUM(CASE WHEN tasks.end_date < ? THEN 1 ELSE 0 END), 0) as overdue, '
            .'COALESCE(SUM(CASE WHEN tasks.end_date >= ? AND tasks.end_date <= ? THEN 1 ELSE 0 END), 0) as due_soon',
            [$today, $today, $soonEnd]
        )->first();

        return [
            'scope'           => 'company',
            'generated_at'    => Carbon::now()->toIso8601String(),
            'today'           => $today,
            'timezone'        => config('app.timezone'),
            'due_soon_window' => ['from' => $today, 'to' => $soonEnd],
            'summary'         => [
                'active_projects' => $this->activeProjects()->count(),
                'open_tasks'      => (int) ($totals->open_total ?? 0),
                'overdue_tasks'   => (int) ($totals->overdue ?? 0),
                'due_soon_tasks'  => (int) ($totals->due_soon ?? 0),
            ],
            'projects'        => $this->projects($perPage, 1),
            'workload'        => $this->workload('workload', $perPage, 1),
        ];
    }

    /** Active Project တစ်ခုချင်းစီရဲ့ open task၊ overdue၊ progress */
    public function projects(int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        $perPage = $this->clamp($perPage);
        [$today] = $this->dates();
        $completedId = $this->completedGroupId() ?? 0;

        $paginator = $this->activeProjects()
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->paginate($perPage, ['id', 'code', 'name', 'updated_at'], 'page', $page);

        $stats = DB::table('tasks')
            ->whereIn('project_id', $paginator->getCollection()->pluck('id')->all())
            ->whereNull('archived_at')
            ->groupBy('project_id')
            ->selectRaw(
                'project_id, COUNT(*) as total, '
                .'COALESCE(SUM(CASE WHEN group_id = ? THEN 1 ELSE 0 END), 0) as completed, '
                .'COALESCE(SUM(CASE WHEN group_id <> ? AND end_date < ? THEN 1 ELSE 0 END), 0) as overdue',
                [$completedId, $completedId, $today]
            )
            ->get()
            ->keyBy('project_id');

        return $paginator->through(function (Project $project) use ($stats) {
            $s = $stats->get($project->id);
            $total = (int) ($s->total ?? 0);
            $completed = (int) ($s->completed ?? 0);

            return [
                'id'              => $project->id,
                'code'            => $project->code,
                'name'            => $project->name,
                'updated_at'      => $project->updated_at,
                'open_tasks'      => $total - $completed,
                'overdue_tasks'   => (int) ($s->overdue ?? 0),
                'total_tasks'     => $total,
                'completed_tasks' => $completed,
                'progress'        => [
                    // ၁၀၀% က completed == total ဖြစ်မှ၊ ကျန်တာက floor (၉၉.၆ ကို ၁၀၀ မပြ)
                    'percent'  => $total === 0 ? null : ($completed === $total ? 100 : (int) floor($completed * 100 / $total)),
                    'completed' => $completed,
                    'total'    => $total,
                    'no_tasks' => $total === 0,
                ],
            ];
        });
    }

    /**
     * Active Employee တစ်ယောက်ချင်းစီရဲ့ workload။ လက်ရှိ assignment (Active Project၊ non-archived၊ Completed group ပြင်ပ)။
     * Task တစ်ခုကို assign ခံထားတဲ့ employee တစ်ယောက်စီအတွက် တစ်ကြိမ်စီ ရေတွက်မယ်။
     */
    public function workload(string $sort = 'workload', int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        $perPage = $this->clamp($perPage);
        [$today, $soonEnd] = $this->dates();
        $completedId = $this->completedGroupId();

        $aggregate = DB::table('task_assignees as ta')
            ->join('tasks as t', 't.id', '=', 'ta.task_id')
            ->whereIn('t.project_id', $this->activeProjectIds())
            ->whereNull('t.archived_at')
            ->when($completedId !== null, fn ($q) => $q->where('t.group_id', '<>', $completedId))
            ->groupBy('ta.user_id')
            ->selectRaw(
                'ta.user_id, COUNT(*) as assigned_open, '
                .'COALESCE(SUM(CASE WHEN t.end_date < ? THEN 1 ELSE 0 END), 0) as overdue, '
                .'COALESCE(SUM(CASE WHEN t.end_date >= ? AND t.end_date <= ? THEN 1 ELSE 0 END), 0) as due_soon',
                [$today, $today, $soonEnd]
            );

        $query = User::query()
            ->leftJoinSub($aggregate, 'w', 'w.user_id', '=', 'users.id')
            ->where('users.role', UserRole::EMPLOYEE->value)
            ->where('users.status', UserStatus::ACTIVE->value)
            ->select('users.id', 'users.name', 'users.job_title', 'users.avatar_path')
            ->selectRaw('COALESCE(w.assigned_open, 0) as assigned_open, COALESCE(w.overdue, 0) as overdue, COALESCE(w.due_soon, 0) as due_soon');

        if ($sort === 'name') {
            $query->orderByRaw('LOWER(users.name)')->orderBy('users.id');
        } else {
            $query->orderByRaw('COALESCE(w.assigned_open, 0) DESC')
                ->orderByRaw('COALESCE(w.overdue, 0) DESC')
                ->orderByRaw('LOWER(users.name)')
                ->orderBy('users.id');
        }

        return $query->paginate($perPage, ['*'], 'page', $page)->through(fn (User $u) => [
            'id'            => $u->id,
            'name'          => $u->name,
            'job_title'     => $u->job_title,
            'avatar_url'    => $u->avatar_url,
            'assigned_open' => (int) $u->assigned_open,
            'overdue'       => (int) $u->overdue,
            'due_soon'      => (int) $u->due_soon,
        ]);
    }

    // ───────── helpers ─────────

    /** Active = ACTIVE status၊ archive မလုပ်ရသေး */
    protected function activeProjects()
    {
        return Project::query()
            ->where('status', ProjectStatus::ACTIVE->value)
            ->whereNull('archived_at');
    }

    protected function activeProjectIds(): QueryBuilder
    {
        return DB::table('projects')
            ->select('id')
            ->where('status', ProjectStatus::ACTIVE->value)
            ->whereNull('archived_at');
    }

    /** Active Project ထဲက archive မလုပ်ရသေး၊ Completed group ပြင်ပက task */
    protected function openTasks(?int $completedId): QueryBuilder
    {
        return DB::table('tasks')
            ->whereIn('tasks.project_id', $this->activeProjectIds())
            ->whereNull('tasks.archived_at')
            ->when($completedId !== null, fn ($q) => $q->where('tasks.group_id', '<>', $completedId));
    }

    protected function completedGroupId(): ?int
    {
        $id = TaskGroup::query()->where('is_completed', 1)->value('id');

        return $id === null ? null : (int) $id;
    }

    /** @return array{0: string, 1: string} [today, today + 6] (application timezone) */
    protected function dates(): array
    {
        $today = Carbon::today();return [$today->toDateString(), $today->copy()->addDays(DashboardService::DUE_SOON_DAYS)->toDateString()];
    }

    protected function clamp(int $perPage): int
    {
        return min(max($perPage, 1), self::MAX_PER_PAGE);
    }
}