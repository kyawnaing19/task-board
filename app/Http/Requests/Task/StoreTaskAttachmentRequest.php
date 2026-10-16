<?php

namespace App\Http\Requests\Task;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'files' => [
                'required',
                'array',
                'min:1',
                'max:10',
            ],

            'files.*' => [
                'required',
                'file',
                'max:10240',
                'mimes:jpg,jpeg,png,webp,gif,pdf,doc,docx,xls,xlsx,txt,csv,zip',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Please select at least one file.',
            'files.max' => 'You can upload a maximum of 10 files per request.',
            'files.*.max' => 'Each file must not exceed 10 MB.',
            'files.*.mimes' => 'One or more files have an unsupported file format.',
        ];
    }
}