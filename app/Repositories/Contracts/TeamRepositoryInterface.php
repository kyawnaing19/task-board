<?php

namespace App\Repositories\Contracts;

use App\Models\Team;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TeamRepositoryInterface
{
    public function paginate(bool $archived = false,int $perPage = 15,?string $search = null): LengthAwarePaginator;
    
    public function create(array $data): Team;

    public function update(Team $team, array $data): Team;


}