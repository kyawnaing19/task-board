<?php

namespace App\Http\Requests\Task;

use App\Services\TaskCommentService;
use Illuminate\Foundation\Http\FormRequest;

class StoreTaskCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $body = $this->input('body');

        if (is_string($body)) {
            // စာလုံးရေ တိုင်းတာတာ မှန်အောင် line ending ကို တူအောင်လုပ်မယ်
            $this->merge(['body' => trim(str_replace(["\r\n", "\r"], "\n", $body))]);
        }
    }

    public function rules(): array
    {
        // Plain text ပဲ၊ HTML ကို render မလုပ်ဘူး
        return [
            'body' => ['required', 'string', 'max:'.TaskCommentService::MAX_BODY],
        ];
    }
}