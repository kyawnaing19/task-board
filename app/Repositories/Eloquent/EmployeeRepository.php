<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EmployeeRepository implements EmployeeRepositoryInterface
{
    public function paginate(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        return User::query()
            ->when($search, function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('job_title', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    public function showDetail(User $user): array
    {
        return [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'job_title' => $user->job_title,
            'avatar' => $user->avatar_url,
        ];
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);

        return $user->refresh();
    }
}
