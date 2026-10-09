<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamMembership extends Model
{
    protected $table = 'team_members';

    public $timestamps = false;

    protected $fillable = [
        'team_id', 'user_id', 'added_at', 'added_by', 'removed_at', 'removed_by',
    ];

    protected function casts(): array
    {
        return [
            'added_at'   => 'datetime',
            'removed_at' => 'datetime',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('removed_at');
    }

    public function scopeActiveAccount(Builder $query): Builder
    {
        return $query->whereHas('user', fn ($u) => $u->where('status', 'ACTIVE'));
    }
}