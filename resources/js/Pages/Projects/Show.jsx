import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import EditProjectModal from './Partials/EditProjectModal';
import LinkTeamsModal from './Partials/LinkTeamsModal';
import UnlinkTeamModal from './Partials/UnlinkTeamModal';
import AddProjectMembersModal from './Partials/AddProjectMembersModal';
import RemoveProjectMemberModal from './Partials/RemoveProjectMemberModal';

import Avatar from '@/Components/Avatar';
import ConfirmationModal from '@/Components/ConfirmationModal';

import ProjectBoard from '@/Components/Board/ProjectBoard';
import ArchivedTasks from '@/Components/Board/ArchivedTasks';
import ProjectTabs from '@/Components/ProjectTabs';

import useProjectTab from '@/lib/useProjectTab';
import { formatDate, isOverdue } from '@/lib/dates';

const STATUS_STYLES = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    COMPLETED: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
};

export default function Show({
    project,
    read_only,
    teams = [],
    members = [],
    access_count = 0,
}) {
    const { flash, errors } = usePage().props;

    // --------------------------------------------------
    // Project tabs
    // --------------------------------------------------

    const [tab, setTab] = useProjectTab();

    // Increment this value to request a board refresh.
    const [boardVersion, setBoardVersion] = useState(0);

    // --------------------------------------------------
    // Modal states
    // --------------------------------------------------

    const [editing, setEditing] = useState(false);
    const [linking, setLinking] = useState(false);
    const [unlinking, setUnlinking] = useState(null);
    const [addingMembers, setAddingMembers] = useState(false);
    const [removingMember, setRemovingMember] = useState(null);

    // --------------------------------------------------
    // Action states
    // --------------------------------------------------

    const [busy, setBusy] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const [processing, setProcessing] = useState(false);

    // --------------------------------------------------
    // Project status
    // --------------------------------------------------

    const archived = Boolean(project.archived_at);
    const completed = project.status === 'COMPLETED';

    const archivedTeams = teams.filter((team) => team.archived);

    const anyModal =
        editing ||
        linking ||
        Boolean(unlinking) ||
        addingMembers ||
        Boolean(removingMember);

    // Use the same key for Board and Archived Tasks.
    // Change it when the project status/archive state changes.
    const projectVersion = `${project.status}-${project.archived_at ?? 'live'}`;

    // --------------------------------------------------
    // Confirmation actions
    // --------------------------------------------------

    const confirmAction = () => {
        if (!confirmation || processing) return;

        setProcessing(true);
        setBusy(true);

        router[confirmation.method](
            confirmation.url,
            confirmation.data ?? {},
            {
                preserveScroll: true,

                onStart: () => {
                    setProcessing(true);
                    setBusy(true);
                },

                onFinish: () => {
                    setProcessing(false);
                    setBusy(false);
                    setConfirmation(null);
                },
            },
        );
    };

    // --------------------------------------------------
    // Change project status
    // --------------------------------------------------

    const changeStatus = (target) => {
        const isCompleting = target === 'COMPLETED';

        setConfirmation({
            method: 'patch',
            url: route('projects.status', project.id),

            title: isCompleting
                ? 'Complete project?'
                : 'Reopen project?',

            message: isCompleting
                ? `Mark ${project.code} as completed? The project, its teams, members and tasks become read-only.`
                : `Reopen ${project.code}? It becomes editable again.`,

            data: {
                status: target,
            },

            variant: isCompleting ? 'danger' : 'primary',
        });
    };

    // --------------------------------------------------
    // Archive project
    // --------------------------------------------------

    const archive = () => {
        setConfirmation({
            method: 'post',
            url: route('projects.archive', project.id),
            title: 'Archive project?',
            message: `Archive ${project.code}? It will remain read-only and can be accessed from the Archived filter.`,
            data: {},
            variant: 'danger',
        });
    };

    // --------------------------------------------------
    // Restore project
    // --------------------------------------------------

    const restore = () => {
        setConfirmation({
            method: 'post',
            url: route('projects.restore', project.id),
            title: 'Restore project?',
            message: `Restore ${project.code}?`,
            data: {},
            variant: 'primary',
        });
    };

    // --------------------------------------------------
    // Resolve archived team linkage
    // --------------------------------------------------

    const resolveArchivedLinkage = () => {
        if (busy || archivedTeams.length === 0) return;

        const teamNames = archivedTeams
            .map((team) => `"${team.name}"`)
            .join(', ');

        const confirmed = window.confirm(
            `End the link between ${project.code} and ${teamNames}?\n\n` +
                'The link will be end-dated, not deleted. Restoring the team later will not automatically recreate the link.',
        );

        if (!confirmed) return;

        router.post(
            route('projects.teams.resolve-archived', project.id),
            {},
            {
                preserveScroll: true,

                onStart: () => {
                    setBusy(true);
                },

                onFinish: () => {
                    setBusy(false);
                },
            },
        );
    };

    // --------------------------------------------------
    // Archived Tasks changed
    // --------------------------------------------------

    const handleArchivedTasksChanged = () => {
        setBoardVersion((version) => version + 1);
    };

    // --------------------------------------------------
    // Status action
    // --------------------------------------------------

    const statusAction = archived
        ? null
        : completed
          ? {
                label: 'Reopen',
                target: 'ACTIVE',
                style: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            }
          : {
                label: 'Complete',
                target: 'COMPLETED',
                style: 'border-sky-200 bg-white text-sky-700 hover:bg-sky-50',
            };

    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    return (
        <AuthenticatedLayout
            header={
                <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm">
                    {/* Breadcrumb */}

                    <Link
                        href={route(
                            'projects.index',
                            archived
                                ? { status: 'archived' }
                                : completed
                                  ? { status: 'completed' }
                                  : {},
                        )}
                        className="shrink-0 text-blue-800 transition hover:text-indigo-600"
                    >
                        Projects
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

                    {/* Project name */}

                    <span
                        className="shrink-0 font-semibold text-slate-900"
                        title={project.name}
                    >
                        {project.name}
                    </span>

                    <span className="shrink-0 text-slate-300">|</span>

                    {/* Project code */}

                    <span className="shrink-0 font-mono text-xs font-semibold text-slate-600">
                        {project.code}
                    </span>

                    <span className="shrink-0 text-slate-300">·</span>

                    {/* Status */}

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

                    <span className="shrink-0 text-slate-300">·</span>

                    {/* Creator and date */}

                    <span className="truncate text-xs text-slate-500">
                        Created by{' '}
                        <span className="font-semibold text-slate-700">
                            {project.creator?.name ?? 'Super Admin'}
                        </span>{' '}
                        on{' '}
                        {project.created_at &&
                        !Number.isNaN(Date.parse(project.created_at))
                            ? formatDate(project.created_at)
                            : '—'}
                    </span>
                </div>
            }
        >
            <Head title={`${project.name} | Projects`} />

            <div className="w-full min-w-0 space-y-2">
                {/* =========================================
                    PROJECT TABS + ACTION BUTTONS
                ========================================= */}

                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    {/* LEFT: Project tabs */}

                    <div className="min-w-0 flex-1">
                        <ProjectTabs
                            tab={tab}
                            onChange={setTab}
                        />
                    </div>

                    {/* RIGHT: Project action buttons */}

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                        {!read_only && (
                            <button
                                type="button"
                                onClick={() => setEditing(true)}
                                disabled={busy}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.8}
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m16.862 4.487 1.687-1.687a2.121 2.121 0 0 1 3 3l-9.5 9.5a4 4 0 0 1-1.692 1.006l-3.1.9.9-3.1a4 4 0 0 1 1.006-1.692l7.699-7.927ZM19 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"
                                    />
                                </svg>

                                Edit
                            </button>
                        )}

                        {statusAction && (
                            <button
                                type="button"
                                onClick={() =>
                                    changeStatus(statusAction.target)
                                }
                                disabled={busy}
                                className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${statusAction.style}`}
                            >
                                {busy ? 'Working...' : statusAction.label}
                            </button>
                        )}

                        {completed && !archived && (
                            <button
                                type="button"
                                onClick={archive}
                                disabled={busy}
                                className="inline-flex h-8 items-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Archive
                            </button>
                        )}

                        {archived && (
                            <button
                                type="button"
                                onClick={restore}
                                disabled={busy}
                                className="inline-flex h-8 items-center rounded-lg border border-indigo-200 bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Restore
                            </button>
                        )}
                    </div>
                </div>

                {/* =========================================
                    READ-ONLY NOTICES
                ========================================= */}

                {archived && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                        <svg
                            className="mt-0.5 h-4 w-4 shrink-0"
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
                                Archived project
                            </p>

                            <p className="mt-0.5 leading-5 text-amber-700">
                                This project is archived and read-only.
                                Restore it to return it to the normal
                                project list.
                            </p>
                        </div>
                    </div>
                )}

                {!archived && completed && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-800">
                        <svg
                            className="mt-0.5 h-4 w-4 shrink-0"
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
                                Completed project
                            </p>

                            <p className="mt-0.5 leading-5 text-sky-700">
                                This project is read-only. Reopen it to
                                make changes to the project, teams, members,
                                and tasks.
                            </p>
                        </div>
                    </div>
                )}

                {/* =========================================
                    SUCCESS MESSAGE
                ========================================= */}

                {flash?.success && (
                    <div
                        role="status"
                        className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800"
                    >
                        <svg
                            className="mt-0.5 h-4 w-4 shrink-0"
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

                {/* =========================================
                    ERROR MESSAGE
                ========================================= */}

                {(errors?.status || errors?.project) && !anyModal && (
                    <div
                        role="alert"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700"
                    >
                        {errors.status || errors.project}
                    </div>
                )}

                {/* =========================================
                    PROJECT BOARD

                    Keep mounted when switching tabs.
                    This preserves the board component state.
                ========================================= */}

                <section
                    aria-label="Project board"
                    className={
                        tab === 'board'
                            ? 'relative -mx-2 block w-[calc(100%+1rem)] min-w-0 sm:-mx-3 sm:w-[calc(100%+1.5rem)] lg:-mx-4 lg:w-[calc(100%+2rem)]'
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

                {/* =========================================
                    ARCHIVED TASKS

                    Render only when the archived tab is open.
                    Notify the board when tasks change.
                ========================================= */}

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

                {/* =========================================
                    PROJECT OVERVIEW
                ========================================= */}

                <section
                    aria-label="Project overview"
                    className={
                        tab === 'overview'
                            ? 'w-full min-w-0 space-y-2'
                            : 'hidden'
                    }
                >
                    {/* Project details */}

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.8}
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
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Project details
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Description and schedule
                                </p>
                            </div>
                        </div>

                        <dl className="grid gap-4 p-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Description
                                </dt>

                                <dd className="mt-1.5 whitespace-pre-line text-sm leading-6 text-slate-700">
                                    {project.description || (
                                        <span className="italic text-slate-400">
                                            No description available.
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Start date
                                </dt>

                                <dd className="mt-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <svg
                                        className="h-4 w-4 shrink-0 text-slate-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.8}
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z"
                                        />
                                    </svg>

                                    {formatDate(project.start_date)}
                                </dd>
                            </div>

                            <div>
                                <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                    Target due date
                                </dt>

                                <dd className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-medium">
                                    <svg
                                        className={`h-4 w-4 shrink-0 ${
                                            isOverdue(project)
                                                ? 'text-rose-500'
                                                : 'text-slate-400'
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.8}
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z"
                                        />
                                    </svg>

                                    <span
                                        className={
                                            isOverdue(project)
                                                ? 'text-rose-600'
                                                : 'text-slate-700'
                                        }
                                    >
                                        {formatDate(project.due_date)}
                                    </span>

                                    {isOverdue(project) && (
                                        <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                                            Overdue
                                        </span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Teams and members */}

                    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                        {/* =========================================
                            TEAMS
                        ========================================= */}

                        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                                <div className="min-w-0">
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Teams{' '}
                                        <span className="font-normal text-slate-500">
                                            ({teams.length})
                                        </span>
                                    </h2>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {access_count}{' '}
                                        {access_count === 1
                                            ? 'employee has'
                                            : 'employees have'}{' '}
                                        access in total
                                    </p>
                                </div>

                                {!read_only && (
                                    <button
                                        type="button"
                                        onClick={() => setLinking(true)}
                                        className="inline-flex h-8 shrink-0 items-center rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                    >
                                        + Link teams
                                    </button>
                                )}
                            </div>

                            {/* Archived team warning */}

                            {archivedTeams.length > 0 && (
                                <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                                    <p className="leading-5">
                                        {archivedTeams.length} linked{' '}
                                        {archivedTeams.length === 1
                                            ? 'team is'
                                            : 'teams are'}{' '}
                                        archived:{' '}
                                        <span className="font-semibold text-amber-900">
                                            {archivedTeams
                                                .map((team) => team.name)
                                                .join(', ')}
                                        </span>
                                        .
                                    </p>

                                    {completed && !archived && (
                                        <div className="mt-2">
                                            <p className="leading-5 text-amber-700">
                                                Restore the archived team(s),
                                                or resolve their linkage with
                                                this project.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={resolveArchivedLinkage}
                                                disabled={busy}
                                                className="mt-2 inline-flex h-7 items-center rounded-lg border border-amber-300 bg-white px-2.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {busy
                                                    ? 'Working...'
                                                    : 'Resolve archived team linkage'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {teams.length === 0 ? (
                                <div className="px-4 py-8 text-center text-xs text-slate-500">
                                    No teams linked yet.
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {teams.map((team) => (
                                        <li
                                            key={team.id}
                                            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                    <Link
                                                        href={route(
                                                            'teams.show',
                                                            team.id,
                                                        )}
                                                        className="truncate text-sm font-medium text-slate-800 transition hover:text-indigo-600"
                                                    >
                                                        {team.name}
                                                    </Link>

                                                    {team.archived && (
                                                        <span className="inline-flex shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                                            Archived
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {team.members_count ?? 0}{' '}
                                                    {(team.members_count ?? 0) === 1
                                                        ? 'member'
                                                        : 'members'}
                                                </p>
                                            </div>

                                            {!read_only && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setUnlinking(team)
                                                    }
                                                    className="inline-flex h-7 shrink-0 items-center rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* =========================================
                            INDIVIDUAL MEMBERS
                        ========================================= */}

                        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                        <svg
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.8}
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m12-14a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                                            />
                                        </svg>
                                    </div>

                                    <div className="min-w-0">
                                        <h2 className="text-sm font-semibold text-slate-900">
                                            Individual members{' '}
                                            <span className="font-medium text-slate-400">
                                                ({members.length})
                                            </span>
                                        </h2>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            Direct project access
                                        </p>
                                    </div>
                                </div>

                                {!read_only && (
                                    <button
                                        type="button"
                                        onClick={() => setAddingMembers(true)}
                                        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-2.5 text-xs font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
                                                d="M12 5v14m-7-7h14"
                                            />
                                        </svg>

                                        Add members
                                    </button>
                                )}
                            </div>

                            {members.length === 0 ? (
                                <div className="px-4 py-8 text-center">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.6}
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                                            />
                                        </svg>
                                    </div>

                                    <p className="mt-2.5 text-sm font-medium text-slate-700">
                                        No individual members yet
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Employees added directly to this
                                        project will appear here.
                                    </p>

                                    {!read_only && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setAddingMembers(true)
                                            }
                                            className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50"
                                        >
                                            + Add your first members
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {members.map((member) => (
                                        <li
                                            key={member.id}
                                            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                                <Avatar
                                                    name={member.name}
                                                    src={member.avatar_url}
                                                    className="h-9 w-9 shrink-0"
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="truncate text-sm font-medium text-slate-900">
                                                            {member.name}
                                                        </p>

                                                        {member.status &&
                                                            member.status !==
                                                                'ACTIVE' && (
                                                                <span className="inline-flex shrink-0 items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                    </div>

                                                    <p className="mt-1 truncate text-xs text-slate-500">
                                                        {member.job_title ||
                                                            member.email}
                                                    </p>

                                                    {member.via_teams?.length >
                                                        0 && (
                                                        <p
                                                            title={`Also via ${member.via_teams.join(', ')}`}
                                                            className="mt-1 inline-block max-w-full truncate rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700"
                                                        >
                                                            Also via{' '}
                                                            {member.via_teams.join(
                                                                ', ',
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {!read_only && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setRemovingMember(member)
                                                    }
                                                    className="inline-flex h-7 shrink-0 items-center rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* =========================================
                MODALS
            ========================================= */}

            {editing && (
                <EditProjectModal
                    project={project}
                    onClose={() => setEditing(false)}
                />
            )}

            {linking && (
                <LinkTeamsModal
                    project={project}
                    onClose={() => setLinking(false)}
                />
            )}

            {unlinking && (
                <UnlinkTeamModal
                    key={unlinking.id}
                    project={project}
                    team={unlinking}
                    onClose={() => setUnlinking(null)}
                />
            )}

            {addingMembers && (
                <AddProjectMembersModal
                    project={project}
                    onClose={() => setAddingMembers(false)}
                />
            )}

            {removingMember && (
                <RemoveProjectMemberModal
                    key={removingMember.id}
                    project={project}
                    member={removingMember}
                    onClose={() => setRemovingMember(null)}
                />
            )}

            {/* Confirmation modal */}

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