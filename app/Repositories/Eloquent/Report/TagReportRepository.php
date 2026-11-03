<?php

namespace App\Repositories\Eloquent\Report;

use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TagReportRepository
{
    use ReportRepositorySupport;

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
            $projects = ReportRowMapper::projects($row->project_ids, $row->project_codes, $row->project_names);
            $assignees = ReportRowMapper::assignees($row->assignee_ids, $row->assignee_names);

            return [
                'id' => $row->id,
                'name' => $row->name,
                'color' => $row->color,
                'task_count' => (int) $row->task_count,
                'project_count' => (int) $row->project_count,
                'overdue_tasks' => (int) $row->overdue_tasks,
                'completed_tasks' => (int) $row->completed_tasks,
                'projects' => $projects,
                'assignees' => $assignees,
            ];
        });
    }
}
