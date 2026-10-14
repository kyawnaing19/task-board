<?php

namespace App\Http\Requests\TaskGroup;

class UpdateTaskGroupRequest extends StoreTaskGroupRequest
{
    protected function ignoredGroupId(): ?int
    {
        return $this->route('taskGroup')?->id;
    }
}