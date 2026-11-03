<?php

namespace App\Services;

use App\Repositories\Contracts\ReportRepositoryInterface;
use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ReportService
{
    public const DEFAULT_PER_PAGE = 25;

    public const MAX_PER_PAGE = 100;

    public function __construct(
        private ReportRepositoryInterface $reports,
        private ReportExportService $export,
    ) {}

    public function employeeWorkload(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        return $this->reports->employeeWorkload($filters, $perPage, $page);
    }

    public function tagReport(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        return $this->reports->tagReport($filters, $perPage, $page);
    }

    public function teamReport(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        return $this->reports->teamReport($filters, $perPage, $page);
    }

    public function taskDetails(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        return $this->reports->taskDetails($filters, $perPage, $page);
    }

    public function taskDetailsForExport(ReportFilters $filters): Collection
    {
        return $this->export->taskDetails($filters);
    }

    public function getFilterOptions(): array
    {
        return $this->reports->getFilterOptions();
    }

    public function getSummaryStats(): array
    {
        return $this->reports->getSummaryStats();
    }

    public function projectOverview(ReportFilters $filters, int $perPage = self::DEFAULT_PER_PAGE, ?int $page = null): LengthAwarePaginator
    {
        return $this->reports->projectOverview($filters, $perPage, $page);
    }
}
