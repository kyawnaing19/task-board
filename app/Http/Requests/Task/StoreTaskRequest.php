<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Project access စစ်တာကို TaskService (TaskAuthorization) မှာ လုပ်တယ်
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $description = $this->input('description');

        if ($description !== null) {
            // စာလုံးရေ တိုင်းတာတာ မှန်အောင် line ending ကို တူအောင်လုပ်မယ်
            $description = trim(str_replace(["\r\n", "\r"], "\n", (string) $description));
        }

        $this->merge([
            'title'       => preg_replace('/\s+/u', ' ', trim((string) $this->input('title'))),
            'description' => filled($description) ? $description : null,
        ]);
    }

    public function rules(): array
    {
        $endDate = ['nullable', 'date_format:Y-m-d'];

        if ($this->filled('start_date')) {
            $endDate[] = 'after_or_equal:start_date';
        }

        return [
            'title'          => ['required', 'string', 'max:200'],
            'description'    => ['nullable', 'string', 'max:20000'],   // plain text၊ HTML ကို render မလုပ်
            'priority'       => ['nullable', Rule::enum(TaskPriority::class)],
            'start_date'     => ['nullable', 'date_format:Y-m-d'],
            'end_date'       => $endDate,
            'group_id'       => ['nullable', 'integer'],
            'assignee_ids'   => ['nullable', 'array', 'max:50'],
            'assignee_ids.*' => ['integer', 'distinct'],
            'tag_ids'        => ['nullable', 'array', 'max:20'],
            'tag_ids.*'      => ['integer', 'distinct'],

            // System စီမံတဲ့ field တွေကို form ကနေ မပို့ရ
            'code'          => ['prohibited'],
            'sequence'      => ['prohibited'],
            'created_by'    => ['prohibited'],
            'sort_position' => ['prohibited'],
            'completed_at'  => ['prohibited'],
            'archived_at'   => ['prohibited'],
        ];
    }

    public function messages(): array
    {
        return [
            'end_date.after_or_equal' => 'The end date cannot be earlier than the start date.',
        ];
    }
}