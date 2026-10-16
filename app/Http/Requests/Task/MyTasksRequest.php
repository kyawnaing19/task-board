<?php

namespace App\Http\Requests\Task;

use App\Services\MyTaskService;
use App\Support\MyTaskScope;
use App\Support\TaskFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MyTasksRequest extends FormRequest
{
    use BoardFilterRules;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return array_merge($this->filterRules(), [
            'mode'              => ['nullable', Rule::in(MyTaskScope::MODES)],
            'archived_tasks'    => ['nullable', 'boolean'],      // 1 / 0 ပို့ပါ ("true" စာသားကို Laravel မလက်ခံဘူး)
            'archived_projects' => ['nullable', 'boolean'],
            'project_id'        => ['nullable', 'integer', 'min:1'],
            'per_page'          => ['nullable', 'integer', 'min:1', 'max:'.MyTaskService::MAX_PER_PAGE],
            'page'              => ['nullable', 'integer', 'min:1'],

            // Ownership mode က assignee / "mine" dimension ကို ကိုင်ထားတယ်
            'assignee' => ['prohibited'],
            'mine'     => ['prohibited'],
        ]);
    }

    public function scope(): MyTaskScope
    {
        return MyTaskScope::fromArray($this->validated());
    }

    public function filters(): TaskFilters
    {
        return TaskFilters::fromArray($this->validated());
    }

    public function perPage(): int
    {
        return (int) ($this->validated('per_page') ?? MyTaskService::DEFAULT_PER_PAGE);
    }
}