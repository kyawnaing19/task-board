<?php

namespace App\Repositories\Contracts;

use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProjectRepositoryInterface
{
    public function paginate(string $filter = 'active', int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Project;

    public function update(Project $project, array $data): Project;

/** Lock the row within the transaction and retrieve it with the latest state */
    public function lock(Project $project): Project;
}