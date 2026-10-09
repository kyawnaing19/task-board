<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;

class AddTeamMembersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'user_ids'   => ['required', 'array', 'min:1', 'max:100'],
            'user_ids.*' => ['integer', 'distinct'],
        ];
    }
}