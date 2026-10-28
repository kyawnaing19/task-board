<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends StoreProjectRequest
{
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'team_ids'   => ['prohibited'],
            'member_ids' => ['prohibited'],
        ]);
    }   
}
