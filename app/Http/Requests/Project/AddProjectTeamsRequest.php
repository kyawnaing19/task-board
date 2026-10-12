<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class AddProjectTeamsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'team_ids'   => ['required', 'array', 'min:1', 'max:50'],
            'team_ids.*' => ['integer', 'distinct'],
        ];
    }
}