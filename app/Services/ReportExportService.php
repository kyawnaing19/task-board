<?php

namespace App\Services;

use App\Repositories\Contracts\ReportRepositoryInterface;
use App\Support\ReportFilters;
use Illuminate\Support\Collection;

class ReportExportService
{
    public function __construct(private ReportRepositoryInterface $reports) {}

    public function taskDetails(ReportFilters $filters): Collection
    {
        $tasks = collect();
        $page = 1;

        do {
            $paginator = $this->reports->taskDetails($filters, ReportService::MAX_PER_PAGE, $page);
            $tasks = $tasks->concat($paginator->items());
            $page++;
        } while ($paginator->hasMorePages());

        return $tasks->values();
    }
}
