import React, { useState } from 'react';

import Avatar from '@/Components/Avatar';

/*
|--------------------------------------------------------------------------
| Priority Styles
|--------------------------------------------------------------------------
*/

const PRIORITY_STYLES = {
    LOW: 'bg-slate-100 text-slate-600 ring-slate-200',
    NORMAL: 'bg-sky-50 text-sky-700 ring-sky-200',
    HIGH: 'bg-amber-50 text-amber-700 ring-amber-200',
    URGENT: 'bg-rose-50 text-rose-700 ring-rose-200',
};

/*
|--------------------------------------------------------------------------
| Group Colors
|--------------------------------------------------------------------------
*/

const GROUP_PALETTES = [
    {
        match: ['todo', 'to do', 'backlog'],
        dot: 'bg-slate-400',
        badge: 'bg-slate-100 text-slate-700 ring-slate-200',
        soft: 'bg-slate-50',
        line: 'bg-slate-300',
    },
    {
        match: ['progress', 'doing', 'development'],
        dot: 'bg-blue-500',
        badge: 'bg-blue-50 text-blue-700 ring-blue-200',
        soft: 'bg-blue-50/60',
        line: 'bg-blue-400',
    },
    {
        match: ['review', 'qa', 'testing'],
        dot: 'bg-violet-500',
        badge: 'bg-violet-50 text-violet-700 ring-violet-200',
        soft: 'bg-violet-50/60',
        line: 'bg-violet-400',
    },
    {
        match: ['done', 'complete', 'completed'],
        dot: 'bg-emerald-500',
        badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        soft: 'bg-emerald-50/60',
        line: 'bg-emerald-400',
    },
];

const DEFAULT_GROUP_PALETTE = {
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    soft: 'bg-indigo-50/40',
    line: 'bg-indigo-400',
};

const EXTRA_GROUP_PALETTES = [
    {
        dot: 'bg-rose-500',
        badge: 'bg-rose-50 text-rose-700 ring-rose-200',
        soft: 'bg-rose-50/50',
        line: 'bg-rose-400',
    },
    {
        dot: 'bg-amber-500',
        badge: 'bg-amber-50 text-amber-700 ring-amber-200',
        soft: 'bg-amber-50/50',
        line: 'bg-amber-400',
    },
    {
        dot: 'bg-teal-500',
        badge: 'bg-teal-50 text-teal-700 ring-teal-200',
        soft: 'bg-teal-50/50',
        line: 'bg-teal-400',
    },
    {
        dot: 'bg-fuchsia-500',
        badge: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
        soft: 'bg-fuchsia-50/50',
        line: 'bg-fuchsia-400',
    },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeGroupName(name) {
    return String(name || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ');
}

function getTaskId(task) {
    return task?.id ?? task?.task_id;
}

function getTaskTitle(task) {
    return task?.title || task?.name || 'Untitled task';
}

function getProject(task) {
    return task?.project || {};
}

function getAssignees(task) {
    if (Array.isArray(task?.assignees)) {
        return task.assignees;
    }

    return task?.assignee ? [task.assignee] : [];
}

function getPriority(task) {
    return String(task?.priority || 'NORMAL').toUpperCase();
}

function getDueDate(task) {
    return task?.end_date || null;
}

/*
|--------------------------------------------------------------------------
| Dynamic Group Palette
|--------------------------------------------------------------------------
*/

function getGroupPalette(group, index = 0) {
    const rawName =
        typeof group === 'string'
            ? group
            : group?.name;

    const name = normalizeGroupName(rawName);

    const explicit = String(
        typeof group === 'object' && group
            ? group.color || group.color_key || ''
            : '',
    )
        .trim()
        .toLowerCase();

    const explicitPalettes = {
        slate: GROUP_PALETTES[0],
        gray: GROUP_PALETTES[0],
        grey: GROUP_PALETTES[0],

        blue: GROUP_PALETTES[1],

        violet: GROUP_PALETTES[2],
        purple: GROUP_PALETTES[2],

        green: GROUP_PALETTES[3],
        emerald: GROUP_PALETTES[3],

        rose: EXTRA_GROUP_PALETTES[0],
        amber: EXTRA_GROUP_PALETTES[1],
        teal: EXTRA_GROUP_PALETTES[2],
        fuchsia: EXTRA_GROUP_PALETTES[3],

        indigo: DEFAULT_GROUP_PALETTE,
    };

    // Prefer the explicitly configured database color.
    if (explicitPalettes[explicit]) {
        return explicitPalettes[explicit];
    }

    // Otherwise, match the group name.
    const matchedPalette = GROUP_PALETTES.find((palette) =>
        palette.match.some((keyword) => name.includes(keyword)),
    );

    if (matchedPalette) {
        return matchedPalette;
    }

    // Give custom group names a consistent fallback color.
    const palettes = [
        DEFAULT_GROUP_PALETTE,
        ...EXTRA_GROUP_PALETTES,
    ];

    let hash = 0;

    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 31 + name.charCodeAt(i)) | 0;
    }

    const paletteIndex = name
        ? Math.abs(hash) % palettes.length
        : Math.abs(index) % palettes.length;

    return palettes[paletteIndex] || DEFAULT_GROUP_PALETTE;
}

/*
|--------------------------------------------------------------------------
| Date Helpers
|--------------------------------------------------------------------------
*/

function parseCalendarDate(value) {
    if (!value) {
        return null;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

    const date = match
        ? new Date(
              Number(match[1]),
              Number(match[2]) - 1,
              Number(match[3]),
          )
        : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function getDueDateLabel(value) {
    if (!value) {
        return 'No due date';
    }

    const dueDate = parseCalendarDate(value);

    if (!dueDate) {
        return '—';
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const days = Math.round(
        (dueDate.getTime() - today.getTime()) / 86400000,
    );

    if (days === 0) {
        return 'Today';
    }

    if (days === 1) {
        return 'Tomorrow';
    }

    if (days === -1) {
        return 'Yesterday';
    }

    if (days < 0) {
        return `${Math.abs(days)} days ago`;
    }

    if (days < 7) {
        return `In ${days} days`;
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year:
            dueDate.getFullYear() !== today.getFullYear()
                ? 'numeric'
                : undefined,
    }).format(dueDate);
}

function isOverdue(task) {
    const value = getDueDate(task);

    if (
        !value ||
        task?.completed_at ||
        task?.status === 'COMPLETED'
    ) {
        return false;
    }

    const dueDate = parseCalendarDate(value);

    if (!dueDate) {
        return false;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
}

/*
|--------------------------------------------------------------------------
| Priority Badge
|--------------------------------------------------------------------------
*/

function PriorityBadge({ priority }) {
    const value = String(priority || 'NORMAL').toUpperCase();

    const label =
        value === 'NORMAL'
            ? 'Normal'
            : value.charAt(0) + value.slice(1).toLowerCase();

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${
                PRIORITY_STYLES[value] || PRIORITY_STYLES.NORMAL
            }`}
        >
            <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 17V3m0 1h10l-2 3 2 3H4"
                />
            </svg>

            <span>{label}</span>
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Due Date
|--------------------------------------------------------------------------
*/

function DueDate({ task }) {
    const value = getDueDate(task);
    const overdue = isOverdue(task);

    return (
        <span
            title={value || 'No due date'}
            className={`inline-flex max-w-full items-center whitespace-nowrap text-xs ${
                overdue
                    ? 'font-semibold text-rose-600'
                    : value
                      ? 'font-medium text-slate-600'
                      : 'font-normal text-slate-400'
            }`}
        >
            {overdue && (
                <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="mr-1.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                >
                    <circle cx="10" cy="10" r="7" />
                    <path
                        strokeLinecap="round"
                        d="M10 6v4l2.5 1.5"
                    />
                </svg>
            )}

            {getDueDateLabel(value)}
        </span>
    );
}

/*
|--------------------------------------------------------------------------
| Assignee Avatars
|--------------------------------------------------------------------------
*/

function AssigneeStack({ assignees }) {
    if (!assignees.length) {
        return (
            <span className="text-xs text-slate-400">
                Unassigned
            </span>
        );
    }

    return (
        <div className="flex items-center -space-x-2">
            {assignees.slice(0, 3).map((assignee, index) => (
                <span
                    key={assignee.id ?? assignee.name ?? index}
                    title={assignee.name || 'Assignee'}
                    className="rounded-full ring-2 ring-white transition-transform hover:z-10 hover:-translate-y-0.5"
                >
                    <Avatar
                        name={assignee.name || '?'}
                        src={assignee.avatar_url}
                        className="h-7 w-7 text-[10px]"
                    />
                </span>
            ))}

            {assignees.length > 3 && (
                <span
                    title={`${assignees.length - 3} more assignees`}
                    className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600 ring-2 ring-white"
                >
                    +{assignees.length - 3}
                </span>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Task Row
|--------------------------------------------------------------------------
*/

function TaskRow({
    task,
    onOpen,
    onRestore,
    restoring,
}) {
    const project = getProject(task);
    const assignees = getAssignees(task);

    const archived = Boolean(task?.archived_at);

    const canRestore =
        archived &&
        Boolean(task?.can_restore) &&
        !task?.restore_blocked_reason;

    return (
        <div className="group relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-slate-100/90 px-3 py-3 transition-colors last:border-b-0 hover:bg-slate-50/60 sm:grid-cols-[minmax(0,1fr)_120px_115px_130px] sm:gap-4 sm:px-4">
            {/* Task title and metadata */}
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={() => onOpen?.(task)}
                    title={`Open ${getTaskTitle(task)}`}
                    aria-label={`Open task ${getTaskTitle(task)}`}
                    className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-indigo-500 bg-white text-transparent transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                    <span className="h-2 w-2 rounded-full bg-indigo-600" />
                </button>

                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <button
                        type="button"
                        onClick={() => onOpen?.(task)}
                        title={getTaskTitle(task)}
                        className="max-w-full truncate text-left text-[13px] font-medium text-slate-800 transition hover:text-indigo-700 focus:outline-none focus:text-indigo-700"
                    >
                        {getTaskTitle(task)}
                    </button>

                    {task?.code && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                            {task.code}
                        </span>
                    )}

                    {project?.name && (
                        <span
                            title={project.name}
                            className="max-w-full truncate text-[11px] text-slate-400"
                        >
                            {project?.code
                                ? `${project.code} · `
                                : ''}
                            {project.name}
                        </span>
                    )}

                    {archived && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            Archived
                        </span>
                    )}

                    {/* Mobile details */}
                    <div className="mt-1 flex w-full flex-wrap items-center gap-3 sm:hidden">
                        <AssigneeStack assignees={assignees} />

                        <PriorityBadge
                            priority={getPriority(task)}
                        />
                    </div>

                    {/* Restore action */}
                    {archived && (
                        <div className="w-full pt-1 sm:hidden">
                            {canRestore ? (
                                <button
                                    type="button"
                                    disabled={restoring}
                                    onClick={() => onRestore?.(task)}
                                    className="text-xs font-medium text-indigo-600 transition hover:text-indigo-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {restoring
                                        ? 'Restoring…'
                                        : 'Restore task'}
                                </button>
                            ) : (
                                <span
                                    title={
                                        task?.restore_blocked_reason ||
                                        'This task cannot be restored.'
                                    }
                                    className="text-xs text-slate-400"
                                >
                                    Restore unavailable
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Assignees */}
            <div className="hidden sm:flex sm:items-center">
                <AssigneeStack assignees={assignees} />
            </div>

            {/* Priority */}
            <div className="hidden sm:flex sm:items-center">
                <PriorityBadge
                    priority={getPriority(task)}
                />
            </div>

            {/* Due date and desktop restore */}
            <div className="flex min-w-0 flex-col items-end gap-2 sm:items-start">
                <DueDate task={task} />

                {archived && (
                    <div className="hidden sm:block">
                        {canRestore ? (
                            <button
                                type="button"
                                disabled={restoring}
                                onClick={() => onRestore?.(task)}
                                className="text-xs font-medium text-indigo-600 transition hover:text-indigo-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {restoring
                                    ? 'Restoring…'
                                    : 'Restore'}
                            </button>
                        ) : (
                            <span
                                title={
                                    task?.restore_blocked_reason ||
                                    'This task cannot be restored.'
                                }
                                className="text-[11px] text-slate-400"
                            >
                                Restore unavailable
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Task Group Section
|--------------------------------------------------------------------------
*/

export default function TaskGroupSection({
    group,
    tasks = [],
    onOpen,
    onRestore,
    restoringId,
}) {
    const [collapsed, setCollapsed] = useState(false);

    const groupName = group?.name || 'No group';

    const palette = getGroupPalette(group);

    return (
        <section className="mb-6 bg-white">
            {/* Group Header */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-1 py-3">
                <button
                    type="button"
                    onClick={() =>
                        setCollapsed((value) => !value)
                    }
                    aria-expanded={!collapsed}
                    aria-label={`${
                        collapsed ? 'Expand' : 'Collapse'
                    } ${groupName}`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                    <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-4 w-4 transition-transform duration-200 ${
                            collapsed ? '-rotate-90' : ''
                        }`}
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.09 1.03l-4.25 4.5a.75.75 0 01-1.09 0l-4.25-4.5a.75.75 0 01.02-1.05z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>

                {/* Dynamic group badge */}
                <span
                    className={`inline-flex min-w-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${palette.badge}`}
                >
                    <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${palette.dot}`}
                    />

                    <span className="truncate">
                        {groupName}
                    </span>
                </span>

                {/* Task count */}
                <span className="ml-1 text-xs font-semibold text-slate-400">
                    {tasks.length}
                </span>

                {/* Dropdown status */}
                <span className="ml-auto text-[11px] text-slate-400">
                    {collapsed
                        ? 'Expand'
                        : `${tasks.length} ${
                              tasks.length === 1
                                  ? 'task'
                                  : 'tasks'
                          }`}
                </span>
            </div>

            {/* Collapsible Content */}
            {!collapsed && (
                <div className="border-b border-slate-200">
                    {/* Table Header */}
                    <div className="hidden grid-cols-[minmax(0,1fr)_120px_115px_130px] items-center gap-4 border-b border-slate-100 px-4 py-2.5 text-[11px] font-medium text-slate-400 sm:grid">
                        <span>Name</span>

                        <span>Assignees</span>

                        <span>Priority</span>

                        <span className="flex items-center gap-1">
                            Due date

                            <svg
                                className="h-3 w-3 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                />
                            </svg>
                        </span>
                    </div>

                    {/* Task Rows */}
                    {tasks.length > 0 ? (
                        tasks.map((task) => (
                            <TaskRow
                                key={getTaskId(task)}
                                task={task}
                                onOpen={onOpen}
                                onRestore={onRestore}
                                restoring={
                                    restoringId ===
                                    getTaskId(task)
                                }
                            />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                            <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
                                    />
                                </svg>
                            </span>

                            <p className="text-xs font-medium text-slate-500">
                                No tasks in this group
                            </p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}