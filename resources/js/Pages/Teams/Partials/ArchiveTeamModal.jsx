import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export default function ArchiveTeamModal({ team, onClose }) {
    const [preview, setPreview] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [processing, setProcessing] = useState(false);

    /*
     * Close modal with Escape
     */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    /*
     * Load archive impact preview
     */
    useEffect(() => {
        const controller = new AbortController();

        setPreview(null);
        setLoadError(false);

        fetch(route('teams.archive-preview', team.id), {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
            signal: controller.signal,
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to load archive preview.');
                }

                return res.json();
            })
            .then((data) => {
                setPreview(data);
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setLoadError(true);
                }
            });

        return () => controller.abort();
    }, [team.id]);

    /*
     * Whether archive is blocked by server-side rules
     */
    const blocked =
        preview?.blockers?.length > 0;

    /*
     * Confirm archive
     */
    const confirm = () => {
        if (!preview || blocked || processing) {
            return;
        }

        setProcessing(true);

        router.post(
            route('teams.archive', team.id),
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    onClose();
                },

                onFinish: () => {
                    setProcessing(false);
                },
            }
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
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                {/* Header */}
                <div className="border-b border-slate-200 px-6 py-5">
                    <div className="flex items-start gap-3">
                        {/* Warning icon */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.334-.213 2.986-1.742 2.986H3.481c-1.53 0-2.492-1.652-1.742-2.986L8.257 3.1zM10 7a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 7zm0 6.5a1 1 0 100-2 1 1 0 000 2z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Archive "{team.name}"?
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Review the impact before archiving this team.
                            </p>
                        </div>

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Close"
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
                </div>

                {/* Body */}
                <div className="space-y-4 px-6 py-5">
                    {/* Loading */}
                    {!preview && !loadError && (
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
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>

                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    Checking impact...
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                    Please wait while we check this team.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Load error */}
                    {loadError && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                            <div className="flex items-start gap-3">
                                <svg
                                    className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10A8 8 0 114 4.293 8 8 0 0118 10zm-8-4a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 7a1 1 0 100-2 1 1 0 000 2z"
                                        clipRule="evenodd"
                                    />
                                </svg>

                                <div>
                                    <p className="text-sm font-medium text-rose-800">
                                        Unable to check archive impact
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-rose-700">
                                        Could not load the impact summary.
                                        Please close this dialog and try again.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Blocked */}
                    {blocked && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4">
                            <div className="flex items-start gap-3">
                                <svg
                                    className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.596c.75 1.334-.213 2.986-1.742 2.986H3.481c-1.53 0-2.492-1.652-1.742-2.986L8.257 3.1zM10 7a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 7zm0 6.5a1 1 0 100-2 1 1 0 000 2z"
                                        clipRule="evenodd"
                                    />
                                </svg>

                                <div className="min-w-0">
                                    <p className="font-medium text-rose-800">
                                        This team cannot be archived yet
                                    </p>

                                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-5 text-rose-700">
                                        {preview.blockers.map(
                                            (blocker, index) => (
                                                <li key={index}>
                                                    {blocker}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Impact */}
                    {preview && !blocked && (
                        <>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                        <svg
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M18 10A8 8 0 114 4.293 8 8 0 0118 10zM10 6a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 7a1 1 0 100-2 1 1 0 000 2z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>

                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Access impact
                                    </p>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-slate-700">
                                    <span className="font-semibold text-slate-900">
                                        {preview.impact.employees}
                                    </span>{' '}
                                    {preview.impact.employees === 1
                                        ? 'employee'
                                        : 'employees'}{' '}
                                    will lose access to{' '}
                                    <span className="font-semibold text-slate-900">
                                        {preview.impact.projects}
                                    </span>{' '}
                                    {preview.impact.projects === 1
                                        ? 'project'
                                        : 'projects'}
                                    .
                                </p>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Counts only people whose access comes
                                    solely from this team.
                                </p>
                            </div>

                            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                                <p className="text-xs leading-5 text-indigo-700">
                                    Task assignments and history are kept.
                                    Membership records are preserved, so
                                    restoring the team brings back the same
                                    effective access.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={confirm}
                        disabled={!preview || blocked || processing}
                        className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {processing
                            ? 'Archiving...'
                            : 'Archive team'}
                    </button>
                </div>
            </div>
        </div>
    );
}