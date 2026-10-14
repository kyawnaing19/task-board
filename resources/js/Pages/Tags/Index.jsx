import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RowActionsMenu from '@/Components/RowActionsMenu';
import TagChip from '@/Components/TagChip';
import TagFormModal from './Partials/TagFormModal';
import RestoreTagModal from './Partials/RestoreTagModal';

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : '—';

export default function Index({ tags, active_names, colors, filters }) {
    const { flash, errors } = usePage().props;

    const [form, setForm] = useState(null); // 'create' | tag
    const [restoring, setRestoring] = useState(null);

    const isArchived = filters.status === 'archived';
    const anyModal = form || restoring;

    const archive = (tag) => {
        const used =
            tag.tasks_count > 0
                ? ` It is used on ${tag.tasks_count} ${
                      tag.tasks_count === 1 ? 'task' : 'tasks'
                  }; they keep the tag as an inactive label.`
                : '';

        if (
            !confirm(
                `Archive "${tag.name}"? It can no longer be selected on tasks.${used}`
            )
        )
            return;

        router.post(route('tags.archive', tag.id), {}, {
            preserveScroll: true,
        });
    };

    const menuItems = (tag) => [
        { label: 'Edit', onClick: () => setForm(tag) },
        {
            label: 'Archive',
            danger: true,
            separatorBefore: true,
            onClick: () => archive(tag),
        },
    ];

    const tabClass = (active) =>
        `rounded-lg px-4 py-2 text-sm font-medium transition ${
            active
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
        }`;

    return (
        <AuthenticatedLayout header="Tags">
            <Head title="Tags" />

            <div className="space-y-6">
                {/* Header actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">
                            Tags
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage task labels and their availability.
                        </p>
                    </div>

                    {!isArchived && (
                        <button
                            type="button"
                            onClick={() => setForm('create')}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            <span className="text-lg leading-none">+</span>
                            New tag
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                        <Link
                            href={route('tags.index')}
                            preserveScroll
                            className={tabClass(!isArchived)}
                        >
                            Active
                        </Link>

                        <Link
                            href={route('tags.index', { status: 'archived' })}
                            preserveScroll
                            className={tabClass(isArchived)}
                        >
                            Archived
                        </Link>
                    </div>
                </div>

                {/* Success message */}
                {flash?.success && (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <span className="font-bold">✓</span>
                        <p>{flash.success}</p>
                    </div>
                )}

                {/* Error message */}
                {(errors?.tag || errors?.name) && !anyModal && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {errors.tag || errors.name}
                    </div>
                )}

                {/* Tags list */}
                <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* List header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                {isArchived ? 'Archived tags' : 'Active tags'}
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                {isArchived
                                    ? 'Archived tags cannot be selected for new tasks.'
                                    : 'Active tags are available when creating or editing tasks.'}
                            </p>
                        </div>

                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {tags.length}{' '}
                            {tags.length === 1 ? 'tag' : 'tags'}
                        </span>
                    </div>

                    {/* Empty state */}
                    {tags.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
                                #
                            </div>

                            <p className="mt-3 text-sm font-medium text-slate-800">
                                {isArchived
                                    ? 'No archived tags'
                                    : 'No tags yet'}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {isArchived
                                    ? 'Archived tags will appear here.'
                                    : 'Create your first tag to organize tasks.'}
                            </p>

                            {!isArchived && (
                                <button
                                    type="button"
                                    onClick={() => setForm('create')}
                                    className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                >
                                    Create your first tag
                                </button>
                            )}
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {tags.map((tag, index) => (
                                <li
                                    key={tag.id}
                                    className="group flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
                                >
                                    {/* Tag information */}
                                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                                        <TagChip
                                            name={tag.name}
                                            color={tag.color}
                                            inactive={isArchived}
                                        />

                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                            {tag.tasks_count}{' '}
                                            {tag.tasks_count === 1
                                                ? 'task'
                                                : 'tasks'}
                                        </span>

                                        {isArchived && (
                                            <span className="text-xs text-slate-500">
                                                Archived{' '}
                                                {formatDate(tag.archived_at)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Row actions */}
                                    {isArchived ? (
                                        <button
                                            type="button"
                                            onClick={() => setRestoring(tag)}
                                            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                        >
                                            Restore
                                        </button>
                                    ) : (
                                        <RowActionsMenu
                                            items={menuItems(tag)}
                                            dropUp={
                                                tags.length > 3 &&
                                                index >= tags.length - 2
                                            }
                                        />
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Create / Edit modal */}
            {form && (
                <TagFormModal
                    key={form === 'create' ? 'create' : form.id}
                    tag={form === 'create' ? null : form}
                    colors={colors}
                    onClose={() => setForm(null)}
                />
            )}

            {/* Restore modal */}
            {restoring && (
                <RestoreTagModal
                    key={restoring.id}
                    tag={restoring}
                    activeNames={active_names}
                    onClose={() => setRestoring(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}