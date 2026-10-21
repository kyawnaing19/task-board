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
export default function Index({ projects, filters }) {
    const { flash, errors } = usePage().props;
    const [createOpen, setCreateOpen] = useState(false);
    const rows = projects.data;
    const current = filters.status;
    const [confirmation, setConfirmation] = useState(null);
const [processing, setProcessing] = useState(false);

const act = (method, url, title, message, data = {}, variant = 'danger') => {
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

const menuItems = (project) => {
    const detailItem = {
        label: 'Detail',
        onClick: () => {
            router.visit(route('projects.show', project.id));
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
    const tabClass = (active) =>
        `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;
    return (
        <AuthenticatedLayout header="Projects">
            <Head title="Projects" />
            <div className="w-full space-y-6">
                {/* Page heading */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {/* <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                            Projects
                        </h1> */}
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
                {/* Success message */}
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
                {/* Blocker / action error message */}
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
                            <p className="font-semibold">Action could not be completed</p>
                            <p className="mt-0.5">{errors.project || errors.status}</p>
                        </div>
                    </div>
                )}
                {/* Project list */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Status tabs */}
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-50 p-1">
                            {TABS.map((tab) => (
                                <Link
                                    key={tab.key}
                                    href={route(
                                        'projects.index',
                                        tab.key === 'active'
                                            ? {}
                                            : { status: tab.key },
                                    )}
                                    preserveScroll
                                    className={tabClass(current === tab.key)}
                                    aria-current={
                                        current === tab.key ? 'page' : undefined
                                    }
                                >
                                    {tab.label}
                                </Link>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500">
                            {projects.total}{' '}
                            {projects.total === 1 ? 'project' : 'projects'}
                        </p>
                    </div>
                    {/* Responsive table */}
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[650px] divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50">
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
                                                {EMPTY_MESSAGES[current] ||
                                                    'No projects found.'}
                                            </p>
                                            {current === 'active' && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setCreateOpen(true)
                                                    }
                                                    className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    Create a project
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                                {rows.map((project, index) => {
                                    const overdue = isOverdue(project);
                                    return (
                                        <tr
                                            key={project.id}
                                            className="transition-colors hover:bg-blue-50/80 cursor-pointer"
                                            onClick={() => router.visit(route('projects.show', project.id))}
                                        >
                                            {/* Project details */}
                                            <td className="px-5 py-4">
                                                <div className="flex min-w-0 items-start gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-sm font-bold text-indigo-600">
                                                        {project.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase() ||
                                                            'P'}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                            {/* <Link
                                                                // href={route('projects.show', project.id)}
                                                                className="group/link inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-semibold text-slate-900 transition-colors hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                                            > */}
                                                                <span className="truncate">
                                                                    {project.name || 'Unnamed Project'}
                                                                </span>
                                                                {/* <svg
                                                                    className="h-4 w-4 shrink-0 text-slate-400 transition-all group-hover/link:translate-x-0.5 group-hover/link:text-indigo-600"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                    strokeWidth={1.8}
                                                                    aria-hidden="true"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M9 5l7 7-7 7"
                                                                    />
                                                                </svg> */}
                                                            {/* </Link> */}
                                                            {project.archived_at && (
                                                                <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-inset ring-slate-200">
                                                                    Archived
                                                                </span>
                                                            )}
                                                        </div>
                                                        {project.code && (
                                                            <p className="mt-1 font-mono text-xs text-slate-500">
                                                                {project.code}
                                                            </p>
                                                        )}
                                                        {project.description && (
                                                            <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-5 text-slate-500">
                                                                {project.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        STATUS_STYLES[
                                                            project.status
                                                        ] ||
                                                        'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${
                                                            project.status ===
                                                            'ACTIVE'
                                                                ? 'bg-emerald-500'
                                                                : project.status ===
                                                                    'COMPLETED'
                                                                  ? 'bg-sky-500'
                                                                  : 'bg-slate-400'
                                                        }`}
                                                    />
                                                    {project.status === 'ACTIVE'
                                                        ? 'Active'
                                                        : project.status ===
                                                            'COMPLETED'
                                                          ? 'Completed'
                                                          : project.status}
                                                </span>
                                            </td>
                                            {/* Start date */}
                                            <td className="hidden whitespace-nowrap px-5 py-4 text-slate-600 md:table-cell">
                                                {formatDate(
                                                    project.start_date,
                                                )}
                                            </td>
                                            {/* Due date */}
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span
                                                        className={
                                                            overdue
                                                                ? 'font-medium text-rose-600'
                                                                : 'text-slate-600'
                                                        }
                                                    >
                                                        {formatDate(
                                                            project.due_date,
                                                        )}
                                                    </span>
                                                    {overdue && (
                                                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
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
                                                                    d="M12 8v4m0 4h.01M10.3 3.86 1.82 18.5A2 2 0 0 0 3.55 21h16.9a2 2 0 0 0 1.73-2.5L13.7 3.86a2 2 0 0 0-3.4 0Z"
                                                                />
                                                            </svg>
                                                            Overdue
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Row actions */}
                                            <td className="px-5 py-3 text-right">
                                                <RowActionsMenu
                                                    items={menuItems(project)}
                                                    dropUp={rows.length > 3 && index >= rows.length - 2}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {projects.links.length > 3 && (
                        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <p className="text-xs text-slate-500">
                                Showing{' '}
                                <span className="font-medium text-slate-700">
                                    {projects.from ?? 0}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium text-slate-700">
                                    {projects.to ?? 0}
                                </span>{' '}
                                of{' '}
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
            <CreateProjectModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
            />

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
                    if (!processing) setConfirmation(null);
                }}
            />
        </AuthenticatedLayout>
    );
}
