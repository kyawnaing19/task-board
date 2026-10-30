<?php

namespace App\Support;

final class ProjectListFilters
{
    public function __construct(
        public readonly ?string $type = null,
        public readonly ?int $teamId = null,
        public readonly ?int $employeeId = null,
    ) {}

    /** URL query ကနေ ယူတာမို့ တန်ဖိုးမှားရင် error မပေးဘဲ ဖယ်ထားမယ် */
    public static function fromArray(array $query): self
    {
        $type = is_string($query['type'] ?? null) ? trim($query['type']) : '';

        return new self(
            type: $type !== '' ? mb_substr($type, 0, 100) : null,
            teamId: self::positiveInt($query['team_id'] ?? null),
            employeeId: self::positiveInt($query['employee_id'] ?? null),
        );
    }

    public function isActive(): bool
    {
        return $this->type !== null || $this->teamId !== null || $this->employeeId !== null;
    }

    public function toArray(): array
    {
        return [
            'type'        => $this->type,
            'team_id'     => $this->teamId,
            'employee_id' => $this->employeeId,
        ];
    }

    private static function positiveInt(mixed $value): ?int
    {
        if (! is_scalar($value) || ! ctype_digit((string) $value) || (int) $value < 1) {
            return null;
        }

        return (int) $value;
    }
}