import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { Head, router, usePage } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TaskDrawer from '@/Components/Board/TaskDrawer';

import {
    errorMessage,
    getJson,
    postJson,
} from '@/lib/http';

const DEFAULT_PER_PAGE = 25;

const PRIORITY_STYLES = {
    LOW: 'bg-slate-100 text-slate-600 ring-slate-200',
    MEDIUM: 'bg-blue-50 text-blue-700 ring-blue-200',
    HIGH: 'bg-amber-50 text-amber-700 ring-amber-200',
    URGENT: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const PRIORITY_LABELS = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
};

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

function getCreator(task) {
    return (
        task?.creator ||
        task?.created_by_user ||
        task?.createdBy ||
        null
    );
}

function isTaskArchived(task) {
    return Boolean(task?.archived_at);
}

function isProjectArchived(task) {
    return Boolean(getProject(task)?.archived);
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
    const priority = String(task?.priority || 'MEDIUM').toUpperCase();

    return {
        value: priority,
        label: PRIORITY_LABELS[priority] || priority,
        className:
            PRIORITY_STYLES[priority] ||
            'bg-slate-100 text-slate-600 ring-slate-200',
    };
}

function SelectField({
    label,
    value,
    onChange,
    children,
    className = '',
}) {
    return (
        <label className={cn('block min-w-0', className)}>
            {label && (
                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                    {label}
                </span>
            )}

            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
                {children}
            </select>
        </label>
    );
}

function DateField({ label, value, onChange }) {
    return (
        <label className="block min-w-0">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                {label}
            </span>

            <input
                type="date"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
        </label>
    );
}

function CheckboxFilter({ checked, onChange, children }) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />

            <span>{children}</span>
        </label>
    );
}

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
        return <span className="text-sm text-slate-400">No group</span>;
    }

    return (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
            {group.color && (
                <span
                    className="h-2 w-2 shrink-0 rounded-full bg-slate-400"
                    aria-hidden="true"
                />
            )}

            <span className="truncate">{group.name}</span>
        </span>
    );
}

function OwnershipBadges({ task, mode }) {
    if (mode !== 'both') return null;

    const creator = getCreator(task);
    const assignees = getAssignees(task);

    return (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {creator && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600">
                    <span className="text-slate-400">Creator:</span>
                    {creator.name || 'Unknown'}
                </span>
            )}

            {assignees.map((assignee) => (
                <span
                    key={assignee.id ?? assignee.name}
                    className="inline-flex items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700"
                >
                    <span className="text-blue-500">Assignee:</span>
                    {assignee.name || 'Unknown'}
                </span>
            ))}
        </div>
    );
}

function EmptyState({ archivedTasks, archivedProjects, hasFilters, onReset }) {
    let title = 'No tasks found';
    let description = 'Tasks matching your selection will appear here.';

    if (archivedTasks && archivedProjects) {
        title = 'No archived tasks in archived projects';
    } else if (archivedTasks) {
        title = 'No archived tasks';
        description = 'Archived tasks matching your selection will appear here.';
    } else if (archivedProjects) {
        title = 'No tasks in archived projects';
        description = 'There are no matching tasks in archived projects.';
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
        (readOnlyReason && !archived ? readOnlyReason : null);

    const canRestore =
        archived &&
        Boolean(task?.can_restore) &&
        !restoreBlockedReason;

    const tags = Array.isArray(task?.tags) ? task.tags : [];

    return (
        <div
            className={cn(
                'group grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-slate-50/80 sm:px-5 lg:grid-cols-[minmax(0,2fr)_minmax(150px,1fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_minmax(120px,0.7fr)] lg:items-center',
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
                                    {restoring ? 'Restoring…' : 'Restore'}
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

                    {project.archived && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                            Archived project
                        </span>
                    )}

                    {project.status === 'COMPLETED' && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">
                            Completed project
                        </span>
                    )}
                </div>

                <OwnershipBadges task={task} mode={mode} />

                {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                            <span
                                key={tag.id}
                                className={cn(
                                    'rounded-md border px-2 py-0.5 text-[11px] font-medium',
                                    tag.inactive || tag.archived_at
                                        ? 'border-dashed border-slate-300 bg-slate-50 text-slate-400'
                                        : 'border-slate-200 bg-white text-slate-600',
                                )}
                            >
                                {tag.name}
                                {(tag.inactive || tag.archived_at) && ' · Inactive'}
                            </span>
                        ))}
                    </div>
                )}

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
                                d="M8.485 2.495a1.75 1.75 0 0 1 3.03 0l6.42 11.12A1.75 1.75 0 0 1 16.42 16.25H3.58a1.75 1.75 0 0 1-1.515-2.635l6.42-11.12ZM10 6a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 10 6Zm0 7.5a.875.875 0 1 0 0 1.75  .875.875 0 0 0 0-1.75Z"
                                clipRule="evenodd"
                            />
                        </svg>

                        <span>{readOnlyReason}</span>
                    </p>
                )}

                {archived && !canRestore && restoreBlockedReason && (
                    <p className="mt-1 text-xs text-slate-400">
                        Restore unavailable: {restoreBlockedReason}
                    </p>
                )}
            </div>

            {/* Group */}
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

            {/* Updated */}
            <div className="flex items-center justify-between gap-3 lg:block">
                <div>
                    <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-400 lg:hidden">
                        Updated
                    </span>

                    <span className="block text-xs text-slate-500">
                        {formatDateTime(task.updated_at)}
                    </span>

                    {assignees.length > 0 && mode !== 'both' && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                            {assignees.slice(0, 3).map((assignee) => (
                                <span
                                    key={assignee.id ?? assignee.name}
                                    title={assignee.name}
                                    className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white py-0.5 pl-0.5 pr-2 text-[11px] text-slate-600"
                                >
                                    <Avatar user={assignee} size="xs" />

                                    <span className="max-w-24 truncate">
                                        {assignee.name}
                                    </span>
                                </span>
                            ))}

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

function Pagination({ pagination, onPageChange, loading }) {
    const currentPage = Number(pagination?.current_page || 1);
    const lastPage = Number(pagination?.last_page || 1);
    const total = Number(pagination?.total || 0);
    const perPage = Number(pagination?.per_page || DEFAULT_PER_PAGE);

    if (lastPage <= 1 && total <= perPage) {
        return null;
    }

    const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, total);

    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(lastPage, currentPage + 2);

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    return (
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">{from}</span>
                {' '}to{' '}
                <span className="font-semibold text-slate-700">{to}</span>
                {' '}of{' '}
                <span className="font-semibold text-slate-700">{total}</span>
                {' '}tasks
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
                            onClick={() => onPageChange(1)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        >
                            1
                        </button>

                        {start > 2 && (
                            <span className="px-1 text-slate-400">…</span>
                        )}
                    </>
                )}

                {pages.map((page) => (
                    <button
                        key={page}
                        type="button"
                        disabled={loading}
                        onClick={() => onPageChange(page)}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={cn(
                            'min-w-9 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50',
                            page === currentPage
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                        )}
                    >
                        {page}
                    </button>
                ))}

                {end < lastPage && (
                    <>
                        {end < lastPage - 1 && (
                            <span className="px-1 text-slate-400">…</span>
                        )}

                        <button
                            type="button"
                            onClick={() => onPageChange(lastPage)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
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

export default function Index() {
    const { auth } = usePage().props;

    const initialUrl = useMemo(
        () => new URL(window.location.href),
        [],
    );

    const initialTaskId = initialUrl.searchParams.get('task');

    const [mode, setMode] = useState(
        initialUrl.searchParams.get('mode') || 'assigned',
    );

    const [archivedTasks, setArchivedTasks] = useState(
        initialUrl.searchParams.get('archived_tasks') === '1',
    );

    const [archivedProjects, setArchivedProjects] = useState(
        initialUrl.searchParams.get('archived_projects') === '1',
    );

    const [projectId, setProjectId] = useState(
        initialUrl.searchParams.get('project_id') || '',
    );

    const [searchInput, setSearchInput] = useState(
        initialUrl.searchParams.get('q') || '',
    );

    const [groupId, setGroupId] = useState(
        initialUrl.searchParams.get('group_ids') || '',
    );

    const [priority, setPriority] = useState(
        initialUrl.searchParams.get('priority') || '',
    );

    const [tagId, setTagId] = useState(
        initialUrl.searchParams.get('tag_ids') || '',
    );

    const [dateFrom, setDateFrom] = useState(
        initialUrl.searchParams.get('date_from') || '',
    );

    const [dateTo, setDateTo] = useState(
        initialUrl.searchParams.get('date_to') || '',
    );

    const [page, setPage] = useState(
        Math.max(1, Number(initialUrl.searchParams.get('page') || 1)),
    );

    const [tasks, setTasks] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [options, setOptions] = useState({
        projects: [],
        groups: [],
        tags: [],
        priorities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        page_size: { default: DEFAULT_PER_PAGE, max: 100 },
    });

    const [loading, setLoading] = useState(true);
    const [optionsLoading, setOptionsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState(null);
    const [restoringId, setRestoringId] = useState(null);
    const [selectedTask, setSelectedTask] = useState(
        initialTaskId ? { id: Number(initialTaskId) } : null,
    );

    const requestVersion = useRef(0);
    const searchTimer = useRef(null);
    const noticeTimer = useRef(null);
    const filtersRef = useRef(null);

    const showNotice = useCallback((type, message) => {
        setNotice({ type, message });

        if (noticeTimer.current) {
            window.clearTimeout(noticeTimer.current);
        }

        noticeTimer.current = window.setTimeout(() => {
            setNotice(null);
        }, 4500);
    }, []);

    const currentFilters = useMemo(
        () => ({
            mode,
            archived_tasks: archivedTasks ? 1 : 0,
            archived_projects: archivedProjects ? 1 : 0,
            project_id: projectId || undefined,
            q: searchInput.trim() || undefined,
            group_ids: groupId ? [Number(groupId)] : undefined,
            priority: priority ? [priority] : undefined,
            tag_ids: tagId ? [Number(tagId)] : undefined,
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
            searchInput,
            groupId,
            priority,
            tagId,
            dateFrom,
            dateTo,
            page,
        ],
    );

    filtersRef.current = currentFilters;

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
                value.forEach((item) => params.append(`${key}[]`, item));
                return;
            }

            params.set(key, String(value));
        });

        return `${route('my-tasks.list')}?${params.toString()}`;
    }, []);

    const syncUrl = useCallback((filters, taskId = null) => {
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
                value.forEach((item) => params.append(`${key}[]`, item));
                return;
            }

            params.set(key, String(value));
        });

        if (taskId) {
            params.set('task', String(taskId));
        }

        const query = params.toString();
        const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}`;

        window.history.replaceState(
            window.history.state,
            '',
            nextUrl,
        );
    }, []);

    const loadOptions = useCallback(async () => {
        setOptionsLoading(true);

        try {
            const result = await getJson(route('my-tasks.options'));

            setOptions({
                projects: result?.projects || [],
                groups: result?.groups || [],
                tags: result?.tags || [],
                priorities:
                    result?.priorities ||
                    ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
                page_size: result?.page_size || {
                    default: DEFAULT_PER_PAGE,
                    max: 100,
                },
            });
        } catch (exception) {
            showNotice(
                'error',
                getErrorMessage(exception, 'Could not load filter options.'),
            );
        } finally {
            setOptionsLoading(false);
        }
    }, [showNotice]);

    const loadTasks = useCallback(
        async (filters = filtersRef.current) => {
            const version = ++requestVersion.current;

            setLoading(true);
            setError('');

            try {
                const result = await getJson(buildListUrl(filters));

                if (version !== requestVersion.current) {
                    return;
                }

                // Laravel LengthAwarePaginator JSON response.
                setTasks(Array.isArray(result?.data) ? result.data : []);
                setPagination({
                    current_page: result?.current_page || 1,
                    last_page: result?.last_page || 1,
                    per_page: result?.per_page || DEFAULT_PER_PAGE,
                    total: result?.total || 0,
                });
            } catch (exception) {
                if (version !== requestVersion.current) {
                    return;
                }

                setError(
                    getErrorMessage(exception, 'Could not load your tasks.'),
                );
            } finally {
                if (version === requestVersion.current) {
                    setLoading(false);
                }
            }
        },
        [buildListUrl],
    );

    useEffect(() => {
        loadOptions();
    }, [loadOptions]);

    useEffect(() => {
        syncUrl(currentFilters, selectedTask?.id ?? null);
        loadTasks(currentFilters);
    }, [currentFilters, loadTasks, syncUrl]);

    useEffect(() => {
        return () => {
            if (searchTimer.current) {
                window.clearTimeout(searchTimer.current);
            }

            if (noticeTimer.current) {
                window.clearTimeout(noticeTimer.current);
            }

            requestVersion.current += 1;
        };
    }, []);

    const changeFilter = useCallback((setter, value) => {
        setter(value);
        setPage(1);
    }, []);

    const changeSearch = useCallback((value) => {
        setSearchInput(value);

        if (searchTimer.current) {
            window.clearTimeout(searchTimer.current);
        }

        searchTimer.current = window.setTimeout(() => {
            setPage(1);
        }, 300);
    }, []);

    const resetFilters = useCallback(() => {
        if (searchTimer.current) {
            window.clearTimeout(searchTimer.current);
        }

        setMode('assigned');
        setArchivedTasks(false);
        setArchivedProjects(false);
        setProjectId('');
        setSearchInput('');
        setGroupId('');
        setPriority('');
        setTagId('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    }, []);

    const hasFilters = Boolean(
        searchInput ||
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

    const openTask = useCallback(
        (task) => {
            const taskId = getTaskId(task);

            if (!taskId) {
                showNotice('error', 'Could not identify this task.');
                return;
            }

            setSelectedTask({
                ...task,
                id: taskId,
            });

            syncUrl(filtersRef.current, taskId);
        },
        [showNotice, syncUrl],
    );

    const closeTask = useCallback(() => {
        setSelectedTask(null);
        syncUrl(filtersRef.current, null);

        // The list remains on its current page and keeps its filters.
    }, [syncUrl]);

    const refreshCurrentPage = useCallback(async () => {
        await loadTasks(filtersRef.current);
    }, [loadTasks]);

    const handleCardChange = useCallback(
        (updatedTask) => {
            const updatedId = getTaskId(updatedTask);

            if (!updatedId) {
                refreshCurrentPage();
                return;
            }

            // Reload the current server page so sorting and filter membership
            // remain consistent with the backend.
            refreshCurrentPage();
        },
        [refreshCurrentPage],
    );

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
                await postJson(route('tasks.restore', taskId));

                showNotice('success', 'Task restored successfully.');

                // Keep the same filters/page, even when restoring removes
                // the task from the archived list.
                await loadTasks(filtersRef.current);
            } catch (exception) {
                showNotice(
                    'error',
                    getErrorMessage(exception, 'Could not restore this task.'),
                );
            } finally {
                setRestoringId(null);
            }
        },
        [loadTasks, restoringId, showNotice],
    );

    const handlePageChange = useCallback((nextPage) => {
        setPage(Math.max(1, nextPage));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const activeCount = tasks.length;
    const projectOptions = options.projects || [];
    const groupOptions = options.groups || [];
    const tagOptions = options.tags || [];

    return (
        <AuthenticatedLayout>
            <Head title="My Tasks" />

            <div className="min-h-screen bg-slate-50">
                <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
                    {/* Page heading */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                                        />
                                    </svg>
                                </div>

                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                        My Tasks
                                    </h1>

                                    <p className="mt-0.5 text-sm text-slate-500">
                                        Tasks assigned to you or created by you.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={refreshCurrentPage}
                            disabled={loading}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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

                            Refresh
                        </button>
                    </div>

                    {/* Mode selector */}
                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-800">
                                    Task ownership
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Choose which tasks you want to see.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:grid-cols-3">
                                {[
                                    {
                                        value: 'assigned',
                                        label: 'Assigned to Me',
                                        description: 'Tasks assigned to you',
                                    },
                                    {
                                        value: 'created',
                                        label: 'Created by Me',
                                        description: 'Tasks you created',
                                    },
                                    {
                                        value: 'both',
                                        label: 'All My Tasks',
                                        description: 'Assigned or created',
                                    },
                                ].map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() =>
                                            changeFilter(setMode, item.value)
                                        }
                                        aria-pressed={mode === item.value}
                                        className={cn(
                                            'rounded-lg px-4 py-2.5 text-left transition sm:min-w-40 sm:text-center',
                                            mode === item.value
                                                ? 'border border-slate-200 bg-white text-blue-700 shadow-sm'
                                                : 'border border-transparent text-slate-500 hover:bg-white hover:text-slate-700',
                                        )}
                                    >
                                        <span className="block text-sm font-semibold">
                                            {item.label}
                                        </span>

                                        <span className="mt-0.5 hidden text-[11px] text-slate-400 sm:block">
                                            {item.description}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-4">
                            <CheckboxFilter
                                checked={archivedTasks}
                                onChange={(value) =>
                                    changeFilter(setArchivedTasks, value)
                                }
                            >
                                Archived Tasks
                            </CheckboxFilter>

                            <CheckboxFilter
                                checked={archivedProjects}
                                onChange={(value) =>
                                    changeFilter(setArchivedProjects, value)
                                }
                            >
                                Archived Projects
                            </CheckboxFilter>

                            <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                {loading
                                    ? 'Loading tasks…'
                                    : `${pagination?.total ?? activeCount} tasks`}
                            </div>
                        </div>
                    </section>

                    {/* Filters */}
                    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-800">
                                    Filters
                                </h2>

                                <p className="mt-1 text-xs text-slate-500">
                                    Narrow down your tasks by project, group, priority, tag, or date.
                                </p>
                            </div>

                            {hasFilters && (
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {/* Search */}
                            <label className="block min-w-0 sm:col-span-2 xl:col-span-1">
                                <span className="mb-1.5 block text-xs font-semibold text-slate-600">
                                    Search
                                </span>

                                <div className="relative">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                        aria-hidden="true"
                                    >
                                        <circle cx="11" cy="11" r="7" />
                                        <path
                                            strokeLinecap="round"
                                            d="m16 16 4 4"
                                        />
                                    </svg>

                                    <input
                                        type="search"
                                        value={searchInput}
                                        onChange={(event) =>
                                            changeSearch(event.target.value)
                                        }
                                        placeholder="Search title or task code…"
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </label>

                            <SelectField
                                label="Project"
                                value={projectId}
                                onChange={(value) =>
                                    changeFilter(setProjectId, value)
                                }
                            >
                                <option value="">All accessible projects</option>

                                {projectOptions.map((project) => (
                                    <option
                                        key={project.id}
                                        value={project.id}
                                    >
                                        {project.code
                                            ? `${project.code} — ${project.name}`
                                            : project.name}
                                        {project.archived
                                            ? ' (Archived)'
                                            : ''}
                                    </option>
                                ))}
                            </SelectField>

                            <SelectField
                                label="Task Group"
                                value={groupId}
                                onChange={(value) =>
                                    changeFilter(setGroupId, value)
                                }
                            >
                                <option value="">All task groups</option>

                                {groupOptions.map((group) => (
                                    <option
                                        key={group.id}
                                        value={group.id}
                                    >
                                        {group.name}
                                    </option>
                                ))}
                            </SelectField>

                            <SelectField
                                label="Priority"
                                value={priority}
                                onChange={(value) =>
                                    changeFilter(setPriority, value)
                                }
                            >
                                <option value="">All priorities</option>

                                {options.priorities.map((item) => (
                                    <option key={item} value={item}>
                                        {PRIORITY_LABELS[item] || item}
                                    </option>
                                ))}
                            </SelectField>

                            <SelectField
                                label="Tag"
                                value={tagId}
                                onChange={(value) =>
                                    changeFilter(setTagId, value)
                                }
                            >
                                <option value="">All tags</option>

                                {tagOptions.map((tag) => (
                                    <option key={tag.id} value={tag.id}>
                                        {tag.name}
                                        {tag.inactive ? ' (Inactive)' : ''}
                                    </option>
                                ))}
                            </SelectField>

                            <DateField
                                label="Date From"
                                value={dateFrom}
                                onChange={(value) =>
                                    changeFilter(setDateFrom, value)
                                }
                            />

                            <DateField
                                label="Date To"
                                value={dateTo}
                                onChange={(value) =>
                                    changeFilter(setDateTo, value)
                                }
                            />
                        </div>

                        {optionsLoading && (
                            <p className="mt-3 text-xs text-slate-400">
                                Loading filter options…
                            </p>
                        )}
                    </section>

                    {/* Notification */}
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

                        {/* Desktop column headers */}
                        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(150px,1fr)_minmax(130px,0.8fr)_minmax(130px,0.8fr)_minmax(120px,0.7fr)] gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 lg:grid">
                            <span>Task / Project</span>
                            <span>Task Group</span>
                            <span>Priority</span>
                            <span>Dates</span>
                            <span>Last Updated</span>
                        </div>

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
                            <EmptyState
                                archivedTasks={archivedTasks}
                                archivedProjects={archivedProjects}
                                hasFilters={hasFilters}
                                onReset={resetFilters}
                            />
                        ) : (
                            <div
                                className={cn(
                                    'divide-y divide-slate-100',
                                    loading && 'opacity-60',
                                )}
                            >
                                {tasks.map((task) => (
                                    <TaskRow
                                        key={getTaskId(task)}
                                        task={task}
                                        mode={mode}
                                        onOpen={openTask}
                                        onRestore={handleRestore}
                                        restoring={
                                            restoringId === getTaskId(task)
                                        }
                                    />
                                ))}
                            </div>
                        )}

                        {!error && (
                            <Pagination
                                pagination={pagination}
                                onPageChange={handlePageChange}
                                loading={loading}
                            />
                        )}
                    </section>

                    <p className="pb-2 text-xs text-slate-400">
                        Showing your accessible projects only. Archived and completed projects may contain read-only tasks.
                    </p>
                </div>
            </div>

            {/* Existing shared task drawer */}
            {selectedTask && (
                <TaskDrawer
                    key={selectedTask.id}
                    taskId={selectedTask.id}
                    projectId={
                        selectedTask.project_id ||
                        selectedTask.project?.id
                    }
                    options={options}
                    onClose={closeTask}
                    onCardChange={handleCardChange}
                    onArchived={refreshCurrentPage}
                    onRestored={refreshCurrentPage}
                />
            )}
        </AuthenticatedLayout>
    );
}