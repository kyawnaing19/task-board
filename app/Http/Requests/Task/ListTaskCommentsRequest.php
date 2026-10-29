<?php

namespace App\Http\Requests\Task;

use App\Services\TaskCommentService;
use Illuminate\Foundation\Http\FormRequest;

class ListTaskCommentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'before' => ['nullable', 'integer', 'min:1'],
            'limit'  => ['nullable', 'integer', 'min:1', 'max:'.TaskCommentService::MAX_LIMIT],
        ];
    }
}