<?php

namespace App\Services;

use App\Enums\ProjectStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Project;
use App\Models\TaskGroup;
use App\Models\User;
use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public const DEFAULT_PER_PAGE = 25;
    public const MAX_PER_PAGE = 100;

    /**
     * Employee workload report with filters (teams, individuals, tags, date range)
     * Returns paginated list of employees with their task/project assignments in the date range
     */
    public function employeeWorkload(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        $perPage = $this->clamp($perPage);
        [$dateFrom, $dateTo] = $this->getDateRange($filters);
        $completedId = $this->completedGroupId();

        // Build the base query for task assignments within the date range
        $aggregate = DB::table('task_assignees as ta')
            ->join('tasks as t', 't.id', '=', 'ta.task_id')
            ->join('projects as p', 'p.id', '=', 't.project_id')
            ->whereIn('t.project_id', $this->activeProjectIds())
            ->whereNull('t.archived_at')
            ->whereNull('p.archived_at')
            ->when($completedId !== null, fn ($q) => $q->where('t.group_id', '<>', $completedId))
            ->when($filters->teamId !== null, function ($q) use ($filters) {
                $q->whereExists(function ($sub) use ($filters) {
                    $sub->from('project_teams as pt')
                        ->whereColumn('pt.project_id', 'p.id')
                        ->where('pt.team_id', $filters->teamId)
                        ->whereNull('pt.removed_at');
                });
            })
            ->when($filters->employeeId !== null, fn ($q) => $q->where('ta.user_id', $filters->employeeId))
            ->when($filters->tagId !== null, function ($q) use ($filters) {
                $q->whereExists(function ($sub) use ($filters) {
                    $sub->from('task_tag as tt')
                        ->where('tt.task_id', 't.id')
                        ->where('tt.tag_id', $filters->tagId);
                });
            })
            ->when($dateFrom !== null, fn ($q) => $q->where('t.end_date', '>=', $dateFrom))
            ->when($dateTo !== null, fn ($q) => $q->where('t.end_date', '<=', $dateTo))
            ->groupBy('ta.user_id')
            ->selectRaw(
                'ta.user_id, '
                .'COUNT(*) as assigned_open, '
                .'COALESCE(SUM(CASE WHEN t.end_date < ? THEN 1 ELSE 0 END), 0) as overdue, '
                .'COALESCE(SUM(CASE WHEN t.end_date >= ? AND t.end_date <= ? THEN 1 ELSE 0 END), 0) as due_soon, '
                .'COALESCE(SUM(CASE WHEN t.group_id = ? THEN 1 ELSE 0 END), 0) as completed_count, '
                .'GROUP_CONCAT(DISTINCT p.id) as project_ids, '
                .'GROUP_CONCAT(DISTINCT p.code) as project_codes, '
                .'GROUP_CONCAT(DISTINCT p.name) as project_names',
                [$this->today(), $this->today(), $this->dueSoonEnd(), $completedId ?? 0]
            );

        $query = User::query()
            ->leftJoinSub($aggregate, 'w', 'w.user_id', '=', 'users.id')
            ->where('users.role', UserRole::EMPLOYEE->value)
            ->where('users.status', UserStatus::ACTIVE->value)
            // Individual filter — ဒီ employee သာမှန
            ->when($filters->employeeId !== null, fn ($q) => $q->where('users.id', $filters->employeeId))
            ->select('users.id', 'users.name', 'users.job_title', 'users.avatar_path')
            ->selectRaw('COALESCE(w.assigned_open, 0) as assigned_open, COALESCE(w.overdue, 0) as overdue, COALESCE(w.due_soon, 0) as due_soon, COALESCE(w.completed_count, 0) as completed_count, w.project_ids, w.project_codes, w.project_names');

        // Sort
        match ($filters->sort) {
            'name' => $query->orderByRaw('LOWER(users.name)')->orderBy('users.id'),
            'overdue' => $query->orderByRaw('COALESCE(w.overdue, 0) DESC')
                ->orderByRaw('COALESCE(w.assigned_open, 0) DESC')
                ->orderByRaw('LOWER(users.name)')->orderBy('users.id'),
            'due_soon' => $query->orderByRaw('COALESCE(w.due_soon, 0) DESC')
                ->orderByRaw('COALESCE(w.assigned_open, 0) DESC')
                ->orderByRaw('LOWER(users.name)')->orderBy('users.id'),
            default => $query->orderByRaw('COALESCE(w.assigned_open, 0) DESC')
                ->orderByRaw('COALESCE(w.overdue, 0) DESC')
                ->orderByRaw('LOWER(users.name)')->orderBy('users.id'),
        };

        return $query->paginate($perPage, ['*'], 'page', $page)->through(function (User $u) {
            $projectIds = $u->project_ids ? explode(',', $u->project_ids) : [];
            $projectCodes = $u->project_codes ? explode(',', $u->project_codes) : [];
            $projectNames = $u->project_names ? explode(',', $u->project_names) : [];

            $projects = [];
            foreach ($projectIds as $index => $id) {
                $projects[] = [
                    'id' => (int) $id,
                    'code' => $projectCodes[$index] ?? '',
                    'name' => $projectNames[$index] ?? '',
                ];
            }

            return [
                'id'              => $u->id,
                'name'            => $u->name,
                'job_title'       => $u->job_title,
                'avatar_url'      => $u->avatar_url,
                'assigned_open'   => (int) $u->assigned_open,
                'overdue'         => (int) $u->overdue,
                'due_soon'        => (int) $u->due_soon,
                'completed_count' => (int) $u->completed_count,
                'projects'        => $projects,
            ];
        });
    }

    /**
     * Tag-based report: which tasks and projects have specific tags in date range
     */
    public function tagReport(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        $perPage = $this->clamp($perPage);
        [$dateFrom, $dateTo] = $this->getDateRange($filters);
        $completedId = $this->completedGroupId();

        $query = DB::table('tags as tg')
            ->join('task_tag as tt', 'tt.tag_id', '=', 'tg.id')
            ->join('tasks as t', 't.id', '=', 'tt.task_id')
            ->join('projects as p', 'p.id', '=', 't.project_id')
            ->leftJoin('task_assignees as ta', 'ta.task_id', '=', 't.id')
            ->leftJoin('users as u', 'u.id', '=', 'ta.user_id')
            ->whereIn('t.project_id', $this->activeProjectIds())
            ->whereNull('t.archived_at')
            ->whereNull('p.archived_at')
            ->when($completedId !== null, fn ($q) => $q->where('t.group_id', '<>', $completedId))
            ->when($filters->tagId !== null, fn ($q) => $q->where('tg.id', $filters->tagId))
            ->when($filters->teamId !== null, function ($q) use ($filters) {
                $q->whereExists(function ($sub) use ($filters) {
                    $sub->from('project_teams as pt')
                        ->whereColumn('pt.project_id', 'p.id')
                        ->where('pt.team_id', $filters->teamId)
                        ->whereNull('pt.removed_at');
                });
            })
            ->when($filters->employeeId !== null, fn ($q) => $q->where('ta.user_id', $filters->employeeId))
            ->when($dateFrom !== null, fn ($q) => $q->where('t.end_date', '>=', $dateFrom))
            ->when($dateTo !== null, fn ($q) => $q->where('t.end_date', '<=', $dateTo))
            ->groupBy('tg.id', 'tg.name', 'tg.color')
            ->selectRaw(
                'tg.id, tg.name, tg.color, '
                .'COUNT(DISTINCT t.id) as task_count, '
                .'COUNT(DISTINCT p.id) as project_count, '
                .'COALESCE(SUM(CASE WHEN t.end_date < ? THEN 1 ELSE 0 END), 0) as overdue_tasks, '
                .'COALESCE(SUM(CASE WHEN t.group_id = ? THEN 1 ELSE 0 END), 0) as completed_tasks, '
                .'GROUP_CONCAT(DISTINCT p.id) as project_ids, '
                .'GROUP_CONCAT(DISTINCT p.code) as project_codes, '
                .'GROUP_CONCAT(DISTINCT p.name) as project_names, '
                .'GROUP_CONCAT(DISTINCT u.id) as assignee_ids, '
                .'GROUP_CONCAT(DISTINCT u.name) as assignee_names',
                [$this->today(), $completedId ?? 0]
            )
            ->orderByDesc('task_count')
            ->orderBy('tg.name');

        return $query->paginate($perPage, ['*'], 'page', $page)->through(function ($row) {
            $projectIds = $row->project_ids ? explode(',', $row->project_ids) : [];
            $projectCodes = $row->project_codes ? explode(',', $row->project_codes) : [];
            $projectNames = $row->project_names ? explode(',', $row->project_names) : [];
            $assigneeIds = $row->assignee_ids ? explode(',', $row->assignee_ids) : [];
            $assigneeNames = $row->assignee_names ? explode(',', $row->assignee_names) : [];

            $projects = [];
            foreach ($projectIds as $index => $id) {
                $projects[] = [
                    'id' => (int) $id,
                    'code' => $projectCodes[$index] ?? '',
                    'name' => $projectNames[$index] ?? '',
                ];
            }

            $assignees = [];
            foreach ($assigneeIds as $index => $id) {
                if ($id) {
                    $assignees[] = [
                        'id' => (int) $id,
                        'name' => $assigneeNames[$index] ?? '',
                    ];
                }
            }

            return [
                'id'               => $row->id,
                'name'             => $row->name,
                'color'            => $row->color,
                'task_count'       => (int) $row->task_count,
                'project_count'    => (int) $row->project_count,
                'overdue_tasks'    => (int) $row->overdue_tasks,
                'completed_tasks'  => (int) $row->completed_tasks,
                'projects'         => $projects,
                'assignees'        => $assignees,
            ];
        });
    }

    /**
     * Team-based report: which projects and tasks belong to teams
     */
    public function teamReport(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        $perPage = $this->clamp($perPage);
        [$dateFrom, $dateTo] = $this->getDateRange($filters);
        $completedId = $this->completedGroupId();

        $query = DB::table('teams as tm')
            ->join('project_teams as pt', 'pt.team_id', '=', 'tm.id')
            ->join('projects as p', 'p.id', '=', 'pt.project_id')
            ->leftJoin('tasks as t', function ($join) use ($dateFrom, $dateTo, $completedId) {
                $join->on('t.project_id', '=', 'p.id')
                    ->whereNull('t.archived_at')
                    ->when($completedId !== null, fn ($q) => $q->where('t.group_id', '<>', $completedId))
                    ->when($dateFrom !== null, fn ($q) => $q->where('t.end_date', '>=', $dateFrom))
                    ->when($dateTo !== null, fn ($q) => $q->where('t.end_date', '<=', $dateTo));
            })
            ->leftJoin('task_assignees as ta', 'ta.task_id', '=', 't.id')
            ->leftJoin('users as u', 'u.id', '=', 'ta.user_id')
            ->whereNull('pt.removed_at')
            ->whereNull('p.archived_at')
            ->where('p.status', ProjectStatus::ACTIVE->value)
            ->when($filters->teamId !== null, fn ($q) => $q->where('tm.id', $filters->teamId))
            ->when($filters->tagId !== null, function ($q) use ($filters) {
                $q->whereExists(function ($sub) use ($filters) {
                    $sub->from('task_tag as tt')
                        ->where('tt.task_id', 't.id')
                        ->where('tt.tag_id', $filters->tagId);
                });
            })
            ->when($filters->employeeId !== null, fn ($q) => $q->where('ta.user_id', $filters->employeeId))
            ->groupBy('tm.id', 'tm.name', 'tm.description')
            ->selectRaw(
                'tm.id, tm.name, tm.description, '
                .'COUNT(DISTINCT p.id) as project_count, '
                .'COUNT(DISTINCT t.id) as task_count, '
                .'COALESCE(SUM(CASE WHEN t.end_date < ? THEN 1 ELSE 0 END), 0) as overdue_tasks, '
                .'COALESCE(SUM(CASE WHEN t.group_id = ? THEN 1 ELSE 0 END), 0) as completed_tasks, '
                .'GROUP_CONCAT(DISTINCT p.id) as project_ids, '
                .'GROUP_CONCAT(DISTINCT p.code) as project_codes, '
                .'GROUP_CONCAT(DISTINCT p.name) as project_names, '
                .'GROUP_CONCAT(DISTINCT u.id) as assignee_ids, '
                .'GROUP_CONCAT(DISTINCT u.name) as assignee_names',
                [$this->today(), $completedId ?? 0]
            )
            ->orderByDesc('task_count')
            ->orderBy('tm.name');

        return $query->paginate($perPage, ['*'], 'page', $page)->through(function ($row) {
            $projectIds = $row->project_ids ? explode(',', $row->project_ids) : [];
            $projectCodes = $row->project_codes ? explode(',', $row->project_codes) : [];
            $projectNames = $row->project_names ? explode(',', $row->project_names) : [];
            $assigneeIds = $row->assignee_ids ? explode(',', $row->assignee_ids) : [];
            $assigneeNames = $row->assignee_names ? explode(',', $row->assignee_names) : [];

            $projects = [];
            foreach ($projectIds as $index => $id) {
                $projects[] = [
                    'id' => (int) $id,
                    'code' => $projectCodes[$index] ?? '',
                    'name' => $projectNames[$index] ?? '',
                ];
            }

            $assignees = [];
            foreach ($assigneeIds as $index => $id) {
                if ($id) {
                    $assignees[] = [
                        'id' => (int) $id,
                        'name' => $assigneeNames[$index] ?? '',
                    ];
                }
            }

            return [
                'id'               => $row->id,
                'name'             => $row->name,
                'description'      => $row->description,
                'project_count'    => (int) $row->project_count,
                'task_count'       => (int) $row->task_count,
                'overdue_tasks'    => (int) $row->overdue_tasks,
                'completed_tasks'  => (int) $row->completed_tasks,
                'projects'         => $projects,
                'assignees'        => $assignees,
            ];
        });
    }

    /**
     * Detailed task list for a specific filter combination
     * Returns individual tasks with assignees, projects, tags
     */
    public function taskDetails(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        $perPage = $this->clamp($perPage);
        [$dateFrom, $dateTo] = $this->getDateRange($filters);
        $completedId = $this->completedGroupId();

        $query = DB::table('tasks as t')
            ->join('projects as p', 'p.id', '=', 't.project_id')
            ->leftJoin('task_groups as tg', 'tg.id', '=', 't.group_id')
            ->leftJoin('task_assignees as ta', 'ta.task_id', '=', 't.id')
            ->leftJoin('users as u', 'u.id', '=', 'ta.user_id')
            ->leftJoin('task_tag as tt', 'tt.task_id', '=', 't.id')
            ->leftJoin('tags as tag', 'tag.id', '=', 'tt.tag_id')
            ->whereIn('t.project_id', $this->activeProjectIds())
            ->whereNull('t.archived_at')
            ->whereNull('p.archived_at')
            ->where('p.status', ProjectStatus::ACTIVE->value)
            ->when($completedId !== null, fn ($q) => $q->where('t.group_id', '<>', $completedId))
            ->when($filters->teamId !== null, function ($q) use ($filters) {
                $q->whereExists(function ($sub) use ($filters) {
                    $sub->from('project_teams as pt')
                        ->whereColumn('pt.project_id', 'p.id')
                        ->where('pt.team_id', $filters->teamId)
                        ->whereNull('pt.removed_at');
                });
            })
            ->when($filters->employeeId !== null, fn ($q) => $q->where('ta.user_id', $filters->employeeId))
            ->when($filters->tagId !== null, fn ($q) => $q->where('tt.tag_id', $filters->tagId))
            ->when($dateFrom !== null, fn ($q) => $q->where('t.end_date', '>=', $dateFrom))
            ->when($dateTo !== null, fn ($q) => $q->where('t.end_date', '<=', $dateTo))
            ->groupBy(
                't.id', 't.project_id', 't.sequence', 't.code', 't.title', 't.priority',
                't.start_date', 't.end_date', 't.group_id', 'tg.name', 'tg.is_completed',
                'p.code', 'p.name'
            )
            ->selectRaw(
                't.id, t.project_id, t.sequence, t.code, t.title, t.priority, '
                .'t.start_date, t.end_date, t.group_id, '
                .'tg.name as group_name, tg.is_completed, '
                .'p.code as project_code, p.name as project_name, '
                ."GROUP_CONCAT(DISTINCT CONCAT_WS(':', u.id, u.name)) as assignees_data, "
                ."GROUP_CONCAT(DISTINCT CONCAT_WS(':', tag.id, tag.name, tag.color)) as tags_data"
            )
            ->orderBy('p.name')
            ->orderBy('t.sequence');

        return $query->paginate($perPage, ['*'], 'page', $page)->through(function ($row) {
            // "id:name" ပုံစံ assignee များ (task တစ်ခုစီအတွက်)
            $assignees = collect(explode(',', $row->assignees_data ?? ''))
                ->filter()
                ->map(function ($part) {
                    // Id က အရင် (':' နောက်မှာ နာမည်ထဲက ':' ရှိနိုင်လို့ limit 2)
                    $segments = explode(':', $part, 2);

                    return [
                        'id'   => (int) $segments[0],
                        'name' => $segments[1] ?? '',
                    ];
                })
                // Sequence မထိခိုက်စေဖို့ key ကို id နဲ့ ဖြေးပြီး values ပြန်ယူ
                ->values()
                ->all();

            // "id:name:color" ပုံစံ tags
            $tags = collect(explode(',', $row->tags_data ?? ''))
                ->filter()
                ->map(function ($part) {
                    $segments = explode(':', $part, 3);

                    return [
                        'id'    => (int) $segments[0],
                        'name'  => $segments[1] ?? '',
                        'color' => $segments[2] ?? '',
                    ];
                })
                ->values()
                ->all();

            $isCompleted = (bool) $row->is_completed;
            $isOverdue = $row->end_date && !$isCompleted && $row->end_date < $this->today();

            return [
                'id'              => $row->id,
                'project_id'      => $row->project_id,
                'sequence'        => $row->sequence,
                'code'            => $row->code,
                'title'           => $row->title,
                'priority'        => $row->priority,
                'start_date'      => $row->start_date,
                'end_date'        => $row->end_date,
                'group_id'        => $row->group_id,
                'group_name'      => $row->group_name,
                'is_completed'    => $isCompleted,
                'project_code'    => $row->project_code,
                'project_name'    => $row->project_name,
                'assignees'       => $assignees,
                'tags'            => $tags,
                'is_overdue'      => $isOverdue,
            ];
        });
    }

    /**
     * Get filter options for the report page (teams, employees, tags)
     */
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

    /**
     * Get summary statistics for the overview
     */
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
            'active_projects'       => $activeProjects,
            'total_open_tasks'      => (int) ($taskStats->total ?? 0),
            'overdue_tasks'         => (int) ($taskStats->overdue ?? 0),
            'due_soon_tasks'        => (int) ($taskStats->due_soon ?? 0),
            'completed_tasks'       => (int) ($taskStats->completed ?? 0),
            'total_employees'       => $employeeCount,
            'employees_with_tasks'  => $employeesWithTasks,
            'total_teams'           => $teamCount,
            'total_tags'            => $tagCount,
            'generated_at'          => Carbon::now()->toIso8601String(),
            'today'                 => $today,
            'due_soon_window'       => ['from' => $today, 'to' => $soonEnd],
        ];
    }

    /**
     * Initial state for the reports page: Active Project တစ်ခုချင်းစီရဲ့ task ရေတွက်ချက်
     * (open/overdue/completed) — filter support နဲ့အတူ pagination ပြန်ပေးမယ်။
     */
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
                'id'          => $project->id,
                'code'        => $project->code,
                'name'        => $project->name,
                'type'        => $project->type,
                'start_date'  => $project->start_date,
                'due_date'    => $project->due_date,
                'updated_at'  => $project->updated_at,
                'total_tasks'     => $total,
                'open_tasks'      => (int) ($s->open ?? 0),
                'overdue_tasks'   => (int) ($s->overdue ?? 0),
                'completed_tasks' => $completed,
                'progress'  => [
                    'percent'  => $total === 0 ? null : ($completed === $total ? 100 : (int) floor($completed * 100 / $total)),
                    'completed' => $completed,
                    'total'    => $total,
                    'no_tasks' => $total === 0,
                ],
            ];
        });
    }

    // ───────── helpers ─────────

    protected function activeProjectIds(): QueryBuilder
    {
        return DB::table('projects')
            ->select('id')
            ->where('status', ProjectStatus::ACTIVE->value)
            ->whereNull('archived_at');
    }

    protected function completedGroupId(): ?int
    {
        $id = TaskGroup::query()->where('is_completed', 1)->value('id');
        return $id === null ? null : (int) $id;
    }

    protected function getDateRange(ReportFilters $filters): array
    {
        $dateFrom = $filters->dateFrom ? Carbon::parse($filters->dateFrom)->format('Y-m-d') : null;
        $dateTo = $filters->dateTo ? Carbon::parse($filters->dateTo)->format('Y-m-d') : null;
        return [$dateFrom, $dateTo];
    }

    protected function today(): string
    {
        return Carbon::today()->format('Y-m-d');
    }

    protected function dueSoonEnd(): string
    {
        return Carbon::today()->addDays(DashboardService::DUE_SOON_DAYS)->format('Y-m-d');
    }

    protected function clamp(int $perPage): int
    {
        return min(max($perPage, 1), self::MAX_PER_PAGE);
    }
}