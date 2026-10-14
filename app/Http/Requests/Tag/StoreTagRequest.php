<?php

namespace App\Http\Requests\Tag;

use App\Enums\GroupColor;
use App\Rules\UniqueActiveTagName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => preg_replace('/\s+/u', ' ', trim((string) $this->input('name'))),
        ]);
    }

    protected function ignoredTagId(): ?int
    {
        return null;
    }

    public function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'max:30', new UniqueActiveTagName($this->ignoredTagId())],
            'color' => ['required', Rule::enum(GroupColor::class)],
        ];
    }
}