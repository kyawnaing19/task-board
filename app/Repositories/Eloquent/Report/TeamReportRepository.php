<?php

namespace App\Repositories\Eloquent\Report;

use App\Enums\ProjectStatus;
use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TeamReportRepository
{
    use ReportRepositorySupport;

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
            $projects = ReportRowMapper::projects($row->project_ids, $row->project_codes, $row->project_names);
            $assignees = ReportRowMapper::assignees($row->assignee_ids, $row->assignee_names);

            return [
                'id' => $row->id,
                'name' => $row->name,
                'description' => $row->description,
                'project_count' => (int) $row->project_count,
                'task_count' => (int) $row->task_count,
                'overdue_tasks' => (int) $row->overdue_tasks,
                'completed_tasks' => (int) $row->completed_tasks,
                'projects' => $projects,
                'assignees' => $assignees,
            ];
        });
    }
}
