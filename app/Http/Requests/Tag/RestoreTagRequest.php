<?php

namespace App\Http\Requests\Tag;

use App\Rules\UniqueActiveTagName;
use Illuminate\Foundation\Http\FormRequest;

class RestoreTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name');

        $this->merge([
            'name' => filled($name) ? preg_replace('/\s+/u', ' ', trim((string) $name)) : null,
        ]);
    }

    public function rules(): array
    {
        return [
            // Rename & Restore: နာမည်တူနေရင်သာ ပို့မယ်
            'name' => ['nullable', 'string', 'max:30', new UniqueActiveTagName()],
        ];
    }
}