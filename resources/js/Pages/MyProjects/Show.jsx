import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';

import ProjectBoard from '@/Components/Board/ProjectBoard';
import ArchivedTasks from '@/Components/Board/ArchivedTasks';
import ProjectTabs from '@/Components/ProjectTabs';

import EditProjectModal from '@/Pages/Projects/Partials/EditProjectModal';
import AddProjectMembersModal from '@/Pages/Projects/Partials/AddProjectMembersModal';
import RemoveProjectMemberModal from '@/Pages/Projects/Partials/RemoveProjectMemberModal';

import useProjectTab from '@/lib/useProjectTab';
import { formatDate, isOverdue } from '@/lib/dates';

export default function Show({
    project,
    teams = [],
    members = [],
    permissions = {},
    type_suggestions = [],
}) {
    // --------------------------------------------------
    // Project tabs
    // --------------------------------------------------

    const [tab, setTab] = useProjectTab();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        if (params.has('task') && params.get('task')) {
            setTab('board');
        }
    }, [setTab]);

    // --------------------------------------------------
    // Modal state
    // --------------------------------------------------

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddMembersModalOpen, setIsAddMembersModalOpen] =
        useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);

    // --------------------------------------------------
    // Board refresh
    // --------------------------------------------------

    const [boardVersion, setBoardVersion] = useState(0);

    const handleArchivedTasksChanged = () => {
        setBoardVersion((version) => version + 1);
    };

    // --------------------------------------------------
    // Project status
    // --------------------------------------------------

    const archived = Boolean(project.archived_at);
    const completed = project.status === 'COMPLETED';
    const readOnly = archived || completed;

    const projectVersion = `${project.status}-${project.archived_at ?? 'live'}`;

    const canEditProject =
        Boolean(permissions?.can_edit) && !readOnly;

    const canManageMembers =
        Boolean(permissions?.can_manage_members) && !readOnly;

    // The backend must authorize status changes independently.
    // can_complete is used for both completing and reopening.
    const canChangeStatus =
        Boolean(permissions?.can_complete) && !archived;

    // --------------------------------------------------
    // Change project status
    // --------------------------------------------------

    const {
        patch: submitStatusChange,
        processing: isChangingStatus,
    } = useForm({
        status: completed ? 'ACTIVE' : 'COMPLETED',
    });

    const handleChangeStatus = () => {
        if (!canChangeStatus || isChangingStatus) {
            return;
        }

        const nextStatus = completed ? 'ACTIVE' : 'COMPLETED';

        const confirmationMessage = completed
            ? `Reopen "${project.name}"?`
            : `Mark "${project.name}" as completed?`;

        if (!window.confirm(confirmationMessage)) {
            return;
        }

        submitStatusChange(
            route('projects.status', project.id),
            {
                data: {
                    status: nextStatus,
                },
                preserveScroll: true,
                onSuccess: () => {
                    // Inertia refreshes server-provided props on success.
                },
            },
        );
    };

    // --------------------------------------------------
    // Render
    // --------------------------------------------------

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
                {/* READ-ONLY NOTICE */}

                {readOnly && (
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

                {/* PROJECT TABS + ACTION BUTTONS */}

                <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <ProjectTabs
                            tab={tab}
                            onChange={setTab}
                        />
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {/* EDIT BUTTON */}

                        {canEditProject && (
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(true)}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            >
                                <svg
                                    className="h-4 w-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m16.862 4.487 2.651 2.651M8.25 16.5l7.94-7.94a1.875 1.875 0 0 0-2.652-2.652l-7.94 7.94L4.5 19.5l3.75-3Z"
                                    />
                                </svg>

                                <span>Edit</span>
                            </button>
                        )}

                        {/* COMPLETE / REOPEN BUTTON */}

                        {canChangeStatus && (
                            <button
                                type="button"
                                onClick={handleChangeStatus}
                                disabled={isChangingStatus}
                                className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                                    completed
                                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100 focus-visible:ring-emerald-500'
                                        : 'border border-indigo-600 bg-indigo-600 text-white hover:border-indigo-700 hover:bg-indigo-700 focus-visible:ring-indigo-500'
                                }`}
                            >
                                {completed ? (
                                    <>
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3L19.5 9m0-4.5V9H15M19.5 12a7.5 7.5 0 0 1-12.8 5.3L4.5 15m0 4.5V15H9"
                                            />
                                        </svg>

                                        <span>
                                            {isChangingStatus
                                                ? 'Reopening...'
                                                : 'Reopen'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m5 12 4 4L19 6"
                                            />
                                        </svg>

                                        <span>
                                            {isChangingStatus
                                                ? 'Completing...'
                                                : 'Complete'}
                                        </span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* PROJECT BOARD */}

                <section
                    aria-label="Project board"
                    className={
                        tab === 'board'
                            ? 'block w-full min-w-0'
                            : 'hidden'
                    }
                >
                    <ProjectBoard
                        key={projectVersion}
                        projectId={project.id}
                        active={tab === 'board'}
                        refreshToken={boardVersion}
                    />
                </section>

                {/* ARCHIVED TASKS */}

                {tab === 'archived' && (
                    <section
                        aria-label="Archived tasks"
                        className="w-full min-w-0"
                    >
                        <ArchivedTasks
                            key={projectVersion}
                            projectId={project.id}
                            onChanged={handleArchivedTasksChanged}
                        />
                    </section>
                )}

                {/* PROJECT OVERVIEW */}

                <div
                    className={
                        tab === 'overview'
                            ? 'w-full min-w-0 space-y-2'
                            : 'hidden'
                    }
                >
                    {/* PROJECT DETAILS */}

                    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
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

                            <div className="min-w-0 flex-1">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Project details
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    Description and project timeline
                                </p>
                            </div>
                        </div>

                        <dl className="grid gap-4 p-3 sm:grid-cols-2">
                            <div className="min-w-0">
                                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Description
                                </dt>

                                <dd className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                                    {project.description || (
                                        <span className="italic text-slate-400">
                                            No description provided.
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="min-w-0">
                                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Project type
                                </dt>

                                <dd className="mt-2">
                                    {project.type ? (
                                        <span className="inline-flex max-w-full items-center rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700">
                                            <span className="truncate">
                                                {project.type}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-sm italic text-slate-400">
                                            No type specified.
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

                    {/* TEAMS */}

                    {teams.length > 0 && (
                        <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
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

                                <div className="min-w-0 flex-1">
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

                    {/* MEMBERS */}

                    {/* MEMBERS */}

<section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    {/* HEADER */}
    <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
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

        <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-slate-900">
                Members
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
                People with access to this project
            </p>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            {members.length}
        </span>

        {/* ADD MEMBERS */}
        {canManageMembers && (
            <button
                type="button"
                onClick={() => setIsAddMembersModalOpen(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 5v14m-7-7h14"
                    />
                </svg>

                <span>Add members</span>
            </button>
        )}
    </div>

    {/* MEMBERS LIST */}
    {members.length > 0 ? (
        <ul className="divide-y divide-slate-100">
            {members.map((member) => (
                <li
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80"
                >
                    {/* AVATAR */}
                    <Avatar
                        name={member.name}
                        src={member.avatar_url}
                        className="h-10 w-10 shrink-0 text-sm"
                    />

                    {/* MEMBER DETAILS */}
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

                    {/* REMOVE BUTTON
                        - User must have permission.
                        - User cannot remove themselves.
                    */}
                    {canManageMembers && !member.is_me && (
                        <button
                            type="button"
                            onClick={() => setMemberToRemove(member)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1"
                            aria-label={`Remove ${member.name} from project`}
                            title={`Remove ${member.name}`}
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 7h12m-10 0 .7 12h6.6L16 7M9 7V4h6v3m-4 4v5m2-5v5"
                                />
                            </svg>

                            <span>Remove</span>
                        </button>
                    )}
                </li>
            ))}
        </ul>
    ) : (
        /* EMPTY STATE */
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
                        d="M15 19.128a9.38 9.38 0 0 0 3.75.772 9.38 9.38 0 0 0 3.75-.772m-9 0v-.772a4.5 4.5 0 0 0-9 0v.772m9 0a12.08 12.08 0 0 1-4.5.872 12.08 12.08 0 0 1-4.5-.872"
                    />
                </svg>
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-800">
                No members found
            </p>

            <p className="mt-1 text-sm text-slate-500">
                There are currently no members to display.
            </p>

            {canManageMembers && (
                <button
                    type="button"
                    onClick={() => setIsAddMembersModalOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 5v14m-7-7h14"
                        />
                    </svg>

                    Add your first member
                </button>
            )}
        </div>
    )}
</section>
                </div>
            </div>

            {/* EDIT PROJECT MODAL */}

            {isEditModalOpen && canEditProject && (
                <EditProjectModal
                    project={project}
                    typeSuggestions={type_suggestions}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}

            {/* ADD PROJECT MEMBERS MODAL */}

            {isAddMembersModalOpen && canManageMembers && (
                <AddProjectMembersModal
                    project={project}
                    onClose={() => setIsAddMembersModalOpen(false)}
                />
            )}

            {/* REMOVE PROJECT MEMBER MODAL */}

            {memberToRemove && canManageMembers && (
                <RemoveProjectMemberModal
                    project={project}
                    member={memberToRemove}
                    onClose={() => setMemberToRemove(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}