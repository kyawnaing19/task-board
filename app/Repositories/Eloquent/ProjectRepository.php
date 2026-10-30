<?php

namespace App\Repositories\Eloquent;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Support\ProjectListFilters;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProjectRepository implements ProjectRepositoryInterface
{
    
    // public function paginate(string $filter = 'active', int $perPage = 15, ?array $projectIds = null, ?string $type = null): LengthAwarePaginator
    // {
    //     return Project::query()
    //         ->when($projectIds === null, fn ($q) => $q->with('creator:id,name'))
    //         ->when($projectIds !== null, fn ($q) => $q->whereIn('id', $projectIds))
    //         ->when($type !== null, fn ($q) => $q->whereRaw('LOWER(type) = ?', [mb_strtolower($type)]))
    //         ->when(
    //             $filter === 'archived',
    //             fn ($q) => $q->archived(),
    //             fn ($q) => $q->notArchived()->where(
    //                 'status',
    //                 ($filter === 'completed' ? ProjectStatus::COMPLETED : ProjectStatus::ACTIVE)->value
    //             )
    //         )
    //         ->latest('id')
    //         ->paginate($perPage)
    //         ->withQueryString();
    // }

    public function paginate(string $filter = 'active', int $perPage = 15, ?array $projectIds = null, ?string $type = null): LengthAwarePaginator
    {
        $query = Project::query()
            ->when($projectIds === null, fn ($q) => $q->with('creator:id,name'))
            ->when($projectIds !== null, fn ($q) => $q->whereIn('id', $projectIds))
            ->when($type !== null, fn ($q) => $q->whereRaw('LOWER(type) = ?', [mb_strtolower($type)]));

        $this->applyStatus($query, $filter);

        return $query->orderByDesc('updated_at')->orderByDesc('id')->paginate($perPage)->withQueryString();
    }

    // public function paginateForAdmin(string $status, int $perPage, ProjectListFilters $filters, ?array $employeeProjectIds = null): LengthAwarePaginator
    // {
    //     $query = Project::query()
    //         ->with('creator:id,name')
    //         ->when($filters->type !== null, fn ($q) => $q->whereRaw('LOWER(type) = ?', [mb_strtolower($filters->type)]))
    //         // Team နဲ့ လက်ရှိ active link ရှိတဲ့ project (archived team ပါ)
    //         ->when($filters->teamId !== null, fn ($q) => $q->whereHas(
    //             'teamLinks',
    //             fn ($l) => $l->whereNull('removed_at')->where('team_id', $filters->teamId)
    //         ))
    //         ->when($employeeProjectIds !== null, fn ($q) => $q->whereIn('id', $employeeProjectIds));

    //     $this->applyStatus($query, $status);

    //     return $query->orderByDesc('updated_at')->orderByDesc('id')->paginate($perPage)->withQueryString();
    // }

    public function paginateForAdmin(string $status,int $perPage,ProjectListFilters $filters,?array $employeeProjectIds = null): LengthAwarePaginator 
    {
        $query = Project::query()
            ->with('creator:id,name')

            ->when(
                $filters->type !== null,
                fn ($q) => $q->whereRaw(
                    'LOWER(type) = ?',
                    [mb_strtolower($filters->type)]
                )
            )

            // Search: Project name, code, description
            ->when(
                $filters->search !== null,
                function ($q) use ($filters) {
                    $search = '%' . $filters->search . '%';

                    $q->where(function ($searchQuery) use ($search) {
                        $searchQuery
                            ->where('name', 'LIKE', $search)
                            ->orWhere('code', 'LIKE', $search)
                            ->orWhere('description', 'LIKE', $search);
                    });
                }
            )

            // Team နဲ့ လက်ရှိ active link ရှိတဲ့ project
            ->when(
                $filters->teamId !== null,
                fn ($q) => $q->whereHas(
                    'teamLinks',
                    fn ($l) => $l
                        ->whereNull('removed_at')
                        ->where('team_id', $filters->teamId)
                )
            )

            ->when(
                $employeeProjectIds !== null,
                fn ($q) => $q->whereIn('id', $employeeProjectIds)
            );

        $this->applyStatus($query, $status);

        return $query
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    protected function applyStatus(Builder $query, string $status): void
    {
        if ($status === 'archived') {
            $query->archived();

            return;
        }

        $query->notArchived()->where(
            'status',
            ($status === 'completed' ? ProjectStatus::COMPLETED : ProjectStatus::ACTIVE)->value
        );
    }





    public function types(): array
    {
        // DISTINCT + ORDER BY LOWER() က MySQL / PostgreSQL မှာ error ဖြစ်လို့ GROUP BY နဲ့
        return Project::query()
            ->whereNotNull('type')
            ->groupBy('type')
            ->orderByRaw('LOWER(type)')
            ->limit(200)
            ->pluck('type')
            ->all();
    }

    public function canonicalType(string $type): ?string
    {
        return Project::query()
            ->whereRaw('LOWER(type) = ?', [mb_strtolower($type)])
            ->orderBy('id')
            ->value('type');
    }

    public function find(int $id): ?Project
    {
        return Project::query()->find($id);
    }

    public function create(array $data): Project
    {
        return Project::create($data);
    }

    public function update(Project $project, array $data): Project
    {
        $project->update($data);

        return $project->refresh();
    }

    public function lock(Project $project): Project
    {
        return Project::query()->whereKey($project->id)->lockForUpdate()->firstOrFail();
    }

    public function lockShared(Project $project): Project
    {
        return Project::query()->whereKey($project->id)->sharedLock()->firstOrFail();
    }

    // public function nextTaskSequence(Project $locked): int
    // {
    //     $next = ((int) $locked->task_sequence) + 1;

    //     Project::query()->whereKey($locked->id)->update(['task_sequence' => $next]);

    //     return $next;
    // }

    public function nextTaskSequence(Project $locked): int
    {
        $next = ((int) $locked->task_sequence) + 1;

        // Query builder နဲ့ တိုက်ရိုက်ရေးတာက updated_at ကို မထိဘူး။
        // Eloquent update က ထိလို့ task ဆောက်တိုင်း project က "recently updated" ထိပ်ကို တက်နေခဲ့တယ်
        DB::table('projects')->where('id', $locked->id)->update(['task_sequence' => $next]);

        return $next;
    }

    public function byIds(array $ids): Collection
    {
        return Project::query()
            ->whereIn('id', $ids)
            ->orderByRaw('LOWER(name)')
            ->orderBy('id')
            ->get(['id', 'code', 'name', 'status', 'archived_at']);
    }
}