<?php

namespace App\Repositories\Contracts;

use App\Support\ReportFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ReportRepositoryInterface
{
    public function employeeWorkload(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator;

    public function tagReport(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator;

    public function teamReport(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator;

    public function taskDetails(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator;

    public function getFilterOptions(): array;

    public function getSummaryStats(): array;

    public function projectOverview(ReportFilters $filters, int $perPage, ?int $page): LengthAwarePaginator;
}
