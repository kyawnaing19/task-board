<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskActivity extends Model
{
    public const CREATED = 'created';
    public const UPDATED = 'updated';
    public const ASSIGNEES_CHANGED = 'assignees_changed';
    public const TAGS_CHANGED = 'tags_changed';
    public const MOVED = 'moved';
    public const REORDERED = 'reordered';
    public const ARCHIVED = 'archived';
    public const RESTORED = 'restored';


    public $timestamps = false;

    protected $fillable = ['task_id', 'actor_id', 'type', 'payload', 'created_at'];

    protected function casts(): array
    {
        return [
            'payload'    => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}