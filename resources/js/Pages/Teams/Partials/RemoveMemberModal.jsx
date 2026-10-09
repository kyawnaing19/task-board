import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { getJson } from '@/lib/http';

export default function RemoveMemberModal({ team, member, onClose }) {
    const [impact, setImpact] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);

    // Close modal with Escape
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && !busy) {
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose, busy]);

    // Load impact preview
    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);
        setImpact(null);

        getJson(
            route('teams.members.preview-remove', {
                team: team.id,
                user: member.id,
            }),
            controller.signal
        )
            .then((result) => {
                setImpact(result);
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setError(
                        err.errors?.team?.[0] ||
                            err.message ||
                            'Could not load the impact summary.'
                    );
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [team.id, member.id]);

    // Confirm member removal
    const confirm = () => {
        if (!impact || busy) {
            return;
        }

        setBusy(true);
        setError(null);

        router.delete(
            route('teams.members.destroy', {
                team: team.id,
                user: member.id,
            }),
            {
                preserveScroll: true,

                onSuccess: () => {
                    onClose();
                },

                onError: (errs) => {
                    setError(
                        errs.team?.[0] ||
                            errs.team ||
                            errs.user?.[0] ||
                            errs.user ||
                            'Something went wrong.'
                    );
                },

                onFinish: () => {
                    setBusy(false);
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => {
                    if (!busy) onClose();
                }}
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="remove-member-title"
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
            >
                {/* Header */}
                <div className="flex items-start gap-3 border-b border-slate-200 px-6 py-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.334-.213 2.986-1.742 2.986H3.481c-1.53 0-2.492-1.652-1.742-2.986L8.257 3.1zM10 7a1 1 0 01.993.883L11 8v3a1 1 0 01-1.993.117L9 11V8a1 1 0 011-1zm0 6a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 13z"
                                clipRule="evenodd"
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

                        <p className="mt-1 text-sm text-slate-500">
                            Are you sure you want to remove{' '}
                            <span className="font-medium text-slate-800">
                                {member.name}
                            </span>{' '}
                            from{' '}
                            <span className="font-medium text-slate-800">
                                {team.name}
                            </span>
                            ?
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <svg
                            className="h-5 w-5"
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

                {/* Body */}
                <div className="space-y-4 px-6 py-5">
                    {/* Loading */}
                    {loading && (
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
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>

                            <p className="text-sm text-slate-500">
                                Checking access impact...
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700"
                        >
                            <svg
                                className="mt-0.5 h-4 w-4 shrink-0"
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

                            <span>{error}</span>
                        </div>
                    )}

                    {/* Impact summary */}
                    {impact && !loading && (
                        <>
                            <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
                                <div className="flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-rose-600"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 002 0V7zm-1 7a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z"
                                            clipRule="evenodd"
                                        />
                                    </svg>

                                    <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                                        Access impact
                                    </p>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-slate-700">
                                    <span className="font-medium text-slate-900">
                                        {member.name}
                                    </span>{' '}
                                    will lose access to{' '}
                                    <span className="font-semibold text-slate-900">
                                        {impact.projects_losing_access}
                                    </span>{' '}
                                    {impact.projects_losing_access === 1
                                        ? 'project'
                                        : 'projects'}{' '}
                                    out of{' '}
                                    <span className="font-semibold text-slate-900">
                                        {impact.projects}
                                    </span>{' '}
                                    linked to this team.
                                </p>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Projects they can still access through
                                    another team or an individual membership
                                    are not counted.
                                </p>
                            </div>

                            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <svg
                                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-3a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 6z"
                                        clipRule="evenodd"
                                    />
                                </svg>

                                <p className="text-xs leading-5 text-slate-600">
                                    Task assignments and history will be
                                    preserved.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={confirm}
                        disabled={!impact || loading || busy || !!error}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy && (
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
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                        )}

                        {busy ? 'Removing...' : 'Remove member'}
                    </button>
                </div>
            </div>
        </div>
    );
}