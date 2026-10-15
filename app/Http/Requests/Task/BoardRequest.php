<?php

namespace App\Http\Requests\Task;

use App\Services\TaskBoard;
use App\Support\TaskFilters;
use Illuminate\Foundation\Http\FormRequest;

class BoardRequest extends FormRequest
{
    use BoardFilterRules;

    public function authorize(): bool
    {
        // Project access ကို TaskBoard service မှာ စစ်ဆေးမယ်။
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return array_merge($this->filterRules(), [
            'limit' => [
                'nullable',
                'integer',
                'min:1',
                'max:' . TaskBoard::MAX_LIMIT,
            ],
            'after' => ['nullable', 'integer', 'min:0'],
        ]);
    }

    public function filters(): TaskFilters
    {
        return TaskFilters::fromArray($this->validated());
    }

    public function limit(): int
    {
        return (int) (
            $this->validated('limit')
            ?? TaskBoard::DEFAULT_LIMIT
        );
    }

    public function afterCursor(): ?int
    {
        $after = $this->validated('after');

        return $after === null ? null : (int) $after;
    }
}