<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class TaskComment extends Model
{
    protected $fillable = ['task_id', 'author_id', 'body', 'edited_at', 'deleted_at', 'deleted_by'];

    protected function casts(): array
    {
        return [
            'edited_at'  => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Task နဲ့ author က immutable
        static::updating(function (TaskComment $comment) {
            foreach (['task_id', 'author_id'] as $field) {
                if ($comment->isDirty($field)) {
                    throw new LogicException("Comment {$field} is immutable.");
                }
            }
        });
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function isDeleted(): bool
    {
        return $this->deleted_at !== null;
    }
}