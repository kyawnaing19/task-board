import React, { useEffect, useRef, useState } from 'react';
import Avatar from '@/Components/Avatar';
import GroupPill from '@/Components/GroupPill';
import TagChip from '@/Components/TagChip';
import { errorMessage, getJson, patchJson, postJson } from '@/lib/http';
import { PRIORITY_LABELS, formatDateTime } from '@/lib/taskFormat';
import { readTaskParam, writeTaskParam } from '@/lib/taskParam';
import TaskDrawer from './TaskDrawer';

const ASSIGNEE_LABELS = {
    inactive: 'inactive',
    non_member: 'no longer a member',
};

function Row({ task, restoring, onOpen, onRestore }) {
    const shown = task.assignees.slice(0, 4);
    const extra = task.assignees.length - shown.length;

    return (
        <li
    onClick={() => onOpen(task)}
    className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 py-3.5 transition-colors hover:bg-slate-50 sm:px-5 cursor-pointer"
>
    <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="shrink-0 font-mono text-xs text-slate-400">
                {task.code}
            </span>

            {/* Normal title, not a button */}
            <span className="break-words text-sm font-semibold text-slate-800">
                {task.title}
            </span>
        </div>

        {/* Task metadata */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            {task.group && (
                <GroupPill
                    name={task.group.name}
                    color={task.group.color}
                />
            )}

            {shown.length > 0 && (
                <div className="flex items-center -space-x-1.5">
                    {shown.map((a) => (
                        <span
                            key={a.id}
                            title={
                                a.label
                                    ? `${a.name} (${ASSIGNEE_LABELS[a.label] ?? a.label})`
                                    : a.name
                            }
                            className={`rounded-full ring-2 ring-white ${
                                a.label ? 'opacity-50 grayscale' : ''
                            }`}
                        >
                            <Avatar
                                name={a.name}
                                src={a.avatar_url}
                                className="h-6 w-6 text-[10px]"
                            />
                        </span>
                    ))}

                    {extra > 0 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
                            +{extra}
                        </span>
                    )}
                </div>
            )}

            {task.priority !== 'NORMAL' && (
                <span className="text-xs font-medium text-slate-500">
                    {PRIORITY_LABELS[task.priority]} priority
                </span>
            )}

            {task.tags.map((t) => (
                <TagChip
                    key={t.id}
                    name={t.name}
                    color={t.color}
                    inactive={t.inactive}
                />
            ))}
        </div>

        <p className="mt-2 text-xs text-slate-400">
            Archived {formatDateTime(task.archived_at)}
        </p>
    </div>

    {/* Restore action */}
    {task.can_manage && (
        <div
            className="flex shrink-0 flex-col items-end gap-1.5"
            onClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                onClick={() => onRestore(task)}
                disabled={!task.can_restore || restoring}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
                {restoring ? 'Restoring…' : 'Restore'}
            </button>

            {task.restore_blocked_reason && (
                <p className="max-w-[16rem] text-right text-xs leading-relaxed text-amber-600">
                    {task.restore_blocked_reason}
                </p>
            )}
        </div>
    )}
</li>
    );
}

export default function ArchivedTasks({ projectId, onChanged }) {
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [options, setOptions] = useState(null);
    const [openTaskId, setOpenTaskId] = useState(readTaskParam);
    const [restoringId, setRestoringId] = useState(null);
    const [toast, setToast] = useState(null);

    // Notify the board when archived-task changes need to be reflected.
    const dirty = useRef(false);
    const onChangedRef = useRef(onChanged);

    onChangedRef.current = onChanged;

    useEffect(() => {
        return () => {
            if (dirty.current) {
                onChangedRef.current?.();
            }
        };
    }, []);

    const markChanged = () => {
        dirty.current = true;
    };

    const notify = (type, message) => {
        setToast({
            type,
            message,
            id: Date.now(),
        });
    };

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => {
            setToast(null);
        }, 4500);

        return () => clearTimeout(timer);
    }, [toast]);

    // Load options for the task drawer.
    useEffect(() => {
        const controller = new AbortController();

        getJson(
            route('projects.board.options', projectId),
            controller.signal
        )
            .then(setOptions)
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    // Options are optional until the drawer needs them.
                }
            });

        return () => controller.abort();
    }, [projectId]);

    // Load archived tasks.
    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        getJson(
            route('projects.tasks.archived', {
                project: projectId,
                page,
            }),
            controller.signal
        )
            .then((payload) => {
                // Return to the last valid page if the current page is empty.
                if (
                    payload.data.length === 0 &&
                    payload.current_page > 1
                ) {
                    setPage(Math.max(payload.last_page, 1));
                    return;
                }

                setData(payload);
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;

                setError(
                    err.status === 404
                        ? 'This project is not available.'
                        : 'Could not load archived tasks.'
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [projectId, page, reloadKey]);

    const reload = () => {
        setReloadKey((key) => key + 1);
    };

    const openTask = (task) => {
        setOpenTaskId(task.id);
        writeTaskParam(task.id);
    };

    const closeTask = () => {
        setOpenTaskId(null);
        writeTaskParam(null);
    };

    // Restore an archived task.
    const restore = async (task) => {
        setRestoringId(task.id);

        try {
            const res = await postJson(
                route('tasks.restore', task.id)
            );

            markChanged();

            notify(
                'success',
                `${res.task.code} restored. It is back on the board.`
            );
        } catch (err) {
            notify(
                'error',
                errorMessage(err, ['project', 'task'])
            );
        } finally {
            setRestoringId(null);

            // Refresh the list even when the restore request fails.
            reload();
        }
    };

    // Handle restoring a task from the drawer.
    const handleRestored = (card) => {
        markChanged();

        notify(
            'success',
            `${card.code} restored. It is back on the board.`
        );

        reload();
    };

    // Handle archiving a task from the drawer.
    const handleArchived = () => {
        markChanged();
        reload();
    };

    // Move a task from the drawer.
    const moveFromDrawer = async (id, groupId) => {
        try {
            await patchJson(
                route('tasks.move', id),
                {
                    group_id: groupId,
                }
            );

            markChanged();
            notify('success', 'Task moved.');

            return true;
        } catch (err) {
            notify(
                'error',
                errorMessage(err, ['group_id', 'task', 'project'])
            );

            return false;
        }
    };

    const total = data?.total ?? 0;
    const lastPage = data?.last_page ?? 1;

    return (
        <div className="w-full">
            {/* Error message */}
            {error && (
                <div
                    role="alert"
                    className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                >
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={reload}
                        className="shrink-0 rounded-md px-2 py-1 font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Archived tasks container */}
            <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Header */}
                <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Archived tasks
                        </h2>

                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-600">
                            {total.toLocaleString()}
                        </span>
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        Archived tasks are not shown on the board or in
                        search. Their assignments and history are kept.
                    </p>
                </div>

                {/* Loading skeleton */}
                {!data && loading ? (
                    <div
                        className="animate-pulse space-y-5 px-4 py-5 sm:px-5"
                        aria-busy="true"
                        aria-label="Loading archived tasks"
                    >
                        {[0, 1, 2].map((i) => (
                            <div
                                key={i}
                                className="space-y-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                            >
                                <div className="h-3.5 w-24 rounded-md bg-slate-200" />

                                <div className="h-4 w-2/3 rounded-md bg-slate-200" />

                                <div className="flex gap-2">
                                    <div className="h-6 w-16 rounded-full bg-slate-100" />
                                    <div className="h-6 w-20 rounded-full bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : data && data.data.length === 0 ? (
                    /* Empty state */
                    <div className="px-5 py-12 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 8h14M5 8l1.5 11h11L19 8M9 8V6a3 3 0 016 0v2"
                                />
                            </svg>
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-800">
                            No archived tasks
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Archived tasks will appear here.
                        </p>
                    </div>
                ) : data ? (
                    /* Task list */
                    <ul
                        className={`divide-y divide-slate-100 transition-opacity ${
                            loading ? 'opacity-60' : 'opacity-100'
                        }`}
                        aria-busy={loading}
                    >
                        {data.data.map((task) => (
                            <Row
                                key={task.id}
                                task={task}
                                restoring={restoringId === task.id}
                                onOpen={openTask}
                                onRestore={restore}
                            />
                        ))}
                    </ul>
                ) : null}

                {/* Pagination */}
                {data && lastPage > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:px-5">
                        <button
                            type="button"
                            onClick={() =>
                                setPage((p) => Math.max(p - 1, 1))
                            }
                            disabled={loading || data.current_page <= 1}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span className="text-xs font-medium text-slate-500">
                            Page{' '}
                            <span className="text-slate-800">
                                {data.current_page}
                            </span>{' '}
                            of{' '}
                            <span className="text-slate-800">
                                {lastPage}
                            </span>
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setPage((p) => Math.min(p + 1, lastPage))
                            }
                            disabled={
                                loading ||
                                data.current_page >= lastPage
                            }
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Task drawer */}
            {openTaskId && (
                <TaskDrawer
                    key={openTaskId}
                    taskId={openTaskId}
                    projectId={projectId}
                    options={options}
                    onClose={closeTask}
                    onCardChange={markChanged}
                    onArchived={handleArchived}
                    onRestored={handleRestored}
                    onMove={moveFromDrawer}
                />
            )}

            {/* Toast notification */}
            {toast && (
                <div
                    key={toast.id}
                    role="status"
                    aria-live="polite"
                    className={`fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-lg sm:bottom-6 sm:right-6 ${
                        toast.type === 'error'
                            ? 'border-rose-200 bg-white text-rose-700'
                            : 'border-emerald-200 bg-white text-emerald-700'
                    }`}
                >
                    <div className="flex items-start gap-2.5">
                        {toast.type === 'error' ? (
                            <svg
                                className="mt-0.5 h-4 w-4 shrink-0"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-11a1 1 0 112 0v3a1 1 0 11-2 0V7zm1 7a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        ) : (
                            <svg
                                className="mt-0.5 h-4 w-4 shrink-0"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        )}

                        <p className="min-w-0 flex-1 leading-relaxed">
                            {toast.message}
                        </p>

                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            aria-label="Dismiss notification"
                            className="shrink-0 rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}