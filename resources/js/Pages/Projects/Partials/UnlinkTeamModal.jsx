import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { getJson } from '@/lib/http';

export default function UnlinkTeamModal({ project, team, onClose }) {
    const [impact, setImpact] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && !busy) onClose();
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, busy]);

    useEffect(() => {
        const controller = new AbortController();

        getJson(
            route('projects.teams.preview-remove', {
                project: project.id,
                team: team.id,
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
    }, [project.id, team.id]);

    const confirm = () => {
        if (!impact || busy) return;

        setBusy(true);
        setError(null);

        router.delete(
            route('projects.teams.destroy', {
                project: project.id,
                team: team.id,
            }),
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errs) => {
                    setError(
                        errs.project ||
                        'Something went wrong. Please try again.',
                    );
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close modal"
                onClick={() => !busy && onClose()}
                className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="unlink-team-title"
                className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                className="h-5 w-5"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 6 6 18M6 6l12 12"
                                />
                            </svg>
                        </div>

                        <h2
                            id="unlink-team-title"
                            className="text-lg font-semibold tracking-tight text-slate-900"
                        >
                            Remove team?
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-slate-500">
                            Remove{' '}
                            <span className="font-medium text-slate-800">
                                {team.name}
                            </span>{' '}
                            from{' '}
                            <span className="font-medium text-slate-800">
                                {project.code}
                            </span>
                            .
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        aria-label="Close"
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4 px-5 py-5 sm:px-6">
                    {!impact && !error && (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <svg
                                className="h-5 w-5 animate-spin text-indigo-600"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
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
                                    d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                                />
                            </svg>
                            <p className="text-sm text-slate-600">
                                Checking project access impact...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div
                            role="alert"
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        >
                            {typeof error === 'string'
                                ? error
                                : Object.values(error)[0]?.[0] ||
                                  'Something went wrong.'}
                        </div>
                    )}

                    {impact && (
                        <>
                            {/* Impact summary */}
                            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                                    Access that will be lost
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                    <span className="text-2xl font-bold tracking-tight text-rose-700">
                                        {impact.employees_losing_access}
                                    </span>{' '}
                                    {impact.employees_losing_access === 1
                                        ? 'employee will'
                                        : 'employees will'}{' '}
                                    lose access to this project.
                                </p>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Employees who can still access the project
                                    through another team or an individual
                                    membership are not included.
                                </p>
                            </div>

                            {/* Preserved data notice */}
                            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    className="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 9v3.75m0 3h.008M10.3 3.86 2.9 16.5a2 2 0 0 0 1.73 3h14.74a2 2 0 0 0 1.73-3L13.7 3.86a2 2 0 0 0-3.46 0Z"
                                    />
                                </svg>

                                <p className="text-xs leading-5 text-slate-600">
                                    Task assignments and history will be kept.
                                    The team link is end-dated, not deleted.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={confirm}
                        disabled={!impact || busy}
                        className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? 'Removing...' : 'Remove team'}
                    </button>
                </div>
            </div>
        </div>
    );
}