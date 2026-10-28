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
        $merge = [
            'name'        => preg_replace('/\s+/u', ' ', trim((string) $this->input('name'))),
            'description' => filled($this->input('description'))
                ? trim((string) $this->input('description'))
                : null,
        ];

        // Request ထဲမှာ type ပါမှသာ ထိမယ် (မပါရင် Update မှာ ရှိပြီးသား type ကို မရှင်းမိအောင်)
        if ($this->has('type')) {
            $type = preg_replace('/\s+/u', ' ', trim((string) $this->input('type')));
            $merge['type'] = $type === '' ? null : $type;
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        $dueDate = ['nullable', 'date_format:Y-m-d'];

        if ($this->filled('start_date')) {
            $dueDate[] = 'after_or_equal:start_date';
        }

        return [
            'name'        => ['required', 'string', 'max:255'],
            'type'        => ['nullable', 'string', 'max:100'],
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