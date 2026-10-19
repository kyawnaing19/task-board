<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;

class AcknowledgeAssignmentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        // Server ထုတ်ပေးတဲ့ toIso8601String ပုံစံအတိုင်း ပြန်ပို့ရမယ်
        return [
            'assignments_as_of' => ['required', 'string', 'date_format:Y-m-d\TH:i:sP'],
        ];
    }

    public function asOf(): Carbon
    {
        return Carbon::createFromFormat('Y-m-d\TH:i:sP', $this->validated('assignments_as_of'));
    }
}