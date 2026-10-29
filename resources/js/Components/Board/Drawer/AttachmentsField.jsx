import React, { useEffect, useRef, useState } from 'react';

import { errorMessage } from '@/lib/http';
import { formatDateTime } from '@/lib/taskFormat';

import ConfirmationModal from '@/Components/ConfirmationModal';

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 10;

const getCsrfHeaders = () => {
    const headers = {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    const metaToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    const xsrfCookie = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.split('=')
        .slice(1)
        .join('=');

    if (metaToken) {
        headers['X-CSRF-TOKEN'] = metaToken;
    } else if (xsrfCookie) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfCookie);
    }

    return headers;
};

const UploadIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path
            d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const DownloadIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path
            d="M12 4v11m0 0 4-4m-4 4-4-4M5 17v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const DeleteIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-4 w-4"
        aria-hidden="true"
    >
        <path
            d="M4.5 7h15M9 7V4.5h6V7m-8 0 1 13h8l1-13M10 10.5v6m4-6v6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const FileIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-7 w-7"
        aria-hidden="true"
    >
        <path
            d="M7 3.75h6l4.5 4.5v12H7a2 2 0 0 1-2-2v-12a2.5 2.5 0 0 1 2-2.5ZM13 4v5h5M8 13h6M8 16.5h6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const AttachmentIcon = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-8 w-8"
        aria-hidden="true"
    >
        <path
            d="M8 12.5 13.5 7a3.182 3.182 0 0 1 4.5 4.5l-7 7A5 5 0 0 1 4 11.5l7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const formatFileSize = (bytes) => {
    const size = Number(bytes);

    if (!Number.isFinite(size) || size < 0) {
        return 'Unknown size';
    }

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getExtension = (filename = '') =>
    filename.split('.').pop()?.toLowerCase() ?? '';

export default function AttachmentsField({ taskId, canManage }) {
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);

    const inputRef = useRef(null);
    const alive = useRef(true);

    useEffect(() => {
        alive.current = true;

        return () => {
            alive.current = false;
        };
    }, []);

    // Load attachments.
    useEffect(() => {
        const controller = new AbortController();

        setAttachments([]);
        setLoading(true);
        setError(null);
        setDeleteConfirmation(null);

        fetch(route('tasks.attachments.index', taskId), {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then(async (response) => {
                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        payload.message || 'Could not load attachments.',
                    );
                }

                return payload;
            })
            .then((payload) => {
                if (!controller.signal.aborted) {
                    setAttachments(payload.attachments ?? []);
                }
            })
            .catch((err) => {
                if (
                    err.name !== 'AbortError' &&
                    !controller.signal.aborted
                ) {
                    setError(errorMessage(err));
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [taskId]);

    // Upload attachments.
    const uploadAttachments = async (event) => {
        const input = event.currentTarget;
        const files = Array.from(input.files ?? []);

        if (!files.length) {
            return;
        }

        if (!canManage) {
            setError('You do not have permission to upload attachments.');
            input.value = '';
            return;
        }

        if (files.length > MAX_ATTACHMENT_COUNT) {
            setError(
                `You can upload a maximum of ${MAX_ATTACHMENT_COUNT} files at a time.`,
            );
            input.value = '';
            return;
        }

        const oversizedFile = files.find(
            (file) => file.size > MAX_ATTACHMENT_SIZE,
        );

        if (oversizedFile) {
            setError(
                `${oversizedFile.name} exceeds the 10 MB file size limit.`,
            );
            input.value = '';
            return;
        }

        const formData = new FormData();

        files.forEach((file) => {
            formData.append('files[]', file);
        });

        setBusy(true);
        setError(null);

        try {
            const response = await fetch(
                route('tasks.attachments.store', taskId),
                {
                    method: 'POST',
                    headers: getCsrfHeaders(),
                    body: formData,
                    credentials: 'same-origin',
                },
            );

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                const validationError = Object.values(
                    payload.errors ?? {},
                )
                    .flat()
                    .find((message) => typeof message === 'string');

                throw new Error(
                    validationError ||
                        payload.message ||
                        'Failed to upload attachments.',
                );
            }

            if (!alive.current) {
                return;
            }

            const uploaded = payload.attachments ?? [];

            setAttachments((previous) => {
                const uploadedIds = new Set(
                    uploaded.map((attachment) => attachment.id),
                );

                return [
                    ...uploaded,
                    ...previous.filter(
                        (attachment) => !uploadedIds.has(attachment.id),
                    ),
                ];
            });
        } catch (err) {
            if (alive.current) {
                setError(
                    errorMessage(err) ||
                        'Failed to upload attachments. Please try again.',
                );
            }
        } finally {
            if (alive.current) {
                setBusy(false);
            }

            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    // Request deletion.
    const requestDeleteAttachment = (attachment) => {
        if (!canManage || busy) {
            return;
        }

        setError(null);
        setDeleteConfirmation(attachment);
    };

    // Cancel deletion.
    const cancelDeleteAttachment = () => {
        if (busy) {
            return;
        }

        setDeleteConfirmation(null);
    };

    // Delete attachment.
    const deleteAttachment = async () => {
        const attachment = deleteConfirmation;

        if (!attachment || !canManage || busy) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            const response = await fetch(
                route('tasks.attachments.destroy', [
                    taskId,
                    attachment.id,
                ]),
                {
                    method: 'DELETE',
                    headers: getCsrfHeaders(),
                    credentials: 'same-origin',
                },
            );

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    payload.message || 'Failed to delete attachment.',
                );
            }

            if (!alive.current) {
                return;
            }

            setAttachments((previous) =>
                previous.filter((item) => item.id !== attachment.id),
            );

            setDeleteConfirmation(null);
        } catch (err) {
            if (alive.current) {
                setError(
                    errorMessage(err) ||
                        'Failed to delete attachment. Please try again.',
                );
            }
        } finally {
            if (alive.current) {
                setBusy(false);
            }
        }
    };

    return (
        <>
            <section className="mt-5 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-800">
                            Attachments
                        </h3>

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            {attachments.length}
                        </span>
                    </div>

                    {canManage && (
                        <>
                            <input
                                ref={inputRef}
                                type="file"
                                multiple
                                accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                                onChange={uploadAttachments}
                                disabled={busy}
                                className="hidden"
                                aria-label="Select attachment files"
                            />

                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                disabled={busy}
                                className="
                                    inline-flex shrink-0 items-center gap-2
                                    rounded-lg border border-indigo-200
                                    bg-indigo-50 px-3 py-2
                                    text-xs font-semibold text-indigo-700
                                    transition-colors hover:bg-indigo-100
                                    focus:outline-none focus-visible:ring-2
                                    focus-visible:ring-indigo-500
                                    disabled:cursor-not-allowed disabled:opacity-50
                                "
                            >
                                <UploadIcon />
                                {busy ? 'Working…' : 'Upload files'}
                            </button>
                        </>
                    )}
                </div>

                {/* Content */}
                {error && (
                    <div
                        role="alert"
                        className="
                            rounded-lg border border-rose-200
                            bg-rose-50 px-3 py-2.5
                            text-xs leading-5 text-rose-700
                        "
                    >
                        {error}
                    </div>
                )}

                {busy && (
                    <div
                        className="flex items-center gap-2 text-xs text-slate-500"
                        role="status"
                    >
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
                        Processing attachments…
                    </div>
                )}

                {loading ? (
                    <div
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                        aria-busy="true"
                    >
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse overflow-hidden rounded-xl border border-slate-200"
                            >
                                <div className="h-32 bg-slate-100 sm:h-36" />
                                <div className="space-y-2 p-3">
                                    <div className="h-3 w-3/4 rounded bg-slate-100" />
                                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : attachments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                        <div className="text-slate-300">
                            <AttachmentIcon />
                        </div>

                        <p className="mt-2 text-sm font-medium text-slate-600">
                            No attachments yet
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-400">
                            Upload images or documents related to this task.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {attachments.map((attachment) => {
                            const mimeType = attachment.mime_type ?? '';
                            const extension = getExtension(
                                attachment.original_name,
                            );

                            const isImage =
                                mimeType.startsWith('image/') &&
                                Boolean(attachment.preview_url);

                            const isPdf = mimeType === 'application/pdf';

                            const isText =
                                mimeType.startsWith('text/') ||
                                extension === 'csv';

                            const canPreviewDocument =
                                Boolean(attachment.preview_url) &&
                                (isPdf || isText);

                            return (
                                <article
                                    key={attachment.id}
                                    className="
                                        group min-w-0 overflow-hidden
                                        rounded-xl border border-slate-200
                                        bg-white transition-colors
                                        hover:border-slate-300
                                    "
                                >
                                    {/* Preview */}
                                        <div className="relative h-48 overflow-hidden bg-slate-100 sm:h-56 lg:h-64">                                        {isImage ? (
                                            <a
                                                href={attachment.preview_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="
                                                    flex h-full w-full
                                                    items-center justify-center
                                                "
                                                aria-label={`Preview ${attachment.original_name}`}
                                            >
                                                <img
                                                    src={attachment.preview_url}
                                                    alt={attachment.original_name}
                                                    loading="lazy"
                                                    className="
                                                        h-full w-full
                                                        object-contain
                                                        transition-transform
                                                        duration-200
                                                        group-hover:scale-[1.02]
                                                    "
                                                />

                                                <span
                                                    className="
                                                        pointer-events-none
                                                        absolute right-2 top-2
                                                        rounded-md
                                                        bg-slate-900/70
                                                        px-2 py-1
                                                        text-[10px] font-medium
                                                        text-white
                                                        opacity-0
                                                        transition-opacity
                                                        group-hover:opacity-100
                                                    "
                                                >
                                                    Preview
                                                </span>
                                            </a>
                                        ) : canPreviewDocument ? (
                                            <iframe
                                                src={attachment.preview_url}
                                                title={`Preview ${attachment.original_name}`}
                                                className="h-full w-full border-0 bg-white"
                                            />
                                        ) : (
                                            <div
                                                className="
                                                    flex h-full flex-col
                                                    items-center justify-center
                                                    gap-2 px-3 text-center
                                                "
                                            >
                                                <div
                                                    className="
                                                        flex h-12 w-12
                                                        items-center justify-center
                                                        rounded-xl border
                                                        border-slate-200
                                                        bg-white text-slate-400
                                                    "
                                                >
                                                    <FileIcon />
                                                </div>

                                                <span className="max-w-full truncate text-xs font-medium text-slate-500">
                                                    {isPdf
                                                        ? 'PDF document'
                                                        : extension
                                                              .toUpperCase()
                                                              .slice(0, 8) ||
                                                          'FILE'}
                                                </span>

                                                <span className="text-[10px] text-slate-400">
                                                    Preview unavailable
                                                </span>
                                            </div>
                                        )}

                                        {/* File size */}
                                        <span
                                            className="
                                                pointer-events-none
                                                absolute bottom-2 left-2
                                                rounded-md bg-white/95
                                                px-2 py-1 text-[10px]
                                                font-semibold text-slate-600
                                                shadow-sm
                                            "
                                        >
                                            {formatFileSize(attachment.size)}
                                        </span>
                                    </div>

                                    {/* File information */}
                                    <div className="p-3">
                                        <p
                                            title={attachment.original_name}
                                            className="
                                                truncate text-xs
                                                font-semibold text-slate-800
                                            "
                                        >
                                            {attachment.original_name}
                                        </p>

                                        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                                            <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">
                                                {attachment.uploader?.name ??
                                                    'Unknown uploader'}
                                            </span>

                                            {attachment.uploaded_at && (
                                                <span className="shrink-0 text-[10px] text-slate-400">
                                                    {formatDateTime(
                                                        attachment.uploaded_at,
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                                            <a
                                                href={attachment.download_url}
                                                className="
                                                    inline-flex h-8 min-w-0
                                                    flex-1 items-center
                                                    justify-center gap-1.5
                                                    rounded-lg border
                                                    border-slate-200 bg-white
                                                    text-xs font-medium
                                                    text-slate-600
                                                    transition-colors
                                                    hover:bg-slate-50
                                                    hover:text-indigo-600
                                                    focus:outline-none
                                                    focus-visible:ring-2
                                                    focus-visible:ring-indigo-500
                                                "
                                                aria-label={`Download ${attachment.original_name}`}
                                                title="Download"
                                            >
                                                <DownloadIcon />
                                                Download
                                            </a>

                                            {canManage && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        requestDeleteAttachment(
                                                            attachment,
                                                        )
                                                    }
                                                    disabled={busy}
                                                    className="
                                                        inline-flex h-8 w-8
                                                        shrink-0 items-center
                                                        justify-center
                                                        rounded-lg text-slate-400
                                                        transition-colors
                                                        hover:bg-rose-50
                                                        hover:text-rose-600
                                                        focus:outline-none
                                                        focus-visible:ring-2
                                                        focus-visible:ring-rose-500
                                                        disabled:cursor-not-allowed
                                                        disabled:opacity-40
                                                    "
                                                    aria-label={`Delete ${attachment.original_name}`}
                                                    title="Delete attachment"
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <p className="text-[11px] leading-5 text-slate-400">
                    Supported formats: images, PDF, Office documents, text,
                    CSV and ZIP. Maximum 10 files per upload, 10 MB per file.
                </p>
            </section>

            {/* Delete confirmation */}
            <ConfirmationModal
                show={Boolean(deleteConfirmation)}
                title="Delete attachment?"
                message={
                    deleteConfirmation
                        ? `Are you sure you want to delete "${deleteConfirmation.original_name}"? This action cannot be undone.`
                        : ''
                }
                confirmText="Delete attachment"
                cancelText="Cancel"
                onConfirm={deleteAttachment}
                onCancel={cancelDeleteAttachment}
                processing={busy}
                variant="danger"
            />
        </>
    );
}