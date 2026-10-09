import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RowActionsMenu from '@/Components/RowActionsMenu';
import CreateTeamModal from './Partials/CreateTeamModal';
import EditTeamModal from './Partials/EditTeamModal';
import ArchiveTeamModal from './Partials/ArchiveTeamModal';

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : '—';

export default function Index({ teams, filters }) {
    const { flash, errors } = usePage().props;

    const [createOpen, setCreateOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [archiving, setArchiving] = useState(null);

    // Search
    const [search, setSearch] = useState(filters?.search ?? '');

    const isArchived = filters.status === 'archived';
    const rows = teams.data;

    /*
     * Server-side search
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = filters?.search ?? '';

            if (search === currentSearch) {
                return;
            }

            router.get(
                route('teams.index'),
                {
                    status: isArchived ? 'archived' : undefined,
                    search: search || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    /*
     * Restore team
     */
    const restore = (team) => {
        if (
            !confirm(
                `Restore "${team.name}"? Its preserved memberships and project links become effective again.`
            )
        ) {
            return;
        }

        router.post(
            route('teams.restore', team.id),
            {},
            {
                preserveScroll: true,
            }
        );
    };

    /*
     * Row actions
     */
    const menuItems = (team) =>
        isArchived
            ? [
                  {
                      label: 'Restore',
                      onClick: () => restore(team),
                  },
              ]
            : [
                  {
                      label: 'Edit',
                      onClick: () => setEditing(team),
                  },
                  {
                      label: 'Archive',
                      onClick: () => setArchiving(team),
                      danger: true,
                      separatorBefore: true,
                  },
              ];

    /*
     * Active / Archived tab style
     */
    const tabClass = (active) =>
        `rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`;

    return (
        <AuthenticatedLayout header="Teams">
            <Head title="Teams" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">
                            Teams
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage your teams and their members.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                            />
                        </svg>

                        New team
                    </button>
                </div>

                {/* Tabs + Search + Count */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Tabs */}
                    <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-50 p-1">
                        <Link
                            href={route('teams.index', {
                                search: search || undefined,
                            })}
                            preserveScroll
                            className={tabClass(!isArchived)}
                        >
                            Active
                        </Link>

                        <Link
                            href={route('teams.index', {
                                status: 'archived',
                                search: search || undefined,
                            })}
                            preserveScroll
                            className={tabClass(isArchived)}
                        >
                            Archived
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
                        <div className="relative w-full sm:w-72">
                            <svg
                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.817-4.817A6 6 0 012 8z"
                                    clipRule="evenodd"
                                />
                            </svg>

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search teams..."
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {/* Count */}
                        <div className="text-xs text-slate-400 sm:whitespace-nowrap">
                            {teams.total ?? rows.length}{' '}
                            {teams.total === 1 ? 'team' : 'teams'}
                        </div>
                    </div>
                </div>

                {/* Success message */}
                {flash?.success && (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <svg
                            className="mt-0.5 h-5 w-5 shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                            />
                        </svg>

                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Archive / restore error */}
                {errors?.team && !editing && !archiving && (
                    <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <svg
                            className="mt-0.5 h-5 w-5 shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.334-.213 2.986-1.742 2.986H3.481c-1.53 0-2.492-1.652-1.742-2.986L8.257 3.1zM10 7a1 1 0 01.993.883L11 8v3a1 1 0 01-1.993.117L9 11V8a1 1 0 011-1zm0 6a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                            />
                        </svg>

                        <span>{errors.team}</span>
                    </div>
                )}

                {/* Teams table */}
                <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[750px] text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3.5">
                                        Team
                                    </th>

                                    <th className="hidden px-5 py-3.5 md:table-cell">
                                        Created by
                                    </th>

                                    <th className="px-5 py-3.5">
                                        {isArchived
                                            ? 'Archived on'
                                            : 'Created'}
                                    </th>

                                    <th className="px-5 py-3.5 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {/* Empty state */}
                                {rows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-14 text-center"
                                        >
                                            <div className="mx-auto flex max-w-sm flex-col items-center">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                                    <svg
                                                        className="h-6 w-6"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="1.8"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M3 7.5L12 3l9 4.5M3 7.5v9L12 21l9-4.5v-9M3 7.5l9 4.5m9-4.5L12 12m0 0v9"
                                                        />
                                                    </svg>
                                                </div>

                                                <p className="mt-4 text-sm font-medium text-slate-700">
                                                    {search
                                                        ? 'No teams found'
                                                        : isArchived
                                                          ? 'No archived teams'
                                                          : 'No teams yet'}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {search
                                                        ? `No teams match "${search}".`
                                                        : isArchived
                                                          ? 'There are no archived teams to display.'
                                                          : 'Create your first team to get started.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Team rows */}
                                {rows.map((team, index) => {
                                    const dropUp =
                                        rows.length > 3 &&
                                        index >= rows.length - 2;

                                    return (
                                        <tr
                                            key={team.id}
                                            className="group transition hover:bg-slate-50"
                                        >
                                            {/* Team */}
                                            <td className="px-5 py-4">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600">
                                                        {team.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase() ||
                                                            'T'}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <Link
                                                            href={route('teams.show', team.id)}
                                                            className="font-medium text-slate-900 transition-colors hover:text-indigo-600"
                                                        >
                                                            {team.name}
                                                        </Link>

                                                        {team.description && (
                                                            <p className="mt-0.5 line-clamp-2 max-w-xl text-xs text-slate-500">
                                                                {team.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Created by */}
                                            <td className="hidden px-5 py-4 text-slate-600 md:table-cell">
                                                {team.creator?.name ?? '—'}
                                            </td>

                                            {/* Date */}
                                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                                {formatDate(
                                                    isArchived
                                                        ? team.archived_at
                                                        : team.created_at
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4 text-right">
                                                <RowActionsMenu
                                                    items={menuItems(team)}
                                                    dropUp={dropUp}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {teams.links.length > 3 && (
                        <div className="flex flex-wrap gap-1 border-t border-slate-200 p-4">
                            {teams.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
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
                    )}
                </div>
            </div>

            {/* Create Team Modal */}
            <CreateTeamModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
            />

            {/* Edit Team Modal */}
            {editing && (
                <EditTeamModal
                    key={editing.id}
                    team={editing}
                    onClose={() => setEditing(null)}
                />
            )}

            {/* Archive Team Modal */}
            {archiving && (
                <ArchiveTeamModal
                    key={archiving.id}
                    team={archiving}
                    onClose={() => setArchiving(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}