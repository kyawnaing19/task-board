import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import Avatar from '@/Components/Avatar';
import { getJson } from '@/lib/http';

const PER_PAGE = 25;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatNumber(value) {
    return new Intl.NumberFormat().format(Number(value ?? 0));
}

function formatDateTime(value) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getUrl(name, fallback, params = {}) {
    const base =
        typeof route === 'function'
            ? route(name, params)
            : fallback;

    const url = new URL(base, window.location.origin);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, String(value));
        } else {
            url.searchParams.delete(key);
        }
    });

    return url.toString();
}

function normalizePaginator(value) {
    if (Array.isArray(value)) {
        return {
            data: value,
            current_page: 1,
            last_page: 1,
            per_page: PER_PAGE,
            total: value.length,
        };
    }

    return {
        data: Array.isArray(value?.data) ? value.data : [],
        current_page: Number(value?.current_page ?? 1),
        last_page: Number(value?.last_page ?? 1),
        per_page: Number(value?.per_page ?? PER_PAGE),
        total: Number(value?.total ?? value?.data?.length ?? 0),
    };
}

/*
|--------------------------------------------------------------------------
| Icons
|--------------------------------------------------------------------------
*/

function Icon({ name, className = 'h-5 w-5' }) {
    const common = {
        className,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        viewBox: '0 0 24 24',
        'aria-hidden': true,
    };

    switch (name) {
        case 'projects':
            return (
                <svg {...common}>
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M8 4V2.5h8V4M3 9h18M8 13h3M8 16h7" />
                </svg>
            );

        case 'tasks':
            return (
                <svg {...common}>
                    <rect x="4" y="3" width="16" height="18" rx="2" />
                    <path d="m8 9 1.5 1.5L12 8M14 10h2M8 15h8" />
                </svg>
            );

        case 'overdue':
            return (
                <svg {...common}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                </svg>
            );

        case 'calendar':
            return (
                <svg {...common}>
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M3 10h18M8 14h2M14 14h2M8 17h2" />
                </svg>
            );

        case 'refresh':
            return (
                <svg {...common}>
                    <path d="M20 7v5h-5M4 17v-5h5" />
                    <path d="M5.5 9A7 7 0 0 1 17 5l3 7M4 12l3 7a7 7 0 0 0 11.5-4" />
                </svg>
            );

        case 'chevron-left':
            return (
                <svg {...common}>
                    <path d="m15 18-6-6 6-6" />
                </svg>
            );

        case 'chevron-right':
            return (
                <svg {...common}>
                    <path d="m9 18 6-6-6-6" />
                </svg>
            );

        default:
            return null;
    }
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
    title,
    value,
    description,
    icon,
    iconClass,
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        {formatNumber(value)}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Section Header
|--------------------------------------------------------------------------
*/

function SectionHeader({
    title,
    description,
    count,
    action,
}) {
    return (
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-slate-900">
                        {title}
                    </h2>

                    {count !== undefined && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {formatNumber(count)}
                        </span>
                    )}
                </div>

                {description && (
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                        {description}
                    </p>
                )}
            </div>

            {action && (
                <div className="shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Empty State
|--------------------------------------------------------------------------
*/

function EmptyState({
    title,
    description,
}) {
    return (
        <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Icon name="tasks" className="h-6 w-6" />
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-800">
                {title}
            </p>

            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                {description}
            </p>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Error Message
|--------------------------------------------------------------------------
*/

function ErrorMessage({
    message,
    onRetry,
}) {
    if (!message) return null;

    return (
        <div
            role="alert"
            className="flex flex-col gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div>
                <p className="text-sm font-semibold text-rose-800">
                    Something went wrong
                </p>

                <p className="mt-1 text-sm text-rose-700">
                    {message}
                </p>
            </div>

            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="shrink-0 self-start rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                    Try again
                </button>
            )}
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Pagination
|--------------------------------------------------------------------------
*/

function Pagination({
    paginator,
    loading,
    onPageChange,
}) {
    const currentPage = paginator.current_page || 1;
    const lastPage = Math.max(paginator.last_page || 1, 1);
    const total = paginator.total || 0;
    const perPage = paginator.per_page || PER_PAGE;

    if (lastPage <= 1) return null;

    const from =
        total === 0
            ? 0
            : (currentPage - 1) * perPage + 1;

    const to = Math.min(currentPage * perPage, total);

    return (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="font-medium text-slate-700">
                    {formatNumber(from)}
                </span>
                {' '}to{' '}
                <span className="font-medium text-slate-700">
                    {formatNumber(to)}
                </span>
                {' '}of{' '}
                <span className="font-medium text-slate-700">
                    {formatNumber(total)}
                </span>
            </p>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={loading || currentPage <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Icon
                        name="chevron-left"
                        className="h-4 w-4"
                    />
                    Previous
                </button>

                <span className="whitespace-nowrap px-2 text-sm text-slate-500">
                    Page {currentPage} of {lastPage}
                </span>

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={loading || currentPage >= lastPage}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <Icon
                        name="chevron-right"
                        className="h-4 w-4"
                    />
                </button>
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Project Progress
|--------------------------------------------------------------------------
*/

function ProgressBar({ progress }) {
    const total = Number(progress?.total ?? 0);
    const completed = Number(progress?.completed ?? 0);

    const hasTasks =
        !progress?.no_tasks &&
        total > 0;

    if (!hasTasks) {
        return (
            <div className="min-w-32">
                <p className="text-sm font-medium text-slate-400">
                    —
                </p>

                <p className="mt-1 text-xs text-slate-400">
                    No tasks
                </p>
            </div>
        );
    }

    const percent = Math.max(
        0,
        Math.min(100, Number(progress?.percent ?? 0)),
    );

    return (
        <div className="min-w-32">
            <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">
                    {percent}%
                </span>

                <span className="whitespace-nowrap text-xs text-slate-400">
                    {formatNumber(completed)} / {formatNumber(total)}
                </span>
            </div>

            <div
                className="h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Project completion"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
            >
                <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{
                        width: `${percent}%`,
                    }}
                />
            </div>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Active Projects Table
|--------------------------------------------------------------------------
*/

function ProjectTable({
    paginator,
    loading,
}) {
    const projects = paginator.data ?? [];

    if (loading && projects.length === 0) {
        return (
            <div className="px-5 py-12 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                <p className="mt-3 text-sm text-slate-500">
                    Loading projects...
                </p>
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <EmptyState
                title="No active projects"
                description="Active projects will appear here when they are available."
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3">
                            Project
                        </th>

                        <th className="px-5 py-3 text-right">
                            Open Tasks
                        </th>

                        <th className="px-5 py-3 text-right">
                            Overdue
                        </th>

                        <th className="px-5 py-3">
                            Progress
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {projects.map((project) => (
                        <tr
                            key={project.id}
                            className="transition hover:bg-slate-50/80"
                        >
                            <td className="px-5 py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                                        <Icon name="projects" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="break-words text-sm font-semibold text-slate-900">
                                            {project.name}
                                        </p>

                                        <p className="mt-1 font-mono text-xs text-slate-400">
                                            {project.code || `PRJ-${project.id}`}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            <td className="px-5 py-4 text-right">
                                <span className="inline-flex min-w-9 justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-semibold text-slate-700">
                                    {formatNumber(project.open_tasks)}
                                </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                                <span
                                    className={`inline-flex min-w-9 justify-center rounded-lg px-2.5 py-1.5 text-sm font-semibold ${
                                        Number(project.overdue_tasks ?? 0) > 0
                                            ? 'bg-rose-50 text-rose-700'
                                            : 'bg-slate-50 text-slate-500'
                                    }`}
                                >
                                    {formatNumber(project.overdue_tasks)}
                                </span>
                            </td>

                            <td className="px-5 py-4">
                                <ProgressBar
                                    progress={project.progress}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Employee Workload Table
|--------------------------------------------------------------------------
*/

function WorkloadTable({
    paginator,
    loading,
}) {
    const employees = paginator.data ?? [];

    if (loading && employees.length === 0) {
        return (
            <div className="px-5 py-12 text-center">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                <p className="mt-3 text-sm text-slate-500">
                    Loading employee workload...
                </p>
            </div>
        );
    }

    if (employees.length === 0) {
        return (
            <EmptyState
                title="No active employees"
                description="Active employees will appear here when they are available."
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
                <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-5 py-3">
                            Employee
                        </th>

                        <th className="px-5 py-3 text-right">
                            Assigned Open
                        </th>

                        <th className="px-5 py-3 text-right">
                            Overdue
                        </th>

                        <th className="px-5 py-3 text-right">
                            Due Soon
                        </th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                    {employees.map((employee) => (
                        <tr
                            key={employee.id}
                            className="transition hover:bg-slate-50/80"
                        >
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        user={employee}
                                        size="sm"
                                    />

                                    <div className="min-w-0">
                                        <p className="break-words text-sm font-semibold text-slate-900">
                                            {employee.name}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {employee.job_title || 'Employee'}
                                        </p>
                                    </div>
                                </div>
                            </td>

                            <td className="px-5 py-4 text-right">
                                <span className="font-semibold text-slate-800">
                                    {formatNumber(employee.assigned_open)}
                                </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                                <span
                                    className={`font-semibold ${
                                        Number(employee.overdue ?? 0) > 0
                                            ? 'text-rose-600'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    {formatNumber(employee.overdue)}
                                </span>
                            </td>

                            <td className="px-5 py-4 text-right">
                                <span
                                    className={`font-semibold ${
                                        Number(employee.due_soon ?? 0) > 0
                                            ? 'text-amber-600'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    {formatNumber(employee.due_soon)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
*/

export default function AdminDashboard() {
    const [overview, setOverview] = useState(null);

    const [projects, setProjects] = useState(
        normalizePaginator(null),
    );

    const [workload, setWorkload] = useState(
        normalizePaginator(null),
    );

    const [workloadSort, setWorkloadSort] = useState('workload');

    const [loading, setLoading] = useState(true);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [workloadLoading, setWorkloadLoading] = useState(false);

    const [error, setError] = useState('');
    const [projectsError, setProjectsError] = useState('');
    const [workloadError, setWorkloadError] = useState('');

    const [refreshKey, setRefreshKey] = useState(0);

    /*
     * Keep references to the latest requests.
     * Older requests are cancelled when a newer request starts.
     */
    const projectsControllerRef = useRef(null);
    const workloadControllerRef = useRef(null);

    const projectsRequestIdRef = useRef(0);
    const workloadRequestIdRef = useRef(0);

    /*
    |--------------------------------------------------------------------------
    | Load initial overview
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        const controller = new AbortController();

        async function loadOverview() {
            setLoading(true);
            setError('');

            try {
                const data = await getJson(
                    getUrl(
                        'dashboard.data',
                        '/dashboard/data',
                    ),
                    controller.signal,
                );

                if (controller.signal.aborted) return;

                setOverview(data);

                // The backend overview already contains the first page
                // of projects and workload.
                setProjects(
                    normalizePaginator(data.projects),
                );

                setWorkload(
                    normalizePaginator(data.workload),
                );
            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError(
                        err.message ||
                            'Unable to load the dashboard.',
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        loadOverview();

        return () => {
            controller.abort();
        };
    }, [refreshKey]);

    /*
    |--------------------------------------------------------------------------
    | Load project page
    |--------------------------------------------------------------------------
    */

    const loadProjects = useCallback(async (page) => {
        projectsControllerRef.current?.abort();

        const controller = new AbortController();
        const requestId = ++projectsRequestIdRef.current;

        projectsControllerRef.current = controller;

        setProjectsLoading(true);
        setProjectsError('');

        try {
            const data = await getJson(
                getUrl(
                    'dashboard.admin.projects',
                    '/dashboard/admin/projects',
                    {
                        page,
                        per_page: PER_PAGE,
                    },
                ),
                controller.signal,
            );

            if (
                controller.signal.aborted ||
                requestId !== projectsRequestIdRef.current
            ) {
                return;
            }

            setProjects(normalizePaginator(data));
        } catch (err) {
            if (
                err.name !== 'AbortError' &&
                requestId === projectsRequestIdRef.current
            ) {
                setProjectsError(
                    err.message || 'Unable to load projects.',
                );
            }
        } finally {
            if (requestId === projectsRequestIdRef.current) {
                setProjectsLoading(false);
            }
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Load employee workload page
    |--------------------------------------------------------------------------
    */

    const loadWorkload = useCallback(async (page, sort) => {
        workloadControllerRef.current?.abort();

        const controller = new AbortController();
        const requestId = ++workloadRequestIdRef.current;

        workloadControllerRef.current = controller;

        setWorkloadLoading(true);
        setWorkloadError('');

        try {
            const data = await getJson(
                getUrl(
                    'dashboard.admin.workload',
                    '/dashboard/admin/workload',
                    {
                        page,
                        per_page: PER_PAGE,
                        sort,
                    },
                ),
                controller.signal,
            );

            if (
                controller.signal.aborted ||
                requestId !== workloadRequestIdRef.current
            ) {
                return;
            }

            setWorkload(normalizePaginator(data));
        } catch (err) {
            if (
                err.name !== 'AbortError' &&
                requestId === workloadRequestIdRef.current
            ) {
                setWorkloadError(
                    err.message ||
                        'Unable to load employee workload.',
                );
            }
        } finally {
            if (requestId === workloadRequestIdRef.current) {
                setWorkloadLoading(false);
            }
        }
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Event handlers
    |--------------------------------------------------------------------------
    */

    function handleWorkloadSort(event) {
        const sort = event.target.value;

        setWorkloadSort(sort);

        loadWorkload(1, sort);
    }

    function refreshDashboard() {
        projectsControllerRef.current?.abort();
        workloadControllerRef.current?.abort();

        setRefreshKey((current) => current + 1);
    }

    /*
    |--------------------------------------------------------------------------
    | Cleanup pending requests on unmount
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        return () => {
            projectsControllerRef.current?.abort();
            workloadControllerRef.current?.abort();
        };
    }, []);

    const summary = overview?.summary ?? {};

    return (
        <div className="-mx-4 -my-4 min-h-full w-auto bg-slate-50 sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8">
            <div className="w-full space-y-6 px-4 pb-6 pt-0 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">

                {/* Page heading */}

                <div className="mt-1 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {overview?.generated_at && (
                        <p className="text-xs text-slate-400">
                            Last updated: {formatDateTime(overview.generated_at)}
                            {overview.timezone
                                ? ` · ${overview.timezone}`
                                : ''}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={refreshDashboard}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                    >
                        <Icon
                            name="refresh"
                            className={`h-4 w-4 ${
                                loading ? 'animate-spin' : ''
                            }`}
                        />

                        Refresh
                    </button>
                </div>

                {/* Last updated */}

                

                {/* Main error */}

                <ErrorMessage
                    message={error}
                    onRetry={refreshDashboard}
                />

                {/* Four summary cards */}

                <section aria-label="Company summary">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                        <SummaryCard
                            title="Active Projects"
                            value={summary.active_projects}
                            description="Active, non-archived projects"
                            icon={
                                <Icon
                                    name="projects"
                                    className="h-5 w-5"
                                />
                            }
                            iconClass="bg-indigo-50 text-indigo-600"
                        />

                        <SummaryCard
                            title="Open Tasks"
                            value={summary.open_tasks}
                            description="Open tasks across active projects"
                            icon={
                                <Icon
                                    name="tasks"
                                    className="h-5 w-5"
                                />
                            }
                            iconClass="bg-sky-50 text-sky-600"
                        />

                        <SummaryCard
                            title="Overdue Tasks"
                            value={summary.overdue_tasks}
                            description="Open tasks past their end date"
                            icon={
                                <Icon
                                    name="overdue"
                                    className="h-5 w-5"
                                />
                            }
                            iconClass="bg-rose-50 text-rose-600"
                        />

                        <SummaryCard
                            title="Due Soon"
                            value={summary.due_soon_tasks}
                            description="Tasks due within the configured due-soon window"
                            icon={
                                <Icon
                                    name="calendar"
                                    className="h-5 w-5"
                                />
                            }
                            iconClass="bg-amber-50 text-amber-600"
                        />
                    </div>

                    {loading && !overview && (
                        <p className="mt-3 text-xs text-slate-400">
                            Loading company totals...
                        </p>
                    )}
                </section>

                {/* Active Projects */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader
                        title="Active Projects"
                        description="Review open tasks, overdue work, and completion progress for each project."
                        count={projects.total}
                    />

                    <ErrorMessage
                        message={projectsError}
                        onRetry={() =>
                            loadProjects(
                                projects.current_page || 1,
                            )
                        }
                    />

                    <ProjectTable
                        paginator={projects}
                        loading={loading || projectsLoading}
                    />

                    <Pagination
                        paginator={projects}
                        loading={projectsLoading}
                        onPageChange={loadProjects}
                    />
                </section>

                {/* Employee Workload */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <SectionHeader
                        title="Employee Workload"
                        description="Current assignments across active projects. Multi-assignee tasks count once for each assigned employee."
                        count={workload.total}
                        action={
                            <label className="flex items-center gap-2">
                                <span className="whitespace-nowrap text-sm font-medium text-slate-500">
                                    Sort by
                                </span>

                                <select
                                    value={workloadSort}
                                    onChange={handleWorkloadSort}
                                    disabled={workloadLoading}
                                    className="rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <option value="workload">
                                        Highest workload
                                    </option>

                                    <option value="name">
                                        Employee name
                                    </option>
                                </select>
                            </label>
                        }
                    />

                    <ErrorMessage
                        message={workloadError}
                        onRetry={() =>
                            loadWorkload(
                                workload.current_page || 1,
                                workloadSort,
                            )
                        }
                    />

                    <WorkloadTable
                        paginator={workload}
                        loading={loading || workloadLoading}
                    />

                    <Pagination
                        paginator={workload}
                        loading={workloadLoading}
                        onPageChange={(page) =>
                            loadWorkload(page, workloadSort)
                        }
                    />
                </section>

                {/* Footer */}

                <div className="pb-2 text-center">
                    <p className="text-xs leading-5 text-slate-400">
                        Archived projects and archived tasks are excluded
                        from dashboard metrics.
                    </p>
                </div>
            </div>
        </div>
    );
}