<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

class Project extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'start_date',
        'due_date',
        'status',
        'created_by',
        'archived_at',
        'archived_by',
    ];

    protected function casts(): array
    {
        return [
            
            'start_date'  => 'date:Y-m-d',
            'due_date'    => 'date:Y-m-d',
            'archived_at' => 'datetime',
            'status'      => ProjectStatus::class,
        ];
    }

    protected static function booted(): void
    {
        // Project code က immutable
        static::updating(function (Project $project) {
            if ($project->isDirty('code')) {
                throw new LogicException('Project code is immutable.');
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function archiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function teamLinks(): HasMany
    {
        return $this->hasMany(ProjectTeam::class);
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function isActive(): bool
    {
        return $this->status === ProjectStatus::ACTIVE;
    }

    public function isCompleted(): bool
    {
        return $this->status === ProjectStatus::COMPLETED;
    }

    
    public function scopeNotArchived(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    
    public function isReadOnly(): bool
    {
        return $this->isArchived() || $this->isCompleted();
    }
}