import React, { useState } from 'react';

import { Head, Link, router, usePage } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

import Avatar from '@/Components/Avatar';

import AddMembersModal from './Partials/AddMembersModal';

import RemoveMemberModal from './Partials/RemoveMemberModal';

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : '—';

export default function Show({ team, members = [], projects = [] }) {
    const { flash, errors } = usePage().props;

    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState(null);

    const [leadershipAction, setLeadershipAction] = useState(null);
    const [updatingLeader, setUpdatingLeader] = useState(false);

    const archived = !!team.archived_at;

    /**
     * Assign or remove the team leader.
     *
     * Make leader:  { user_id: member.id }
     * Remove leader: { user_id: null }
     */
    const confirmLeadershipChange = () => {
        if (!leadershipAction || updatingLeader || archived) {
            return;
        }

        const { member, makeLeader } = leadershipAction;

        setUpdatingLeader(true);

        router.patch(
            route('teams.leader', team.id),
            {
                user_id: makeLeader ? member.id : null,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    setLeadershipAction(null);
                },

                onFinish: () => {
                    setUpdatingLeader(false);
                },
            },
        );
    };

    const openLeadershipConfirmation = (member, makeLeader) => {
        if (archived || updatingLeader) {
            return;
        }

        setLeadershipAction({
            member,
            makeLeader,
        });
    };

    const closeLeadershipConfirmation = () => {
        if (!updatingLeader) {
            setLeadershipAction(null);
        }
    };

    const renderLeaderBadge = () => (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
            <svg
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
            >
                <path d="M10 1.5 12.6 6.8 18.5 7.6 14.2 11.7 15.2 17.5 10 14.7 4.8 17.5 5.8 11.7 1.5 7.6 7.4 6.8 10 1.5Z" />
            </svg>
            Leader
        </span>
    );

    const renderLeadershipButton = (member, mobile = false) => {
        const baseClass = mobile
            ? 'inline-flex min-h-9 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'
            : 'inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';

        if (member.is_leader) {
            return (
                <button
                    type="button"
                    onClick={() =>
                        openLeadershipConfirmation(member, false)
                    }
                    disabled={updatingLeader}
                    className={`${baseClass} border border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100`}
                >
                    Remove leader
                </button>
            );
        }

        if (member.status !== 'ACTIVE') {
            return null;
        }

        return (
            <button
                type="button"
                onClick={() =>
                    openLeadershipConfirmation(member, true)
                }
                disabled={updatingLeader}
                className={`${baseClass} border border-indigo-200 bg-white text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50`}
            >
                Make leader
            </button>
        );
    };

    const renderRemoveMemberButton = (member, mobile = false) => (
        <button
            type="button"
            onClick={() => setRemoving(member)}
            aria-label={`Remove ${member.name} from team`}
            className={
                mobile
                    ? 'inline-flex min-h-9 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2'
                    : 'inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2'
            }
        >
            {mobile ? 'Remove member' : 'Remove'}
        </button>
    );

    return (
        <AuthenticatedLayout
            header={
                <div className="flex min-w-0 items-center gap-2 text-sm">
                    <Link
                        href={route(
                            'teams.index',
                            archived ? { status: 'archived' } : {},
                        )}
                        className="shrink-0 font-medium text-slate-500 transition hover:text-indigo-600"
                    >
                        Teams
                    </Link>

                    <svg
                        className="h-4 w-4 shrink-0 text-slate-300"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M7.21 14.77a.75.75 0 001.06.02l4.25-4a.75.75 0 000-1.08l-4.25-4a.75.75 0 10-1.02 1.1L10.92 10l-3.71 3.48a.75.75 0 00.02 1.29z"
                            clipRule="evenodd"
                        />
                    </svg>

                    <span className="truncate font-semibold text-slate-900">
                        {team.name}
                    </span>
                </div>
            }
        >
            <Head title={team.name} />

            <div className="w-full space-y-6">
                {/* Team header */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="p-5 sm:p-7">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                        {team.name}
                                    </h1>

                                    {archived ? (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                            Archived
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Active
                                        </span>
                                    )}
                                </div>

                                {team.description && (
                                    <p className="mt-3 max-w-3xl whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                                        {team.description}
                                    </p>
                                )}

                                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                                    <div className="inline-flex items-center gap-2">
                                        <svg
                                            className="h-4 w-4 text-slate-400"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                                            />
                                        </svg>

                                        <span>
                                            Created by{' '}
                                            <span className="font-medium text-slate-700">
                                                {team.creator?.name ?? '—'}
                                            </span>
                                        </span>
                                    </div>

                                    <div className="inline-flex items-center gap-2">
                                        <svg
                                            className="h-4 w-4 text-slate-400"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            aria-hidden="true"
                                        >
                                            <rect
                                                x="3"
                                                y="5"
                                                width="18"
                                                height="16"
                                                rx="2"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M16 3v4M8 3v4M3 11h18"
                                            />
                                        </svg>

                                        <span>
                                            Created{' '}
                                            <span className="font-medium text-slate-700">
                                                {formatDate(team.created_at)}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {!archived && (
                                <button
                                    type="button"
                                    onClick={() => setAdding(true)}
                                    className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
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
                                    Add members
                                </button>
                            )}
                        </div>
                    </div>

                    {archived && (
                        <div className="border-t border-amber-200 bg-amber-50 px-5 py-3.5 sm:px-7">
                            <div className="flex items-start gap-3">
                                <svg
                                    className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v4m0 4h.01M10.3 3.86 2.7 17a2 2 0 0 0 1.74 3h15.12a2 2 0 0 0 1.74-3L13.7 3.86a2 2 0 0 0-3.4 0Z"
                                    />
                                </svg>

                                <p className="text-sm leading-5 text-amber-800">
                                    <span className="font-semibold">
                                        This team is archived.
                                    </span>{' '}
                                    Restore it from the Teams list before
                                    changing its members or leader.
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Success message */}
                {flash?.success && (
                    <div
                        role="status"
                        className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800"
                    >
                        <svg
                            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m5 12 4 4L19 6"
                            />
                        </svg>

                        <p>{flash.success}</p>
                    </div>
                )}

                {/* General team error */}
                {errors?.team && !adding && !removing && !leadershipAction && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800"
                    >
                        <svg
                            className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4m0 4h.01"
                            />
                        </svg>

                        <p>{errors.team}</p>
                    </div>
                )}

                {/* Members section */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Team members
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                People who have access to this team.
                            </p>
                        </div>

                        <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                            {members.length}{' '}
                            {members.length === 1 ? 'member' : 'members'}
                        </span>
                    </div>

                    {members.length === 0 ? (
                        <div className="px-5 py-14 text-center sm:px-6">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                                    />
                                </svg>
                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-slate-900">
                                No members yet
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Add people to this team to get started.
                            </p>

                            {!archived && (
                                <button
                                    type="button"
                                    onClick={() => setAdding(true)}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    <span aria-hidden="true">+</span>
                                    Add members
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Desktop/tablet table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full divide-y divide-slate-200 text-sm">
                                    <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3.5"
                                            >
                                                Employee
                                            </th>

                                            <th
                                                scope="col"
                                                className="px-6 py-3.5"
                                            >
                                                Job title
                                            </th>

                                            <th
                                                scope="col"
                                                className="px-6 py-3.5"
                                            >
                                                Added
                                            </th>

                                            {!archived && (
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3.5 text-right"
                                                >
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {members.map((member) => (
                                            <tr
                                                key={member.id}
                                                className="transition hover:bg-slate-50/80"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <Avatar
                                                            name={member.name}
                                                            src={member.avatar_url}
                                                        />

                                                        <div className="min-w-0">
                                                            <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
                                                                <span className="break-words">
                                                                    {member.name}
                                                                </span>

                                                                {member.is_leader &&
                                                                    renderLeaderBadge()}

                                                                {member.status !==
                                                                    'ACTIVE' && (
                                                                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </p>

                                                            <p className="mt-0.5 break-all text-xs text-slate-500">
                                                                {member.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-slate-600">
                                                    {member.job_title || '—'}
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                                                    {formatDate(
                                                        member.added_at,
                                                    )}
                                                </td>

                                                {!archived && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                                            {renderLeadershipButton(
                                                                member,
                                                            )}

                                                            {renderRemoveMemberButton(
                                                                member,
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile member cards */}
                            <div className="divide-y divide-slate-100 md:hidden">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="p-4 sm:p-5"
                                    >
                                        <div className="flex items-start gap-3">
                                            <Avatar
                                                name={member.name}
                                                src={member.avatar_url}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="break-words text-sm font-semibold text-slate-900">
                                                        {member.name}
                                                    </p>

                                                    {member.is_leader &&
                                                        renderLeaderBadge()}

                                                    {member.status !==
                                                        'ACTIVE' && (
                                                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-1 break-all text-xs text-slate-500">
                                                    {member.email}
                                                </p>

                                                <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                                                    <div>
                                                        <p className="text-xs text-slate-400">
                                                            Job title
                                                        </p>

                                                        <p className="mt-0.5 break-words text-slate-700">
                                                            {member.job_title ||
                                                                '—'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-400">
                                                            Added
                                                        </p>

                                                        <p className="mt-0.5 text-slate-700">
                                                            {formatDate(
                                                                member.added_at,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {!archived && (
                                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                                        {renderLeadershipButton(
                                                            member,
                                                            true,
                                                        )}

                                                        {renderRemoveMemberButton(
                                                            member,
                                                            true,
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>

                {/* Projects */}
                <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                        <h2 className="text-base font-semibold text-slate-900">
                            Projects{' '}
                            <span className="text-slate-500">
                                ({projects.length})
                            </span>
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Projects associated with this team.
                        </p>
                    </div>

                    {projects.length === 0 ? (
                        <div className="px-5 py-10 text-center sm:px-6">
                            <p className="text-sm font-medium text-slate-700">
                                No projects linked
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                This team is not linked to any project.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {projects.map((project) => (
                                <li
                                    key={project.id}
                                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                                >
                                    <Link
                                        href={route(
                                            'projects.show',
                                            project.id,
                                        )}
                                        className="flex min-w-0 items-center gap-3 hover:text-indigo-600"
                                    >
                                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-500">
                                            {project.code}
                                        </span>

                                        <span className="truncate text-sm font-medium text-slate-900">
                                            {project.name}
                                        </span>
                                    </Link>

                                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                project.status === 'ACTIVE'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-sky-50 text-sky-700'
                                            }`}
                                        >
                                            {project.status === 'ACTIVE'
                                                ? 'Active'
                                                : 'Completed'}
                                        </span>

                                        {project.archived_at && (
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                Archived
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            {/* Add members modal */}
            {adding && (
                <AddMembersModal
                    team={team}
                    onClose={() => setAdding(false)}
                />
            )}

            {/* Remove member modal */}
            {removing && (
                <RemoveMemberModal
                    key={removing.id}
                    team={team}
                    member={removing}
                    onClose={() => setRemoving(null)}
                />
            )}

            {/* Make / remove leader confirmation modal */}
            {leadershipAction && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
                    onMouseDown={(event) => {
                        if (
                            event.target === event.currentTarget &&
                            !updatingLeader
                        ) {
                            closeLeadershipConfirmation();
                        }
                    }}
                >
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="leader-confirm-title"
                        aria-describedby="leader-confirm-description"
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div
                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                        leadershipAction.makeLeader
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'bg-amber-50 text-amber-700'
                                    }`}
                                >
                                    <svg
                                        className="h-5 w-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        aria-hidden="true"
                                    >
                                        {leadershipAction.makeLeader ? (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 3v18m9-9H3"
                                            />
                                        ) : (
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M5 12h14"
                                            />
                                        )}
                                    </svg>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h2
                                        id="leader-confirm-title"
                                        className="text-lg font-semibold text-slate-900"
                                    >
                                        {leadershipAction.makeLeader
                                            ? 'Make team leader?'
                                            : 'Remove team leader?'}
                                    </h2>

                                    <p
                                        id="leader-confirm-description"
                                        className="mt-2 text-sm leading-6 text-slate-600"
                                    >
                                        {leadershipAction.makeLeader ? (
                                            <>
                                                Are you sure you want to make{' '}
                                                <span className="font-semibold text-slate-900">
                                                    {
                                                        leadershipAction.member
                                                            .name
                                                    }
                                                </span>{' '}
                                                the leader of{' '}
                                                <span className="font-semibold text-slate-900">
                                                    {team.name}
                                                </span>
                                                ? The current leader, if any,
                                                will be replaced.
                                            </>
                                        ) : (
                                            <>
                                                Are you sure you want to remove{' '}
                                                <span className="font-semibold text-slate-900">
                                                    {
                                                        leadershipAction.member
                                                            .name
                                                    }
                                                </span>{' '}
                                                as the leader of{' '}
                                                <span className="font-semibold text-slate-900">
                                                    {team.name}
                                                </span>
                                                ? The team will have no leader
                                                until another member is assigned.
                                            </>
                                        )}
                                    </p>

                                    {errors?.user_id && (
                                        <p
                                            role="alert"
                                            className="mt-3 text-sm text-rose-600"
                                        >
                                            {errors.user_id}
                                        </p>
                                    )}

                                    {errors?.team && (
                                        <p
                                            role="alert"
                                            className="mt-3 text-sm text-rose-600"
                                        >
                                            {errors.team}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeLeadershipConfirmation}
                                disabled={updatingLeader}
                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmLeadershipChange}
                                disabled={updatingLeader}
                                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    leadershipAction.makeLeader
                                        ? 'bg-indigo-600 hover:bg-indigo-700'
                                        : 'bg-amber-600 hover:bg-amber-700'
                                }`}
                            >
                                {updatingLeader && (
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
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
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                        />
                                    </svg>
                                )}

                                {updatingLeader
                                    ? 'Please wait...'
                                    : leadershipAction.makeLeader
                                      ? 'Confirm leader'
                                      : 'Remove leader'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
