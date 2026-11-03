<?php

namespace App\Repositories\Eloquent\Report;

use App\Enums\ProjectStatus;
use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TaskReportRepository
{
    use ReportRepositorySupport;

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
            ->leftJoin('project_teams as pt', function ($join) {
                $join->on('pt.project_id', '=', 'p.id')->whereNull('pt.removed_at');
            })
            ->leftJoin('teams as team', 'team.id', '=', 'pt.team_id')
            ->whereIn('t.project_id', $this->activeProjectIds())
            ->whereNull('t.archived_at')
            ->whereNull('p.archived_at')
            ->where('p.status', ProjectStatus::ACTIVE->value)
            ->when($filters->taskStatus === 'open' && $completedId !== null, fn ($q) => $q->where('t.group_id', '<>', $completedId))
            ->when($filters->taskStatus === 'completed' && $completedId !== null, fn ($q) => $q->where('t.group_id', '=', $completedId))
            ->when($filters->taskStatus === 'completed' && $completedId === null, fn ($q) => $q->whereRaw('1 = 0'))
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
            ->when($dateFrom !== null, fn ($q) => $q->where('t.start_date', '>=', $dateFrom))
            ->when($dateTo !== null, fn ($q) => $q->where('t.start_date', '<=', $dateTo))
            ->groupBy(
                't.id', 't.project_id', 't.sequence', 't.code', 't.title', 't.priority',
                't.start_date', 't.end_date', 't.completed_at', 't.group_id', 'tg.name', 'tg.is_completed',
                'p.code', 'p.name'
            )
            ->selectRaw(
                't.id, t.project_id, t.sequence, t.code, t.title, t.priority, '
                .'t.start_date, t.end_date, t.completed_at, t.group_id, '
                .'tg.name as group_name, tg.is_completed, '
                .'p.code as project_code, p.name as project_name, '
                ."GROUP_CONCAT(DISTINCT CONCAT_WS(':', u.id, COALESCE(u.avatar_disk, ''), COALESCE(u.avatar_path, ''), u.name)) as assignees_data, "
                ."GROUP_CONCAT(DISTINCT CONCAT_WS(':', tag.id, tag.name, tag.color)) as tags_data, "
                .'GROUP_CONCAT(DISTINCT team.name) as teams_data'
            )
            ->orderBy('p.name')
            ->orderBy('t.sequence');

        return $query->paginate($perPage, ['*'], 'page', $page)->through(function ($row) {
            // "id:name" ပုံစံ assignee များ (task တစ်ခုစီအတွက်)
            $assignees = collect(explode(',', $row->assignees_data ?? ''))
                ->filter()
                ->map(function ($part) {
                    // Id က အရင် (':' နောက်မှာ နာမည်ထဲက ':' ရှိနိုင်လို့ limit 2)
                    $segments = explode(':', $part, 4);

                    return [
                        'id' => (int) $segments[0],
                        'avatar_url' => ! empty($segments[2])
                            ? Storage::disk($segments[1] ?: 'public')->url($segments[2])
                            : null,
                        'name' => $segments[3] ?? '',
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
                        'id' => (int) $segments[0],
                        'name' => $segments[1] ?? '',
                        'color' => $segments[2] ?? '',
                    ];
                })
                ->values()
                ->all();

            $isCompleted = (bool) $row->is_completed;
            $isOverdue = $row->end_date && ! $isCompleted && $row->end_date < $this->today();

            return [
                'id' => $row->id,
                'project_id' => $row->project_id,
                'sequence' => $row->sequence,
                'code' => $row->code,
                'title' => $row->title,
                'priority' => $row->priority,
                'start_date' => $row->start_date,
                'end_date' => $row->end_date,
                'completed_at' => $row->completed_at,
                'group_id' => $row->group_id,
                'group_name' => $row->group_name,
                'is_completed' => $isCompleted,
                'project_code' => $row->project_code,
                'project_name' => $row->project_name,
                'assignees' => $assignees,
                'tags' => $tags,
                'teams' => $row->teams_data ? explode(',', $row->teams_data) : [],
                'is_overdue' => $isOverdue,
            ];
        });
    }
}
