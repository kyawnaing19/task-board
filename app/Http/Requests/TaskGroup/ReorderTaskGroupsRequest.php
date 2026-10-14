<?php

namespace App\Http\Requests\TaskGroup;

use Illuminate\Foundation\Http\FormRequest;

class ReorderTaskGroupsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'ids'   => ['required', 'array', 'min:2', 'max:100'],
            'ids.*' => ['integer', 'distinct'],
        ];
    }
}