<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaskGroupEvent extends Model
{
    public const ARCHIVED = 'archived';
    public const INITIAL_CHANGED = 'initial_changed';
    public const COMPLETED_CHANGED = 'completed_changed';

    public $timestamps = false;

    protected $fillable = ['group_id', 'actor_id', 'type', 'payload', 'created_at'];

    protected function casts(): array
    {
        return [
            'payload'    => 'array',
            'created_at' => 'datetime',
        ];
    }
}