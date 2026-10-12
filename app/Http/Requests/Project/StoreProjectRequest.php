<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $name = preg_replace('/\s+/u', ' ', trim((string) $this->input('name')));

        $this->merge([
            'name'        => $name,
            'description' => filled($this->input('description'))
                ? trim((string) $this->input('description'))
                : null,
        ]);
    }

    public function rules(): array
    {
        $dueDate = ['nullable', 'date_format:Y-m-d'];

        if ($this->filled('start_date')) {
            $dueDate[] = 'after_or_equal:start_date';
        }

        return [
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'start_date'  => ['nullable', 'date_format:Y-m-d'],
            'due_date'    => $dueDate,
        ];
    }

    public function messages(): array
    {
        return [
            'due_date.after_or_equal' => 'The target due date cannot be earlier than the start date.',
        ];
    }
}