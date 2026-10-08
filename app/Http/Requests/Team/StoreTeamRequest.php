<?php

namespace App\Http\Requests\Team;

use App\Rules\UniqueTeamName;
use Illuminate\Foundation\Http\FormRequest;

class StoreTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        
        $name = preg_replace('/\s+/u', ' ', trim((string) $this->input('name')));

        $this->merge([
            'name' => $name,
            'description' => filled($this->input('description'))
                ? trim((string) $this->input('description'))
                : null,
        ]);
    }

    

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255', new UniqueTeamName()],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}