import React, { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';

import Avatar from '@/Components/Avatar';
import GroupPill from '@/Components/GroupPill';

import {
    errorMessage,
    getJson,
    patchJson,
    postJson,
} from '@/lib/http';

import { formatDateTime } from '@/lib/taskFormat';

import Section from './Drawer/Section';
import TitleField from './Drawer/TitleField';
import DescriptionField from './Drawer/DescriptionField';
import DatesField from './Drawer/DatesField';
import PeopleField from './Drawer/PeopleField';
import TagsField from './Drawer/TagsField';
import AttachmentsField from './Drawer/AttachmentsField';
import HistoryTimeline from './Drawer/HistoryTimeline';
import ConfirmationModal from '@/Components/ConfirmationModal';



const PERSON_LABELS = {
    inactive: 'inactive',
    non_member: 'no longer a member',
};

const PRIORITIES = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
];

const PRIORITY_STYLES = {
    LOW: 'border-slate-200 bg-slate-50 text-slate-600',
    NORMAL: 'border-blue-200 bg-blue-50 text-blue-700',
    HIGH: 'border-amber-200 bg-amber-50 text-amber-700',
    URGENT: 'border-rose-200 bg-rose-50 text-rose-700',
};
// Preserve previously loaded history pages after refreshing task details.
const mergeHistory = (prev, next) => {
    const byId = new Map();

    [...next.data, ...prev.data].forEach((item) => {
        byId.set(item.id, item);
    });

    return {
        data: [...byId.values()].sort((a, b) => b.id - a.id),
        next_cursor: prev.next_cursor,
    };
};

const CloseIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path
            d="M18 6 6 18M6 6l12 12"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const ArchiveIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path
            d="M3.75 7.5h16.5v12H3.75zM3 4.5h18v3H3zM9 12h6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const RestoreIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path
            d="M3.75 11a8.25 8.25 0 1 1 2.4 5.85M3.75 4.5V11H10"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const DetailRow = ({ label, children }) => (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
        <dt className="shrink-0 text-xs font-medium text-slate-500">
            {label}
        </dt>

        <dd className="min-w-0 text-right text-sm text-slate-700">
            {children}
        </dd>
    </div>
);

export default function TaskDrawer({
    taskId,
    projectId,
    options,
    onClose,
    onCardChange,
    onArchived,
    onRestored,
    onMove,
}) {
    const { auth } = usePage().props;

    const viewer = auth.user;
    const isAdmin = viewer.role === 'SUPER_ADMIN';

    const [data, setData] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);
    const [olderLoading, setOlderLoading] = useState(false);

    const [confirmation, setConfirmation] = useState({
        show: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        variant: 'danger',
        onConfirm: null,
    });

    const [confirmationProcessing, setConfirmationProcessing] =
        useState(false);

    const alive = useRef(true);

    useEffect(() => {
        alive.current = true;

        return () => {
            alive.current = false;
        };
    }, []);

    // Close with Escape unless another component has already handled it.
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !event.defaultPrevented) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    // Prevent background scrolling while the drawer is open.
    useEffect(() => {
        const previous = document.body.style.overflow;

        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previous;
        };
    }, []);

    // Load task details and activity history.
    useEffect(() => {
        const controller = new AbortController();

        setData(null);
        setLoadError(null);
        setNotice(null);

        getJson(route('tasks.show', taskId), controller.signal)
            .then((payload) => {
                if (controller.signal.aborted) {
                    return;
                }

                if (payload.task.project.id !== projectId) {
                    setLoadError(
                        'This task belongs to a different project.',
                    );
                    return;
                }

                setData(payload);
            })
            .catch((err) => {
                if (err.name === 'AbortError') {
                    return;
                }

                setLoadError(
                    err.status === 404
                        ? 'This task is not available.'
                        : errorMessage(err),
                );
            });

        return () => {
            controller.abort();
        };
    }, [taskId, projectId]);

    // Refresh task details without losing previously loaded history pages.
    const refresh = async () => {
        try {
            const payload = await getJson(route('tasks.show', taskId));

            if (!alive.current) {
                return;
            }

            setData((prev) => ({
                task: payload.task,
                history: prev
                    ? mergeHistory(prev.history, payload.history)
                    : payload.history,
            }));
        } catch {
            if (alive.current) {
                setNotice(
                    'Saved, but the latest details could not be loaded. Close and reopen the task.',
                );
            }
        }
    };

    // Save task changes.
    const save = async (patch) => {
    setBusy(true);
    setNotice(null);

    try {
        const { task: card } = await patchJson(
            route('tasks.update', taskId),
            patch,
        );

        if (!alive.current) {
            return false;
        }

        onCardChange(card);

        await refresh();

        return true;
    } catch (err) {
        if (alive.current) {
            setNotice(errorMessage(err, ['task', 'project']));
        }

        return false;
    } finally {
        if (alive.current) {
            setBusy(false);
        }
    }
};

    // Archive and restore actions.
    const act = async (url, handler) => {
    setBusy(true);
    setNotice(null);

    try {
        const { task: card } = await postJson(url);

        if (!alive.current) {
            return false;
        }

        handler(card);

        await refresh();

        return true;
    } catch (err) {
        if (alive.current) {
            setNotice(errorMessage(err, ['task', 'project']));
        }

        return false;
    } finally {
        if (alive.current) {
            setBusy(false);
        }
    }
};

    // Move the task to another group.
    const changeGroup = async (groupId) => {
        setBusy(true);
        setNotice(null);

        try {
            const ok = await onMove(taskId, groupId);

            if (ok && alive.current) {
                await refresh();
            }
        } finally {
            if (alive.current) {
                setBusy(false);
            }
        }
    };

    // Load older activity without duplicating existing entries.
    const loadOlder = async () => {
        if (!data?.history?.next_cursor || olderLoading) {
            return;
        }

        setOlderLoading(true);

        try {
            const page = await getJson(
                route('tasks.history', {
                    task: taskId,
                    before: data.history.next_cursor,
                }),
            );

            if (!alive.current) {
                return;
            }

            setData((prev) => {
                if (!prev) {
                    return prev;
                }

                const known = new Set(
                    prev.history.data.map((item) => item.id),
                );

                return {
                    ...prev,
                    history: {
                        data: [
                            ...prev.history.data,
                            ...page.data.filter(
                                (item) => !known.has(item.id),
                            ),
                        ],
                        next_cursor: page.next_cursor,
                    },
                };
            });
        } catch {
            if (alive.current) {
                setNotice('Could not load older activity.');
            }
        } finally {
            if (alive.current) {
                setOlderLoading(false);
            }
        }
    };

    const task = data?.task;
    const perm = task?.permissions;

    // Attachment upload/delete permissions.
    // The backend must independently enforce these permissions.
    const canManageAttachments = Boolean(
        task &&
            perm?.can_manage &&
            !task.is_archived &&
            !task.project.archived &&
            !task.project.read_only,
    );

    // Change priority.
    const changePriority = (priority) =>
        save({ priority }).catch((err) => {
            if (alive.current) {
                setNotice(
                    errorMessage(err, ['priority', 'task', 'project']),
                );
            }
        });

    // Add assignee.
    const addAssignee = (id) =>
        save({
            assignee_ids: [
                ...task.assignees.map((assignee) => assignee.id),
                id,
            ],
        });

    // Remove assignee.
    const removeAssignee = async (person) => {
    const authorityComesFromAssignment =
        !isAdmin && task.creator?.id !== viewer.id;

    const removingSelf = person.id === viewer.id;

    const updateAssignees = () =>
        save({
            assignee_ids: task.assignees
                .filter((assignee) => assignee.id !== person.id)
                .map((assignee) => assignee.id),
        });

    if (!removingSelf || !authorityComesFromAssignment) {
        await updateAssignees();
        return;
    }

    setConfirmation({
        show: true,
        title: 'Remove yourself from this task?',
        message:
            'You will no longer be able to edit this task, but you can still view it while you are a member of the project.',
        confirmText: 'Remove myself',
        variant: 'danger',

        onConfirm: async () => {
            setConfirmationProcessing(true);

            try {
                const success = await updateAssignees();

                if (success) {
                    setConfirmation((current) => ({
                        ...current,
                        show: false,
                        onConfirm: null,
                    }));
                }
            } finally {
                setConfirmationProcessing(false);
            }
        },
    });
};

    // Add tag.
    const addTag = (id) =>
        save({
            tag_ids: [...task.tags.map((tag) => tag.id), id],
        });

    // Remove tag.
    const removeTag = (tag) =>
        save({
            tag_ids: task.tags
                .filter((item) => item.id !== tag.id)
                .map((item) => item.id),
        });

    // Archive task.
    const archive = () => {
    setConfirmation({
        show: true,
        title: 'Archive task?',
        message: `Are you sure you want to archive ${task.code}? It will leave the board and normal search results, but its assignments and history will be kept. You can restore it later.`,
        confirmText: 'Archive task',
        variant: 'danger',

        onConfirm: async () => {
            setConfirmationProcessing(true);

            try {
                const success = await act(
                    route('tasks.archive', taskId),
                    onArchived,
                );

                if (success) {
                    setConfirmation((current) => ({
                        ...current,
                        show: false,
                        onConfirm: null,
                    }));
                }
            } finally {
                setConfirmationProcessing(false);
            }
        },
    });
};

    // Restore task.
    const restore = () => {
        act(route('tasks.restore', taskId), onRestored);
    };

    // Read-only explanation.
    const readOnlyReason = !task
        ? null
        : task.is_archived
          ? 'This task is archived and read-only. It is not shown on the board.'
          : task.project.archived
            ? 'This project is archived, so the task is read-only.'
            : task.project.read_only
              ? 'This project is completed, so the task is read-only.'
              : !perm?.can_manage
                ? 'Only the task creator, its current assignees or a Super Admin can change this task.'
                : null;

    return (
        <div
            className="fixed inset-0 z-50 flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Task details"
        >
            {/* Backdrop */}
            <button
                type="button"
                tabIndex={-1}
                aria-label="Close task details"
                className="absolute inset-0 cursor-default bg-slate-950/25 backdrop-blur-[3px]"
                onClick={onClose}
            />

            {/* Drawer */}
            <aside
                className="
                    relative flex h-full w-full max-w-xl flex-col
                    border-l border-slate-200/80
                    bg-white text-slate-900
                    shadow-2xl shadow-slate-950/10
                "
            >
                {/* Header */}
                <header
                    className="
                        flex shrink-0 items-center justify-between gap-4
                        border-b border-slate-100
                        bg-white px-5 py-3.5 sm:px-6
                    "
                >
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span
                            className="
                                truncate font-mono text-xs font-semibold
                                tracking-wide text-slate-500
                            "
                        >
                            {task?.code ?? 'Loading task…'}
                        </span>

                        {task?.is_archived && (
                            <span
                                className="
                                    inline-flex shrink-0 items-center
                                    rounded-md border border-slate-200
                                    bg-slate-50 px-2 py-1
                                    text-[10px] font-semibold
                                    uppercase tracking-wide text-slate-500
                                "
                            >
                                Archived
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        autoFocus
                        onClick={onClose}
                        aria-label="Close task details"
                        className="
                            inline-flex h-8 w-8 shrink-0 items-center
                            justify-center rounded-lg
                            text-slate-400 transition-colors
                            hover:bg-slate-100 hover:text-slate-700
                            focus:outline-none focus-visible:ring-2
                            focus-visible:ring-indigo-500
                        "
                    >
                        <CloseIcon />
                    </button>
                </header>

                {/* Scrollable content */}
                <div className="min-h-0 flex-1 overflow-y-auto bg-white">
                    <div className="px-5 py-5 sm:px-6 sm:py-6">
                        {loadError ? (
                            <div
                                className="
                                    rounded-xl border border-rose-200
                                    bg-rose-50/70 p-4
                                "
                            >
                                <p className="text-sm font-medium text-rose-800">
                                    Unable to open task
                                </p>

                                <p className="mt-1 text-sm leading-6 text-rose-700">
                                    {loadError}
                                </p>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="
                                        mt-3 text-xs font-semibold
                                        text-rose-700 underline
                                        underline-offset-4
                                        hover:text-rose-900
                                    "
                                >
                                    Close task
                                </button>
                            </div>
                        ) : !task ? (
                            <div
                                className="animate-pulse space-y-6"
                                aria-busy="true"
                            >
                                <div className="space-y-3">
                                    <div className="h-3 w-24 rounded bg-slate-100" />
                                    <div className="h-7 w-4/5 rounded-md bg-slate-100" />
                                    <div className="h-4 w-2/5 rounded bg-slate-100" />
                                </div>

                                <div className="h-px bg-slate-100" />

                                <div className="space-y-3">
                                    <div className="h-20 rounded-xl bg-slate-50" />
                                    <div className="h-20 rounded-xl bg-slate-50" />
                                    <div className="h-20 rounded-xl bg-slate-50" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-7">
                                {/* Task identity */}
                                <section className="space-y-3">
                                    <p
                                        className="
                                            text-[10px] font-semibold
                                            uppercase tracking-[0.16em]
                                            text-slate-400
                                        "
                                    >
                                        Task overview
                                    </p>

                                    <TitleField
                                        value={task.title}
                                        editable={perm.can_edit}
                                        saving={busy}
                                        onSave={save}
                                    />

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        {task.group && (
                                            <GroupPill
                                                name={task.group.name}
                                                color={task.group.color}
                                            />
                                        )}

                                        {task.completed_at && (
                                            <span
                                                className="
                                                    inline-flex items-center gap-1.5
                                                    rounded-full border
                                                    border-emerald-100
                                                    bg-emerald-50 px-2.5 py-1
                                                    text-[11px] font-medium
                                                    text-emerald-700
                                                "
                                            >
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Completed
                                            </span>
                                        )}

                                        {/* Priority */}
                                        {perm.can_edit && (
                                            <label className="inline-flex items-center gap-1.5">
                                                <span className="text-xs font-medium text-slate-500">
                                                    Priority
                                                </span>

                                                <select
                                                    value={task.priority ?? 'NORMAL'}
                                                    disabled={busy}
                                                    onChange={(event) => {
                                                        const priority =
                                                            event.target.value;

                                                        if (
                                                            priority !==
                                                            task.priority
                                                        ) {
                                                            changePriority(
                                                                priority,
                                                            );
                                                        }
                                                    }}
                                                    aria-label="Task priority"
                                                    className={`
                                                        cursor-pointer rounded-lg border px-2.5 py-1.5
                                                        text-xs font-semibold shadow-sm
                                                        outline-none transition-colors
                                                        focus:ring-2 focus:ring-indigo-100
                                                        disabled:cursor-not-allowed disabled:opacity-50
                                                        ${
                                                            PRIORITY_STYLES[
                                                                task.priority
                                                            ] ??
                                                            'border-slate-200 bg-white text-slate-700'
                                                        }
                                                    `}
                                                >
                                                    {PRIORITIES.map(
                                                        (priority) => (
                                                            <option
                                                                key={priority.value}
                                                                value={priority.value}
                                                                className="bg-white text-slate-700"
                                                            >
                                                                {priority.label}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </label>
                                        )}

                                        {/* Move group */}
                                        {perm.can_move && options?.groups && (
                                            <select
                                                value=""
                                                disabled={busy}
                                                onChange={(event) =>
                                                    event.target.value &&
                                                    changeGroup(
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                aria-label="Move to group"
                                                className="
                                                    max-w-full cursor-pointer
                                                    rounded-lg border border-slate-200
                                                    !bg-white px-2.5 py-1.5
                                                    text-xs font-medium !text-slate-700
                                                    shadow-sm outline-none transition-colors
                                                    hover:border-slate-300
                                                    focus:border-indigo-400
                                                    focus:ring-2 focus:ring-indigo-100
                                                    disabled:cursor-not-allowed disabled:opacity-50
                                                "
                                            >
                                                <option
                                                    value=""
                                                    className="bg-white text-slate-500"
                                                >
                                                    Move to…
                                                </option>

                                                {options.groups
                                                    .filter(
                                                        (group) =>
                                                            group.id !==
                                                            task.group?.id,
                                                    )
                                                    .map((group) => (
                                                        <option
                                                            key={group.id}
                                                            value={group.id}
                                                            className="bg-white text-slate-700"
                                                        >
                                                            {group.name}
                                                        </option>
                                                    ))}
                                            </select>
                                        )}
                                    </div>
                                </section>

                                {/* Read-only explanation */}
                                {readOnlyReason && (
                                    <div
                                        className="
                                            flex gap-3 rounded-xl
                                            border border-amber-200/80
                                            bg-amber-50/60 px-3.5 py-3
                                        "
                                    >
                                        <span
                                            className="
                                                mt-0.5 h-1.5 w-1.5
                                                shrink-0 rounded-full bg-amber-500
                                            "
                                        />

                                        <p className="text-xs leading-5 text-amber-800">
                                            {readOnlyReason}
                                        </p>
                                    </div>
                                )}

                                {/* Request notice */}
                                {notice && (
                                    <div
                                        role="alert"
                                        className="
                                            rounded-xl border border-rose-200
                                            bg-rose-50 px-3.5 py-3
                                            text-sm leading-5 text-rose-700
                                        "
                                    >
                                        {notice}
                                    </div>
                                )}

                                {/* Schedule */}
                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Schedule
                                        </h3>

                                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                            Dates
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                                        <DatesField
                                            start={task.start_date}
                                            end={task.end_date}
                                            editable={perm.can_edit}
                                            saving={busy}
                                            onSave={save}
                                        />
                                    </div>
                                </section>

                                {/* Assignees */}
                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-slate-800">
                                        People
                                    </h3>

                                    <div className="rounded-xl border border-slate-200/80 p-3.5">
                                        <PeopleField
                                            people={task.assignees}
                                            candidates={options?.members ?? null}
                                            editable={perm.can_edit}
                                            saving={busy}
                                            onAdd={addAssignee}
                                            onRemove={removeAssignee}
                                        />
                                    </div>
                                </section>

                                {/* Tags */}
                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-slate-800">
                                        Tags
                                    </h3>

                                    <div className="rounded-xl border border-slate-200/80 p-3.5">
                                        <TagsField
                                            tags={task.tags}
                                            candidates={options?.tags ?? null}
                                            editable={perm.can_edit}
                                            saving={busy}
                                            onAdd={addTag}
                                            onRemove={removeTag}
                                        />
                                    </div>
                                </section>

                                {/* Description */}
                                <section className="space-y-3">
                                    <h3 className="text-sm font-semibold text-slate-800">
                                        Description
                                    </h3>

                                    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5">
                                        <DescriptionField
                                            value={task.description}
                                            editable={perm.can_edit}
                                            saving={busy}
                                            onSave={save}
                                        />
                                    </div>
                                </section>

                                {/* Attachments:*/}
                                <AttachmentsField
                                    taskId={taskId}
                                    canManage={canManageAttachments}
                                />

                                {/* Details */}
                                <Section title="Details">
                                    <dl className="divide-y divide-slate-100">
                                        <DetailRow label="Creator">
                                            {task.creator ? (
                                                <span className="inline-flex flex-wrap items-center justify-end gap-2">
                                                    <Avatar
                                                        name={task.creator.name}
                                                        src={task.creator.avatar_url}
                                                        className="h-6 w-6 text-[10px]"
                                                    />

                                                    <span className="font-medium text-slate-800">
                                                        {task.creator.name}
                                                    </span>

                                                    {task.creator.label && (
                                                        <span className="text-xs text-slate-400">
                                                            (
                                                            {PERSON_LABELS[
                                                                task.creator.label
                                                            ] ?? task.creator.label}
                                                            )
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">
                                                    —
                                                </span>
                                            )}
                                        </DetailRow>

                                        <DetailRow label="Created">
                                            {formatDateTime(task.created_at)}
                                        </DetailRow>

                                        <DetailRow label="Last updated">
                                            {formatDateTime(task.updated_at)}
                                        </DetailRow>

                                        {task.completed_at && (
                                            <DetailRow label="Completed">
                                                <span className="text-emerald-700">
                                                    {formatDateTime(
                                                        task.completed_at,
                                                    )}
                                                </span>
                                            </DetailRow>
                                        )}

                                        {task.archived_at && (
                                            <DetailRow label="Archived">
                                                {formatDateTime(
                                                    task.archived_at,
                                                )}
                                            </DetailRow>
                                        )}
                                    </dl>
                                </Section>

                                {/* Activity */}
                                <Section title="Activity">
                                    <HistoryTimeline
                                        history={data.history}
                                        loading={olderLoading}
                                        onLoadOlder={loadOlder}
                                    />
                                </Section>
                            </div>
                        )}
                    </div>
                </div>
                

                {/* Footer actions */}
                {task &&
                    (task.is_archived
                        ? perm.can_restore || perm.restore_blocked_reason
                        : perm.can_archive) && (
                        <footer
                            className="
                                shrink-0 border-t border-slate-200/80
                                bg-white px-5 py-3.5 sm:px-6
                            "
                        >
                            {task.is_archived ? (
                                <div>
                                    <button
                                        type="button"
                                        onClick={restore}
                                        disabled={busy || !perm.can_restore}
                                        className="
                                            inline-flex items-center justify-center gap-2
                                            rounded-lg border border-slate-200
                                            bg-white px-3.5 py-2
                                            text-sm font-medium text-slate-700
                                            shadow-sm transition-colors
                                            hover:bg-slate-50 hover:text-slate-900
                                            focus:outline-none
                                            focus-visible:ring-2 focus-visible:ring-indigo-500
                                            disabled:cursor-not-allowed disabled:opacity-40
                                        "
                                    >
                                        <RestoreIcon />
                                        {busy ? 'Working…' : 'Restore task'}
                                    </button>

                                    {perm.restore_blocked_reason && (
                                        <p className="mt-2 text-xs leading-5 text-amber-700">
                                            {perm.restore_blocked_reason}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={archive}
                                    disabled={busy}
                                    className="
                                        inline-flex items-center justify-center gap-2
                                        rounded-lg border border-rose-200
                                        bg-white px-3.5 py-2
                                        text-sm font-medium text-rose-600
                                        transition-colors hover:bg-rose-50
                                        focus:outline-none focus-visible:ring-2
                                        focus-visible:ring-rose-500
                                        disabled:cursor-not-allowed disabled:opacity-50
                                    "
                                >
                                    <ArchiveIcon />
                                    {busy ? 'Working…' : 'Archive task'}
                                </button>
                            )}
                        </footer>
                    )}

                    
            </aside>
            <ConfirmationModal
    show={confirmation.show}
    title={confirmation.title}
    message={confirmation.message}
    confirmText={confirmation.confirmText}
    cancelText="Cancel"
    variant={confirmation.variant}
    processing={confirmationProcessing}
    onConfirm={confirmation.onConfirm}
    onCancel={() => {
        if (confirmationProcessing) return;

        setConfirmation((current) => ({
            ...current,
            show: false,
            onConfirm: null,
        }));
    }}
/>
        </div>

        
    );
    
}