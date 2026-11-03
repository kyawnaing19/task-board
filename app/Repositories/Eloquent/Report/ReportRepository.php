<?php

namespace App\Repositories\Eloquent\Report;

use App\Repositories\Contracts\ReportRepositoryInterface;
use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReportRepository implements ReportRepositoryInterface
{
    public function __construct(
        private EmployeeWorkloadRepository $employeeWorkload,
        private TagReportRepository $tagReport,
        private TeamReportRepository $teamReport,
        private TaskReportRepository $taskReport,
        private ReportOverviewRepository $overview,
    ) {}

    public function employeeWorkload(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator
    {
        return $this->employeeWorkload->employeeWorkload($filters, $perPage, $page);
    }

    public function tagReport(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator
    {
        return $this->tagReport->tagReport($filters, $perPage, $page);
    }

    public function teamReport(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator
    {
        return $this->teamReport->teamReport($filters, $perPage, $page);
    }

    public function taskDetails(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator
    {
        return $this->taskReport->taskDetails($filters, $perPage, $page);
    }

    public function getFilterOptions(): array
    {
        return $this->overview->getFilterOptions();
    }

    public function getSummaryStats(): array
    {
        return $this->overview->getSummaryStats();
    }

    public function projectOverview(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator
    {
        return $this->overview->projectOverview($filters, $perPage, $page);
    }
}
