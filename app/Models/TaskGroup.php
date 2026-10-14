<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskGroup extends Model
{
    protected $fillable = [
        'name',
        'color',
        'sort_order',
        'is_initial',
        'is_completed',
        'archived_at',
        'archived_by',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }

    /**
     * Flag ကို DB ထဲမှာ true သို့မဟုတ် NULL ပဲ သိမ်းမယ်။
     * false ကို 0 အဖြစ် သိမ်းမိရင် unique index နဲ့ ထိပြီး ပြဿနာတက်လို့ NULL ပြောင်းပေးမယ်။
     */
    protected function isInitial(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => (bool) $value,
            set: fn ($value) => $value ? 1 : null,
        );
    }

    protected function isCompleted(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => (bool) $value,
            set: fn ($value) => $value ? 1 : null,
        );
    }

    public function archiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order')->orderBy('id');
    }
}