import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import Avatar from '@/Components/Avatar';
import { getJson, postJson } from '@/lib/http';

export default function AddProjectMembersModal({ project, onClose }) {
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
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        const controller = new AbortController();

        const timer = setTimeout(() => {
            getJson(
                route('projects.members.candidates', {
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
                                'Could not load employees.',
                        );
                    }
                });
        }, search ? 300 : 0);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search, project.id]);

    const toggle = (user) =>
        setSelected((prev) => {
            const next = { ...prev };

            if (next[user.id]) {
                delete next[user.id];
            } else {
                next[user.id] = user;
            }

            return next;
        });

    const goConfirm = async () => {
        setBusy(true);
        setError(null);

        try {
            const result = await postJson(
                route('projects.members.preview-add', project.id),
                {
                    user_ids: selectedList.map((u) => u.id),
                },
            );

            setImpact(result);
            setStep('confirm');
        } catch (err) {
            setError(
                err.errors?.user_ids?.[0] ||
                    err.errors?.project?.[0] ||
                    err.message ||
                    'Something went wrong.',
            );
        } finally {
            setBusy(false);
        }
    };

    const confirmAdd = () => {
        setBusy(true);
        setError(null);

        router.post(
            route('projects.members.store', project.id),
            {
                user_ids: selectedList.map((u) => u.id),
            },
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errs) => {
                    setError(
                        errs.user_ids?.[0] ||
                            errs.project?.[0] ||
                            'Something went wrong.',
                    );
                    setStep('select');
                },
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
            <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                    <div className="min-w-0 pr-4">
                        <h2 className="text-lg font-semibold text-slate-900">
                            Add members to {project.code}
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            Only active employees can be added. Employees who
                            already have access through a team can still be
                            added individually.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        {error}
                    </div>
                )}

                {/* Selection step */}
                {step === 'select' && (
                    <>
                        <div className="px-6 pt-4">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or email…"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                autoFocus
                            />
                        </div>

                        <div className="mx-6 mt-3 min-h-[12rem] flex-1 overflow-y-auto rounded-xl border border-slate-200">
                            {candidates === null && (
                                <p className="p-4 text-sm text-slate-500">
                                    Loading employees…
                                </p>
                            )}

                            {candidates?.length === 0 && (
                                <p className="p-4 text-sm text-slate-500">
                                    {search
                                        ? 'No matching employees.'
                                        : 'No employees available to add.'}
                                </p>
                            )}

                            {candidates?.map((user) => (
                                <label
                                    key={user.id}
                                    className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 hover:bg-slate-50 ${
                                        selected[user.id]
                                            ? 'bg-indigo-50/70'
                                            : ''
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={!!selected[user.id]}
                                        onChange={() => toggle(user)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                                    />

                                    <Avatar
                                        name={user.name}
                                        src={user.avatar_url}
                                        className="h-9 w-9 shrink-0 text-xs"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-slate-900">
                                            {user.name}
                                        </p>

                                        <p className="truncate text-xs text-slate-500">
                                            {user.job_title || user.email}
                                        </p>

                                        {user.via_teams?.length > 0 && (
                                            <p className="mt-1 inline-block max-w-full truncate rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                                                Already has access via{' '}
                                                {user.via_teams.join(', ')}
                                            </p>
                                        )}
                                    </div>

                                    {selected[user.id] && (
                                        <span className="text-xs font-medium text-indigo-600">
                                            Selected
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>

                        {candidates?.length === 20 && (
                            <p className="px-6 pt-2 text-xs text-slate-500">
                                Showing the first 20 employees. Use search to
                                narrow down.
                            </p>
                        )}

                        {/* Selection footer */}
                        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
                            <span className="text-sm text-slate-500">
                                <span className="font-semibold text-slate-900">
                                    {selectedList.length}
                                </span>{' '}
                                selected
                            </span>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={goConfirm}
                                    disabled={
                                        selectedList.length === 0 || busy
                                    }
                                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {busy ? 'Checking…' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Confirmation step */}
                {step === 'confirm' && impact && (
                    <>
                        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                                    Impact summary
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-700">
                                    <span className="font-semibold text-slate-900">
                                        {impact.employees}
                                    </span>{' '}
                                    {impact.employees === 1
                                        ? 'employee'
                                        : 'employees'}{' '}
                                    will be added individually.{' '}
                                    <span className="font-semibold text-slate-900">
                                        {impact.employees_gaining_access}
                                    </span>{' '}
                                    {impact.employees_gaining_access === 1
                                        ? 'employee'
                                        : 'employees'}{' '}
                                    will gain access they do not have today.
                                </p>
                            </div>

                            {impact.already_have_access?.length > 0 && (
                                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                                    <p className="font-semibold">
                                        {impact.already_have_access.length}{' '}
                                        already{' '}
                                        {impact.already_have_access.length === 1
                                            ? 'has'
                                            : 'have'}{' '}
                                        access through a team:
                                    </p>

                                    <ul className="mt-2 space-y-1">
                                        {impact.already_have_access.map((u) => (
                                            <li key={u.id} className="break-words">
                                                <span className="font-medium">
                                                    {u.name}
                                                </span>{' '}
                                                <span className="text-sky-700/80">
                                                    ({u.teams.join(', ')})
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <p className="mt-3 text-xs leading-5 text-sky-700">
                                        Adding them individually keeps their
                                        access even if they are later removed
                                        from the team or the team is archived.
                                        They are still counted only once.
                                    </p>
                                </div>
                            )}

                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Employees to add
                                </p>

                                <ul className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                    {selectedList.map((u) => (
                                        <li key={u.id} className="flex gap-2">
                                            <span className="text-slate-400">
                                                •
                                            </span>
                                            <span>{u.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Confirmation footer */}
                        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setStep('select')}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                                Back
                            </button>

                            <button
                                type="button"
                                onClick={confirmAdd}
                                disabled={busy}
                                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {busy ? 'Adding…' : 'Confirm & add'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}