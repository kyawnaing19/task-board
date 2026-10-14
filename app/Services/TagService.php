<?php

namespace App\Services;

use App\Models\Tag;
use App\Models\User;
use App\Repositories\Contracts\TagRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TagService
{
    public function __construct(
        protected TagRepositoryInterface $tags
    ) {}

    public function create(User $actor, array $data): Tag
    {
        return DB::transaction(function () use ($actor, $data) {
            $this->tags->lockAll();

            $this->assertNameAvailable($data['name']);

            return $this->tags->create([
                'name'       => $data['name'],
                'color'      => $data['color'],
                'created_by' => $actor->id,
            ]);
        });
    }

    /** နာမည်နဲ့ အရောင်ပဲ ပြင်လို့ရမယ်။ Archived tag ကို မပြင်ရ။ */
    public function update(Tag $tag, array $data): Tag
    {
        return DB::transaction(function () use ($tag, $data) {
            $this->tags->lockAll();

            $fresh = $tag->fresh();

            if ($fresh->isArchived()) {
                throw ValidationException::withMessages([
                    'tag' => 'Archived tags cannot be edited. Restore the tag first.',
                ]);
            }

            $this->assertNameAvailable($data['name'], $fresh->id);

            return $this->tags->update($fresh, [
                'name'  => $data['name'],
                'color' => $data['color'],
            ]);
        });
    }

    /**
     * Archive လုပ်ရင် Task နဲ့ ချိတ်ဆက်မှု၊ history ကို မထိဘူး။ Replacement မလိုဘူး။
     */
    public function archive(User $actor, Tag $tag): Tag
    {
        return DB::transaction(function () use ($actor, $tag) {
            $this->tags->lockAll();

            $fresh = $tag->fresh();

            if ($fresh->isArchived()) {
                throw ValidationException::withMessages(['tag' => 'This tag is already archived.']);
            }

            return $this->tags->update($fresh, [
                'archived_at' => now(),
                'archived_by' => $actor->id,
            ]);
        });
    }

    /** နာမည်တူနေရင် Rename & Restore (အသစ်ပေးမှ) လုပ်ရမယ်။ */
    public function restore(Tag $tag, ?string $newName = null): Tag
    {
        return DB::transaction(function () use ($tag, $newName) {
            $this->tags->lockAll();

            $fresh = $tag->fresh();

            if (! $fresh->isArchived()) {
                throw ValidationException::withMessages(['tag' => 'This tag is not archived.']);
            }

            $name = $newName ?: $fresh->name;

            if ($this->tags->activeNameExists($name)) {
                throw ValidationException::withMessages([
                    'name' => $newName
                        ? 'An active tag with this name already exists.'
                        : "An active tag named \"{$name}\" already exists. Choose a new name to restore this tag.",
                ]);
            }

            return $this->tags->update($fresh, [
                'name'        => $name,
                'archived_at' => null,
                'archived_by' => null,
            ]);
        });
    }

    /**
     * Task create/update မှာ Step 6 က ခေါ်မယ့် စစ်ဆေးချက်။
     *
     * $requested = form က ပို့လာတဲ့ tag id အားလုံး (ရှိပြီးသား Archived tag ပါ ပါနိုင်တယ်)
     * $current   = Task မှာ အခု ချိတ်ထားပြီးသား tag id များ (Task အသစ်ဆိုရင် [])
     *
     * - အသစ်ထပ်ထည့်တဲ့ tag က Active ဖြစ်ရမယ်။ Archived သို့မဟုတ် မရှိတာဆိုရင် ပယ်မယ်။
     * - $current ထဲမှာ ရှိပြီးသား Archived tag ကို $requested မှာ ပါနေရင် ဆက်ထားမယ်။
     * - $requested မှာ မပါတော့တဲ့ Archived tag က explicit removal လို့ ယူမယ် (ဒီမှာ ဘာမှ မစစ်ဘူး)။
     *
     * @param  int[]  $requested
     * @param  int[]  $current
     * @return int[] စစ်ပြီးသား tag id များ (ထပ်တာဖယ်ပြီး)
     */
    public function assertAssignable(array $requested, array $current = []): array
    {
        $requested = array_values(array_unique(array_map('intval', $requested)));
        $newIds = array_values(array_diff($requested, array_map('intval', $current)));
        if (! $newIds) {
            return $requested;
        }

        $found = $this->tags->findMany($newIds);

        if ($found->count() !== count($newIds)) {
            throw ValidationException::withMessages(['tag_ids' => 'One or more selected tags do not exist.']);
        }

        $archived = $found->filter(fn (Tag $t) => $t->isArchived());

        if ($archived->isNotEmpty()) {
            throw ValidationException::withMessages([
                'tag_ids' => 'Archived tags cannot be newly selected: '.$archived->pluck('name')->implode(', ').'.',
            ]);
        }

        return $requested;
    }

    protected function assertNameAvailable(string $name, ?int $ignoreId = null): void
    {
        if ($this->tags->activeNameExists($name, $ignoreId)) {
            throw ValidationException::withMessages([
                'name' => 'An active tag with this name already exists.',
            ]);
        }
    }
}