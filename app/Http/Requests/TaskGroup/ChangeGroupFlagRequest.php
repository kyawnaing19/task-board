<?php

namespace App\Http\Requests\TaskGroup;

use Illuminate\Foundation\Http\FormRequest;

class ChangeGroupFlagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'target_group_id' => ['required', 'integer', 'exists:task_groups,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'target_group_id.required' => 'Choose the group that should become the new default.',
        ];
    }
}