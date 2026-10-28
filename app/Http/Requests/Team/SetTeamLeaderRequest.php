<?php

namespace App\Http\Requests\Team;

use Illuminate\Foundation\Http\FormRequest;

class SetTeamLeaderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    public function rules(): array
    {
        // null = leader ကို ဖယ်မယ်
        return ['user_id' => ['nullable', 'integer', 'min:1']];
    }
}