<?php

namespace App\Repositories\Eloquent\Report;

use App\Enums\ProjectStatus;
use App\Models\TaskGroup;
use App\Services\DashboardService;
use App\Support\ReportFilters;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

trait ReportRepositorySupport
{
    public const DEFAULT_PER_PAGE = 25;

    public const MAX_PER_PAGE = 100;

    public function activeProjectIds(): QueryBuilder
    {
        return DB::table('projects')
            ->select('id')
            ->where('status', ProjectStatus::ACTIVE->value)
            ->whereNull('archived_at');
    }

    public function completedGroupId(): ?int
    {
        $id = TaskGroup::query()->where('is_completed', 1)->value('id');

        return $id === null ? null : (int) $id;
    }

    public function getDateRange(ReportFilters $filters): array
    {
        $dateFrom = $filters->dateFrom ? Carbon::parse($filters->dateFrom)->format('Y-m-d') : null;
        $dateTo = $filters->dateTo ? Carbon::parse($filters->dateTo)->format('Y-m-d') : null;

        return [$dateFrom, $dateTo];
    }

    public function today(): string
    {
        return Carbon::today()->format('Y-m-d');
    }

    public function dueSoonEnd(): string
    {
        return Carbon::today()->addDays(DashboardService::DUE_SOON_DAYS)->format('Y-m-d');
    }

    public function clamp(int $perPage): int
    {
        return min(max($perPage, 1), self::MAX_PER_PAGE);
    }
}
