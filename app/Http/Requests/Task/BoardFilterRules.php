<?php

namespace App\Http\Requests\Task;

use App\Enums\TaskPriority;
use Illuminate\Validation\Rule;

trait BoardFilterRules
{
    /** Board query string နဲ့ Move request ရဲ့ filters object နှစ်ခုလုံးအတွက် rule တူတူ */
    protected function filterRules(string $prefix = ''): array
    {
        $rules = [
            'q'           => ['nullable', 'string', 'max:100'],
            'assignee'    => ['nullable', 'regex:/^(me|unassigned|[0-9]+)$/'],
            'priority'    => ['nullable', 'array', 'max:4'],
            'priority.*'  => [Rule::enum(TaskPriority::class)],
            'tag_ids'     => ['nullable', 'array', 'max:20'],
            'tag_ids.*'   => ['integer', 'distinct'],
            'group_ids'   => ['nullable', 'array', 'max:50'],
            'group_ids.*' => ['integer', 'distinct'],
            'date_from'   => ['nullable', 'date_format:Y-m-d'],
            'date_to'     => ['nullable', 'date_format:Y-m-d'],
            'mine' => ['nullable', 'boolean'],

        ];

        if ($this->filled($prefix.'date_from')) {
            $rules['date_to'][] = 'after_or_equal:'.$prefix.'date_from';
        }

        $prefixed = [];

        foreach ($rules as $key => $rule) {
            $prefixed[$prefix.$key] = $rule;
        }

        return $prefixed;
    }
}