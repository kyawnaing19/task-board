<?php

namespace App\Http\Controllers;

use App\Http\Requests\Dashboard\AcknowledgeAssignmentsRequest;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $service
    ) {}

    public function data(Request $request): JsonResponse
    {
        // Super Admin dashboard (company-wide) ကို နောက်မှ ထည့်မယ်
        abort_if($request->user()->isSuperAdmin(), 403);

        return response()->json($this->service->employee($request->user()));
    }

    public function acknowledgeAssignments(AcknowledgeAssignmentsRequest $request): JsonResponse
    {
        abort_if($request->user()->isSuperAdmin(), 403);

        $checkpoint = $this->service->acknowledgeAssignments($request->user(), $request->asOf());

        return response()->json(['checkpoint' => $checkpoint->toIso8601String()]);
    }
}