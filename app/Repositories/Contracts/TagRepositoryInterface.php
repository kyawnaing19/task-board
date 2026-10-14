<?php

namespace App\Repositories\Contracts;

use App\Models\Tag;
use Illuminate\Support\Collection;

interface TagRepositoryInterface
{
    public function list(bool $archived = false): Collection;

    /** Tag row အားလုံးကို lock လုပ်ပြီး ယူမယ် (နာမည်ထပ်တာကို serialize လုပ်ဖို့) */
    public function lockAll(): Collection;

    public function activeNameExists(string $name, ?int $ignoreId = null): bool;

    public function create(array $data): Tag;

    public function update(Tag $tag, array $data): Tag;

    /** @return Collection<int, Tag> id နဲ့ keyed */
    public function findMany(array $ids): Collection;

    /** @return array<int, int> tag id => ချိတ်ထားတဲ့ task အရေအတွက် */
    public function usageCounts(array $ids): array;
}