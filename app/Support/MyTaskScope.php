<?php

namespace App\Support;

final class MyTaskScope
{
    public const MODES = ['assigned', 'created', 'both'];

    public function __construct(
        public readonly string $mode = 'assigned',
        public readonly bool $archivedTasks = false,
        public readonly bool $archivedProjects = false,
        public readonly ?int $projectId = null,
    ) {}

    public static function fromArray(array $data): self
    {
        $mode = $data['mode'] ?? null;

        return new self(
            mode: in_array($mode, self::MODES, true) ? $mode : 'assigned',
            archivedTasks: filter_var($data['archived_tasks'] ?? false, FILTER_VALIDATE_BOOLEAN),
            archivedProjects: filter_var($data['archived_projects'] ?? false, FILTER_VALIDATE_BOOLEAN),
            projectId: isset($data['project_id']) && $data['project_id'] !== '' ? (int) $data['project_id'] : null,
        );
    }

    public function toArray(): array
    {
        return [
            'mode'              => $this->mode,
            'archived_tasks'    => $this->archivedTasks,
            'archived_projects' => $this->archivedProjects,
            'project_id'        => $this->projectId,
        ];
    }
}