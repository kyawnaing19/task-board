<?php

namespace App\Repositories\Contracts;

use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ProjectRepositoryInterface
{
    //public function paginate(string $filter = 'active', int $perPage = 15): LengthAwarePaginator;
    //public function paginate(string $filter = 'active', int $perPage = 15, ?array $projectIds = null): LengthAwarePaginator;
    
    public function paginate(string $filter = 'active', int $perPage = 15, ?array $projectIds = null, ?string $type = null): LengthAwarePaginator;

    /** ရှိပြီးသား type များ (အကြီးအသေးမခွဲ ထပ်တူမရှိ၊ နာမည်စဉ်) */
    public function types(): array;

    /** ဒီ type နဲ့ အကြီးအသေးပဲကွာတဲ့ ရှိပြီးသား spelling (အစောဆုံး project ရဲ့) */
    public function canonicalType(string $type): ?string;


    public function create(array $data): Project;

    public function update(Project $project, array $data): Project;

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