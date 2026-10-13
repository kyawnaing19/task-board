import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import EditProjectModal from './Partials/EditProjectModal';
import LinkTeamsModal from './Partials/LinkTeamsModal';
import UnlinkTeamModal from './Partials/UnlinkTeamModal';
import Avatar from '@/Components/Avatar';
import AddProjectMembersModal from './Partials/AddProjectMembersModal';
import RemoveProjectMemberModal from './Partials/RemoveProjectMemberModal';
import { formatDate, isOverdue } from '@/lib/dates';
import ConfirmationModal from '@/Components/ConfirmationModal';
const STATUS_STYLES = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    COMPLETED: 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
};
//export default function Show({ project, read_only, teams = [], access_count = 0 }) {
export default function Show({ project, read_only, teams, members, access_count }) {
    const { flash, errors } = usePage().props;
    const [editing, setEditing] = useState(false);
    const [linking, setLinking] = useState(false);
    const [unlinking, setUnlinking] = useState(null);
    const [addingMembers, setAddingMembers] = useState(false);
    const [removingMember, setRemovingMember] = useState(null);
    const [busy, setBusy] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const [processing, setProcessing] = useState(false);
    const confirmAction = () => {
        if (!confirmation || processing) return;
        setProcessing(true);
        setBusy(true);
        router[confirmation.method](
            confirmation.url,
            confirmation.data,
            {
                preserveScroll: true,
                onStart: () => {
                    setProcessing(true);
                    setBusy(true);
                },
                onFinish: () => {
                    setBusy(false);
                    setProcessing(false);
                    setConfirmation(null);
                },
            },
        );
    };
    const archived = !!project.archived_at;
    const completed = project.status === 'COMPLETED';
    const archivedTeams = teams.filter((team) => team.archived);
    //const anyModal = editing || linking || Boolean(unlinking);
    const anyModal = editing || linking ||  unlinking ||  addingMembers || removingMember;
    const changeStatus = (target) => {
        const isCompleting = target === 'COMPLETED';
        setConfirmation({
            method: 'patch',
            url: route('projects.status', project.id),
            title: isCompleting ? 'Complete project?' : 'Reopen project?',
            message: isCompleting
                ? `Mark ${project.code} as completed? The project, its teams, members and tasks become read-only.`
                : `Reopen ${project.code}? It becomes editable again.`,
            data: { status: target },
            variant: isCompleting ? 'danger' : 'primary',
        });
    };
    const archive = () => {
        setConfirmation({
            method: 'post',
            url: route('projects.archive', project.id),
            title: 'Archive project?',
            message: `Archive ${project.code}? It stays read-only and is only visible from the Archived filter.`,
            data: {},
            variant: 'danger',
        });
    };
    const restore = () => {
        setConfirmation({
            method: 'post',
            url: route('projects.restore', project.id),
            title: 'Restore project?',
            message: `Restore ${project.code}? It returns as a completed, read-only project.`,
            data: {},
            variant: 'primary',
        });
    };
    // Archived projects do not display the status action.
    const statusAction = archived
        ? null
        : completed
          ? {
                label: 'Reopen project',
                target: 'ACTIVE',
                style: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            }
          : {
                label: 'Mark as completed',
                target: 'COMPLETED',
                style: 'border-sky-200 bg-white text-sky-700 hover:bg-sky-50',
            };
    return (
        <AuthenticatedLayout header="Projects">
            <Head title={`${project.code} ${project.name}`} />
            <div className="w-full space-y-6">
                {/* Back navigation */}
                <Link
                    href={route(
                        'projects.index',
                        archived
                            ? { status: 'archived' }
                            : completed
                              ? { status: 'completed' }
                              : {},
                    )}
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-indigo-600"
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
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Back to projects
                </Link>
                {/* Project header */}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Project icon */}
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-lg font-bold text-indigo-600">
                                {project.name?.charAt(0)?.toUpperCase() ||
                                    'P'}
                            </div>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-medium text-slate-500">
                                        {project.code}
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                            STATUS_STYLES[project.status] ||
                                            'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                completed
                                                    ? 'bg-sky-500'
                                                    : 'bg-emerald-500'
                                            }`}
                                        />
                                        {completed ? 'Completed' : 'Active'}
                                    </span>
                                    {archived && (
                                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                                            Archived
                                        </span>
                                    )}
                                </div>
                                <h1 className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900">
                                    {project.name}
                                </h1>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Created by{' '}
                                    <span className="font-medium text-slate-700">
                                        {project.creator?.name ?? '—'}
                                    </span>{' '}
                                    on{' '}
                                    {new Date(
                                        project.created_at,
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Project actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        {!read_only && (
                            <button
                                type="button"
                                onClick={() => setEditing(true)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            >
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
                                        d="m16.862 4.487 1.687-1.687a2.121 2.121 0 0 1 3 3l-9.5 9.5a4 4 0 0 1-1.692 1.006l-3.1.9.9-3.1a4 4 0 0 1 1.006-1.692l7.699-7.927ZM19 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"
                                    />
                                </svg>
                                Edit project
                            </button>
                        )}
                        {statusAction && (
                            <button
                                type="button"
                                onClick={() => changeStatus(statusAction.target)}
                                disabled={busy}
                                className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${statusAction.style}`}
                            >
                                {busy ? (
                                    <>
                                        <svg
                                            className="mr-2 h-4 w-4 animate-spin"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                                            />
                                        </svg>
                                        Working...
                                    </>
                                ) : (
                                    statusAction.label
                                )}
                            </button>
                        )}
                        {/* Archive completed project */}
                        {completed && !archived && (
                            <button
                                type="button"
                                onClick={archive}
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 shadow-sm transition-colors hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {busy ? 'Archiving...' : 'Archive'}
                            </button>
                        )}
                        {/* Restore archived project */}
                        {archived && (
                            <button
                                type="button"
                                onClick={restore}
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {busy ? 'Restoring...' : 'Restore'}
                            </button>
                        )}
                    </div>
                </div>
                {/* Read-only notices */}
                {archived ? (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-800">
                        <svg
                            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
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
                            <p className="mt-1 leading-5 text-amber-700">
                                This project is archived and read-only. Restore
                                it to make it visible in the normal lists
                                again.
                            </p>
                        </div>
                    </div>
                ) : (
                    completed && (
                        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3.5 text-sm text-sky-800">
                            <svg
                                className="mt-0.5 h-5 w-5 shrink-0 text-sky-600"
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
                                <p className="mt-1 leading-5 text-sky-700">
                                    This project is completed and read-only.
                                    Reopen it to edit its details, teams,
                                    members, or tasks.
                                </p>
                            </div>
                        </div>
                    )
                )}
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
                {/* Transition/read-only errors */}
                {(errors?.status || errors?.project) && !anyModal && (
                    <div
                        role="alert"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                        {errors.status || errors.project}
                    </div>
                )}
                {/* Project details */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <svg
                                className="h-5 w-5"
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
                            <p className="mt-0.5 text-xs text-slate-500">
                                Overview and schedule
                            </p>
                        </div>
                    </div>
                    <dl className="grid gap-6 p-5 sm:grid-cols-2">
                        {/* Description */}
                        <div className="sm:col-span-2">
                            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Description
                            </dt>
                            <dd className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                                {project.description || (
                                    <span className="italic text-slate-400">
                                        No description available.
                                    </span>
                                )}
                            </dd>
                        </div>
                        {/* Start date */}
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Start date
                            </dt>
                            <dd className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                <svg
                                    className="h-4 w-4 text-slate-400"
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
                        {/* Due date */}
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Target due date
                            </dt>
                            <dd className="mt-2 flex flex-wrap items-center gap-2 text-sm font-medium">
                                <svg
                                    className={`h-4 w-4 ${
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
                                    <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                                        Overdue
                                    </span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>
                {/* Teams and individual members */}
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Teams <span className="font-normal text-slate-500">({teams.length})</span>
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {access_count} {access_count === 1 ? 'employee has' : 'employees have'} access to this project in total
                                </p>
                            </div>
                            {!read_only && (
                                <button
                                    type="button"
                                    onClick={() => setLinking(true)}
                                    className="shrink-0 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                >
                                    + Link teams
                                </button>
                            )}
                        </div>
                        {archivedTeams.length > 0 && (
                            <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs leading-5 text-amber-800">
                                {archivedTeams.length} linked {archivedTeams.length === 1 ? 'team is' : 'teams are'} archived.
                                Their members have no access through {archivedTeams.length === 1 ? 'it' : 'them'} until restored.
                            </div>
                        )}
                        {teams.length === 0 ? (
                            <p className="px-5 py-10 text-center text-sm text-slate-500">
                                No teams linked yet.
                            </p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {teams.map((team) => (
                                    <li key={team.id} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50/70">
                                        <div className="min-w-0">
                                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                <Link
                                                    href={route('teams.show', team.id)}
                                                    className="truncate text-sm font-medium text-slate-800 transition hover:text-indigo-600"
                                                >
                                                    {team.name}
                                                </Link>
                                                {team.archived && (
                                                    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                                        Archived
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {team.members_count} {team.members_count === 1 ? 'member' : 'members'}
                                            </p>
                                        </div>
                                        {!read_only && (
                                            <button
                                                type="button"
                                                onClick={() => setUnlinking(team)}
                                                className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                     {/* Header */}
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <svg
                                        className="h-5 w-5"
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
                                        Employees with direct project access
                                    </p>
                                </div>
                            </div>

                            {!read_only && (
                                <button
                                    type="button"
                                    onClick={() => setAddingMembers(true)}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
                                            d="M12 5v14m-7-7h14"
                                        />
                                    </svg>
                                    Add members
                                </button>
                            )}
                        </div>

                        {/* Empty state */}
                        {members.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
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

                                <p className="mt-3 text-sm font-medium text-slate-700">
                                    No individual members yet
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Employees added directly to this project will appear here.
                                </p>

                                {!read_only && (
                                    <button
                                        type="button"
                                        onClick={() => setAddingMembers(true)}
                                        className="mt-4 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700"
                                    >
                                        + Add your first members
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Members list */
                            <ul className="divide-y divide-slate-100">
                                {members.map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/80"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <Avatar
                                                name={member.name}
                                                src={member.avatar_url}
                                                className="h-10 w-10 shrink-0"
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm font-medium text-slate-900">
                                                        {member.name}
                                                    </p>

                                                    {member.status !== 'ACTIVE' && (
                                                        <span className="inline-flex shrink-0 items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                                    {member.job_title || member.email}
                                                </p>

                                                {member.via_teams?.length > 0 && (
                                                    <p
                                                        title={`Also via ${member.via_teams.join(', ')}`}
                                                        className="mt-1 inline-block max-w-full truncate rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700"
                                                    >
                                                        Also via {member.via_teams.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {!read_only && (
                                            <button
                                                type="button"
                                                onClick={() => setRemovingMember(member)}
                                                className="shrink-0 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
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
            </div>
            {/* Edit project modal */}
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

            {addingMembers && <AddProjectMembersModal project={project} onClose={() => setAddingMembers(false)} />}
            {removingMember && (
                <RemoveProjectMemberModal
                    key={removingMember.id}
                    project={project}
                    member={removingMember}
                    onClose={() => setRemovingMember(null)}
                />
            )}
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
