<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dashboard\AcknowledgeAssignmentsRequest;
use App\Http\Requests\Dashboard\AdminDashboardListRequest;
use App\Services\AdminDashboardService;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $service,
        protected AdminDashboardService $admin
    ) {}

    public function data(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json(
            $user->isSuperAdmin() ? $this->admin->overview() : $this->service->employee($user)
        );
    }

    public function adminProjects(AdminDashboardListRequest $request): JsonResponse
    {
        return response()->json($this->admin->projects($request->perPage(), $request->page()));
    }

    public function adminWorkload(AdminDashboardListRequest $request): JsonResponse
    {
        return response()->json($this->admin->workload($request->sort(), $request->perPage(), $request->page()));
    }

    public function acknowledgeAssignments(AcknowledgeAssignmentsRequest $request): JsonResponse
    {
        // Assignment checkpoint က Employee အတွက်ပဲ
        abort_if($request->user()->isSuperAdmin(), 403);

        $checkpoint = $this->service->acknowledgeAssignments($request->user(), $request->asOf());

        return response()->json(['checkpoint' => $checkpoint->toIso8601String()]);
    }
}