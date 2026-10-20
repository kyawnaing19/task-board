<?php

namespace App\Http\Requests\Dashboard;

use App\Services\AdminDashboardService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminDashboardListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.AdminDashboardService::MAX_PER_PAGE],
            'page'     => ['nullable', 'integer', 'min:1'],
            'sort'     => ['nullable', Rule::in(['workload', 'name'])],
        ];
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? AdminDashboardService::DEFAULT_PER_PAGE);
    }

    public function page(): ?int
    {
        $page = $this->validated('page');

        return $page === null ? null : (int) $page;
    }

    public function sort(): string
    {
        return $this->validated('sort') ?? 'workload';
    }
}