<?php

namespace App\Http\Requests\Team;

use App\Rules\UniqueTeamName;

class UpdateTeamRequest extends StoreTeamRequest
{
    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255', new UniqueTeamName($this->route('team')->id)],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}