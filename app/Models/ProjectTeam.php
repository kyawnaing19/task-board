<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectTeam extends Model
{
    protected $table = 'project_teams';

    public $timestamps = false;

    protected $fillable = [
        'project_id', 'team_id', 'added_at', 'added_by', 'removed_at', 'removed_by',
    ];

    protected function casts(): array
    {
        return [
            'added_at'   => 'datetime',
            'removed_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('removed_at');
    }
}