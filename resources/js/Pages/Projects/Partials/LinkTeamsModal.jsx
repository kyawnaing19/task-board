import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { getJson, postJson } from '@/lib/http';

export default function LinkTeamsModal({ project, onClose }) {
    const [search, setSearch] = useState('');
    const [candidates, setCandidates] = useState(null);
    const [selected, setSelected] = useState({});
    const [step, setStep] = useState('select');
    const [impact, setImpact] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const selectedList = Object.values(selected);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && !busy) onClose();
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, busy]);

    useEffect(() => {
        const controller = new AbortController();

        const timer = setTimeout(() => {
            getJson(
                route('projects.teams.candidates', {
                    project: project.id,
                    search,
                }),
                controller.signal,
            )
                .then((rows) => {
                    setCandidates(rows);
                    setError(null);
                })
                .catch((err) => {
                    if (err.name !== 'AbortError') {
                        setError(
                            err.errors?.project?.[0] ||
                            'Could not load teams.',
                        );
                    }
                });
        }, search ? 300 : 0);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search, project.id]);

    const toggle = (team) => {
        setSelected((prev) => {
            const next = { ...prev };

            if (next[team.id]) {
                delete next[team.id];
            } else {
                next[team.id] = team;
            }

            return next;
        });
    };

    const goConfirm = async () => {
        if (selectedList.length === 0 || busy) return;

        setBusy(true);
        setError(null);

        try {
            const result = await postJson(
                route('projects.teams.preview-add', project.id),
                { team_ids: selectedList.map((team) => team.id) },
            );

            setImpact(result);
            setStep('confirm');
        } catch (err) {
            setError(
                err.errors?.team_ids?.[0] ||
                err.errors?.project?.[0] ||
                err.message ||
                'Could not check the impact of linking these teams.',
            );
        } finally {
            setBusy(false);
        }
    };

    const confirmAdd = () => {
        if (busy) return;

        setBusy(true);
        setError(null);

        router.post(
            route('projects.teams.store', project.id),
            { team_ids: selectedList.map((team) => team.id) },
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errs) => {
                    setError(
                        errs.team_ids ||
                        errs.project ||
                        'Something went wrong.',
                    );
                    setStep('select');
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
            <button
                type="button"
                aria-label="Close modal"
                className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-sm"
                onClick={() => !busy && onClose()}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="link-teams-title"
                className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h2
                            id="link-teams-title"
                            className="text-lg font-semibold tracking-tight text-slate-900"
                        >
                            Link teams to {project.code}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Only active, non-archived teams can be linked.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-6">
                        {typeof error === 'string'
                            ? error
                            : Object.values(error)[0]?.[0] || 'Something went wrong.'}
                    </div>
                )}

                {/* Select Teams */}
                {step === 'select' && (
                    <>
                        <div className="px-5 pt-4 sm:px-6">
                            <label
                                htmlFor="team-search"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Search teams
                            </label>

                            <input
                                id="team-search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by team name..."
                                disabled={busy}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
                                autoFocus
                            />
                        </div>

                        <div className="mx-5 mt-3 min-h-48 flex-1 overflow-y-auto rounded-xl border border-slate-200 sm:mx-6">
                            {candidates === null && (
                                <p className="p-5 text-center text-sm text-slate-500">
                                    Loading teams...
                                </p>
                            )}

                            {candidates?.length === 0 && (
                                <p className="p-5 text-center text-sm text-slate-500">
                                    {search
                                        ? 'No matching teams found.'
                                        : 'No teams available to link.'}
                                </p>
                            )}

                            {candidates?.map((team) => {
                                const isSelected = !!selected[team.id];

                                return (
                                    <label
                                        key={team.id}
                                        className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 transition ${
                                            isSelected
                                                ? 'bg-indigo-50/70'
                                                : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggle(team)}
                                            disabled={busy}
                                            className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-900">
                                                {team.name}
                                            </p>

                                            {team.description && (
                                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                                    {team.description}
                                                </p>
                                            )}
                                        </div>

                                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                            {team.members_count}{' '}
                                            {team.members_count === 1
                                                ? 'member'
                                                : 'members'}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>

                        {candidates?.length === 20 && (
                            <p className="px-6 pt-2 text-xs text-slate-500">
                                Showing the first 20 teams. Use search to narrow down.
                            </p>
                        )}

                        {/* Footer */}
                        <div className="mt-4 flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <span className="text-sm text-slate-500">
                                <span className="font-semibold text-slate-900">
                                    {selectedList.length}
                                </span>{' '}
                                {selectedList.length === 1 ? 'team' : 'teams'} selected
                            </span>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={busy}
                                    className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={goConfirm}
                                    disabled={selectedList.length === 0 || busy}
                                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {busy ? 'Checking...' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Confirmation Step */}
                {step === 'confirm' && impact && (
                    <>
                        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                                        ✓
                                    </span>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Project access impact
                                    </p>
                                </div>

                                <p className="mt-3 text-sm leading-6 text-slate-700">
                                    <span className="font-semibold text-slate-900">
                                        {impact.teams}
                                    </span>{' '}
                                    {impact.teams === 1 ? 'team' : 'teams'} will be linked, and{' '}
                                    <span className="font-semibold text-slate-900">
                                        {impact.employees_gaining_access}
                                    </span>{' '}
                                    {impact.employees_gaining_access === 1
                                        ? 'employee will'
                                        : 'employees will'}{' '}
                                    immediately gain access to this project.
                                </p>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Only employees who do not already have access are counted.
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-sm font-medium text-slate-700">
                                    Teams to link
                                </p>

                                <ul className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                                    {selectedList.map((team) => (
                                        <li
                                            key={team.id}
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            <span className="text-indigo-600">✓</span>
                                            <span className="min-w-0 truncate">
                                                {team.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
                            <button
                                type="button"
                                onClick={() => setStep('select')}
                                disabled={busy}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={confirmAdd}
                                disabled={busy}
                                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {busy ? 'Linking...' : 'Confirm & link'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}