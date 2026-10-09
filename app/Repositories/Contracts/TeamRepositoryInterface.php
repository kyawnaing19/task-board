<?php

namespace App\Repositories\Contracts;

use App\Models\Team;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface TeamRepositoryInterface
{
    public function paginate(bool $archived = false,int $perPage = 15,?string $search = null): LengthAwarePaginator;
    
    public function create(array $data): Team;

    public function update(Team $team, array $data): Team;

    /** Active (unarchived) teams that include this employee */
    public function forMember(User $user): Collection;

    /** Returns the team only if it is active and includes the employee, otherwise null */
    public function findForMember(User $user, int $teamId): ?Team;

    /** Active account members for the colleague list */
    public function colleagues(Team $team): Collection;


}