import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GroupPill from '@/Components/GroupPill';
import RowActionsMenu from '@/Components/RowActionsMenu';
import GroupFormModal from './Partials/GroupFormModal';
import ChangeFlagModal from './Partials/ChangeFlagModal';
import ArchiveGroupModal from './Partials/ArchiveGroupModal';
import RestoreGroupModal from './Partials/RestoreGroupModal';

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : '—';

export default function Index({ groups, active_names, colors, filters }) {
    const { flash, errors } = usePage().props;

    const [form, setForm] = useState(null); // 'create' | group
    const [flagChange, setFlagChange] = useState(null); // { flag, target }
    const [archiving, setArchiving] = useState(null);
    const [restoring, setRestoring] = useState(null);
    const [busy, setBusy] = useState(false);

    const isArchived = filters.status === 'archived';
    const anyModal = form || flagChange || archiving || restoring;

    const initial = groups.find((g) => g.is_initial);
    const completed = groups.find((g) => g.is_completed);

    const move = (index, direction) => {
        const ids = groups.map((g) => g.id);
        const swap = index + direction;

        if (swap < 0 || swap >= ids.length) return;

        [ids[index], ids[swap]] = [ids[swap], ids[index]];

        router.post(
            route('task-groups.reorder'),
            { ids },
            {
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
            },
        );
    };

    const menuItems = (group) => {
        const items = [
            {
                label: 'Edit',
                onClick: () => setForm(group),
            },
        ];

        if (!group.is_initial) {
            items.push({
                label: 'Set as Initial group',
                onClick: () =>
                    setFlagChange({ flag: 'initial', target: group }),
            });
        }

        if (!group.is_completed) {
            items.push({
                label: 'Set as Completed group',
                onClick: () =>
                    setFlagChange({ flag: 'completed', target: group }),
            });
        }

        items.push({
            label: 'Archive',
            danger: true,
            separatorBefore: true,
            onClick: () => setArchiving(group),
        });

        return items;
    };

    const tabClass = (active) =>
        `rounded-lg px-4 py-1.5 text-sm font-medium transition ${
            active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`;

    return (
        <AuthenticatedLayout header="Task Groups">
            <Head title="Task Groups" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                {/* Status Tabs */}
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                    <Link
                        href={route('task-groups.index')}
                        preserveScroll
                        className={tabClass(!isArchived)}
                    >
                        Active
                    </Link>

                    <Link
                        href={route('task-groups.index', {
                            status: 'archived',
                        })}
                        preserveScroll
                        className={tabClass(isArchived)}
                    >
                        Archived
                    </Link>
                </div>

                {!isArchived && (
                    <button
                        type="button"
                        onClick={() => setForm('create')}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        + New group
                    </button>
                )}
            </div>

            {/* Success Message */}
            {flash?.success && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {flash.success}
                </div>
            )}

            {/* Error Message */}
            {(errors?.group || errors?.ids) && !anyModal && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errors.group || errors.ids}
                </div>
            )}

            {/* Initial / Completed Summary */}
            {!isArchived && (
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    {[
                        [
                            'Initial group',
                            initial,
                            'New tasks without a group start here.',
                        ],
                        [
                            'Completed group',
                            completed,
                            'Tasks here count as completed.',
                        ],
                    ].map(([title, group, hint]) => (
                        <div
                            key={title}
                            className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300"
                        >
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                {title}
                            </p>

                            <div className="mt-2">
                                {group ? (
                                    <GroupPill
                                        name={group.name}
                                        color={group.color}
                                    />
                                ) : (
                                    <span className="text-sm text-slate-400">
                                        —
                                    </span>
                                )}
                            </div>

                            <p className="mt-2 text-xs text-slate-500">
                                {hint}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Groups List */}
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h2 className="text-sm font-semibold text-slate-900">
                        {isArchived ? 'Archived groups' : 'Board columns'}{' '}
                        <span className="font-medium text-slate-500">
                            ({groups.length})
                        </span>
                    </h2>

                    {!isArchived && (
                        <p className="mt-1 text-xs text-slate-500">
                            These groups are shared by every project board, in
                            this order.
                        </p>
                    )}
                </div>

                {groups.length === 0 ? (
                    <p className="px-5 py-10 text-center text-sm text-slate-500">
                        {isArchived
                            ? 'No archived groups.'
                            : 'No groups yet.'}
                    </p>
                ) : (
                    <ul className="divide-y divide-slate-100">
                        {groups.map((group, index) => (
                            <li
                                key={group.id}
                                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-slate-50"
                            >
                                {!isArchived && (
                                    <div className="flex shrink-0 flex-col">
                                        <button
                                            type="button"
                                            onClick={() => move(index, -1)}
                                            disabled={busy || index === 0}
                                            aria-label="Move up"
                                            className="rounded px-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            ▲
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => move(index, 1)}
                                            disabled={
                                                busy ||
                                                index === groups.length - 1
                                            }
                                            aria-label="Move down"
                                            className="rounded px-1 text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                )}

                                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                                    <GroupPill
                                        name={group.name}
                                        color={group.color}
                                    />

                                    {group.is_initial && (
                                        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                            Initial
                                        </span>
                                    )}

                                    {group.is_completed && (
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                                            Completed
                                        </span>
                                    )}

                                    {isArchived && (
                                        <span className="text-xs text-slate-500">
                                            Archived{' '}
                                            {formatDate(group.archived_at)}
                                        </span>
                                    )}
                                </div>

                                {isArchived ? (
                                    <button
                                        type="button"
                                        onClick={() => setRestoring(group)}
                                        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                    >
                                        Restore
                                    </button>
                                ) : (
                                    <RowActionsMenu
                                        items={menuItems(group)}
                                        dropUp={
                                            groups.length > 3 &&
                                            index >= groups.length - 2
                                        }
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Create / Edit Group Modal */}
            {form && (
                <GroupFormModal
                    key={form === 'create' ? 'create' : form.id}
                    group={form === 'create' ? null : form}
                    colors={colors}
                    onClose={() => setForm(null)}
                />
            )}

            {/* Change Flag Modal */}
            {flagChange && (
                <ChangeFlagModal
                    key={`${flagChange.flag}-${flagChange.target.id}`}
                    flag={flagChange.flag}
                    target={flagChange.target}
                    groups={groups}
                    onClose={() => setFlagChange(null)}
                />
            )}

            {/* Archive Group Modal */}
            {archiving && (
                <ArchiveGroupModal
                    key={archiving.id}
                    group={archiving}
                    onClose={() => setArchiving(null)}
                />
            )}

            {/* Restore Group Modal */}
            {restoring && (
                <RestoreGroupModal
                    key={restoring.id}
                    group={restoring}
                    activeNames={active_names}
                    onClose={() => setRestoring(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}