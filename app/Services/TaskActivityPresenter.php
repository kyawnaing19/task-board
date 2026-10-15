<?php

namespace App\Services;

use App\Models\TaskActivity;

class TaskActivityPresenter
{
    private const FIELD_LABELS = [
        'title'       => 'Title',
        'description' => 'Description',
        'priority'    => 'Priority',
        'start_date'  => 'Start date',
        'end_date'    => 'End date',
    ];

    public function present(TaskActivity $activity): array
    {
        $payload = $activity->payload ?? [];
        $details = [];

        $summary = match ($activity->type) {
            TaskActivity::CREATED            => $this->created($payload),
            TaskActivity::UPDATED            => $this->updated($payload, $details),
            TaskActivity::ASSIGNEES_CHANGED  => $this->assignees($payload),
            TaskActivity::TAGS_CHANGED       => $this->tags($payload),
            TaskActivity::MOVED              => $this->moved($payload),
            TaskActivity::REORDERED          => $this->reordered($payload),
            TaskActivity::ARCHIVED           => 'archived this task',
            TaskActivity::RESTORED           => $this->restored($payload),
            default                          => $activity->type,
        };

        return [
            'id'         => $activity->id,
            'type'       => $activity->type,
            'actor'      => $activity->actor ? [
                'id'         => $activity->actor->id,
                'name'       => $activity->actor->name,
                'avatar_url' => $activity->actor->avatar_url,
            ] : null,
            'summary'    => $summary,
            'details'    => $details,   // 'updated' မှာပဲ field တစ်ခုချင်း from/to ပါမယ်
            'created_at' => $activity->created_at,
        ];
    }

    protected function created(array $p): string
    {
        $group = $p['group']['name'] ?? null;
        $text = 'created this task'.($group ? ' in "'.$group.'"' : '');

        return ! empty($p['completed']) ? $text.' as completed' : $text;
    }

    protected function updated(array $p, array &$details): string
    {
        $labels = [];

        foreach ($p['changes'] ?? [] as $field => $change) {
            $label = self::FIELD_LABELS[$field] ?? $field;
            $labels[] = strtolower($label);
            $details[] = [
                'field' => $field,
                'label' => $label,
                'from'  => $change['from'] ?? null,
                'to'    => $change['to'] ?? null,
            ];
        }

        return $labels ? 'updated '.$this->humanList($labels) : 'updated this task';
    }

    protected function assignees(array $p): string
    {
        $parts = [];

        if ($added = $this->names($p['added'] ?? [])) {
            $parts[] = 'assigned '.implode(', ', $added);
        }

        if ($removed = $this->names($p['removed'] ?? [])) {
            $parts[] = 'unassigned '.implode(', ', $removed);
        }

        return $parts ? implode('; ', $parts) : 'changed assignees';
    }

    protected function tags(array $p): string
    {
        $parts = [];

        if ($added = $this->names($p['added'] ?? [])) {
            $parts[] = (count($added) === 1 ? 'added tag ' : 'added tags ').implode(', ', $added);
        }

        if ($removed = $this->names($p['removed'] ?? [])) {
            $parts[] = (count($removed) === 1 ? 'removed tag ' : 'removed tags ').implode(', ', $removed);
        }

        return $parts ? implode('; ', $parts) : 'changed tags';
    }

    protected function moved(array $p): string
    {
        $from = $p['from']['name'] ?? null;
        $to = $p['to']['name'] ?? 'another group';
        $text = $from ? 'moved from "'.$from.'" to "'.$to.'"' : 'moved to "'.$to.'"';

        return match ($p['completed'] ?? null) {
            'entered' => $text.' (marked completed)',
            'left'    => $text.' (completion cleared)',
            default   => $text,
        };
    }

    protected function reordered(array $p): string
    {
        $group = $p['group']['name'] ?? null;

        return $group ? 'reordered within "'.$group.'"' : 'reordered within its group';
    }protected function restored(array $p): string
    {
        $group = $p['group']['name'] ?? null;
        $text = 'restored this task'.($group ? ' to "'.$group.'"' : '');
        $notes = [];

        $completion = $p['completion']['completed_at'] ?? null;

        if ($completion === 'retained') {
            $notes[] = 'completion time kept';
        } elseif ($completion === 'cleared') {
            $notes[] = 'completion time cleared';
        }

        if (($p['placement'] ?? null) === 'end') {
            $notes[] = 'added to the end of the group';
        }

        return $notes ? $text.' ('.implode('; ', $notes).')' : $text;
    }

    /** @param  array<int, array{name: ?string}>  $items */
    protected function names(array $items): array
    {
        return array_map(fn ($item) => $item['name'] ?? 'a user', $items);
    }

    protected function humanList(array $items): string
    {
        if (count($items) <= 1) {
            return $items[0] ?? '';
        }

        $last = array_pop($items);

        return implode(', ', $items).' and '.$last;
    }
}