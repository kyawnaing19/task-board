<?php

namespace App\Repositories\Eloquent\Report;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\User;
use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EmployeeWorkloadRepository
{
    use ReportRepositorySupport;

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
            $projects = ReportRowMapper::projects($u->project_ids, $u->project_codes, $u->project_names);

            return [
                'id' => $u->id,
                'name' => $u->name,
                'job_title' => $u->job_title,
                'avatar_url' => $u->avatar_url,
                'assigned_open' => (int) $u->assigned_open,
                'overdue' => (int) $u->overdue,
                'due_soon' => (int) $u->due_soon,
                'completed_count' => (int) $u->completed_count,
                'projects' => $projects,
            ];
        });
    }
}
