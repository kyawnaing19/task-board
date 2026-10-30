<?php

namespace App\Http\Controllers;

use App\Http\Requests\Report\ReportListRequest;
use App\Services\ReportService;
use App\Support\ReportFilters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /** Reports page မှာ ပြမယ့် overview rows အရေအတွက် */
    protected const OVERVIEW_LIMIT = 10;

    public function __construct(
        protected ReportService $service
    ) {}

    /**
     * Reports page (Inertia) — Filter options နဲ့ အစပိုင်း overview data တွေကို
     * props အနေနဲ့ ပြန်ပေးမယ် (data က server-side render ဖြစ်တယ်၊ response က client-side reload)။
     */
    public function index(Request $request): Response
    {
        $options = $this->service->getFilterOptions();
        $filters = ReportFilters::fromArray($request->query());

        // Tasks table pagination — ?page=N (Laravel paginator links)
        $taskPage = max((int) ($request->query('page') ?? 1), 1);

        return Inertia::render('Reports/Index', [
            'filter_options' => [
                'teams'     => $options['teams'],
                'employees' => $options['employees'],
                'tags'      => $options['tags'],
            ],

            'filters' => $filters->toArray(),

            'summary'      => $this->service->getSummaryStats(),
            'projects'     => $this->service->projectOverview($filters, self::OVERVIEW_LIMIT, 1)->items(),
            'top_employees'=> $this->service->employeeWorkload($filters, self::OVERVIEW_LIMIT, 1)->items(),
            'top_tags'     => $this->service->tagReport($filters, self::OVERVIEW_LIMIT, 1)->items(),
            'top_teams'    => $this->service->teamReport($filters, self::OVERVIEW_LIMIT, 1)->items(),
            'tasks'        => $this->service->taskDetails($filters, self::OVERVIEW_LIMIT, $taskPage)->withQueryString(),
        ]);
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
            'data'            => $data,
            'applied_filters' => $filters->toArray(),
            'report_type'     => 'employee_workload',
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
            'data'            => $data,
            'applied_filters' => $filters->toArray(),
            'report_type'     => 'tag_report',
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
            'data'            => $data,
            'applied_filters' => $filters->toArray(),
            'report_type'     => 'team_report',
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
            'data'            => $data,
            'applied_filters' => $filters->toArray(),
            'report_type'     => 'task_details',
        ]);
    }
}