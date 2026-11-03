<?php

namespace App\Repositories\Eloquent\Report;

use App\Enums\ProjectStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Project;
use App\Models\User;
use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportOverviewRepository
{
    use ReportRepositorySupport;

    public function getFilterOptions(): array
    {
        $teams = DB::table('teams')
            ->whereNull('archived_at')
            ->orderBy('name')
            ->get(['id', 'name']);

        $employees = User::query()
            ->where('role', UserRole::EMPLOYEE->value)
            ->where('status', UserStatus::ACTIVE->value)
            ->orderBy('name')
            ->get(['id', 'name', 'job_title', 'avatar_path'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'job_title' => $u->job_title,
                'avatar_url' => $u->avatar_url,
            ]);

        $tags = DB::table('tags')
            ->whereNull('archived_at')
            ->orderBy('name')
            ->get(['id', 'name', 'color']);

        return [
            'teams' => $teams,
            'employees' => $employees,
            'tags' => $tags,
        ];
    }

    public function getSummaryStats(): array
    {
        $completedId = $this->completedGroupId();
        $today = $this->today();
        $soonEnd = $this->dueSoonEnd();
        $activeProjectIds = $this->activeProjectIds()->pluck('id')->all();

        // Total active projects
        $activeProjects = count($activeProjectIds);

        // Task totals
        $taskStats = DB::table('tasks')
            ->whereIn('project_id', $activeProjectIds)
            ->whereNull('archived_at')
            ->when($completedId !== null, fn ($q) => $q->where('group_id', '<>', $completedId))
            ->selectRaw(
                'COUNT(*) as total, '
                .'COALESCE(SUM(CASE WHEN end_date < ? THEN 1 ELSE 0 END), 0) as overdue, '
                .'COALESCE(SUM(CASE WHEN end_date >= ? AND end_date <= ? THEN 1 ELSE 0 END), 0) as due_soon, '
                .'COALESCE(SUM(CASE WHEN group_id = ? THEN 1 ELSE 0 END), 0) as completed',
                [$today, $today, $soonEnd, $completedId ?? 0]
            )
            ->first();

        // Employee count
        $employeeCount = User::query()
            ->where('role', UserRole::EMPLOYEE->value)
            ->where('status', UserStatus::ACTIVE->value)
            ->count();

        // Team count
        $teamCount = DB::table('teams')
            ->whereNull('archived_at')
            ->count();

        // Tag count
        $tagCount = DB::table('tags')
            ->whereNull('archived_at')
            ->count();

        // Employees with assignments
        $employeesWithTasks = DB::table('task_assignees as ta')
            ->join('tasks as t', 't.id', '=', 'ta.task_id')
            ->whereIn('t.project_id', $activeProjectIds)
            ->whereNull('t.archived_at')
            ->when($completedId !== null, fn ($q) => $q->where('t.group_id', '<>', $completedId))
            ->distinct('ta.user_id')
            ->count('ta.user_id');

        return [
            'active_projects' => $activeProjects,
            'total_open_tasks' => (int) ($taskStats->total ?? 0),
            'overdue_tasks' => (int) ($taskStats->overdue ?? 0),
            'due_soon_tasks' => (int) ($taskStats->due_soon ?? 0),
            'completed_tasks' => (int) ($taskStats->completed ?? 0),
            'total_employees' => $employeeCount,
            'employees_with_tasks' => $employeesWithTasks,
            'total_teams' => $teamCount,
            'total_tags' => $tagCount,
            'generated_at' => Carbon::now()->toIso8601String(),
            'today' => $today,
            'due_soon_window' => ['from' => $today, 'to' => $soonEnd],
        ];
    }

    public function projectOverview(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        $perPage = $this->clamp($perPage);
        [$dateFrom, $dateTo] = $this->getDateRange($filters);
        $today = $this->today();

        $query = Project::query()
            ->where('status', ProjectStatus::ACTIVE->value)
            ->whereNull('archived_at')
            // Team နဲ့ လက်ရှိ active link ရှိတဲ့ project သာ
            ->when($filters->teamId !== null, fn ($q) => $q->whereHas(
                'teamLinks',
                fn ($l) => $l->whereNull('removed_at')->where('team_id', $filters->teamId)
            ))
            // Tag ချိတ်ထားတဲ့ task ရှိတဲ့ project သာ
            ->when($filters->tagId !== null, fn ($q) => $q->whereExists(function ($sub) use ($filters) {
                $sub->from('task_tag as tg_link')
                    ->join('tasks as tt', 'tt.id', '=', 'tg_link.task_id')
                    ->whereColumn('tt.project_id', 'projects.id')
                    ->where('tg_link.tag_id', $filters->tagId);
            }))
            // Employee assign ခံထားတဲ့ task ရှိတဲ့ project သာ
            ->when($filters->employeeId !== null, fn ($q) => $q->whereExists(function ($sub) use ($filters) {
                $sub->from('task_assignees as ta')
                    ->join('tasks as tt', 'tt.id', '=', 'ta.task_id')
                    ->whereColumn('tt.project_id', 'projects.id')
                    ->where('ta.user_id', $filters->employeeId);
            }))
            // Date range အတွင်း end_date ရှိ task တစ်ခုချင်းစီနဲ့ ဆိုင်တဲ့ project သာ
            ->when($dateFrom !== null || $dateTo !== null, function ($q) use ($dateFrom, $dateTo) {
                $q->whereExists(function ($sub) use ($dateFrom, $dateTo) {
                    $sub->from('tasks as st')
                        ->whereColumn('st.project_id', 'projects.id')
                        ->whereNull('st.archived_at')
                        ->when($dateFrom !== null, fn ($s) => $s->where('st.end_date', '>=', $dateFrom))
                        ->when($dateTo !== null, fn ($s) => $s->where('st.end_date', '<=', $dateTo));
                });
            })
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        $paginator = $query->paginate($perPage, ['id', 'code', 'name', 'type', 'start_date', 'due_date', 'updated_at'], 'page', $page);

        if ($paginator->isEmpty()) {
            return $paginator;
        }

        $completedId = $this->completedGroupId();

        $stats = DB::table('tasks')
            ->whereIn('project_id', $paginator->getCollection()->pluck('id')->all())
            ->whereNull('archived_at')
            ->when($dateFrom !== null, fn ($q) => $q->where('end_date', '>=', $dateFrom))
            ->when($dateTo !== null, fn ($q) => $q->where('end_date', '<=', $dateTo))
            ->when($filters->tagId !== null, fn ($q) => $q->whereExists(fn ($s) => $s->from('task_tag as tt')->whereColumn('tt.task_id', 'tasks.id')->where('tt.tag_id', $filters->tagId)))
            ->when($filters->employeeId !== null, fn ($q) => $q->whereExists(fn ($s) => $s->from('task_assignees as ta')->whereColumn('ta.task_id', 'tasks.id')->where('ta.user_id', $filters->employeeId)))
            ->groupBy('project_id')
            ->selectRaw(
                'project_id, COUNT(*) as total, '
                .'COALESCE(SUM(CASE WHEN group_id <> ? THEN 1 ELSE 0 END), 0) as open, '
                .'COALESCE(SUM(CASE WHEN group_id <> ? AND end_date < ? THEN 1 ELSE 0 END), 0) as overdue, '
                .'COALESCE(SUM(CASE WHEN group_id = ? THEN 1 ELSE 0 END), 0) as completed',
                [$completedId ?? 0, $completedId ?? 0, $today, $completedId ?? 0]
            )
            ->get()
            ->keyBy('project_id');

        return $paginator->through(function (Project $project) use ($stats) {
            $s = $stats->get($project->id);
            $total = (int) ($s->total ?? 0);
            $completed = (int) ($s->completed ?? 0);

            return [
                'id' => $project->id,
                'code' => $project->code,
                'name' => $project->name,
                'type' => $project->type,
                'start_date' => $project->start_date,
                'due_date' => $project->due_date,
                'updated_at' => $project->updated_at,
                'total_tasks' => $total,
                'open_tasks' => (int) ($s->open ?? 0),
                'overdue_tasks' => (int) ($s->overdue ?? 0),
                'completed_tasks' => $completed,
                'progress' => [
                    'percent' => $total === 0 ? null : ($completed === $total ? 100 : (int) floor($completed * 100 / $total)),
                    'completed' => $completed,
                    'total' => $total,
                    'no_tasks' => $total === 0,
                ],
            ];
        });
    }
}
