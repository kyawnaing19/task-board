import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import { getJson, postJson } from '@/lib/http';

export default function AddMembersModal({ team, onClose }) {
    const [search, setSearch] = useState('');
    const [candidates, setCandidates] = useState(null);
    const [selected, setSelected] = useState({});
    const [step, setStep] = useState('select');
    const [impact, setImpact] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const selectedList = Object.values(selected);

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

    // Search available employees
    useEffect(() => {
        const controller = new AbortController();

        setCandidates(null);
        setError(null);

        const timer = setTimeout(
            async () => {
                try {
                    const rows = await getJson(
                        route('teams.members.candidates', {
                            team: team.id,
                            search,
                        }),
                        controller.signal
                    );

                    setCandidates(rows);
                } catch (err) {
                    console.error('Failed to load candidates:', err);
                    if (err.name !== 'AbortError') {
                        setError('Could not load employeesQQQQ.');
                        setCandidates([]);
                    }
                }
            },
            search ? 300 : 0
        );

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search, team.id]);

    // Select / deselect employee
    const toggle = (user) => {
        setSelected((prev) => {
            const next = { ...prev };

            if (next[user.id]) {
                delete next[user.id];
            } else {
                next[user.id] = user;
            }

            return next;
        });
    };

    // Preview impact before adding members
    const goConfirm = async () => {
        if (selectedList.length === 0 || busy) {
            return;
        }

        setBusy(true);
        setError(null);

        try {
            const result = await postJson(
                route('teams.members.preview-add', team.id),
                {
                    user_ids: selectedList.map((user) => user.id),
                }
            );

            setImpact(result);
            setStep('confirm');
        } catch (err) {
            setError(
                err.errors?.user_ids?.[0] ||
                    err.errors?.team?.[0] ||
                    err.message ||
                    'Could not preview adding members.'
            );
        } finally {
            setBusy(false);
        }
    };

    // Confirm and add members
    const confirmAdd = () => {
        if (busy || selectedList.length === 0) {
            return;
        }

        setBusy(true);
        setError(null);

        router.post(
            route('teams.members.store', team.id),
            {
                user_ids: selectedList.map((user) => user.id),
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    onClose();
                },

                onError: (errs) => {
                    setError(
                        errs.user_ids?.[0] ||
                            errs.team?.[0] ||
                            'Something went wrong.'
                    );

                    setStep('select');
                },

                onFinish: () => {
                    setBusy(false);
                },
            }
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="presentation"
        >
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
                aria-labelledby="add-members-title"
                className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div className="min-w-0">
                        <h2
                            id="add-members-title"
                            className="text-lg font-semibold text-slate-900"
                        >
                            Add members
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Add employees to{' '}
                            <span className="font-medium text-slate-700">
                                {team.name}
                            </span>
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Only active employees can be added.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="ml-3 shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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

                {/* Error message */}
                {error && (
                    <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
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

                {/* Select employees */}
                {step === 'select' && (
                    <>
                        <div className="px-6 pt-4">
                            <label
                                htmlFor="employee-search"
                                className="mb-1.5 block text-xs font-medium text-slate-600"
                            >
                                Search employees
                            </label>

                            <div className="relative">
                                <svg
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.817-4.817A6 6 0 012 8z"
                                        clipRule="evenodd"
                                    />
                                </svg>

                                <input
                                    id="employee-search"
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search by name or email..."
                                    autoFocus
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                                        aria-label="Clear search"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Candidate list */}
                        <div className="mx-6 mt-3 min-h-[12rem] flex-1 overflow-y-auto rounded-xl border border-slate-200">
                            {candidates === null && (
                                <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
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

                                    Loading employees...
                                </div>
                            )}

                            {candidates?.length === 0 && !error && (
                                <div className="px-4 py-10 text-center">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.817-4.817A6 6 0 012 8z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>

                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                        {search
                                            ? 'No matching employees'
                                            : 'No employees available'}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-400">
                                        {search
                                            ? 'Try a different name or email.'
                                            : 'All eligible employees may already belong to this team.'}
                                    </p>
                                </div>
                            )}

                            {candidates?.map((user) => (
                                <label
                                    key={user.id}
                                    className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 transition ${
                                        selected[user.id]
                                            ? 'bg-indigo-50/70'
                                            : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!selected[user.id]}
                                        onChange={() => toggle(user)}
                                        className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                                    />

                                    <Avatar
                                        name={user.name}
                                        src={user.avatar_url}
                                        className="h-9 w-9 shrink-0 text-xs"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-800">
                                            {user.name}
                                        </p>

                                        <p className="truncate text-xs text-slate-500">
                                            {user.job_title || user.email}
                                        </p>
                                    </div>

                                    {selected[user.id] && (
                                        <svg
                                            className="h-4 w-4 shrink-0 text-indigo-600"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-label="Selected"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 11.586l6.293-6.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    )}
                                </label>
                            ))}
                        </div>

                        {candidates?.length === 20 && (
                            <p className="px-6 pt-2 text-xs text-slate-400">
                                Showing the first 20 employees. Use search to
                                narrow down the results.
                            </p>
                        )}

                        {/* Selection footer */}
                        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-indigo-50 px-2 text-xs font-semibold text-indigo-700">
                                    {selectedList.length}
                                </span>

                                {selectedList.length === 1
                                    ? 'employee selected'
                                    : 'employees selected'}
                            </div>

                            <div className="flex justify-end gap-3">
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
                                    onClick={goConfirm}
                                    disabled={
                                        selectedList.length === 0 || busy
                                    }
                                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {busy ? 'Checking...' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Confirm impact */}
                {step === 'confirm' && impact && (
                    <>
                        <div className="flex-1 overflow-y-auto px-6 py-5">
                            <div className="mb-4">
                                <p className="text-sm font-medium text-slate-800">
                                    Review your changes
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    Confirm the employees you want to add to
                                    this team.
                                </p>
                            </div>

                            {/* Impact card */}
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                                <div className="flex items-center gap-2">
                                    <svg
                                        className="h-5 w-5 text-indigo-600"
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

                                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                                        Impact summary
                                    </p>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-slate-700">
                                    <span className="font-semibold text-slate-900">
                                        {impact.employees}
                                    </span>{' '}
                                    {impact.employees === 1
                                        ? 'employee'
                                        : 'employees'}{' '}
                                    will be added and will immediately gain
                                    access to{' '}
                                    <span className="font-semibold text-slate-900">
                                        {impact.projects}
                                    </span>{' '}
                                    {impact.projects === 1
                                        ? 'project'
                                        : 'projects'}{' '}
                                    linked to this team.
                                </p>
                            </div>

                            {/* Selected employee list */}
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Employees to add (
                                    {selectedList.length})
                                </p>

                                <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                                    {selectedList.map((user) => (
                                        <li
                                            key={user.id}
                                            className="flex items-center gap-3 px-3 py-2.5"
                                        >
                                            <Avatar
                                                name={user.name}
                                                src={user.avatar_url}
                                                className="h-8 w-8 shrink-0 text-xs"
                                            />

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-800">
                                                    {user.name}
                                                </p>

                                                <p className="truncate text-xs text-slate-500">
                                                    {user.job_title ||
                                                        user.email}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Confirmation footer */}
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('select');
                                    setError(null);
                                }}
                                disabled={busy}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={confirmAdd}
                                disabled={busy}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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

                                {busy ? 'Adding...' : 'Confirm & add'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}