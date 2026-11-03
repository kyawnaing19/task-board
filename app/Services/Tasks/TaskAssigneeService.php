<?php

namespace App\Services\Tasks;

use App\Models\Project;
use App\Services\ProjectAccess;
use Illuminate\Validation\ValidationException;

class TaskAssigneeService
{
    public function __construct(private ProjectAccess $access) {}

    public function assertAssignees(Project $project, array $requested, array $current = []): array
    {
        $requested = array_values(array_unique(array_map('intval', $requested)));
        $newIds = array_diff($requested, array_map('intval', $current));

        if ($newIds && array_diff($newIds, $this->access->memberIds($project))) {
            throw ValidationException::withMessages([
                'assignee_ids' => 'Only active employees who are members of this project can be newly assigned.',
            ]);
        }

        return $requested;
    }

    /**
 * Title / description / priority / dates / assignees / tags ကို ပြင်မယ်။
 * Request ထဲမှာ ပါလာတဲ့ field ကိုပဲ ထိမယ်။ Group၊ position၊ completed_at ကို ဒီမှာ မပြောင်းဘူး။
 */
}
