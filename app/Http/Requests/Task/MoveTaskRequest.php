<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class MoveTaskRequest extends FormRequest
{
    use BoardFilterRules;

    public function authorize(): bool
    {
        // Ownership စစ်တာကို TaskService (TaskAuthorization) မှာ လုပ်တယ်
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return array_merge([
            'group_id'       => ['required', 'integer'],
            // မပါရင် destination ရဲ့ အဆုံးမှာ append လုပ်မယ်
            'before_task_id' => ['nullable', 'integer'],

            // Client မှာ လက်ရှိ သုံးနေတဲ့ filter။ ရွှေ့ပြီးနောက် task က filter နဲ့ ကိုက်သေးလား server က ပြန်ပြောပေးမယ်
            'filters'        => ['nullable', 'array'],

            'position'      => ['prohibited'],
            'sort_position' => ['prohibited'],
            'completed_at'  => ['prohibited'],
        ], $this->filterRules('filters.'));
    }
}