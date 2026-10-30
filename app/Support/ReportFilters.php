<?php

namespace App\Support;

final class ReportFilters
{
    public function __construct(
        public readonly ?int $teamId = null,
        public readonly ?int $employeeId = null,
        public readonly ?int $tagId = null,
        public readonly ?string $dateFrom = null,
        public readonly ?string $dateTo = null,
        public readonly string $sort = 'workload',
    ) {}

    /**
     * Create from request query array
     */
    public static function fromArray(array $query): self
    {
        return new self(
            teamId: self::positiveInt($query['team_id'] ?? null),
            employeeId: self::positiveInt($query['employee_id'] ?? null),
            tagId: self::positiveInt($query['tag_id'] ?? null),
            dateFrom: self::dateString($query['date_from'] ?? null),
            dateTo: self::dateString($query['date_to'] ?? null),
            sort: self::validSort($query['sort'] ?? 'workload'),
        );
    }

    public function isActive(): bool
    {
        return $this->teamId !== null
            || $this->employeeId !== null
            || $this->tagId !== null
            || $this->dateFrom !== null
            || $this->dateTo !== null;
    }

    public function toArray(): array
    {
        return [
            'team_id'     => $this->teamId,
            'employee_id' => $this->employeeId,
            'tag_id'      => $this->tagId,
            'date_from'   => $this->dateFrom,
            'date_to'     => $this->dateTo,
            'sort'        => $this->sort,
        ];
    }

    private static function positiveInt(mixed $value): ?int
    {
        if (
            ! is_scalar($value) ||
            ! ctype_digit((string) $value) ||
            (int) $value < 1
        ) {
            return null;
        }
        return (int) $value;
    }

    private static function dateString(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }
        $date = trim($value);
        // Validate Y-m-d format
        if (! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return null;
        }
        // Validate it's a real date
        $parsed = \DateTime::createFromFormat('Y-m-d', $date);
        return $parsed && $parsed->format('Y-m-d') === $date ? $date : null;
    }

    private static function validSort(mixed $value): string
    {
        $allowed = ['workload', 'name', 'overdue', 'due_soon'];
        $sort = is_string($value) ? $value : 'workload';
        return in_array($sort, $allowed, true) ? $sort : 'workload';
    }
}