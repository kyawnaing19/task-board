import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import { formatDate, isOverdue } from '@/lib/dates';

import ProjectBoard from '@/Components/Board/ProjectBoard';
import ProjectTabs from '@/Components/ProjectTabs';
import useProjectTab from '@/lib/useProjectTab';

const STATUS_STYLES = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    COMPLETED: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
};

export default function Show({
    project,
    teams = [],
    members = [],
}) {
    const [tab, setTab] = useProjectTab();

    const archived = !!project.archived_at;
    const completed = project.status === 'COMPLETED';

    return (
        <AuthenticatedLayout
            header={
                <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm">
                    <Link
                        href={route(
                            'my-projects.index',
                            archived
                                ? { status: 'archived' }
                                : completed
                                  ? { status: 'completed' }
                                  : {},
                        )}
                        className="shrink-0 text-blue-800 transition hover:text-indigo-600"
                    >
                        My projects
                    </Link>

                    <svg
                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m9 18 6-6-6-6"
                        />
                    </svg>

                    <span
                        className="shrink-0 truncate font-semibold text-slate-900"
                        title={project.name}
                    >
                        {project.name}
                    </span>

                    <span className="shrink-0 text-slate-300">|</span>

                    <span className="shrink-0 font-mono text-xs font-semibold text-slate-600">
                        {project.code}
                    </span>

                    <span className="shrink-0 text-slate-300">·</span>

                    <span
                        className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium ${
                            archived
                                ? 'text-amber-700'
                                : completed
                                  ? 'text-sky-700'
                                  : 'text-emerald-700'
                        }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${
                                archived
                                    ? 'bg-amber-500'
                                    : completed
                                      ? 'bg-sky-500'
                                      : 'bg-emerald-500'
                            }`}
                        />
                        {archived
                            ? 'Archived'
                            : completed
                              ? 'Completed'
                              : 'Active'}
                    </span>
                </div>
            }
        >
            <Head title={`${project.code} ${project.name}`} />

            <div className="w-full min-w-0 space-y-2">

                {/* Read-only Notice */}
                {(archived || completed) && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                        <svg
                            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v3.75m0 3h.008M10.29 3.86 2.82 17.25A1.875 1.875 0 0 0 4.45 20.1h15.1a1.875 1.875 0 0 0 1.63-2.85L13.71 3.86a1.97 1.97 0 0 0-3.42 0Z"
                            />
                        </svg>

                        <div>
                            <p className="text-xs font-semibold text-amber-900">
                                {archived
                                    ? 'This project is archived.'
                                    : 'This project is completed.'}
                            </p>

                            <p className="mt-0.5 text-xs text-amber-800">
                                This project is read-only.
                            </p>
                        </div>
                    </div>
                )}

                {/* Project Tabs */}
                <div className="min-w-0">
                    <ProjectTabs
                        tab={tab}
                        onChange={setTab}
                    />
                </div>

                {/* Board Tab */}
                <section
                    aria-label="Project board"
                    className={tab === 'board' ? 'block w-full min-w-0' : 'hidden'}
                >
                    <ProjectBoard
                        key={`${project.status}-${project.archived_at ?? 'live'}`}
                        projectId={project.id}
                    />
                </section>

                {/* Overview Tab */}
                <div
                    className={
                        tab === 'overview'
                            ? 'w-full min-w-0 space-y-2'
                            : 'hidden'
                    }
                >
                    {/* Project Details */}
                    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                                <svg
                                    className="h-5 w-5 text-indigo-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8.25 6.75h7.5m-7.5 4.5h7.5m-7.5 4.5h4.5M6 3.75h12A2.25 2.25 0 0 1 20.25 6v12A2.25 2.25 0 0 1 18 20.25H6A2.25 2.25 0 0 1 3.75 18V6A2.25 2.25 0 0 1 6 3.75Z"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Project details
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    Description and project timeline
                                </p>
                            </div>
                        </div>

                        <dl className="grid gap-4 p-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Description
                                </dt>

                                <dd className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                                    {project.description || (
                                        <span className="italic text-slate-400">
                                            No description provided.
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Start date
                                </dt>

                                <dd className="mt-2 text-sm font-medium text-slate-800">
                                    {formatDate(project.start_date)}
                                </dd>
                            </div>

                            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Target due date
                                </dt>

                                <dd className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                    <span
                                        className={
                                            isOverdue(project)
                                                ? 'font-semibold text-rose-600'
                                                : 'font-medium text-slate-800'
                                        }
                                    >
                                        {formatDate(project.due_date)}
                                    </span>

                                    {isOverdue(project) && (
                                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                                            Overdue
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {/* Teams */}
                    {teams.length > 0 && (
                        <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50">
                                    <svg
                                        className="h-5 w-5 text-violet-600"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.5 18.75h4.125a.375.375 0 0 0 .375-.375v-.75a4.125 4.125 0 0 0-6.75-3.2M16.5 18.75v-.375c0-.621-.12-1.214-.337-1.757M16.5 18.75v.375m-9-5.25a4.125 4.125 0 1 0 0-8.25 4.125 4.125 0 0 0 0 8.25ZM3.75 20.25a6.75 6.75 0 0 1 13.5 0v.375H3.75v-.375Zm12.413-14.9a4.125 4.125 0 0 1 0 8.01"
                                        />
                                    </svg>
                                </div>

                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Teams
                                    </h2>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Teams linked to this project
                                    </p>
                                </div>

                                <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    {teams.length}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 p-3">
                                {teams.map((team) =>
                                    team.can_view ? (
                                        <Link
                                            key={team.id}
                                            href={route(
                                                'my-teams.show',
                                                team.id,
                                            )}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                        >
                                            <svg
                                                className="h-4 w-4 text-indigo-500"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M16.5 18.75h4.125a.375.375 0 0 0 .375-.375v-.75a4.125 4.125 0 0 0-6.75-3.2M16.5 18.75v-.375c0-.621-.12-1.214-.337-1.757M16.5 18.75v.375m-9-5.25a4.125 4.125 0 1 0 0-8.25 4.125 4.125 0 0 0 0 8.25ZM3.75 20.25a6.75 6.75 0 0 1 13.5 0v.375H3.75v-.375Zm12.413-14.9a4.125 4.125 0 0 1 0 8.01"
                                                />
                                            </svg>

                                            {team.name}

                                            <svg
                                                className="h-3.5 w-3.5 text-slate-400"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="m9 18 6-6-6-6"
                                                />
                                            </svg>
                                        </Link>
                                    ) : (
                                        <span
                                            key={team.id}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500"
                                        >
                                            <svg
                                                className="h-4 w-4 text-slate-400"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.7"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M16.5 18.75h4.125a.375.375 0 0 0 .375-.375v-.75a4.125 4.125 0 0 0-6.75-3.2M16.5 18.75v-.375c0-.621-.12-1.214-.337-1.757M16.5 18.75v.375m-9-5.25a4.125 4.125 0 1 0 0-8.25 4.125 4.125 0 0 0 0 8.25ZM3.75 20.25a6.75 6.75 0 0 1 13.5 0v.375H3.75v-.375Zm12.413-14.9a4.125 4.125 0 0 0 0 8.01"
                                                />
                                            </svg>

                                            {team.name}
                                        </span>
                                    ),
                                )}
                            </div>
                        </section>
                    )}

                    {/* Members */}
                    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                                <svg
                                    className="h-5 w-5 text-emerald-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 19.128a9.38 9.38 0 0 0 3.75.772 9.38 9.38 0 0 0 3.75-.772M15 19.128v-.772a4.5 4.5 0 0 0-9 0v.772m9 0a12.08 12.08 0 0 1-4.5.872 12.08 12.08 0 0 1-4.5-.872m9 0a5.25 5.25 0 0 0 3.75-5.003 5.25 5.25 0 0 0-10.5 0 5.25 5.25 0 0 0 3.75 5.003"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Members
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    People with access to this project
                                </p>
                            </div>

                            <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {members.length}
                            </span>
                        </div>

                        {members.length > 0 ? (
                            <ul className="divide-y divide-slate-100">
                                {members.map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                                    >
                                        <Avatar
                                            name={member.name}
                                            src={member.avatar_url}
                                            className="h-10 w-10 shrink-0 text-sm"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                {member.name}

                                                {member.is_me && (
                                                    <span className="ml-2 inline-flex rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                                                        You
                                                    </span>
                                                )}
                                            </p>

                                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                                {member.job_title || '—'}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center px-4 py-8 text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
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
                                            d="M15 19.128a9.38 9.38 0 0 0 3.75.772 9.38 9.38 0 0 0 3.75-.772M15 19.128v-.772a4.5 4.5 0 0 0-9 0v.772m9 0a12.08 12.08 0 0 1-4.5.872 12.08 12.08 0 0 1-4.5-.872m9 0a5.25 5.25 0 0 0 3.75-5.003 5.25 5.25 0 0 0-10.5 0 5.25 5.25 0 0 0 3.75 5.003"
                                        />
                                    </svg>
                                </div>

                                <p className="mt-3 text-sm font-semibold text-slate-800">
                                    No members found
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    There are currently no members to display.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}