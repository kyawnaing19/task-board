<?php

namespace App\Repositories\Contracts;

use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use App\Support\ProjectListFilters;

interface ProjectRepositoryInterface
{
    //public function paginate(string $filter = 'active', int $perPage = 15): LengthAwarePaginator;
    //public function paginate(string $filter = 'active', int $perPage = 15, ?array $projectIds = null): LengthAwarePaginator;
    
    public function paginate(string $filter = 'active', int $perPage = 15, ?array $projectIds = null, ?string $type = null): LengthAwarePaginator;

    /**
     * Super Admin ရဲ့ Projects list။ Status tab + type + team + employee ကို AND လုပ်မယ်။
     * Sort: updated_at desc၊ id desc။
     *
     * @param int[]|null $employeeProjectIds ပေးရင် ဒီ id တွေထဲကပဲ (employee filter ရဲ့ effective access)၊ [] ဆိုရင် ဗလာ
     */
    public function paginateForAdmin(string $status, int $perPage, ProjectListFilters $filters, ?array $employeeProjectIds = null): LengthAwarePaginator;

    /** ရှိပြီးသား type များ (အကြီးအသေးမခွဲ ထပ်တူမရှိ၊ နာမည်စဉ်) */
    public function types(): array;

    /** ဒီ type နဲ့ အကြီးအသေးပဲကွာတဲ့ ရှိပြီးသား spelling (အစောဆုံး project ရဲ့) */
    public function canonicalType(string $type): ?string;


    public function create(array $data): Project;

    public function update(Project $project, array $data): Project;

    /** Project row ကို shared lock နဲ့ ယူမယ် (status ပြောင်းတာ၊ archive နဲ့ တိုက်ဆိုင်မှုကို serialize လုပ်ဖို့) */
    public function lockShared(Project $project): Project;

    /** Lock the row within the transaction and retrieve it with the latest state */
    public function lock(Project $project): Project;

    /**
     * @param 'active'|'completed'|'archived' $filter
     * @param int[]|null $projectIds ပေးရင် ဒီ id တွေထဲကပဲ ပြန်မယ် (Employee view)
     */

    public function find(int $id): ?Project;


    /** Project row ကို lock လုပ်ပြီးသားမှာ ခေါ်ရမယ်။ Task sequence ကို တိုးပြီး ပြန်ပေးမယ်။ */
    public function nextTaskSequence(Project $locked): int;

    /** Normalized name ascending (LOWER(name)၊ id tie-break) */
    public function byIds(array $ids): Collection;

}