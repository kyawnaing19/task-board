import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
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

export default function Show({ team, members }) {
    const { flash, errors } = usePage().props;

    const [adding, setAdding] = useState(false);
    const [removing, setRemoving] = useState(null);

    const archived = !!team.archived_at;

    return (
        <AuthenticatedLayout header="Teams">
            <Head title={team.name} />

            <div className="mx-auto w-full max-w-7xl space-y-6">
                {/* Back navigation */}
                <div>
                    <Link
                        href={route(
                            'teams.index',
                            archived ? { status: 'archived' } : {}
                        )}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 12H5m7 7-7-7 7-7"
                            />
                        </svg>
                        Back to teams
                    </Link>
                </div>

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
                                    Restore it from the Teams list before changing its members.
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

                {/* Error message */}
                {errors?.team && !adding && !removing && (
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
                                            <th scope="col" className="px-6 py-3.5">
                                                Employee
                                            </th>
                                            <th scope="col" className="px-6 py-3.5">
                                                Job title
                                            </th>
                                            <th scope="col" className="px-6 py-3.5">
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

                                                                {member.status !== 'ACTIVE' && (
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
                                                    {formatDate(member.added_at)}
                                                </td>

                                                {!archived && (
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => setRemoving(member)}
                                                            aria-label={`Remove ${member.name} from team`}
                                                            className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                                                        >
                                                            Remove
                                                        </button>
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
                                    <div key={member.id} className="p-4 sm:p-5">
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

                                                    {member.status !== 'ACTIVE' && (
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
                                                            {member.job_title || '—'}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-400">
                                                            Added
                                                        </p>
                                                        <p className="mt-0.5 text-slate-700">
                                                            {formatDate(member.added_at)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {!archived && (
                                                    <div className="mt-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setRemoving(member)}
                                                            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                                                        >
                                                            Remove member
                                                        </button>
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

                {/* Projects placeholder */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                        <h2 className="text-base font-semibold text-slate-900">
                            Projects
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Projects associated with this team.
                        </p>
                    </div>

                    <div className="px-5 py-10 text-center sm:px-6">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                            >
                                <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="16"
                                    rx="2"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 10h18M8 4v6m8-6v6"
                                />
                            </svg>
                        </div>

                        <h3 className="mt-4 text-sm font-semibold text-slate-900">
                            Projects coming soon
                        </h3>
                        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                            Projects linked to this team will appear here once the Projects module is available.
                        </p>
                    </div>
                </section>
            </div>

            {/* Modals */}
            {adding && (
                <AddMembersModal
                    team={team}
                    onClose={() => setAdding(false)}
                />
            )}

            {removing && (
                <RemoveMemberModal
                    key={removing.id}
                    team={team}
                    member={removing}
                    onClose={() => setRemoving(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}