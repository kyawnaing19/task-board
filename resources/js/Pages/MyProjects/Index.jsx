import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RowActionsMenu from '@/Components/RowActionsMenu';
import CreateProjectModal from '@/Pages/Projects/Partials/CreateProjectModal';

/**
 * Format date for display.
 * Example: 28 Oct 2026
 */
const formatDate = (date) => {
    if (!date) return '—';

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
        return '—';
    }

    return parsedDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

/**
 * Check whether an active project is overdue.
 */
const isOverdue = (project) => {
    if (!project?.due_date) return false;

    if (project.status !== 'active' || project.archived_at) {
        return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(`${project.due_date}T00:00:00`);

    return (
        !Number.isNaN(dueDate.getTime()) &&
        dueDate < today
    );
};

const statusTabs = [
    {
        label: 'Active',
        value: 'active',
    },
    {
        label: 'Completed',
        value: 'completed',
    },
    {
        label: 'Archived',
        value: 'archived',
    },
];

const getStatusStyle = (status) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';

        case 'completed':
            return 'bg-blue-50 text-blue-700 ring-blue-600/20';

        case 'archived':
            return 'bg-slate-100 text-slate-600 ring-slate-500/20';

        default:
            return 'bg-slate-100 text-slate-600 ring-slate-500/20';
    }
};

const getStatusLabel = (status) => {
    switch (status) {
        case 'active':
            return 'Active';

        case 'completed':
            return 'Completed';

        case 'archived':
            return 'Archived';

        default:
            return status || 'Unknown';
    }
};

export default function Index({
    projects,
    filters = {},
    can_create = false,
    typeSuggestions = [],
}) {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const currentStatus = filters?.status ?? 'active';

    // Laravel paginator or a plain array are both supported.
    const rows = Array.isArray(projects?.data)
        ? projects.data
        : Array.isArray(projects)
          ? projects
          : [];

    const paginationLinks = Array.isArray(projects?.links)
        ? projects.links
        : [];

    const currentPage = Number(projects?.current_page ?? 1);
    const lastPage = Number(projects?.last_page ?? 1);
    const totalProjects = Number(projects?.total ?? rows.length);
    const perPage = Number(projects?.per_page ?? (rows.length || 1));

    const from = totalProjects === 0
        ? 0
        : (currentPage - 1) * perPage + 1;

    const to = Math.min(
        (currentPage - 1) * perPage + rows.length,
        totalProjects,
    );

    const changeStatus = (status) => {
        router.get(
            route('my-projects.index'),
            { status },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const openProject = (project) => {
        router.visit(route('my-projects.show', project.id));
    };

    const getProjectActions = (project) => [
        {
            label: 'View project',
            onClick: () => openProject(project),
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-slate-800">
                        My Projects
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        View and manage the projects you can access.
                    </p>
                </div>
            }
        >
            <Head title="My Projects" />

            <div className="min-h-screen bg-slate-50/70">
                <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                    {/* Page heading */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                Projects
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Keep track of your team projects and their progress.
                            </p>
                        </div>

                        {can_create && (
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M12 5v14M5 12h14"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                Create Project
                            </button>
                        )}
                    </div>

                    {/* Main card */}
                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Tabs and total */}
                        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div
                                className="flex gap-1 overflow-x-auto"
                                role="tablist"
                                aria-label="Project status"
                            >
                                {statusTabs.map((tab) => {
                                    const selected = currentStatus === tab.value;

                                    return (
                                        <button
                                            key={tab.value}
                                            type="button"
                                            role="tab"
                                            aria-selected={selected}
                                            onClick={() => changeStatus(tab.value)}
                                            className={[
                                                'relative shrink-0 px-4 py-3 text-sm font-medium transition',
                                                selected
                                                    ? 'text-indigo-700'
                                                    : 'text-slate-500 hover:text-slate-800',
                                            ].join(' ')}
                                        >
                                            {tab.label}

                                            {selected && (
                                                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-600" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pb-3 text-sm text-slate-500 sm:pb-0">
                                <span className="font-semibold text-slate-800">
                                    {totalProjects}
                                </span>{' '}
                                {totalProjects === 1 ? 'project' : 'projects'}
                            </div>
                        </div>

                        {/* Project table */}
                        {rows.length > 0 ? (
                            <>
                                <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[850px] border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50/80">
                                                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Project
                                                </th>

                                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Type
                                                </th>

                                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Start date
                                                </th>

                                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Due date
                                                </th>

                                                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Status
                                                </th>

                                                <th className="w-14 px-4 py-3">
                                                    <span className="sr-only">
                                                        Actions
                                                    </span>
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100">
                                            {rows.map((project) => {
                                                const overdue = isOverdue(project);

                                                return (
                                                    <tr
                                                        key={project.id}
                                                        onClick={() => openProject(project)}
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key === 'Enter' ||
                                                                event.key === ' '
                                                            ) {
                                                                event.preventDefault();
                                                                openProject(project);
                                                            }
                                                        }}
                                                        tabIndex={0}
                                                        className="group cursor-pointer transition hover:bg-slate-50/80 focus:bg-slate-50 focus:outline-none"
                                                    >
                                                        {/* Project name */}
                                                        <td className="px-6 py-4">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700">
                                                                    <svg
                                                                        className="h-5 w-5"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="1.7"
                                                                        aria-hidden="true"
                                                                    >
                                                                        <rect
                                                                            x="3"
                                                                            y="4"
                                                                            width="18"
                                                                            height="16"
                                                                            rx="2"
                                                                        />
                                                                        <path
                                                                            d="M8 4v16M8 9h13"
                                                                            strokeLinecap="round"
                                                                        />
                                                                    </svg>
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <Link
                                                                        href={route(
                                                                            'my-projects.show',
                                                                            project.id,
                                                                        )}
                                                                        onClick={(event) => event.stopPropagation()}
                                                                        className="block truncate text-sm font-semibold text-slate-800 transition hover:text-indigo-700"
                                                                    >
                                                                        {project.name}
                                                                    </Link>

                                                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                        {project.code && (
                                                                            <span className="text-xs text-slate-400">
                                                                                {project.code}
                                                                            </span>
                                                                        )}

                                                                        {overdue && (
                                                                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[11px] font-medium text-rose-600">
                                                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                                                                Overdue
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {project.description && (
                                                                        <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                                                                            {project.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Type */}
                                                        <td className="px-5 py-4">
                                                            {project.type ? (
                                                                <span className="inline-flex max-w-44 truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                                                                    {project.type}
                                                                </span>
                                                            ) : (
                                                                <span className="text-sm text-slate-400">
                                                                    —
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Start date */}
                                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                            {formatDate(project.start_date)}
                                                        </td>

                                                        {/* Due date */}
                                                        <td
                                                            className={[
                                                                'whitespace-nowrap px-5 py-4 text-sm',
                                                                overdue
                                                                    ? 'font-medium text-rose-600'
                                                                    : 'text-slate-600',
                                                            ].join(' ')}
                                                        >
                                                            {formatDate(project.due_date)}
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={[
                                                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
                                                                    getStatusStyle(project.status),
                                                                ].join(' ')}
                                                            >
                                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />

                                                                {getStatusLabel(project.status)}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td
                                                            className="px-4 py-4 text-right"
                                                            onClick={(event) => event.stopPropagation()}
                                                            onKeyDown={(event) => event.stopPropagation()}
                                                        >
                                                            <RowActionsMenu
                                                                actions={getProjectActions(project)}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {lastPage > 1 && (
                                    <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                        <p className="text-sm text-slate-500">
                                            Showing{' '}
                                            <span className="font-medium text-slate-700">
                                                {from}
                                            </span>
                                            {' '}to{' '}
                                            <span className="font-medium text-slate-700">
                                                {to}
                                            </span>
                                            {' '}of{' '}
                                            <span className="font-medium text-slate-700">
                                                {totalProjects}
                                            </span>
                                            {' '}projects
                                        </p>

                                        <div className="flex flex-wrap items-center gap-1">
                                            {paginationLinks.map((link, index) => {
                                                const label = String(link.label)
                                                    .replace('&laquo;', '«')
                                                    .replace('&raquo;', '»')
                                                    .replace(/<[^>]*>/g, '')
                                                    .trim();

                                                return (
                                                    <button
                                                        key={`${label}-${index}`}
                                                        type="button"
                                                        disabled={!link.url || link.active}
                                                        onClick={() => {
                                                            if (link.url) {
                                                                router.visit(link.url, {
                                                                    preserveScroll: true,
                                                                    preserveState: true,
                                                                });
                                                            }
                                                        }}
                                                        className={[
                                                            'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition',
                                                            link.active
                                                                ? 'border-indigo-600 bg-indigo-600 font-semibold text-white'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                                                            !link.url
                                                                ? 'cursor-not-allowed opacity-40'
                                                                : '',
                                                        ].join(' ')}
                                                        aria-current={link.active ? 'page' : undefined}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Empty state */
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                                    <svg
                                        className="h-7 w-7"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.6"
                                        aria-hidden="true"
                                    >
                                        <rect
                                            x="3"
                                            y="4"
                                            width="18"
                                            height="16"
                                            rx="2"
                                        />
                                        <path
                                            d="M8 4v16M8 9h13"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>

                                <h3 className="mt-4 text-base font-semibold text-slate-900">
                                    {currentStatus === 'active'
                                        ? 'No active projects'
                                        : currentStatus === 'completed'
                                          ? 'No completed projects'
                                          : 'No archived projects'}
                                </h3>

                                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
                                    {currentStatus === 'active'
                                        ? 'Projects you can access will appear here. Create a project to get started if you have permission.'
                                        : 'There are no projects in this category yet.'}
                                </p>

                                {can_create && currentStatus === 'active' && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(true)}
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                                    >
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M12 5v14M5 12h14"
                                                strokeLinecap="round"
                                            />
                                        </svg>

                                        Create Project
                                    </button>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* Create project modal */}
            <CreateProjectModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                typeSuggestions={typeSuggestions}
            />
        </AuthenticatedLayout>
    );
}
