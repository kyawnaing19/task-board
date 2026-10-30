import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import RowActionsMenu from '@/Components/RowActionsMenu';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import CreateProjectModal from './Partials/CreateProjectModal';
import ConfirmationModal from '@/Components/ConfirmationModal';

import { formatDate, isOverdue } from '@/lib/dates';

const STATUS_STYLES = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    COMPLETED: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
};

const TABS = [
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'archived', label: 'Archived' },
];

const EMPTY_MESSAGES = {
    active: 'No active projects. Create the first one.',
    completed: 'No completed projects.',
    archived: 'No archived projects.',
};

export default function Index({
    projects,
    filters,
    filter_options = {},
    type_suggestions = [],
}) {
    const { flash, errors } = usePage().props;

    const [createOpen, setCreateOpen] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const [processing, setProcessing] = useState(false);

    const rows = projects.data ?? [];
    const current = filters.status ?? 'active';

    const teams = filter_options.teams ?? [];
    const employees = filter_options.employees ?? [];
    const selected = filter_options.selected ?? {};

    /*
    |--------------------------------------------------------------------------
    | Filter Helpers
    |--------------------------------------------------------------------------
    */

    const hasFilters = Boolean(
        filters.type ||
        filters.team_id ||
        filters.employee_id
    );

    const applyFilters = (changes = {}) => {
        const next = {
            status:
                filters.status !== 'active'
                    ? filters.status
                    : undefined,

            type: filters.type || undefined,
            team_id: filters.team_id || undefined,
            employee_id: filters.employee_id || undefined,

            ...changes,
        };

        Object.keys(next).forEach((key) => {
            if (
                next[key] === undefined ||
                next[key] === null ||
                next[key] === ''
            ) {
                delete next[key];
            }
        });

        router.get(
            route('projects.index'),
            next,
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const clearFilters = () => {
        applyFilters({
            type: undefined,
            team_id: undefined,
            employee_id: undefined,
        });
    };

    /*
    |--------------------------------------------------------------------------
    | Confirmation Actions
    |--------------------------------------------------------------------------
    */

    const act = (
        method,
        url,
        title,
        message,
        data = {},
        variant = 'danger',
    ) => {
        setConfirmation({
            method,
            url,
            title,
            message,
            data,
            variant,
        });
    };

    const confirmAction = () => {
        if (!confirmation || processing) return;

        setProcessing(true);

        router[confirmation.method](
            confirmation.url,
            confirmation.data,
            {
                preserveScroll: true,

                onFinish: () => {
                    setProcessing(false);
                    setConfirmation(null);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Project Actions Menu
    |--------------------------------------------------------------------------
    */

    const menuItems = (project) => {
        const detailItem = {
            label: 'Detail',

            onClick: () => {
                router.visit(
                    route('projects.show', project.id),
                );
            },
        };

        if (project.archived_at) {
            return [
                detailItem,
                {
                    label: 'Restore',

                    onClick: () =>
                        act(
                            'post',
                            route('projects.restore', project.id),
                            'Restore project?',
                            `Restore ${project.code}? It returns as a completed, read-only project.`,
                            {},
                            'primary',
                        ),
                },
            ];
        }

        if (project.status === 'COMPLETED') {
            return [
                detailItem,
                {
                    label: 'Reopen project',

                    onClick: () =>
                        act(
                            'patch',
                            route('projects.status', project.id),
                            'Reopen project?',
                            `Reopen ${project.code}? It becomes editable again.`,
                            { status: 'ACTIVE' },
                            'primary',
                        ),
                },
                {
                    label: 'Archive',
                    danger: true,
                    separatorBefore: true,

                    onClick: () =>
                        act(
                            'post',
                            route('projects.archive', project.id),
                            'Archive project?',
                            `Archive ${project.code}? It stays read-only and is only visible from the Archived filter.`,
                        ),
                },
            ];
        }

        return [
            detailItem,
            {
                label: 'Mark as completed',

                onClick: () =>
                    act(
                        'patch',
                        route('projects.status', project.id),
                        'Complete project?',
                        `Mark ${project.code} as completed? The project, its teams, members and tasks become read-only.`,
                        { status: 'COMPLETED' },
                    ),
            },
        ];
    };

    /*
    |--------------------------------------------------------------------------
    | Tab Styles
    |--------------------------------------------------------------------------
    */

    const tabClass = (active) =>
        `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;

    /*
    |--------------------------------------------------------------------------
    | Filter Select Styles
    |--------------------------------------------------------------------------
    */

    const selectClass =
        'h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

    return (
        <AuthenticatedLayout header="Projects">
            <Head title="Projects" />

            <div className="w-full space-y-6">

                {/* Page Heading */}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage and track your projects.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4v16m8-8H4"
                            />
                        </svg>

                        New project
                    </button>
                </div>

                {/* Success Message */}

                {flash?.success && (
                    <div
                        role="status"
                        className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    >
                        <svg
                            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m5 12 4 4L19 6"
                            />
                        </svg>

                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Action Error Message */}

                {(errors?.project || errors?.status) && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                        <svg
                            className="mt-0.5 h-5 w-5 shrink-0 text-rose-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 16.5h.008v.008H12V16.5Z"
                            />
                        </svg>

                        <div>
                            <p className="font-semibold">
                                Action could not be completed
                            </p>

                            <p className="mt-0.5">
                                {errors.project || errors.status}
                            </p>
                        </div>
                    </div>
                )}

                {/* Project List */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* Status Tabs */}

                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-50 p-1">
                            {TABS.map((tab) => (
                                <Link
                                    key={tab.key}
                                    href={route('projects.index', {
                                        ...(tab.key !== 'active'
                                            ? { status: tab.key }
                                            : {}),

                                        ...(filters.type
                                            ? { type: filters.type }
                                            : {}),

                                        ...(filters.team_id
                                            ? { team_id: filters.team_id }
                                            : {}),

                                        ...(filters.employee_id
                                            ? {
                                                employee_id:
                                                    filters.employee_id,
                                            }
                                            : {}),
                                    })}
                                    preserveScroll
                                    className={tabClass(
                                        current === tab.key,
                                    )}
                                    aria-current={
                                        current === tab.key
                                            ? 'page'
                                            : undefined
                                    }
                                >
                                    {tab.label}
                                </Link>
                            ))}
                        </div>

                        {/* Project Count */}

                        <p className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-700">
                                {projects.total}
                            </span>{' '}
                            {projects.total === 1
                                ? 'project'
                                : 'projects'}
                        </p>
                    </div>

                    {/* Filters */}

                    <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                            {/* Filter Controls */}

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">

                                {/* Project Type */}

                                <div className="relative">
                                    <select
                                        value={filters.type ?? ''}
                                        aria-label="Filter by project type"
                                        onChange={(e) =>
                                            applyFilters({
                                                type:
                                                    e.target.value ||
                                                    undefined,
                                            })
                                        }
                                        className={`${selectClass} w-full lg:min-w-[145px] lg:max-w-[190px]`}
                                    >
                                        <option value="">
                                            All types
                                        </option>

                                        {type_suggestions.map((type) => (
                                            <option
                                                key={type}
                                                value={type}
                                            >
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Team */}

                                <div className="relative">
                                    <select
                                        value={filters.team_id ?? ''}
                                        aria-label="Filter by team"
                                        onChange={(e) =>
                                            applyFilters({
                                                team_id:
                                                    e.target.value ||
                                                    undefined,
                                            })
                                        }
                                        className={`${selectClass} w-full lg:min-w-[145px] lg:max-w-[200px]`}
                                    >
                                        <option value="">
                                            All teams
                                        </option>

                                        {selected.team &&
                                            !teams.some(
                                                (team) =>
                                                    String(team.id) ===
                                                    String(selected.team.id),
                                            ) && (
                                                <option value={selected.team.id}>
                                                    {selected.team.name}
                                                    {selected.team.archived
                                                        ? ' (Archived)'
                                                        : ''}
                                                </option>
                                            )}

                                        {teams.map((team) => (
                                            <option
                                                key={team.id}
                                                value={team.id}
                                            >
                                                {team.name}
                                                {team.archived
                                                    ? ' (Archived)'
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Employee */}

                                <div className="relative">
                                    <select
                                        value={filters.employee_id ?? ''}
                                        aria-label="Filter by employee"
                                        onChange={(e) =>
                                            applyFilters({
                                                employee_id:
                                                    e.target.value ||
                                                    undefined,
                                            })
                                        }
                                        className={`${selectClass} w-full lg:min-w-[165px] lg:max-w-[230px]`}
                                    >
                                        <option value="">
                                            All employees
                                        </option>

                                        {selected.employee &&
                                            !employees.some(
                                                (employee) =>
                                                    String(employee.id) ===
                                                    String(selected.employee.id),
                                            ) && (
                                                <option
                                                    value={selected.employee.id}
                                                >
                                                    {selected.employee.name}
                                                    {!selected.employee.active
                                                        ? ' (Inactive)'
                                                        : ''}
                                                </option>
                                            )}

                                        {employees.map((employee) => (
                                            <option
                                                key={employee.id}
                                                value={employee.id}
                                            >
                                                {employee.name}
                                                {employee.job_title
                                                    ? ` — ${employee.job_title}`
                                                    : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Clear Filters */}

                            <div className="flex items-center justify-between gap-3">
                                {hasFilters ? (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                                    >
                                        <svg
                                            className="h-3.5 w-3.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M6 6l12 12M18 6L6 18"
                                            />
                                        </svg>

                                        Clear filters
                                    </button>
                                ) : (
                                    <span className="text-xs text-slate-400">
                                        Filter projects
                                    </span>
                                )}

                                <p className="whitespace-nowrap text-xs text-slate-500 lg:hidden">
                                    {projects.total} projects
                                </p>
                            </div>
                        </div>

                        {/* Active Filter Indicators */}

                        {hasFilters && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-slate-400">
                                    Active filters:
                                </span>

                                {filters.type && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-100">
                                        Type: {filters.type}

                                        <button
                                            type="button"
                                            aria-label="Remove type filter"
                                            onClick={() =>
                                                applyFilters({
                                                    type: undefined,
                                                })
                                            }
                                            className="ml-1 rounded hover:text-indigo-900"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}

                                {filters.team_id && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-100">
                                        Team:{' '}
                                        {selected.team?.name ??
                                            teams.find(
                                                (team) =>
                                                    String(team.id) ===
                                                    String(filters.team_id),
                                            )?.name ??
                                            `#${filters.team_id}`}

                                        <button
                                            type="button"
                                            aria-label="Remove team filter"
                                            onClick={() =>
                                                applyFilters({
                                                    team_id: undefined,
                                                })
                                            }
                                            className="ml-1 rounded hover:text-violet-900"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}

                                {filters.employee_id && (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-100">
                                        Employee:{' '}
                                        {selected.employee?.name ??
                                            employees.find(
                                                (employee) =>
                                                    String(employee.id) ===
                                                    String(filters.employee_id),
                                            )?.name ??
                                            `#${filters.employee_id}`}

                                        <button
                                            type="button"
                                            aria-label="Remove employee filter"
                                            onClick={() =>
                                                applyFilters({
                                                    employee_id: undefined,
                                                })
                                            }
                                            className="ml-1 rounded hover:text-emerald-900"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Responsive Table with Vertical Scroll */}

                    <div className="w-full max-h-[calc(100dvh-360px)] min-h-[200px] overflow-auto overscroll-contain">

                        <table className="w-full min-w-[650px] divide-y divide-slate-200 text-sm">

                            <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3.5">
                                        Project
                                    </th>

                                    <th className="px-5 py-3.5">
                                        Status
                                    </th>

                                    <th className="hidden px-5 py-3.5 md:table-cell">
                                        Start date
                                    </th>

                                    <th className="px-5 py-3.5">
                                        Due date
                                    </th>

                                    <th className="px-5 py-3.5 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {/* Empty State */}

                                {rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-16 text-center"
                                        >
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                                <svg
                                                    className="h-6 w-6"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={1.6}
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M3.75 6.75h16.5v12.5H3.75zM7 6.75V4.75h10v2M8 11h8m-8 4h5"
                                                    />
                                                </svg>
                                            </div>

                                            <p className="mt-3 text-sm font-medium text-slate-800">
                                                {hasFilters
                                                    ? 'No projects match your filters.'
                                                    : EMPTY_MESSAGES[current] ||
                                                      'No projects found.'}
                                            </p>

                                            {hasFilters && (
                                                <button
                                                    type="button"
                                                    onClick={clearFilters}
                                                    className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    Clear all filters
                                                </button>
                                            )}

                                            {!hasFilters && current === 'active' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCreateOpen(true)}
                                                    className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    Create a project
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}

                                {/* Project Rows */}

                                {rows.map((project, index) => {
                                    const overdue = isOverdue(project);

                                    return (
                                        <tr
                                            key={project.id}
                                            className="cursor-pointer transition-colors hover:bg-blue-50/80"
                                            onClick={(event) => {
                                                if (
                                                    event.target.closest(
                                                        'button, a, [role="menu"], [role="menuitem"]',
                                                    )
                                                ) {
                                                    return;
                                                }

                                                router.visit(
                                                    route('projects.show', project.id),
                                                );
                                            }}
                                        >
                                            {/* Project Details */}

                                            <td className="px-5 py-4">
                                                <div className="flex min-w-0 items-center gap-3">

                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600 ring-1 ring-inset ring-indigo-100">
                                                        {(project.name || 'P')
                                                            .trim()
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="truncate font-semibold text-slate-800">
                                                                {project.name}
                                                            </span>

                                                            {project.archived_at && (
                                                                <span className="inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                                                                    Archived
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                            {project.code}
                                                        </p>

                                                        {/* {project.description && (
                                                            <p className="mt-1 max-w-[280px] truncate text-xs text-slate-400">
                                                                {project.description}
                                                            </p>
                                                        )} */}

                                                        {project.type && (
                                                            <p className="mt-1 text-[11px] font-medium text-indigo-500">
                                                                {project.type}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        STATUS_STYLES[project.status] ??
                                                        'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            project.status === 'ACTIVE'
                                                                ? 'bg-emerald-500'
                                                                : project.status === 'COMPLETED'
                                                                  ? 'bg-sky-500'
                                                                  : 'bg-slate-400'
                                                        }`}
                                                    />

                                                    {project.status === 'ACTIVE'
                                                        ? 'Active'
                                                        : project.status === 'COMPLETED'
                                                          ? 'Completed'
                                                          : project.status}
                                                </span>
                                            </td>

                                            {/* Start Date */}

                                            <td className="hidden whitespace-nowrap px-5 py-4 text-slate-600 md:table-cell">
                                                {formatDate(project.start_date)}
                                            </td>

                                            {/* Due Date */}

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span
                                                        className={
                                                            overdue
                                                                ? 'font-medium text-rose-600'
                                                                : 'text-slate-600'
                                                        }
                                                    >
                                                        {formatDate(project.due_date)}
                                                    </span>

                                                    {overdue && (
                                                        <span className="inline-flex items-center rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 ring-1 ring-inset ring-rose-100">
                                                            Overdue
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}

                                            <td
                                                className="px-5 py-3 text-right"
                                                onClick={(event) => event.stopPropagation()}
                                                onKeyDown={(event) => event.stopPropagation()}
                                            >
                                                <div className="flex justify-end">
                                                    <RowActionsMenu
                                                        items={menuItems(project)}
                                                        dropUp={
                                                            rows.length > 3 &&
                                                            index >= rows.length - 2
                                                        }
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Outside Scroll Container */}

                    {projects.links.length > 3 && (
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

                            <p className="text-xs text-slate-500">
                                Showing{' '}

                                <span className="font-medium text-slate-700">
                                    {projects.from ?? 0}
                                </span>

                                {' '}to{' '}

                                <span className="font-medium text-slate-700">
                                    {projects.to ?? 0}
                                </span>

                                {' '}of{' '}

                                <span className="font-medium text-slate-700">
                                    {projects.total}
                                </span>
                            </p>

                            <div className="flex flex-wrap items-center gap-1">
                                {projects.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        aria-current={
                                            link.active ? 'page' : undefined
                                        }
                                        aria-disabled={!link.url}
                                        className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                            link.active
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : link.url
                                                  ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                  : 'pointer-events-none text-slate-300'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Project Modal */}

            <CreateProjectModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                typeSuggestions={type_suggestions}
            />

            {/* Confirmation Modal */}

            <ConfirmationModal
                show={Boolean(confirmation)}
                title={confirmation?.title ?? 'Are you sure?'}
                message={confirmation?.message ?? ''}
                confirmText="Confirm"
                cancelText="Cancel"
                variant={confirmation?.variant ?? 'danger'}
                processing={processing}
                onConfirm={confirmAction}
                onCancel={() => {
                    if (!processing) {
                        setConfirmation(null);
                    }
                }}
            />
        </AuthenticatedLayout>
    );
}
