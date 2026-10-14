<?php

namespace App\Rules;

use App\Models\Tag;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueActiveTagName implements ValidationRule
{
    public function __construct(protected ?int $ignoreId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $exists = Tag::query()
            ->active()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower((string) $value)])
            ->when($this->ignoreId, fn ($q) => $q->where('id', '!=', $this->ignoreId))
            ->exists();

        if ($exists) {
            $fail('An active tag with this name already exists.');
        }
    }
}