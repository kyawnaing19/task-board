<?php

namespace App\Http\Requests\TaskGroup;

use App\Enums\GroupColor;
use App\Rules\UniqueActiveGroupName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => preg_replace('/\s+/u', ' ', trim((string) $this->input('name'))),
        ]);
    }

    protected function ignoredGroupId(): ?int
    {
        return null;
    }

    public function rules(): array
    {
        return [
            'name'  => ['required', 'string', 'max:50', new UniqueActiveGroupName($this->ignoredGroupId())],
            'color' => ['required', Rule::enum(GroupColor::class)],

            // Flag တွေကို form ကနေ တိုက်ရိုက်ပြောင်းလို့မရဘူး (Step 3 ရဲ့ သီးသန့် action နှစ်ခုသာ)
            'is_initial'   => ['prohibited'],
            'is_completed' => ['prohibited'],
            'sort_order'   => ['prohibited'],
        ];
    }
}