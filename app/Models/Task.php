<?php

namespace App\Models;

use App\Enums\TaskPriority;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use LogicException;

class Task extends Model
{
    protected $fillable = [
        'project_id', 'sequence', 'code', 'title', 'description', 'priority',
        'start_date', 'end_date', 'group_id', 'sort_position', 'completed_at',
        'created_by', 'archived_at', 'archived_by',
    ];

    protected function casts(): array
    {
        return [
            'priority'     => TaskPriority::class,
            'start_date'   => 'date:Y-m-d',
            'end_date'     => 'date:Y-m-d',
            'completed_at' => 'datetime',
            'archived_at'  => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Reference၊ project၊ creator က immutable
        static::updating(function (Task $task) {
            foreach (['code', 'sequence', 'project_id', 'created_by'] as $field) {
                if ($task->isDirty($field)) {
                    throw new LogicException("Task {$field} is immutable.");
                }
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(TaskGroup::class, 'group_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'task_assignees')->withPivot(['assigned_at', 'assigned_by']);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'task_tag');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(TaskActivity::class)->orderBy('id');
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function scopeNotArchived(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }
}