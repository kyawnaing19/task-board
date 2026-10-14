<?php

namespace App\Repositories\Eloquent;

use App\Models\Tag;
use App\Repositories\Contracts\TagRepositoryInterface;
use Illuminate\Support\Collection;

class TagRepository implements TagRepositoryInterface
{
    public function list(bool $archived = false): Collection
    {
        return Tag::query()
            ->when($archived, fn ($q) => $q->archived()->latest('archived_at'), fn ($q) => $q->active()->ordered())
            ->get();
    }

    public function lockAll(): Collection
    {
        return Tag::query()->orderBy('id')->lockForUpdate()->get(['id']);
    }

    public function activeNameExists(string $name, ?int $ignoreId = null): bool
    {
        return Tag::query()
            ->active()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists();
    }

    public function create(array $data): Tag
    {
        return Tag::create($data);
    }

    public function update(Tag $tag, array $data): Tag
    {
        $tag->update($data);

        return $tag->refresh();
    }

    public function findMany(array $ids): Collection
    {
        return Tag::query()->whereIn('id', $ids)->get()->keyBy('id');
    }

    /**
     * TODO (Tasks module): task_tag pivot ကနေ tag တစ်ခုချင်းစီ ဘယ်နှစ် task ချိတ်ထားလဲ ရေတွက်မယ်။
     * Archived task နဲ့ Completed/Archived project ထဲက task ပါ ပါမယ်။
     */
    public function usageCounts(array $ids): array
    {
        return array_fill_keys($ids, 0);
    }
}