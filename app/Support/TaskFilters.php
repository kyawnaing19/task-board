<?php

namespace App\Support;

final class TaskFilters
{
    /**
     * @param  string[]  $priority
     * @param  int[]  $tagIds
     * @param  int[]  $groupIds
     */
    public function __construct(
        public readonly ?string $q = null,
        public readonly string|int|null $assignee = null,   // 'me' | 'unassigned' | user id
        public readonly array $priority = [],
        public readonly array $tagIds = [],
        public readonly array $groupIds = [],
        public readonly ?string $dateFrom = null,
        public readonly ?string $dateTo = null,
        public readonly bool $mine=false
    ) {}

    public static function none(): self
    {
        return new self();
    }

    public static function fromArray(array $data): self
    {
        $q = isset($data['q']) ? trim((string) $data['q']) : '';
        $assignee = $data['assignee'] ?? null;

        if ($assignee !== null && $assignee !== '' && ctype_digit((string) $assignee)) {
            $assignee = (int) $assignee;
        } elseif (! in_array($assignee, ['me', 'unassigned'], true)) {
            $assignee = null;
        }

        return new self(
            q: $q !== '' ? $q : null,
            assignee: $assignee,
            priority: array_values(array_unique(array_map('strval', $data['priority'] ?? []))),
            tagIds: array_values(array_unique(array_map('intval', $data['tag_ids'] ?? []))),
            groupIds: array_values(array_unique(array_map('intval', $data['group_ids'] ?? []))),
            dateFrom: ($data['date_from'] ?? null) ?: null,
            dateTo: ($data['date_to'] ?? null) ?: null,
            mine: filter_var($data['mine'] ?? false, FILTER_VALIDATE_BOOLEAN),
        );
    }

    public function isActive(): bool
    {
        return $this->q !== null
            || $this->assignee !== null
            || $this->priority !== []
            || $this->tagIds !== []
            || $this->groupIds !== []
            || $this->dateFrom !== null
            || $this->dateTo !== null
            || $this->mine;
    }

    /** Response ထဲမှာ ပြန်ပြဖို့ */
    public function toArray(): array
    {
        return [
            'q'         => $this->q,
            'assignee'  => $this->assignee,
            'priority'  => $this->priority,
            'tag_ids'   => $this->tagIds,
            'group_ids' => $this->groupIds,
            'date_from' => $this->dateFrom,
            'date_to'   => $this->dateTo,
            'mine' => $this->mine,
        ];
    }
}