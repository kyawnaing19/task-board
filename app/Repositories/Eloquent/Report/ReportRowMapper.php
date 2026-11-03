<?php

namespace App\Repositories\Eloquent\Report;

class ReportRowMapper
{
    public static function projects(?string $projectIds, ?string $projectCodes, ?string $projectNames): array
    {
        $ids = $projectIds ? explode(',', $projectIds) : [];
        $codes = $projectCodes ? explode(',', $projectCodes) : [];
        $names = $projectNames ? explode(',', $projectNames) : [];
        $projects = [];

        foreach ($ids as $index => $id) {
            $projects[] = [
                'id' => (int) $id,
                'code' => $codes[$index] ?? '',
                'name' => $names[$index] ?? '',
            ];
        }

        return $projects;
    }

    public static function assignees(?string $assigneeIds, ?string $assigneeNames): array
    {
        $ids = $assigneeIds ? explode(',', $assigneeIds) : [];
        $names = $assigneeNames ? explode(',', $assigneeNames) : [];
        $assignees = [];

        foreach ($ids as $index => $id) {
            if ($id) {
                $assignees[] = [
                    'id' => (int) $id,
                    'name' => $names[$index] ?? '',
                ];
            }
        }

        return $assignees;
    }
}
