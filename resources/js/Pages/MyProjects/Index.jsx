import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatDate, isOverdue } from '@/lib/dates';
import RowActionsMenu from '@/Components/RowActionsMenu';

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
    active: 'You have no active projects.',
    completed: 'You have no completed projects.',
    archived: 'You have no archived projects.',
};

const menuItems = (project) => [
    {
        label: 'Detail',
        onClick: () => {
            router.visit(route('my-projects.show', project.id));
        },
    },
];

export default function Index({ projects, filters }) {
    const rows = projects?.data ?? [];
    const current = filters?.status ?? 'active';

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
                {/* Status Tabs */}
                <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    {TABS.map((tab) => (
                        <Link
                            key={tab.key}
                            href={route(
                                'my-projects.index',
                                tab.key === 'active'
                                    ? {}
                                    : { status: tab.key },
                            )}
                            preserveScroll
                            className={tabClass(current === tab.key)}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Projects Table */}
                <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] divide-y divide-slate-200 text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">
                                        Project
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Status
                                    </th>

                                    <th className="hidden px-5 py-4 font-semibold md:table-cell">
                                        Start
                                    </th>

                                    <th className="px-5 py-4 font-semibold">
                                        Due
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold">
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
                                            <div className="mx-auto flex max-w-sm flex-col items-center">
                                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                                    <svg
                                                        className="h-6 w-6 text-slate-400"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h4.19a2.25 2.25 0 0 1 1.59.66l1.06 1.06a2.25 2.25 0 0 0 1.59.66H18A2.25 2.25 0 0 1 20.25 9v8.25A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75Z"
                                                        />
                                                    </svg>
                                                </div>

                                                <p className="text-sm font-semibold text-slate-800">
                                                    No projects found
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {EMPTY_MESSAGES[current] ??
                                                        EMPTY_MESSAGES.active}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Project Rows */}
                                {rows.map((project, index) => (
                                    <tr
                                        key={project.id}
                                        className="transition-colors hover:bg-slate-50"
                                    >
                                        {/* Project */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50">
                                                    <svg
                                                        className="h-4 w-4 text-indigo-600"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.7"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h4.19a2.25 2.25 0 0 1 1.59.66l1.06 1.06a2.25 2.25 0 0 0 1.59.66H18A2.25 2.25 0 0 1 20.25 9v8.25A2.25 2.25 0 0 1 18 19.5H6a2.25 2.25 0 0 1-2.25-2.25V6.75Z"
                                                        />
                                                    </svg>
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="font-mono text-xs text-slate-400">
                                                            {project.code}
                                                        </span>

                                                        <Link
                                                            // href={route(
                                                            //     'my-projects.show',
                                                            //     project.id,
                                                            // )}
                                                            className="break-words font-semibold text-slate-900 transition-colors hover:text-indigo-600"
                                                        >
                                                            {project.name}
                                                        </Link>
                                                    </div>

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
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        STATUS_STYLES[
                                                            project.status
                                                        ] ??
                                                        'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'
                                                    }`}
                                                >
                                                    <span
                                                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                                            project.status ===
                                                            'ACTIVE'
                                                                ? 'bg-emerald-500'
                                                                : 'bg-sky-500'
                                                        }`}
                                                    />

                                                    {project.status === 'ACTIVE'
                                                        ? 'Active'
                                                        : 'Completed'}
                                                </span>

                                                {project.archived_at && (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                                                        Archived
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Start Date */}
                                        <td className="hidden whitespace-nowrap px-5 py-4 text-slate-600 md:table-cell">
                                            {formatDate(project.start_date)}
                                        </td>

                                        {/* Due Date */}
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={
                                                        isOverdue(project)
                                                            ? 'font-medium text-rose-600'
                                                            : 'text-slate-600'
                                                    }
                                                >
                                                    {formatDate(
                                                        project.due_date,
                                                    )}
                                                </span>

                                                {isOverdue(project) && (
                                                    <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                                                        Overdue
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-3 text-right">
                                            <RowActionsMenu
                                                items={menuItems(project)}
                                                dropUp={
                                                    rows.length > 3 &&
                                                    index >= rows.length - 2
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {projects.links.length > 3 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-4">
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
                                </span>{' '}
                                projects
                            </p>

                            <div className="flex flex-wrap gap-1">
                                {projects.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                            link.active
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : link.url
                                                  ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                  : 'pointer-events-none border border-slate-100 bg-slate-50 text-slate-300'
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
        </AuthenticatedLayout>
    );
}