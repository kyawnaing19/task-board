import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { getJson } from '@/lib/http';

export default function RemoveProjectMemberModal({ project, member, onClose }) {
    const [impact, setImpact] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        const controller = new AbortController();

        getJson(
            route('projects.members.preview-remove', {
                project: project.id,
                user: member.id,
            }),
            controller.signal,
        )
            .then(setImpact)
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setError(
                        err.errors?.project?.[0] ||
                            'Could not load the impact summary.',
                    );
                }
            });

        return () => controller.abort();
    }, [project.id, member.id]);

    const confirm = () => {
        setBusy(true);
        setError(null);

        router.delete(
            route('projects.members.destroy', {
                project: project.id,
                user: member.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errs) =>
                    setError(
                        errs.project?.[0] ||
                            'Something went wrong.',
                    ),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="remove-member-title"
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
            >
                {/* Header */}
                <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2
                            id="remove-member-title"
                            className="text-lg font-semibold text-slate-900"
                        >
                            Remove member?
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-slate-500">
                            Remove{' '}
                            <span className="font-medium text-slate-800">
                                {member.name}
                            </span>{' '}
                            from{' '}
                            <span className="font-medium text-slate-800">
                                {project.code}
                            </span>
                            ?
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        aria-label="Close"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m6 6 12 12M18 6 6 18"
                            />
                        </svg>
                    </button>
                </div>

                {/* Impact summary */}
                <div className="space-y-3 px-6 py-5 text-sm">
                    {!impact && !error && (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <svg
                                className="h-5 w-5 animate-spin text-indigo-600"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="9"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                />
                                <path
                                    className="opacity-90"
                                    fill="currentColor"
                                    d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z"
                                />
                            </svg>

                            <p className="text-slate-600">
                                Checking access impact…
                            </p>
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        >
                            {error}
                        </div>
                    )}

                    {impact &&
                        (impact.loses_access ? (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 9v4m0 4h.01M10.3 3.9 1.8 18.2A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z"
                                            />
                                        </svg>
                                    </span>

                                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                                        Access will be lost
                                    </p>
                                </div>

                                <p className="mt-3 leading-6 text-slate-700">
                                    {member.name} has no other way to access
                                    this project and will{' '}
                                    <span className="font-semibold text-rose-700">
                                        lose access
                                    </span>{' '}
                                    after removal.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="m5 12 4 4L19 6"
                                            />
                                        </svg>
                                    </span>

                                    <p className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                                        Access will remain
                                    </p>
                                </div>

                                <p className="mt-3 leading-6 text-slate-700">
                                    {member.name} will retain access through:
                                </p>

                                <p className="mt-2 break-words font-semibold text-sky-800">
                                    {impact.still_via_teams.join(', ')}
                                </p>
                            </div>
                        ))}

                    {impact && (
                        <div className="flex gap-2 rounded-lg bg-slate-50 px-3 py-3">
                            <svg
                                className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="9" />
                                <path
                                    strokeLinecap="round"
                                    d="M12 11v5m0-8h.01"
                                />
                            </svg>

                            <p className="text-xs leading-5 text-slate-500">
                                Task assignments and history will be preserved.
                                The membership will be end-dated, not deleted.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={confirm}
                        disabled={!impact || busy || !!error}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? (
                            <>
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    aria-hidden="true"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="9"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />
                                    <path
                                        className="opacity-90"
                                        fill="currentColor"
                                        d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z"
                                    />
                                </svg>
                                Removing…
                            </>
                        ) : (
                            'Remove member'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}