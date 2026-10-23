import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
} from 'react';

import { Head, Link, router, usePage } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RowActionsMenu from '@/Components/RowActionsMenu';
import TagChip from '@/Components/TagChip';
import TagFormModal from './Partials/TagFormModal';
import RestoreTagModal from './Partials/RestoreTagModal';
import ConfirmationModal from '@/Components/ConfirmationModal';

const formatDate = (value) => {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export default function Index({
    tags = [],
    active_names = [],
    colors = [],
    filters = {},
}) {
    const { flash, errors = {} } = usePage().props;

    const [form, setForm] = useState(null);
    const [restoring, setRestoring] = useState(null);
    const [archiving, setArchiving] = useState(null);

    const [search, setSearch] = useState(filters.search || '');
    const [archiveProcessing, setArchiveProcessing] = useState(false);

    const debounceRef = useRef(null);
    const searchInputRef = useRef(null);

    const isArchived = filters.status === 'archived';

    const anyModal = Boolean(form || restoring || archiving);

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    const performSearch = useCallback(
        (value, status = filters.status) => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                router.get(
                    route('tags.index'),
                    {
                        ...(status ? { status } : {}),
                        search: value.trim(),
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                );

                debounceRef.current = null;
            }, 300);
        },
        [filters.status],
    );

    const handleSearchChange = (event) => {
        const value = event.target.value;

        setSearch(value);
        performSearch(value);
    };

    /*
    |--------------------------------------------------------------------------
    | Clear search
    |--------------------------------------------------------------------------
    |
    | The browser's built-in search clear button clears the input.
    | React's onChange handles the input change and updates the results.
    |
    */

    const handleClearSearch = () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }

        setSearch('');

        router.get(
            route('tags.index'),
            {
                ...(filters.status ? { status: filters.status } : {}),
                search: '',
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );

        searchInputRef.current?.focus();
    };

    /*
    |--------------------------------------------------------------------------
    | Synchronize search with server filters
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        setSearch(filters.search || '');
    }, [filters.search, filters.status]);

    /*
    |--------------------------------------------------------------------------
    | Cleanup
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    /*
    |--------------------------------------------------------------------------
    | Archive
    |--------------------------------------------------------------------------
    */

    const archive = (tag) => {
        if (archiveProcessing) return;

        setArchiving(tag);
    };

    const cancelArchive = () => {
        if (archiveProcessing) return;

        setArchiving(null);
    };

    const confirmArchive = () => {
        if (!archiving || archiveProcessing) return;

        setArchiveProcessing(true);

        router.post(
            route('tags.archive', archiving.id),
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    setArchiving(null);
                },

                onFinish: () => {
                    setArchiveProcessing(false);
                },
            },
        );
    };

    /*
    |--------------------------------------------------------------------------
    | Row actions
    |--------------------------------------------------------------------------
    */

    const menuItems = (tag) => [
        {
            label: 'Edit',
            onClick: () => setForm(tag),
        },
        {
            label: 'Archive',
            danger: true,
            separatorBefore: true,
            onClick: () => archive(tag),
        },
    ];

    /*
    |--------------------------------------------------------------------------
    | Tabs
    |--------------------------------------------------------------------------
    */

    const tabClass = (active) =>
        [
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
            active
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:bg-white/70 hover:text-slate-800',
        ].join(' ');

    /*
    |--------------------------------------------------------------------------
    | Errors
    |--------------------------------------------------------------------------
    */

    const pageError = errors.tag || errors.name;

    return (
        <AuthenticatedLayout header="Tags">
            <Head title="Tags" />

            <div className="tags-page w-full min-w-0 space-y-5 sm:space-y-6">
                {/* Tabs and actions */}
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    {/* Status tabs */}
                    <div className="inline-flex w-fit max-w-full rounded-xl border border-slate-200 bg-slate-100 p-1">
                        <Link
                            href={route('tags.index')}
                            preserveScroll
                            className={tabClass(!isArchived)}
                            aria-current={!isArchived ? 'page' : undefined}
                        >
                            Active
                        </Link>

                        <Link
                            href={route('tags.index', {
                                status: 'archived',
                            })}
                            preserveScroll
                            className={tabClass(isArchived)}
                            aria-current={isArchived ? 'page' : undefined}
                        >
                            Archived
                        </Link>
                    </div>

                    {/* Search and create */}
                    <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                        <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                            <svg
                                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <circle
                                    cx="11"
                                    cy="11"
                                    r="7"
                                    strokeWidth="1.8"
                                />

                                <path
                                    d="m16 16 4 4"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />
                            </svg>

                            <input
                                ref={searchInputRef}
                                type="search"
                                value={search}
                                onChange={handleSearchChange}
                                onSearch={(event) => {
                                    if (event.target.value === '') {
                                        handleClearSearch();
                                    }
                                }}
                                placeholder="Search tags..."
                                aria-label="Search tags"
                                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>

                        {!isArchived && (
                            <button
                                type="button"
                                onClick={() => setForm('create')}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M12 5v14M5 12h14"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>

                                New tag
                            </button>
                        )}
                    </div>
                </div>

                {/* Success message */}
                {flash?.success && (
                    <div
                        role="status"
                        className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                    >
                        <svg
                            className="mt-0.5 h-5 w-5 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="m5 12 4 4L19 6"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>

                        <p>{flash.success}</p>
                    </div>
                )}

                {/* Page-level error */}
                {pageError && !anyModal && (
                    <div
                        role="alert"
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                        {pageError}
                    </div>
                )}

                {/* Tags list */}
                <section className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* List header */}
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-slate-900">
                                {isArchived
                                    ? 'Archived tags'
                                    : 'Active tags'}
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                {isArchived
                                    ? 'Archived tags cannot be selected for new tasks.'
                                    : 'Manage the tags available when creating or editing tasks.'}
                            </p>
                        </div>

                        <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {tags.length}{' '}
                            {tags.length === 1 ? 'tag' : 'tags'}
                        </span>
                    </div>

                    {/* Empty state */}
                    {tags.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-semibold text-indigo-400">
                                #
                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-slate-800">
                                {search.trim()
                                    ? 'No matching tags'
                                    : isArchived
                                      ? 'No archived tags'
                                      : 'No tags yet'}
                            </h3>

                            <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
                                {search.trim()
                                    ? 'Try another search term or clear your search.'
                                    : isArchived
                                      ? 'Tags you archive will appear here.'
                                      : 'Create your first tag to organize tasks.'}
                            </p>

                            {search.trim() ? (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Clear search
                                </button>
                            ) : (
                                !isArchived && (
                                    <button
                                        type="button"
                                        onClick={() => setForm('create')}
                                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                    >
                                        <span className="text-lg leading-none">
                                            +
                                        </span>
                                        Create your first tag
                                    </button>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="max-h-[min(65vh,640px)] min-h-0 overflow-y-auto overscroll-contain">
                            <ul className="divide-y divide-slate-100">
                                {tags.map((tag, index) => (
                                    <li
                                        key={tag.id}
                                        className="group flex min-w-0 flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
                                    >
                                        {/* Tag information */}
                                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
                                            <div className="min-w-0 max-w-full">
                                                <TagChip
                                                    name={tag.name}
                                                    color={tag.color}
                                                    inactive={isArchived}
                                                />
                                            </div>

                                            <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                                {tag.tasks_count}{' '}
                                                {tag.tasks_count === 1
                                                    ? 'task'
                                                    : 'tasks'}
                                            </span>

                                            {isArchived && (
                                                <span className="text-xs text-slate-500">
                                                    Archived{' '}
                                                    {formatDate(
                                                        tag.archived_at,
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {/* Row actions */}
                                        <div className="flex shrink-0 items-center justify-end">
                                            {isArchived ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setRestoring(tag)
                                                    }
                                                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
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
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* List footer */}
                    {tags.length > 0 && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 sm:px-5">
                            <p className="text-xs text-slate-500">
                                Showing {tags.length}{' '}
                                {tags.length === 1 ? 'tag' : 'tags'}

                                {search.trim() && (
                                    <>
                                        {' '}
                                        matching{' '}
                                        <span className="font-medium text-slate-700">
                                            "{search.trim()}"
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    )}
                </section>
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

            {/* Archive confirmation modal */}
            <ConfirmationModal
                show={Boolean(archiving)}
                title="Archive tag?"
                message={
                    archiving
                        ? `Archive "${archiving.name}"? It can no longer be selected on tasks.${
                              archiving.tasks_count > 0
                                  ? ` It is used on ${archiving.tasks_count} ${
                                        archiving.tasks_count === 1
                                            ? 'task'
                                            : 'tasks'
                                    }; existing tasks will keep the tag as an inactive label.`
                                  : ''
                          }`
                        : ''
                }
                confirmText="Archive"
                cancelText="Cancel"
                variant="danger"
                processing={archiveProcessing}
                onConfirm={confirmArchive}
                onCancel={cancelArchive}
            />
        </AuthenticatedLayout>
    );
}
