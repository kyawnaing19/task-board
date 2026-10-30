<?php

namespace App\Http\Requests\Report;

use App\Services\ReportService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.ReportService::MAX_PER_PAGE],
            'page' => ['nullable', 'integer', 'min:1'],
            'sort' => ['nullable', Rule::in(['workload', 'name', 'overdue', 'due_soon'])],
            'task_status' => ['nullable', Rule::in(['open', 'completed', 'all'])],
            'team_id' => ['nullable', 'integer', 'min:1', 'exists:teams,id'],
            'employee_id' => ['nullable', 'integer', 'min:1', 'exists:users,id'],
            'tag_id' => ['nullable', 'integer', 'min:1', 'exists:tags,id'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ];
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? ReportService::DEFAULT_PER_PAGE);
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

    public function teamId(): ?int
    {
        return $this->validated('team_id');
    }

    public function employeeId(): ?int
    {
        return $this->validated('employee_id');
    }

    public function tagId(): ?int
    {
        return $this->validated('tag_id');
    }

    public function dateFrom(): ?string
    {
        return $this->validated('date_from');
    }

    public function dateTo(): ?string
    {
        return $this->validated('date_to');
    }
}
