import React, { useCallback, useEffect, useRef, useState } from 'react';
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

function SendIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
            <path d="m21 3-7.2 18-3.6-7.2L3 10.2 21 3Z"
                strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.2 13.8 15 9" strokeLinecap="round"
                strokeLinejoin="round" />
        </svg>
    );
}

function MoreIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor"
            className="h-4 w-4" aria-hidden="true">
            <circle cx="5" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="19" cy="12" r="1.6" />
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

    const isBusy = busyCommentId === comment.id;
    const canEdit = Boolean(comment.can_edit && canComment);
    const canDelete = Boolean(
        comment.can_delete && canComment && (isSuperAdmin || comment.author?.id === currentUserId),
    );

    useEffect(() => {
        setEditBody(comment.body ?? '');
    }, [comment.body]);

    useEffect(() => {
        if (editing) editRef.current?.focus();
    }, [editing]);

    const saveEdit = async () => {
        const body = editBody.trim();

        if (!body) {
            setLocalError('Please enter a comment.');
            return;
        }

        if (body.length > MAX_BODY) {
            setLocalError(`Comments must be ${MAX_BODY.toLocaleString()} characters or fewer.`);
            return;
        }

        setLocalError('');

        try {
            await onUpdate(comment.id, body);
            setEditing(false);
        } catch (error) {
            setLocalError(error.message || 'Could not update this comment.');
        }
    };

    if (comment.is_deleted) {
        return (
            <div className="flex gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.6" className="h-4 w-4" aria-hidden="true">
                        <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3.5 py-3">
                    <p className="text-sm italic text-slate-500">This comment was deleted.</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                        {formatCommentDate(comment.deleted_at)}
                    </p>
                </div>
            </div>
        );
    }

    const authorName = comment.author?.name ?? 'Unknown user';
    const avatarSrc = comment.author?.avatar_url ?? comment.author?.avatar_path ?? null;

    return (
        <article className="group flex gap-3 py-3">
            <Avatar
                name={authorName}
                src={avatarSrc}
                className="h-9 w-9 shrink-0 text-xs"
            />

            <div className="min-w-0 flex-1">
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
                                <span className="text-[11px] text-slate-400">(edited)</span>
                            )}
                        </div>
                    </div>

                    {(canEdit || canDelete) && !editing && (
                        <div className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((open) => !open)}
                                disabled={isBusy}
                                aria-label="Comment actions"
                                aria-expanded={menuOpen}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-100 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                            >
                                <MoreIcon />
                            </button>

                            {menuOpen && (
                                <div className="absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
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
                                {editBody.length.toLocaleString()} / {MAX_BODY.toLocaleString()}
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
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white"
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
                                        setLocalError(error.message || 'Could not delete this comment.');
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
                    <p role="alert" className="mt-2 text-xs leading-5 text-rose-600">
                        {localError}
                    </p>
                )}
            </div>
        </article>
    );
}

export default function CommentsField({ taskId, canComment: canCommentProp }) {
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
    const requestSequence = useRef(0);

    const canComment = canCommentProp === false ? false : canCommentFromApi;

    const indexUrl = useCallback(
        (before = null) => {
            const url = new URL(route('tasks.comments.index', { task: taskId }), window.location.origin);
            url.searchParams.set('limit', String(PAGE_LIMIT));
            if (before) url.searchParams.set('before', String(before));
            return `${url.pathname}${url.search}`;
        },
        [taskId],
    );

    const loadInitial = useCallback(async (signal) => {
        const sequence = ++requestSequence.current;
        setLoading(true);
        setError('');

        try {
            const payload = await requestJson(indexUrl(), { signal });
            if (signal?.aborted || sequence !== requestSequence.current) return;

            setComments(Array.isArray(payload.data) ? payload.data : []);
            setNextCursor(payload.next_cursor ?? null);
            setTotal(Number(payload.total ?? 0));
            setCanCommentFromApi(Boolean(payload.can_comment));
            setBlockedReason(payload.comment_blocked_reason ?? null);
        } catch (err) {
            if (err.name !== 'AbortError' && !signal?.aborted) {
                setError(err.message || 'Could not load comments.');
            }
        } finally {
            if (!signal?.aborted && sequence === requestSequence.current) {
                setLoading(false);
            }
        }
    }, [indexUrl]);

    useEffect(() => {
        const controller = new AbortController();
        setComments([]);
        setNextCursor(null);
        setTotal(0);
        setBody('');
        loadInitial(controller.signal);

        return () => controller.abort();
    }, [loadInitial]);

    const loadOlder = async () => {
        if (!nextCursor || loadingOlder) return;

        setLoadingOlder(true);
        setError('');

        try {
            const payload = await requestJson(indexUrl(nextCursor));
            setComments((current) => {
                const known = new Set(current.map((comment) => comment.id));
                return [
                    ...current,
                    ...(payload.data ?? []).filter((comment) => !known.has(comment.id)),
                ];
            });
            setNextCursor(payload.next_cursor ?? null);
            setTotal(Number(payload.total ?? total));
            setCanCommentFromApi(Boolean(payload.can_comment));
            setBlockedReason(payload.comment_blocked_reason ?? null);
        } catch (err) {
            setError(err.message || 'Could not load older comments.');
        } finally {
            setLoadingOlder(false);
        }
    };

    const createComment = async (event) => {
        event.preventDefault();
        const cleanBody = body.trim();

        if (!cleanBody || submitting || !canComment) return;

        setSubmitting(true);
        setError('');

        try {
            const payload = await requestJson(
                route('tasks.comments.store', { task: taskId }),
                { method: 'POST', body: { body: cleanBody } },
            );

            if (payload.comment) {
                setComments((current) => [
                    payload.comment,
                    ...current.filter((comment) => comment.id !== payload.comment.id),
                ]);
                setTotal((current) => current + 1);
            }

            setBody('');
            textareaRef.current?.focus();
        } catch (err) {
            setError(err.message || 'Could not add your comment.');
        } finally {
            setSubmitting(false);
        }
    };

    const updateComment = async (commentId, newBody) => {
        setBusyCommentId(commentId);
        setError('');

        try {
            const payload = await requestJson(
                route('comments.update', { comment: commentId }),
                { method: 'PATCH', body: { body: newBody } },
            );

            if (payload.comment) {
                setComments((current) =>
                    current.map((comment) =>
                        comment.id === commentId ? payload.comment : comment,
                    ),
                );
            }
        } finally {
            setBusyCommentId(null);
        }
    };

    const deleteComment = async (commentId) => {
        setBusyCommentId(commentId);
        setError('');

        try {
            const payload = await requestJson(
                route('comments.destroy', { comment: commentId }),
                { method: 'DELETE' },
            );

            if (payload.comment) {
                setComments((current) =>
                    current.map((comment) =>
                        comment.id === commentId ? payload.comment : comment,
                    ),
                );
            }
        } finally {
            setBusyCommentId(null);
        }
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">Comments</h3>
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {total}
                    </span>
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                    Discussion
                </span>
            </div>

            {canComment && (
                <form onSubmit={createComment} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start gap-3">
                        <Avatar
                            name={currentUser?.name ?? 'You'}
                            src={currentUser?.avatar_url ?? currentUser?.avatar_path ?? null}
                            className="h-8 w-8 shrink-0 text-[10px]"
                        />
                        <div className="min-w-0 flex-1">
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
                                className="block w-full resize-y border-0 bg-transparent p-0 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400 focus:ring-0 disabled:opacity-60"
                            />
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                                <span className={`text-[11px] ${body.length > MAX_BODY - 200 ? 'text-amber-600' : 'text-slate-400'}`}>
                                    {body.length.toLocaleString()} / {MAX_BODY.toLocaleString()}
                                </span>
                                <button
                                    type="submit"
                                    disabled={submitting || !body.trim()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    <SendIcon />
                                    {submitting ? 'Posting…' : 'Post comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {!canComment && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3">
                    <p className="text-xs leading-5 text-amber-800">
                        {blockedReason || 'Comments are read-only for this task.'}
                    </p>
                </div>
            )}

            {error && (
                <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">
                    {error}
                </div>
            )}

            <div className="divide-y divide-slate-100">
                {loading ? (
                    <div className="space-y-4 py-2" aria-busy="true">
                        {[1, 2].map((item) => (
                            <div key={item} className="flex animate-pulse gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-100" />
                                <div className="flex-1 space-y-2 pt-1">
                                    <div className="h-3 w-32 rounded bg-slate-100" />
                                    <div className="h-3 w-full rounded bg-slate-50" />
                                    <div className="h-3 w-3/5 rounded bg-slate-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : comments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="1.6" className="h-5 w-5" aria-hidden="true">
                                <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1-4.5A7.5 7.5 0 1 1 20 11.5Z"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-600">No comments yet</p>
                        <p className="mt-1 text-xs text-slate-400">
                            Start the conversation with your team.
                        </p>
                    </div>
                ) : (
                    comments.map((comment) => (
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
                    ))
                )}
            </div>

            {!loading && nextCursor && (
                <button
                    type="button"
                    onClick={loadOlder}
                    disabled={loadingOlder}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loadingOlder ? 'Loading older comments…' : 'Load older comments'}
                </button>
            )}
        </section>
    );
}
