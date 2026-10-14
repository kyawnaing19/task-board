<?php

namespace App\Http\Requests\Tag;

class UpdateTagRequest extends StoreTagRequest
{
    protected function ignoredTagId(): ?int
    {
        return $this->route('tag')?->id;
    }
}