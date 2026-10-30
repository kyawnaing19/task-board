<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Team;
use App\Models\User;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Support\ProjectListFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AdminProjectListService
{
    public const DEFAULT_PER_PAGE = 25;
    public const MAX_PER_PAGE = 100;
    public const OPTION_LIMIT = 500;

    public function __construct(
        protected ProjectRepositoryInterface $projects,
        protected ProjectAccess $access
    ) {}

    public function list(string $status, ProjectListFilters $filters, int $perPage = self::DEFAULT_PER_PAGE): LengthAwarePaginator
    {
        $perPage = min(max($perPage, 1), self::MAX_PER_PAGE);

        $employeeProjectIds = null;

        if ($filters->employeeId !== null) {
            // Effective membership စည်းမျဉ်း အတိုင်း။ Active Employee မဟုတ်ရင် access မရှိလို့ ရလဒ်ဗလာ
            $employee = $this->activeEmployees()->find($filters->employeeId);

            $employeeProjectIds = $employee ? $this->access->projectIdsFor($employee) : [];
        }

        return $this->projects->paginateForAdmin($status, $perPage, $filters, $employeeProjectIds);
    }

    /**
     * Dropdown ရွေးစရာ (နာမည် အကြီးအသေးမခွဲ အစဉ်လိုက်)။ Email မပါဘူး။
     * URL ကနေ ရွေးထားတဲ့ team / employee ကို စာရင်းမှာ မပါလည်း (archived team၊ inactive employee) selected နဲ့ ပြန်ပေးမယ်။
     */
    public function options(ProjectListFilters $filters): array
    {
        return [
            'teams' => Team::query()
                ->orderByRaw('LOWER(name)')->orderBy('id')
                ->limit(self::OPTION_LIMIT)
                ->get(['id', 'name', 'archived_at'])
                ->map(fn (Team $t) => $this->team($t))->values()->all(),
            'employees' => $this->activeEmployees()
                ->orderByRaw('LOWER(name)')->orderBy('id')
                ->limit(self::OPTION_LIMIT)
                ->get(['id', 'name', 'job_title'])
                ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name, 'job_title' => $u->job_title])
                ->values()->all(),
            'selected' => [
                'team'     => ($t = $filters->teamId ? Team::query()->find($filters->teamId, ['id', 'name', 'archived_at']) : null)
                    ? $this->team($t) : null,
                'employee' => ($u = $filters->employeeId
                    ? User::query()->where('role', UserRole::EMPLOYEE->value)->find($filters->employeeId, ['id', 'name', 'status'])
                    : null)
                    ? ['id' => $u->id, 'name' => $u->name, 'active' => $u->status === UserStatus::ACTIVE->value] : null,
            ],
        ];
    }

    protected function team(Team $team): array
    {
        return ['id' => $team->id, 'name' => $team->name, 'archived' => $team->archived_at !== null];
    }

    protected function activeEmployees()
    {
        return User::query()
            ->where('role', UserRole::EMPLOYEE->value)
            ->where('status', UserStatus::ACTIVE->value);
    }
}