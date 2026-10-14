<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Ownership စစ်တာကို TaskService (TaskAuthorization) မှာ လုပ်တယ်
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('title')) {
            $merge['title'] = preg_replace('/\s+/u', ' ', trim((string) $this->input('title')));
        }

        if ($this->has('description')) {
            $description = $this->input('description');

            if ($description !== null) {
                $description = trim(str_replace(["\r\n", "\r"], "\n", (string) $description));
            }

            $merge['description'] = filled($description) ? $description : null;
        }

        $this->merge($merge);
    }

    public function rules(): array
    {
        return [
            // 'sometimes' = ပါလာတဲ့ field ကိုပဲ စစ်ပြီး ပြင်မယ်
            'title'          => ['sometimes', 'required', 'string', 'max:200'],
            'description'    => ['sometimes', 'nullable', 'string', 'max:20000'],
            'priority'       => ['sometimes', 'required', Rule::enum(TaskPriority::class)],
            'start_date'     => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'end_date'       => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'assignee_ids'   => ['sometimes', 'nullable', 'array', 'max:50'],
            'assignee_ids.*' => ['integer', 'distinct'],
            'tag_ids'        => ['sometimes', 'nullable', 'array', 'max:20'],
            'tag_ids.*'      => ['integer', 'distinct'],

            // ဒီ route ကနေ မပြောင်းရတဲ့ field များ (group / position က Step 8 ရဲ့ move နဲ့ပဲ)
            'code'          => ['prohibited'],
            'sequence'      => ['prohibited'],
            'project_id'    => ['prohibited'],
            'created_by'    => ['prohibited'],
            'group_id'      => ['prohibited'],
            'sort_position' => ['prohibited'],
            'completed_at'  => ['prohibited'],
            'archived_at'   => ['prohibited'],
            'archived_by'   => ['prohibited'],
        ];
    }
}