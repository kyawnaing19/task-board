import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import { usePage } from '@inertiajs/react';

import Avatar from '@/Components/Avatar';

const MAX_BODY = 5000;
const PAGE_LIMIT = 25;

function formatCommentDate(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function csrfToken() {
    return document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
}

async function requestJson(url, { method = 'GET', body, signal } = {}) {
    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const token = csrfToken();

    if (token) {
        headers['X-CSRF-TOKEN'] = token;
    }

    const response = await fetch(url, {
        method,
        headers,
        credentials: 'same-origin',
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validationErrors = payload?.errors
            ? Object.values(payload.errors).flat().filter(Boolean)
            : [];

        const error = new Error(
            validationErrors[0] ||
                payload?.message ||
                `Request failed (${response.status}).`,
        );

        error.status = response.status;
        error.errors = payload?.errors ?? {};

        throw error;
    }

    return payload;
}

/**
 * Remove duplicate comments and keep internal order newest-first.
 * The API uses id DESC and cursor pagination.
 */
function dedupeAndSortNewestFirst(items) {
    const byId = new Map();

    for (const item of items) {
        if (item?.id !== undefined && item?.id !== null) {
            byId.set(String(item.id), item);
        }
    }

    return [...byId.values()].sort(
        (a, b) => Number(b.id) - Number(a.id),
    );
}

function SendIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                d="m21 3-7.2 18-3.6-7.2L3 10.2 21 3Z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10.2 13.8 15 9"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function MoreIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
        </svg>
    );
}

function DeletedCommentIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-4 w-4"
            aria-hidden="true"
        >
            <path
                d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function CommentItem({
    comment,
    currentUserId,
    isSuperAdmin,
    canComment,
    onUpdate,
    onDelete,
    busyCommentId,
}) {
    const [editing, setEditing] = useState(false);
    const [editBody, setEditBody] = useState(comment.body ?? '');
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [localError, setLocalError] = useState('');

    const editRef = useRef(null);
    const menuRef = useRef(null);

    const isBusy = busyCommentId === comment.id;

    const canEdit = Boolean(comment.can_edit && canComment);

    const canDelete = Boolean(
        comment.can_delete &&
            canComment &&
            (isSuperAdmin || comment.author?.id === currentUserId),
    );

    useEffect(() => {
        setEditBody(comment.body ?? '');
    }, [comment.body]);

    useEffect(() => {
        if (editing) {
            editRef.current?.focus();
        }
    }, [editing]);

    useEffect(() => {
        if (!menuOpen) return undefined;

        const closeOnOutsideClick = (event) => {
            if (!menuRef.current?.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        const closeOnEscape = (event) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', closeOnOutsideClick);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [menuOpen]);

    const saveEdit = async () => {
        const cleanBody = editBody.trim();

        if (!cleanBody) {
            setLocalError('Please enter a comment.');
            return;
        }

        if (cleanBody.length > MAX_BODY) {
            setLocalError(
                `Comments must be ${MAX_BODY.toLocaleString()} characters or fewer.`,
            );
            return;
        }

        setLocalError('');

        try {
            await onUpdate(comment.id, cleanBody);
            setEditing(false);
        } catch (error) {
            setLocalError(
                error.message || 'Could not update this comment.',
            );
        }
    };

    if (comment.is_deleted) {
        return (
            <div className="flex gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <DeletedCommentIcon />
                </div>

                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3.5 py-3">
                    <p className="text-sm italic text-slate-500">
                        This comment was deleted.
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                        {formatCommentDate(comment.deleted_at)}
                    </p>
                </div>
            </div>
        );
    }

    const authorName = comment.author?.name ?? 'Unknown user';

    const avatarSrc =
        comment.author?.avatar_url ??
        comment.author?.avatar_path ??
        null;

    return (
        <article className="group flex gap-3 py-3">
            <Avatar
                name={authorName}
                src={avatarSrc}
                className="h-9 w-9 shrink-0 text-xs"
            />

            <div className="min-w-0 flex-1">
                {/* Author and actions */}
                <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="truncate text-sm font-semibold text-slate-800">
                                {authorName}
                            </span>

                            {comment.author?.label && (
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                                    {comment.author.label === 'inactive'
                                        ? 'Inactive'
                                        : comment.author.label === 'non_member'
                                          ? 'Former member'
                                          : comment.author.label}
                                </span>
                            )}

                            <span className="text-[11px] text-slate-400">
                                {formatCommentDate(comment.created_at)}
                            </span>

                            {comment.edited_at && (
                                <span className="text-[11px] text-slate-400">
                                    (edited)
                                </span>
                            )}
                        </div>
                    </div>

                    {(canEdit || canDelete) && !editing && (
                        <div
                            ref={menuRef}
                            className="relative shrink-0"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setMenuOpen((open) => !open)
                                }
                                disabled={isBusy}
                                aria-label="Comment actions"
                                aria-expanded={menuOpen}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-100 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                            >
                                <MoreIcon />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                                    {canEdit && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                setEditing(true);
                                                setLocalError('');
                                            }}
                                            className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            Edit comment
                                        </button>
                                    )}

                                    {canDelete && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMenuOpen(false);
                                                setConfirmDelete(true);
                                                setLocalError('');
                                            }}
                                            className="block w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                                        >
                                            Delete comment
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Comment body or edit form */}
                {editing ? (
                    <div className="mt-2 space-y-2">
                        <textarea
                            ref={editRef}
                            value={editBody}
                            onChange={(event) => {
                                setEditBody(event.target.value);
                                setLocalError('');
                            }}
                            rows={3}
                            maxLength={MAX_BODY}
                            disabled={isBusy}
                            className="block w-full resize-y rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">
                                {editBody.length.toLocaleString()} /{' '}
                                {MAX_BODY.toLocaleString()}
                            </span>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(false);
                                        setEditBody(comment.body ?? '');
                                        setLocalError('');
                                    }}
                                    disabled={isBusy}
                                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={saveEdit}
                                    disabled={isBusy || !editBody.trim()}
                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isBusy ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                        {comment.body}
                    </p>
                )}

                {/* Delete confirmation */}
                {confirmDelete && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                        <p className="text-xs font-semibold text-rose-800">
                            Delete this comment?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-rose-700">
                            The comment will be marked as deleted.
                        </p>

                        <div className="mt-3 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(false)}
                                disabled={isBusy}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    setLocalError('');

                                    try {
                                        await onDelete(comment.id);
                                        setConfirmDelete(false);
                                    } catch (error) {
                                        setLocalError(
                                            error.message ||
                                                'Could not delete this comment.',
                                        );
                                    }
                                }}
                                disabled={isBusy}
                                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                                {isBusy ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                )}

                {localError && (
                    <p
                        role="alert"
                        className="mt-2 text-xs leading-5 text-rose-600"
                    >
                        {localError}
                    </p>
                )}
            </div>
        </article>
    );
}

export default function CommentsField({
    taskId,
    canComment: canCommentProp,
}) {
    const { auth } = usePage().props;

    const currentUser = auth?.user;
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const [comments, setComments] = useState([]);
    const [nextCursor, setNextCursor] = useState(null);
    const [total, setTotal] = useState(0);

    const [canCommentFromApi, setCanCommentFromApi] = useState(true);
    const [blockedReason, setBlockedReason] = useState(null);

    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [busyCommentId, setBusyCommentId] = useState(null);
    const [error, setError] = useState('');

    const textareaRef = useRef(null);
    const commentsContainerRef = useRef(null);

    const requestSequence = useRef(0);
    const taskIdRef = useRef(taskId);

    const pendingScrollToBottom = useRef(false);
    const preserveScrollHeight = useRef(null);

    const canComment =
        canCommentProp === false ? false : canCommentFromApi;

    const indexUrl = useCallback(
        (before = null) => {
            const url = new URL(
                route('tasks.comments.index', { task: taskId }),
                window.location.origin,
            );

            url.searchParams.set('limit', String(PAGE_LIMIT));

            if (before !== null && before !== undefined) {
                url.searchParams.set('before', String(before));
            }

            return `${url.pathname}${url.search}`;
        },
        [taskId],
    );

    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const container = commentsContainerRef.current;

                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        });
    }, []);

    const loadInitial = useCallback(
        async (signal) => {
            const sequence = ++requestSequence.current;

            setLoading(true);
            setError('');

            try {
                const payload = await requestJson(indexUrl(), { signal });

                if (
                    signal?.aborted ||
                    sequence !== requestSequence.current
                ) {
                    return;
                }

                setComments(
                    dedupeAndSortNewestFirst(
                        Array.isArray(payload.data) ? payload.data : [],
                    ),
                );

                setNextCursor(payload.next_cursor ?? null);
                setTotal(Number(payload.total ?? 0));
                setCanCommentFromApi(Boolean(payload.can_comment));
                setBlockedReason(
                    payload.comment_blocked_reason ?? null,
                );

                pendingScrollToBottom.current = true;
            } catch (err) {
                if (err.name !== 'AbortError' && !signal?.aborted) {
                    setError(err.message || 'Could not load comments.');
                }
            } finally {
                if (
                    !signal?.aborted &&
                    sequence === requestSequence.current
                ) {
                    setLoading(false);
                }
            }
        },
        [indexUrl],
    );

    useEffect(() => {
        const controller = new AbortController();

        taskIdRef.current = taskId;
        requestSequence.current += 1;

        setComments([]);
        setNextCursor(null);
        setTotal(0);
        setBody('');
        setError('');
        setLoadingOlder(false);
        setSubmitting(false);
        setBusyCommentId(null);

        pendingScrollToBottom.current = false;
        preserveScrollHeight.current = null;

        if (commentsContainerRef.current) {
            commentsContainerRef.current.scrollTop = 0;
        }

        loadInitial(controller.signal);

        return () => {
            controller.abort();
            requestSequence.current += 1;
        };
    }, [taskId, loadInitial]);

    useLayoutEffect(() => {
        if (pendingScrollToBottom.current && !loading) {
            pendingScrollToBottom.current = false;
            scrollToBottom();
            return;
        }

        if (preserveScrollHeight.current !== null) {
            const container = commentsContainerRef.current;

            if (container) {
                const previousHeight = preserveScrollHeight.current;

                container.scrollTop +=
                    container.scrollHeight - previousHeight;
            }

            preserveScrollHeight.current = null;
        }
    }, [comments, loading, scrollToBottom]);

    const loadOlder = async () => {
        if (!nextCursor || loadingOlder || loading) return;

        const requestedTaskId = taskId;
        const cursor = nextCursor;
        const container = commentsContainerRef.current;

        preserveScrollHeight.current = container?.scrollHeight ?? null;

        setLoadingOlder(true);
        setError('');

        try {
            const payload = await requestJson(indexUrl(cursor));

            if (taskIdRef.current !== requestedTaskId) return;

            const olderComments = Array.isArray(payload.data)
                ? payload.data
                : [];

            setComments((current) =>
                dedupeAndSortNewestFirst([
                    ...current,
                    ...olderComments,
                ]),
            );

            setNextCursor(payload.next_cursor ?? null);
            setTotal(Number(payload.total ?? total));
            setCanCommentFromApi(Boolean(payload.can_comment));
            setBlockedReason(
                payload.comment_blocked_reason ?? null,
            );
        } catch (err) {
            if (taskIdRef.current === requestedTaskId) {
                setError(
                    err.message || 'Could not load older comments.',
                );

                preserveScrollHeight.current = null;
            }
        } finally {
            if (taskIdRef.current === requestedTaskId) {
                setLoadingOlder(false);
            }
        }
    };

    const createComment = async (event) => {
        event.preventDefault();

        const cleanBody = body.trim();

        if (!cleanBody || submitting || !canComment) return;

        const requestedTaskId = taskId;

        setSubmitting(true);
        setError('');

        try {
            const payload = await requestJson(
                route('tasks.comments.store', { task: taskId }),
                {
                    method: 'POST',
                    body: { body: cleanBody },
                },
            );

            if (taskIdRef.current !== requestedTaskId) return;

            if (payload.comment) {
                setComments((current) =>
                    dedupeAndSortNewestFirst([
                        payload.comment,
                        ...current,
                    ]),
                );

                setTotal((current) => current + 1);
                pendingScrollToBottom.current = true;
            }

            setBody('');
            textareaRef.current?.focus();
        } catch (err) {
            if (taskIdRef.current === requestedTaskId) {
                setError(err.message || 'Could not add your comment.');
            }
        } finally {
            if (taskIdRef.current === requestedTaskId) {
                setSubmitting(false);
            }
        }
    };

    const updateComment = async (commentId, newBody) => {
        const requestedTaskId = taskId;

        setBusyCommentId(commentId);
        setError('');

        try {
            const payload = await requestJson(
                route('comments.update', { comment: commentId }),
                {
                    method: 'PATCH',
                    body: { body: newBody },
                },
            );

            if (
                taskIdRef.current === requestedTaskId &&
                payload.comment
            ) {
                setComments((current) =>
                    dedupeAndSortNewestFirst(
                        current.map((comment) =>
                            comment.id === commentId
                                ? payload.comment
                                : comment,
                        ),
                    ),
                );
            }
        } finally {
            if (taskIdRef.current === requestedTaskId) {
                setBusyCommentId(null);
            }
        }
    };

    const deleteComment = async (commentId) => {
        const requestedTaskId = taskId;

        setBusyCommentId(commentId);
        setError('');

        try {
            const payload = await requestJson(
                route('comments.destroy', { comment: commentId }),
                { method: 'DELETE' },
            );

            if (
                taskIdRef.current === requestedTaskId &&
                payload.comment
            ) {
                setComments((current) =>
                    dedupeAndSortNewestFirst(
                        current.map((comment) =>
                            comment.id === commentId
                                ? payload.comment
                                : comment,
                        ),
                    ),
                );
            }
        } finally {
            if (taskIdRef.current === requestedTaskId) {
                setBusyCommentId(null);
            }
        }
    };

    // API/internal state is newest-first; display is oldest-first.
    const visibleComments = [...comments].sort(
        (a, b) => Number(a.id) - Number(b.id),
    );

    return (
        <section className="flex h-full min-h-0 flex-col bg-white">
            {/* Scrollable comments area */}
            <div
                ref={commentsContainerRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
                <div className="px-4 py-3 sm:px-5">
                    {/* Comment count */}
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                            {total}{' '}
                            {total === 1 ? 'comment' : 'comments'}
                        </span>

                        {loading && (
                            <span className="text-xs text-slate-400">
                                Loading…
                            </span>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            role="alert"
                            className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700"
                        >
                            {error}
                        </div>
                    )}

                    {/* Loading state */}
                    {loading ? (
                        <div
                            className="space-y-5 py-4"
                            aria-busy="true"
                        >
                            {[1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="flex animate-pulse gap-3"
                                >
                                    <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100" />

                                    <div className="flex-1 space-y-2 pt-1">
                                        <div className="h-3 w-28 rounded bg-slate-100" />
                                        <div className="h-3 w-full rounded bg-slate-50" />
                                        <div className="h-3 w-3/4 rounded bg-slate-50" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : visibleComments.length === 0 ? (
                        /* Empty state */
                        <div className="flex min-h-[240px] flex-col items-center justify-center px-3 py-8 text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1-4.5A7.5 7.5 0 1 1 20 11.5Z"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            <h3 className="mt-3 text-sm font-semibold text-slate-800">
                                No comments yet
                            </h3>

                            <p className="mt-1 max-w-[240px] text-xs leading-5 text-slate-500">
                                Start a conversation with your team about
                                this task.
                            </p>
                        </div>
                    ) : (
                        /* Oldest at top, newest at bottom */
                        <div className="divide-y divide-slate-100">
                            {visibleComments.map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    currentUserId={currentUser?.id}
                                    isSuperAdmin={isSuperAdmin}
                                    canComment={canComment}
                                    onUpdate={updateComment}
                                    onDelete={deleteComment}
                                    busyCommentId={busyCommentId}
                                />
                            ))}
                        </div>
                    )}

                    {/* Load older comments */}
                    {!loading && nextCursor && (
                        <button
                            type="button"
                            onClick={loadOlder}
                            disabled={loadingOlder}
                            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loadingOlder
                                ? 'Loading older comments…'
                                : 'Load older comments'}
                        </button>
                    )}
                </div>
            </div>

            {/* Composer stays at the bottom */}
            <div className="shrink-0 border-t border-slate-200 bg-white p-3 sm:p-4">
                {canComment ? (
                    <form
                        onSubmit={createComment}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50"
                    >
                        <div className="px-3 pt-3">
                            <textarea
                                ref={textareaRef}
                                value={body}
                                onChange={(event) => {
                                    setBody(event.target.value);

                                    if (error) setError('');
                                }}
                                rows={3}
                                maxLength={MAX_BODY}
                                placeholder="Write a comment…"
                                aria-label="Write a comment"
                                disabled={submitting}
                                className="block max-h-36 min-h-[76px] w-full resize-y border-0 bg-transparent p-0 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0 disabled:opacity-60"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5">
                            <span
                                className={`text-[11px] ${
                                    body.length > MAX_BODY - 200
                                        ? 'text-amber-600'
                                        : 'text-slate-400'
                                }`}
                            >
                                {body.length.toLocaleString()} /{' '}
                                {MAX_BODY.toLocaleString()}
                            </span>

                            <button
                                type="submit"
                                disabled={submitting || !body.trim()}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <SendIcon />
                                {submitting ? 'Posting…' : 'Post'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                        <p className="text-xs leading-5 text-amber-800">
                            {blockedReason ||
                                'Comments are read-only for this task.'}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}