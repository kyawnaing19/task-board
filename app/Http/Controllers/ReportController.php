<?php

namespace App\Http\Controllers;

use App\Exports\TaskReportExport;
use App\Http\Requests\Report\ReportListRequest;
use App\Services\ReportService;
use App\Support\ReportFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    /** Rows shown on the task report page. */
    protected const TASKS_PER_PAGE = 15;

    public function __construct(
        protected ReportService $service
    ) {}

    /**
     * Render the filtered, server-paginated task report.
     */
    public function index(Request $request): Response
    {
        $options = $this->service->getFilterOptions();
        $filters = ReportFilters::fromArray($request->query());

        $taskPage = max((int) ($request->query('page') ?? 1), 1);
        $taskCounts = [];
        foreach (['open', 'all', 'completed'] as $status) {
            $statusFilters = new ReportFilters(
                teamId: $filters->teamId,
                employeeId: $filters->employeeId,
                tagId: $filters->tagId,
                dateFrom: $filters->dateFrom,
                dateTo: $filters->dateTo,
                taskStatus: $status,
            );
            $taskCounts[$status] = $this->service->taskDetails($statusFilters, 1, 1)->total();
        }

        return Inertia::render('Reports/Index', [
            'filter_options' => [
                'teams' => $options['teams'],
                'employees' => $options['employees'],
                'tags' => $options['tags'],
            ],

            'filters' => $filters->toArray(),

            'task_counts' => $taskCounts,
            'tasks' => $this->service->taskDetails($filters, self::TASKS_PER_PAGE, $taskPage)->withQueryString(),
        ]);
    }

    // public function export(Request $request): BinaryFileResponse
    // {
    //     $filters = ReportFilters::fromArray($request->query());
    //     $options = $this->service->getFilterOptions();
    //     $filterName = static function (array $options, ?int $id): string {
    //         if ($id === null) {
    //             return 'All';
    //         }

    //         return data_get(collect($options)->firstWhere('id', $id), 'name', 'All');
    //     };

    //     $criteria = [
    //         'team' => $filterName($options['teams'], $filters->teamId),
    //         'employee' => $filterName($options['employees'], $filters->employeeId),
    //         'tag' => $filterName($options['tags'], $filters->tagId),
    //         'date_from' => $filters->dateFrom ?? 'Any',
    //         'date_to' => $filters->dateTo ?? 'Any',
    //         'status' => ucfirst($filters->taskStatus),
    //     ];

    //     $filename = 'task-report-'.now()->format('Y-m-d-His').'.xlsx';

    //     return Excel::download(
    //         new TaskReportExport($this->service->taskDetailsForExport($filters), $criteria),
    //         $filename,
    //     );
    // }

    public function export(Request $request): BinaryFileResponse
{
    $filters = ReportFilters::fromArray($request->query());
    $options = $this->service->getFilterOptions();

    $filterName = static function (Collection $options, ?int $id): string {
        if ($id === null) {
            return 'All';
        }

        return (string) data_get(
            $options->firstWhere('id', $id),
            'name',
            'All'
        );
    };

    $criteria = [
        'team' => $filterName($options['teams'], $filters->teamId),
        'employee' => $filterName($options['employees'], $filters->employeeId),
        'tag' => $filterName($options['tags'], $filters->tagId),
        'date_from' => $filters->dateFrom ?? 'Any',
        'date_to' => $filters->dateTo ?? 'Any',
        'status' => ucfirst($filters->taskStatus),
    ];

    $filename = 'task-report-'.now()->format('Y-m-d-His').'.xlsx';

    return Excel::download(
        new TaskReportExport(
            $this->service->taskDetailsForExport($filters),
            $criteria
        ),
        $filename,
    );
}

    /**
     * Filtered detail reports (JSON)
     * GET /reports/employees — Employee workload
     * GET /reports/tags — Tag-based report
     * GET /reports/teams — Team-based report
     * GET /reports/tasks — Detailed task list
     */

    /**
     * Employee workload report with filters
     * GET /reports/employees
     */
    public function employeeWorkload(ReportListRequest $request): JsonResponse
    {
        $filters = ReportFilters::fromArray($request->validated());
        $data = $this->service->employeeWorkload($filters, $request->perPage(), $request->page());

        return response()->json([
            'data' => $data,
            'applied_filters' => $filters->toArray(),
            'report_type' => 'employee_workload',
        ]);
    }

    /**
     * Tag-based report
     * GET /reports/tags
     */
    public function tagReport(ReportListRequest $request): JsonResponse
    {
        $filters = ReportFilters::fromArray($request->validated());
        $data = $this->service->tagReport($filters, $request->perPage(), $request->page());

        return response()->json([
            'data' => $data,
            'applied_filters' => $filters->toArray(),
            'report_type' => 'tag_report',
        ]);
    }

    /**
     * Team-based report
     * GET /reports/teams
     */
    public function teamReport(ReportListRequest $request): JsonResponse
    {
        $filters = ReportFilters::fromArray($request->validated());
        $data = $this->service->teamReport($filters, $request->perPage(), $request->page());

        return response()->json([
            'data' => $data,
            'applied_filters' => $filters->toArray(),
            'report_type' => 'team_report',
        ]);
    }

    /**
     * Detailed task list report
     * GET /reports/tasks
     */
    public function taskDetails(ReportListRequest $request): JsonResponse
    {
        $filters = ReportFilters::fromArray($request->validated());
        $data = $this->service->taskDetails($filters, $request->perPage(), $request->page());

        return response()->json([
            'data' => $data,
            'applied_filters' => $filters->toArray(),
            'report_type' => 'task_details',
        ]);
    }
}
