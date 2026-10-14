<?php

namespace App\Http\Requests\TaskGroup;

use Illuminate\Foundation\Http\FormRequest;

class ArchiveTaskGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'replacement_group_id' => ['required', 'integer'],
        ];
    }

    public function messages(): array
    {
        return [
            'replacement_group_id.required' => 'Choose a replacement group for the tasks in this group.',
        ];
    }
}