import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { Head, usePage } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TaskDrawer from '@/Components/Board/TaskDrawer';
import GroupedTaskList from './Partials/GroupedTaskList';
import TaskOwnershipBar from './Partials/TaskOwnershipBar';
import TaskFilters from './Partials/TaskFilters';

import {
    errorMessage,
    getJson,
    patchJson,
    postJson,
} from '@/lib/http';

import { colorOf } from '@/lib/groupColors';

const DEFAULT_PER_PAGE = 25;

const PRIORITY_STYLES = {
    LOW: 'bg-slate-100 text-slate-600 ring-slate-200',
    NORMAL: 'bg-blue-50 text-blue-700 ring-blue-200',
    HIGH: 'bg-amber-50 text-amber-700 ring-amber-200',
    URGENT: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const PRIORITY_LABELS = {
    LOW: 'Low',
    NORMAL: 'Normal',
    HIGH: 'High',
    URGENT: 'Urgent',
};

const PRIORITY_VALUES = Object.keys(PRIORITY_LABELS);

const MODES = ['assigned', 'created', 'both'];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

function getErrorMessage(error, fallback = 'Something went wrong.') {
    return errorMessage?.(error) || error?.message || fallback;
}

function formatDate(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}

function formatDateTime(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
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

function getGroup(task) {
    return task?.group || task?.task_group || {};
}

function getAssignees(task) {
    if (Array.isArray(task?.assignees)) {
        return task.assignees;
    }

    if (task?.assignee) {
        return [task.assignee];
    }

    return [];
}

function isTaskArchived(task) {
    return Boolean(task?.archived_at);
}

function isProjectArchived(task) {
    const project = getProject(task);

    return Boolean(
        project.archived ||
        project.archived_at
    );
}

function isProjectCompleted(task) {
    return getProject(task)?.status === 'COMPLETED';
}

function getReadOnlyReason(task) {
    if (task?.read_only_reason) {
        return task.read_only_reason;
    }

    if (isProjectArchived(task)) {
        return 'This project is archived, so the task is read-only.';
    }

    if (isProjectCompleted(task)) {
        return 'This project is completed, so the task is read-only.';
    }

    if (isTaskArchived(task)) {
        return 'This task is archived and read-only.';
    }

    return null;
}

function getPriority(task) {
    const priority = String(
        task?.priority || 'NORMAL',
    ).toUpperCase();

    return {
        value: priority,
        label: PRIORITY_LABELS[priority] || priority,
        className:
            PRIORITY_STYLES[priority] ||
            'bg-slate-100 text-slate-600 ring-slate-200',
    };
}

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

function PriorityBadge({ priority }) {
    const item = getPriority({ priority });

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset',
                item.className,
            )}
        >
            {item.label}
        </span>
    );
}

function GroupBadge({ group }) {
    if (!group?.name) {
        return (
            <span className="text-sm text-slate-400">
                No group
            </span>
        );
    }

    const groupColor = colorOf(group.color);

    return (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
            <span
                className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    groupColor.swatch,
                )}
                aria-hidden="true"
            />

            <span className="truncate">
                {group.name}
            </span>
        </span>
    );
}

function OwnershipBadges({ task, mode }) {
    if (
        mode !== 'both' ||
        (!task.is_creator && !task.is_assignee)
    ) {
        return null;
    }

    return (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {task.is_creator && (
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600">
                    Created by you
                </span>
            )}

            {task.is_assignee && (
                <span className="inline-flex items-center rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                    Assigned to you
                </span>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState({
    archivedTasks,
    archivedProjects,
    hasFilters,
    onReset,
}) {
    let title = 'No tasks found';

    let description =
        'Tasks matching your selection will appear here.';

    if (archivedTasks && archivedProjects) {
        title = 'No archived tasks in archived projects';

        description =
            'There are no matching archived tasks in archived projects.';
    } else if (archivedTasks) {
        title = 'No archived tasks';

        description =
            'Archived tasks matching your selection will appear here.';
    } else if (archivedProjects) {
        title = 'No tasks in archived projects';

        description =
            'There are no matching tasks in archived projects.';
    }

    return (
        <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-6 w-6"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                    />
                </svg>
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-800">
                {title}
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {description}
            </p>

            {hasFilters && (
                <button
                    type="button"
                    onClick={onReset}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Task row                                                                   */
/* -------------------------------------------------------------------------- */

function TaskRow({
    task,
    mode,
    onOpen,
    onRestore,
    restoring,
}) {
    const project = getProject(task);
    const group = getGroup(task);
    const assignees = getAssignees(task);

    const archived = isTaskArchived(task);
    const readOnlyReason = getReadOnlyReason(task);

    const restoreBlockedReason =
        task?.restore_blocked_reason ||
        (readOnlyReason && !archived
            ? readOnlyReason
            : null);

    const canRestore =
        archived &&
        Boolean(task?.can_restore) &&
        !restoreBlockedReason;

    const tags = Array.isArray(task?.tags)
        ? task.tags
        : [];

    return (
        <div
            className={cn(
                'group grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-slate-50/80 sm:px-5 lg:grid-cols-[minmax(0,2fr)_minmax(150px,1fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_minmax(120px,0.7fr)_auto] lg:items-center',
                archived && 'bg-slate-50/50',
            )}
        >
            {/* Task title and project */}

            <div className="min-w-0">
                <div className="flex min-w-0 items-start gap-3">
                    <button
                        type="button"
                        onClick={() => onOpen(task)}
                        className="min-w-0 flex-1 text-left"
                    >
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {task.code && (
                                <span className="font-mono text-xs font-medium text-slate-400">
                                    {task.code}
                                </span>
                            )}

                            {archived && (
                                <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                    Archived
                                </span>
                            )}
                        </span>

                        <span className="mt-1 block break-words text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                            {getTaskTitle(task)}
                        </span>
                    </button>

                    {archived && (
                        <div className="shrink-0">
                            {canRestore ? (
                                <button
                                    type="button"
                                    disabled={restoring}
                                    onClick={() => onRestore(task)}
                                    className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {restoring
                                        ? 'Restoring…'
                                        : 'Restore'}
                                </button>
                            ) : (
                                <span
                                    title={
                                        restoreBlockedReason ||
                                        'This task cannot be restored.'
                                    }
                                    className="cursor-help rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-400"
                                >
                                    Restore
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    {project.code && (
                        <span className="font-mono font-medium text-slate-500">
                            {project.code}
                        </span>
                    )}

                    <span className="max-w-full truncate font-medium text-slate-600">
                        {project.name || 'Unknown project'}
                    </span>

                    {isProjectArchived(task) && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                            Archived project
                        </span>
                    )}

                    {isProjectCompleted(task) && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                            Completed project
                        </span>
                    )}
                </div>

                <OwnershipBadges
                    task={task}
                    mode={mode}
                />

                {/* Task tags */}

                {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((tag) => {
                            const inactive = Boolean(
                                tag.inactive ||
                                tag.archived_at,
                            );

                            return (
                                <span
                                    key={tag.id}
                                    className={cn(
                                        'rounded-md border px-2 py-0.5 text-[11px] font-medium',
                                        inactive
                                            ? 'border-dashed border-slate-300 bg-slate-50 text-slate-400'
                                            : 'border-slate-200 bg-white text-slate-600',
                                    )}
                                >
                                    {tag.name}

                                    {inactive && ' · Inactive'}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Read-only explanation */}

                {readOnlyReason && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700">
                        <svg
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="mt-0.5 h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.485 2.495a1.75 1.75 0 0 1 3.03 0l6.42 11.12A1.75 1.75 0 0 1 16.42 16.25H3.58a1.75 1.75 0 0 1-1.515-2.635l6.42-11.12ZM10 6a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 10 6Zm0 7.5a.875.875 0 1 0 0 1.75.875.875 0 0 0 0-1.75Z"
                                clipRule="evenodd"
                            />
                        </svg>

                        <span>{readOnlyReason}</span>
                    </p>
                )}

                {archived &&
                    !canRestore &&
                    restoreBlockedReason && (
                        <p className="mt-1 text-xs text-slate-400">
                            Restore unavailable:{' '}
                            {restoreBlockedReason}
                        </p>
                    )}
            </div>

            {/* Task group */}

            <div className="min-w-0">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400 lg:hidden">
                    Task group
                </span>

                <GroupBadge group={group} />
            </div>

            {/* Priority */}

            <div>
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400 lg:hidden">
                    Priority
                </span>

                <PriorityBadge priority={task.priority} />
            </div>

            {/* Dates */}

            <div className="grid grid-cols-2 gap-3 lg:block">
                <div>
                    <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400 lg:hidden">
                        Start date
                    </span>

                    <span className="block text-xs text-slate-600">
                        {formatDate(task.start_date)}
                    </span>
                </div>

                <div className="lg:mt-1">
                    <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400 lg:hidden">
                        Due date
                    </span>

                    <span className="block text-xs text-slate-600">
                        {formatDate(task.end_date)}
                    </span>
                </div>
            </div>

            {/* Last updated and assignees */}

            <div className="flex items-center justify-between gap-3 lg:block">
                <div className="min-w-0">
                    <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400 lg:hidden">
                        Updated
                    </span>

                    <span className="block text-xs text-slate-500">
                        {formatDateTime(task.updated_at)}
                    </span>

                    {assignees.length > 0 &&
                        mode !== 'both' && (
                            <div className="mt-2 flex flex-wrap items-center gap-1">
                                {assignees
                                    .slice(0, 3)
                                    .map((assignee) => {
                                        const inactive =
                                            Boolean(assignee.label);

                                        const label =
                                            assignee.label === 'inactive'
                                                ? 'inactive'
                                                : 'no longer a member';

                                        return (
                                            <span
                                                key={
                                                    assignee.id ??
                                                    assignee.name
                                                }
                                                title={
                                                    inactive
                                                        ? `${assignee.name} (${label})`
                                                        : assignee.name
                                                }
                                                className={cn(
                                                    'inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white py-0.5 pl-0.5 pr-2 text-[11px] text-slate-600',
                                                    inactive && 'opacity-60',
                                                )}
                                            >
                                                <Avatar
                                                    name={assignee.name}
                                                    src={assignee.avatar_url}
                                                    className="h-5 w-5 text-[10px]"
                                                />

                                                <span className="max-w-24 truncate">
                                                    {assignee.name}
                                                </span>

                                                {inactive && (
                                                    <span className="text-[10px] text-slate-400">
                                                        {label}
                                                    </span>
                                                )}
                                            </span>
                                        );
                                    })}

                                {assignees.length > 3 && (
                                    <span className="text-[11px] text-slate-400">
                                        +{assignees.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                </div>

                <button
                    type="button"
                    onClick={() => onOpen(task)}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
                >
                    Details
                </button>
            </div>

            {/* Actions */}

            <button
                type="button"
                onClick={() => onOpen(task)}
                className="hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:block"
            >
                Open task
            </button>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Pagination                                                                 */
/* -------------------------------------------------------------------------- */

function Pagination({
    pagination,
    onPageChange,
    loading,
}) {
    const currentPage = Number(
        pagination?.current_page || 1,
    );

    const lastPage = Number(
        pagination?.last_page || 1,
    );

    const total = Number(
        pagination?.total || 0,
    );

    const perPage = Number(
        pagination?.per_page || DEFAULT_PER_PAGE,
    );

    if (lastPage <= 1 && total <= perPage) {
        return null;
    }

    const from =
        total === 0
            ? 0
            : (currentPage - 1) * perPage + 1;

    const to = Math.min(
        currentPage * perPage,
        total,
    );

    const pages = [];

    const start = Math.max(
        1,
        currentPage - 2,
    );

    const end = Math.min(
        lastPage,
        currentPage + 2,
    );

    for (
        let pageNumber = start;
        pageNumber <= end;
        pageNumber += 1
    ) {
        pages.push(pageNumber);
    }

    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                    {from}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">
                    {to}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                    {total}
                </span>{' '}
                tasks
            </p>

            <nav
                aria-label="Task pagination"
                className="flex flex-wrap items-center gap-1"
            >
                <button
                    type="button"
                    disabled={loading || currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Previous
                </button>

                {start > 1 && (
                    <>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => onPageChange(1)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            1
                        </button>

                        {start > 2 && (
                            <span className="px-1 text-slate-400">
                                …
                            </span>
                        )}
                    </>
                )}

                {pages.map((pageNumber) => (
                    <button
                        key={pageNumber}
                        type="button"
                        disabled={loading}
                        onClick={() => onPageChange(pageNumber)}
                        aria-current={
                            pageNumber === currentPage
                                ? 'page'
                                : undefined
                        }
                        className={cn(
                            'min-w-9 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50',
                            pageNumber === currentPage
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                        )}
                    >
                        {pageNumber}
                    </button>
                ))}

                {end < lastPage && (
                    <>
                        {end < lastPage - 1 && (
                            <span className="px-1 text-slate-400">
                                …
                            </span>
                        )}

                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => onPageChange(lastPage)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                        >
                            {lastPage}
                        </button>
                    </>
                )}

                <button
                    type="button"
                    disabled={loading || currentPage >= lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                </button>
            </nav>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function Index() {
    const { auth } = usePage().props;

    /* ---------------------------------------------------------------------- */
    /* URL initialization                                                     */
    /* ---------------------------------------------------------------------- */

    const initialUrl = useMemo(
        () => new URL(window.location.href),
        [],
    );

    const urlParam = (key) =>
        initialUrl.searchParams.get(key) || '';

    const numeric = (value) =>
        /^\d+$/.test(value) ? value : '';

    const initialTaskId = numeric(
        urlParam('task'),
    );

    /* ---------------------------------------------------------------------- */
    /* Filter state                                                           */
    /* ---------------------------------------------------------------------- */

    const [mode, setMode] = useState(() =>
        MODES.includes(urlParam('mode'))
            ? urlParam('mode')
            : 'assigned',
    );

    const [archivedTasks, setArchivedTasks] = useState(
        () => urlParam('archived_tasks') === '1',
    );

    const [archivedProjects, setArchivedProjects] = useState(
        () => urlParam('archived_projects') === '1',
    );

    const [projectId, setProjectId] = useState(
        () => numeric(urlParam('project_id')),
    );

    const [searchInput, setSearchInput] = useState(
        () => urlParam('q'),
    );

    // q is the debounced value sent to the server.
    const [q, setQ] = useState(
        () => urlParam('q').trim(),
    );

    // URL uses scalar "group"; API receives "group_ids[]".
    const [groupId, setGroupId] = useState(
        () => numeric(urlParam('group')),
    );

    const [priority, setPriority] = useState(() => {
        const value = urlParam('priority');

        return PRIORITY_VALUES.includes(value)
            ? value
            : '';
    });

    // URL uses scalar "tag"; API receives "tag_ids[]".
    const [tagId, setTagId] = useState(
        () => numeric(urlParam('tag')),
    );

    const [dateFrom, setDateFrom] = useState(
        () => urlParam('date_from'),
    );

    const [dateTo, setDateTo] = useState(
        () => urlParam('date_to'),
    );

    const [page, setPage] = useState(() =>
        Math.max(
            1,
            Number(urlParam('page')) || 1,
        ),
    );

    /* ---------------------------------------------------------------------- */
    /* Data state                                                             */
    /* ---------------------------------------------------------------------- */

    const [tasks, setTasks] = useState([]);

    const [pagination, setPagination] = useState(null);

    const [options, setOptions] = useState({
        projects: [],
        groups: [],
        tags: [],
        priorities: PRIORITY_VALUES,
        page_size: {
            default: DEFAULT_PER_PAGE,
            max: 100,
        },
    });

    const [loading, setLoading] = useState(true);

    const [optionsLoading, setOptionsLoading] = useState(true);

    const [error, setError] = useState('');

    const [notice, setNotice] = useState(null);

    const [restoringId, setRestoringId] = useState(null);

    const [selectedTask, setSelectedTask] = useState(
        () =>
            initialTaskId
                ? { id: Number(initialTaskId) }
                : null,
    );

    /* ---------------------------------------------------------------------- */
    /* Drawer state                                                           */
    /* ---------------------------------------------------------------------- */

    const [resolvedProjectId, setResolvedProjectId] =
        useState(null);

    const [drawerOptions, setDrawerOptions] =
        useState(null);

    const knownProjectId =
        selectedTask?.project_id ||
        selectedTask?.project?.id ||
        null;

    const drawerProjectId =
        knownProjectId || resolvedProjectId;

    /* ---------------------------------------------------------------------- */
    /* Refs                                                                    */
    /* ---------------------------------------------------------------------- */

    const requestVersion = useRef(0);

    const noticeTimer = useRef(null);

    const filtersRef = useRef(null);

    /* ---------------------------------------------------------------------- */
    /* Notifications                                                          */
    /* ---------------------------------------------------------------------- */

    const showNotice = useCallback((type, message) => {
        setNotice({
            type,
            message,
        });

        if (noticeTimer.current) {
            window.clearTimeout(noticeTimer.current);
        }

        noticeTimer.current = window.setTimeout(() => {
            setNotice(null);
        }, 4500);
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Current filters                                                        */
    /* ---------------------------------------------------------------------- */

    const currentFilters = useMemo(
        () => ({
            mode,

            archived_tasks: archivedTasks ? 1 : 0,

            archived_projects: archivedProjects ? 1 : 0,

            project_id: projectId || undefined,

            q: q || undefined,

            group_ids: groupId
                ? [Number(groupId)]
                : undefined,

            priority: priority
                ? [priority]
                : undefined,

            tag_ids: tagId
                ? [Number(tagId)]
                : undefined,

            date_from: dateFrom || undefined,

            date_to: dateTo || undefined,

            page,

            per_page: DEFAULT_PER_PAGE,
        }),
        [
            mode,
            archivedTasks,
            archivedProjects,
            projectId,
            q,
            groupId,
            priority,
            tagId,
            dateFrom,
            dateTo,
            page,
        ],
    );

    filtersRef.current = currentFilters;

    /* ---------------------------------------------------------------------- */
    /* API URL builder                                                        */
    /* ---------------------------------------------------------------------- */

    const buildListUrl = useCallback((filters) => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (
                value === undefined ||
                value === null ||
                value === ''
            ) {
                return;
            }

            if (Array.isArray(value)) {
                value.forEach((item) => {
                    params.append(`${key}[]`, String(item));
                });

                return;
            }

            params.set(key, String(value));
        });

        return `${route('my-tasks.list')}?${params.toString()}`;
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Browser URL synchronization                                            */
    /* ---------------------------------------------------------------------- */

    const syncUrl = useCallback((filters, taskId = null) => {
        const params = new URLSearchParams();

        const set = (key, value) => {
            if (
                value !== undefined &&
                value !== null &&
                value !== ''
            ) {
                params.set(key, String(value));
            }
        };

        // Omit defaults to keep the URL clean.

        if (filters.mode !== 'assigned') {
            set('mode', filters.mode);
        }

        if (filters.archived_tasks) {
            set('archived_tasks', 1);
        }

        if (filters.archived_projects) {
            set('archived_projects', 1);
        }

        set('project_id', filters.project_id);

        set('q', filters.q);

        // Browser URL uses scalar values.
        set('group', filters.group_ids?.[0]);

        set('priority', filters.priority?.[0]);

        set('tag', filters.tag_ids?.[0]);

        set('date_from', filters.date_from);

        set('date_to', filters.date_to);

        if (filters.page > 1) {
            set('page', filters.page);
        }

        if (taskId) {
            set('task', taskId);
        }

        const query = params.toString();

        const nextUrl =
            `${window.location.pathname}` +
            `${query ? `?${query}` : ''}`;

        window.history.replaceState(
            window.history.state,
            '',
            nextUrl,
        );
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Load filter options                                                    */
    /* ---------------------------------------------------------------------- */

    const loadOptions = useCallback(async () => {
        setOptionsLoading(true);

        try {
            const result = await getJson(
                route('my-tasks.options'),
            );

            setOptions({
                projects: result?.projects || [],

                groups: result?.groups || [],

                tags: result?.tags || [],

                priorities:
                    result?.priorities || PRIORITY_VALUES,

                page_size: result?.page_size || {
                    default: DEFAULT_PER_PAGE,
                    max: 100,
                },
            });
        } catch (exception) {
            showNotice(
                'error',
                getErrorMessage(
                    exception,
                    'Could not load filter options.',
                ),
            );
        } finally {
            setOptionsLoading(false);
        }
    }, [showNotice]);

    /* ---------------------------------------------------------------------- */
    /* Load tasks                                                             */
    /* ---------------------------------------------------------------------- */

    const loadTasks = useCallback(
        async (filters = filtersRef.current) => {
            const version = ++requestVersion.current;

            setLoading(true);
            setError('');

            try {
                const result = await getJson(
                    buildListUrl(filters),
                );

                // Ignore responses from older requests.
                if (version !== requestVersion.current) {
                    return;
                }

                const rows = Array.isArray(result?.data)
                    ? result.data
                    : [];

                const lastPage = Math.max(
                    1,
                    Number(result?.last_page || 1),
                );

                const currentPage = Number(
                    result?.current_page || 1,
                );

                /*
                 * If archiving or restoring empties the current
                 * page, move back to the last available page.
                 *
                 * Changing page triggers the loading effect again.
                 */

                if (
                    rows.length === 0 &&
                    currentPage > lastPage
                ) {
                    setPage(lastPage);

                    return;
                }

                setTasks(rows);

                setPagination({
                    current_page: currentPage,
                    last_page: lastPage,
                    per_page:
                        result?.per_page || DEFAULT_PER_PAGE,
                    total: Number(result?.total || 0),
                });
            } catch (exception) {
                if (version !== requestVersion.current) {
                    return;
                }

                setError(
                    getErrorMessage(
                        exception,
                        'Could not load your tasks.',
                    ),
                );
            } finally {
                if (version === requestVersion.current) {
                    setLoading(false);
                }
            }
        },
        [buildListUrl],
    );

    /* ---------------------------------------------------------------------- */
    /* Search debounce                                                        */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        const next = searchInput.trim();

        if (next === q) {
            return;
        }

        const timer = window.setTimeout(() => {
            setQ(next);
            setPage(1);
        }, 300);

        return () => {
            window.clearTimeout(timer);
        };
    }, [searchInput, q]);

    /* ---------------------------------------------------------------------- */
    /* Initial loading and filter changes                                     */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        loadOptions();
    }, [loadOptions]);

    useEffect(() => {
        syncUrl(
            currentFilters,
            selectedTask?.id ?? null,
        );

        loadTasks(currentFilters);
    }, [
        currentFilters,
        loadTasks,
        syncUrl,
        selectedTask?.id,
    ]);

    /* ---------------------------------------------------------------------- */
    /* Cleanup                                                                */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        return () => {
            if (noticeTimer.current) {
                window.clearTimeout(noticeTimer.current);
            }

            requestVersion.current += 1;
        };
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Filter handlers                                                        */
    /* ---------------------------------------------------------------------- */

    const changeFilter = useCallback((setter, value) => {
        setter(value);

        setPage(1);
    }, []);

    const resetFilters = useCallback(() => {
        setMode('assigned');

        setArchivedTasks(false);

        setArchivedProjects(false);

        setProjectId('');

        setSearchInput('');

        setQ('');

        setGroupId('');

        setPriority('');

        setTagId('');

        setDateFrom('');

        setDateTo('');

        setPage(1);
    }, []);

    const hasFilters = Boolean(
        searchInput ||
        q ||
        projectId ||
        groupId ||
        priority ||
        tagId ||
        dateFrom ||
        dateTo ||
        archivedTasks ||
        archivedProjects ||
        mode !== 'assigned',
    );

    /* ---------------------------------------------------------------------- */
    /* Open and close task drawer                                             */
    /* ---------------------------------------------------------------------- */

    const openTask = useCallback(
        (task) => {
            const taskId = getTaskId(task);

            if (!taskId) {
                showNotice(
                    'error',
                    'Could not identify this task.',
                );

                return;
            }

            setSelectedTask({
                ...task,
                id: taskId,
            });

            // Project resolution runs in the effects below.
            syncUrl(filtersRef.current, taskId);
        },
        [showNotice, syncUrl],
    );

    const closeTask = useCallback(() => {
        setSelectedTask(null);

        setResolvedProjectId(null);

        setDrawerOptions(null);

        syncUrl(filtersRef.current, null);

        // Keep the current list page and filters.
    }, [syncUrl]);

    /* ---------------------------------------------------------------------- */
    /* Resolve project for deep-linked tasks                                  */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        setResolvedProjectId(null);

        if (!selectedTask?.id || knownProjectId) {
            return;
        }

        const controller = new AbortController();

        getJson(
            route('tasks.show', selectedTask.id),
            controller.signal,
        )
            .then((payload) => {
                const projectId =
                    payload?.task?.project?.id ??
                    payload?.project?.id ??
                    payload?.task?.project_id ??
                    null;

                if (!projectId) {
                    throw new Error(
                        'Could not identify the task project.',
                    );
                }

                setResolvedProjectId(projectId);
            })
            .catch((exception) => {
                if (
                    exception?.name === 'AbortError' ||
                    controller.signal.aborted
                ) {
                    return;
                }

                showNotice(
                    'error',
                    exception?.status === 404
                        ? 'This task is not available.'
                        : getErrorMessage(
                              exception,
                              'Could not load this task.',
                          ),
                );

                setSelectedTask(null);

                setResolvedProjectId(null);

                syncUrl(filtersRef.current, null);
            });

        return () => {
            controller.abort();
        };
    }, [
        selectedTask?.id,
        knownProjectId,
        showNotice,
        syncUrl,
    ]);

    /* ---------------------------------------------------------------------- */
    /* Load project-specific drawer options                                  */
    /* ---------------------------------------------------------------------- */

    useEffect(() => {
        setDrawerOptions(null);

        if (!drawerProjectId) {
            return;
        }

        const controller = new AbortController();

        getJson(
            route(
                'projects.board.options',
                drawerProjectId,
            ),
            controller.signal,
        )
            .then((result) => {
                if (!controller.signal.aborted) {
                    setDrawerOptions(result);
                }
            })
            .catch((exception) => {
                if (
                    exception?.name === 'AbortError' ||
                    controller.signal.aborted
                ) {
                    return;
                }

                // The drawer can still display task details.
                // Keep the options unavailable if loading fails.
                setDrawerOptions(null);
            });

        return () => {
            controller.abort();
        };
    }, [drawerProjectId]);

    /* ---------------------------------------------------------------------- */
    /* Refresh and task mutation handlers                                    */
    /* ---------------------------------------------------------------------- */

    const refreshCurrentPage = useCallback(async () => {
        await loadTasks(filtersRef.current);
    }, [loadTasks]);

    const handleCardChange = useCallback(
        async (updatedTask) => {
            const updatedId = getTaskId(updatedTask);

            if (!updatedId) {
                await refreshCurrentPage();

                return;
            }

            /*
             * Reload from the server instead of updating the row
             * optimistically. This keeps sorting, ownership filters,
             * archived filters, and pagination consistent.
             */

            await refreshCurrentPage();
        },
        [refreshCurrentPage],
    );

    /* ---------------------------------------------------------------------- */
    /* Move task from drawer                                                 */
    /* ---------------------------------------------------------------------- */

    const moveFromDrawer = useCallback(
        async (taskId, groupId) => {
            try {
                await patchJson(
                    route('tasks.move', taskId),
                    {
                        group_id: groupId,
                    },
                );

                showNotice(
                    'success',
                    'Task moved.',
                );

                await loadTasks(filtersRef.current);

                return true;
            } catch (exception) {
                showNotice(
                    'error',
                    getErrorMessage(
                        exception,
                        'Could not move this task.',
                    ),
                );

                return false;
            }
        },
        [loadTasks, showNotice],
    );

    /* ---------------------------------------------------------------------- */
    /* Restore task                                                           */
    /* ---------------------------------------------------------------------- */

    const handleRestore = useCallback(
        async (task) => {
            const taskId = getTaskId(task);

            if (!taskId || restoringId !== null) {
                return;
            }

            if (!task.can_restore) {
                showNotice(
                    'error',
                    task.restore_blocked_reason ||
                        'This task cannot be restored.',
                );

                return;
            }

            setRestoringId(taskId);

            try {
                await postJson(
                    route('tasks.restore', taskId),
                );

                showNotice(
                    'success',
                    'Task restored successfully.',
                );

                await loadTasks(filtersRef.current);
            } catch (exception) {
                showNotice(
                    'error',
                    getErrorMessage(
                        exception,
                        'Could not restore this task.',
                    ),
                );
            } finally {
                setRestoringId(null);
            }
        },
        [
            loadTasks,
            restoringId,
            showNotice,
        ],
    );

    /* ---------------------------------------------------------------------- */
    /* Pagination handler                                                     */
    /* ---------------------------------------------------------------------- */

    const handlePageChange = useCallback((nextPage) => {
        setPage(Math.max(1, nextPage));

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }, []);

    /* ---------------------------------------------------------------------- */
    /* Dropdown options                                                       */
    /* ---------------------------------------------------------------------- */

    const projectOptions = options.projects || [];

    const groupOptions = options.groups || [];

    const tagOptions = options.tags || [];

    const priorityOptions =
        options.priorities || PRIORITY_VALUES;

    const activeCount = tasks.length;

    /* ---------------------------------------------------------------------- */
    /* Render                                                                 */
    /* ---------------------------------------------------------------------- */

    return (
        <AuthenticatedLayout
            header={
                <div className="flex w-full min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                            My Tasks
                        </h1>

                        <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
                            Tasks assigned to you or created by you.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={refreshCurrentPage}
                        disabled={loading}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className={cn(
                                'h-4 w-4',
                                loading && 'animate-spin',
                            )}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 7v5h-5M4 17v-5h5m10-1a7 7 0 0 0-12-4L4 12m16 0-3 5a7 7 0 0 1-12-4"
                            />
                        </svg>

                        <span className="hidden sm:inline">
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </span>
                    </button>
                </div>
            }
        >

        
            <Head title="My Tasks" />

            <div className="w-full min-w-0 space-y-4">
                {/* Task ownership — compact bar */}

                <TaskOwnershipBar
                    mode={mode}
                    onModeChange={(value) =>
                        changeFilter(setMode, value)
                    }
                    archivedTasks={archivedTasks}
                    onArchivedTasksChange={(value) =>
                        changeFilter(setArchivedTasks, value)
                    }
                    archivedProjects={archivedProjects}
                    onArchivedProjectsChange={(value) =>
                        changeFilter(setArchivedProjects, value)
                    }
                    loading={loading}
                    total={pagination?.total}
                    activeCount={activeCount}
                />

                {/* Filters — search + collapsible panel */}

                <TaskFilters
                    searchInput={searchInput}
                    onSearchChange={setSearchInput}
                    projectId={projectId}
                    onProjectChange={(value) =>
                        changeFilter(setProjectId, value)
                    }
                    groupId={groupId}
                    onGroupChange={(value) =>
                        changeFilter(setGroupId, value)
                    }
                    priority={priority}
                    onPriorityChange={(value) =>
                        changeFilter(setPriority, value)
                    }
                    tagId={tagId}
                    onTagChange={(value) =>
                        changeFilter(setTagId, value)
                    }
                    dateFrom={dateFrom}
                    onDateFromChange={(value) =>
                        changeFilter(setDateFrom, value)
                    }
                    dateTo={dateTo}
                    onDateToChange={(value) =>
                        changeFilter(setDateTo, value)
                    }
                    projectOptions={projectOptions}
                    groupOptions={groupOptions}
                    tagOptions={tagOptions}
                    priorityOptions={priorityOptions}
                    hasFilters={hasFilters}
                    onReset={resetFilters}
                    optionsLoading={optionsLoading}
                />

                {/* Notifications */}

                {notice && (
                    <div
                        role="status"
                        className={cn(
                            'flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm',
                            notice.type === 'success'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-rose-200 bg-rose-50 text-rose-700',
                        )}
                    >
                        <span>{notice.message}</span>

                        <button
                            type="button"
                            onClick={() => setNotice(null)}
                            aria-label="Dismiss notification"
                            className="shrink-0 font-semibold opacity-70 hover:opacity-100"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Task list */}

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">
                                {archivedTasks
                                    ? 'Archived Tasks'
                                    : archivedProjects
                                      ? 'Tasks in Archived Projects'
                                      : 'My Task List'}
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                {mode === 'assigned'
                                    ? 'Tasks assigned to you'
                                    : mode === 'created'
                                      ? 'Tasks created by you'
                                      : 'Tasks assigned to you or created by you'}
                            </p>
                        </div>

                        <div className="text-xs text-slate-400">
                            {loading
                                ? 'Updating…'
                                : `${tasks.length} on this page`}
                        </div>
                    </div>

                    {/* Loading state */}

                    {loading && tasks.length === 0 ? (
                        <div className="space-y-4 px-5 py-8">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="animate-pulse space-y-2"
                                >
                                    <div className="h-4 w-1/3 rounded bg-slate-100" />

                                    <div className="h-3 w-1/4 rounded bg-slate-100" />

                                    <div className="h-px w-full bg-slate-100" />
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        /* Error state */

                        <div className="px-5 py-14 text-center">
                            <p className="text-sm font-semibold text-rose-700">
                                Could not load tasks
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={refreshCurrentPage}
                                className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Try again
                            </button>
                        </div>
                    ) : tasks.length === 0 ? (
                        /* Empty state */

                        <EmptyState
                            archivedTasks={archivedTasks}
                            archivedProjects={archivedProjects}
                            hasFilters={hasFilters}
                            onReset={resetFilters}
                        />
                    ) : (
                        /* Grouped task rows */

                        <div
                            className={cn(
                                'px-3 pb-4 sm:px-4',
                                loading && 'opacity-60',
                            )}
                        >
                            <GroupedTaskList
                                tasks={tasks}
                                groups={groupOptions}
                                onOpen={openTask}
                                onRestore={handleRestore}
                                restoringId={restoringId}
                            />
                        </div>
                    )}

                    {/* Pagination */}

                    {!error && (
                        <Pagination
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            loading={loading}
                        />
                    )}
                </section>

                <p className="pb-2 text-xs text-slate-400">
                    Showing your accessible projects only.
                    Archived and completed projects may contain
                    read-only tasks.
                </p>
            </div>

            {/* Shared task drawer */}

            {selectedTask && drawerProjectId && (
                <TaskDrawer
                    key={selectedTask.id}
                    taskId={selectedTask.id}
                    projectId={drawerProjectId}
                    options={drawerOptions}
                    onClose={closeTask}
                    onCardChange={handleCardChange}
                    onArchived={refreshCurrentPage}
                    onRestored={refreshCurrentPage}
                    onMove={moveFromDrawer}
                />
            )}
        </AuthenticatedLayout>
    );
}