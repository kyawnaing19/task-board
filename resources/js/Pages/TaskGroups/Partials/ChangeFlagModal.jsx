import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import GroupPill from '@/Components/GroupPill';
import { getJson } from '@/lib/http';

const LABELS = { initial: 'Initial', completed: 'Completed' };

export default function ChangeFlagModal({ flag, target, groups, onClose }) {
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const label = LABELS[flag];
    const colorOfGroup = (id) => groups.find((g) => g.id === id)?.color;

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        getJson(
            route('task-groups.flag.preview', {
                flag,
                target_group_id: target.id,
            }),
            controller.signal,
        )
            .then(setPreview)
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setError(
                        'Could not load the impact summary. Close this dialog and try again.',
                    );
                }
            });

        return () => controller.abort();
    }, [flag, target.id]);

    const confirm = () => {
        setBusy(true);

        router.post(
            route('task-groups.flag.change', { flag }),
            { target_group_id: target.id },
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errs) =>
                    setError(
                        errs.group ||
                            errs.target_group_id ||
                            'Something went wrong.',
                    ),
                onFinish: () => setBusy(false),
            },
        );
    };

    const blocked = preview?.blockers?.length > 0;
    const impact = preview?.impact;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
                {/* Header */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Change {label} group
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Review the impact before confirming this change.
                    </p>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                    {!preview && !error && (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                            <p className="text-slate-500">
                                Checking impact…
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        >
                            {error}
                        </p>
                    )}

                    {preview && (
                        <>
                            {/* Current → Target */}
                            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                                {preview.current ? (
                                    <GroupPill
                                        name={preview.current.name}
                                        color={colorOfGroup(
                                            preview.current.id,
                                        )}
                                    />
                                ) : (
                                    <span className="text-xs text-slate-400">
                                        None
                                    </span>
                                )}

                                <span className="text-slate-400">→</span>

                                <GroupPill
                                    name={preview.target.name}
                                    color={colorOfGroup(preview.target.id)}
                                />

                                <span className="text-xs text-slate-500">
                                    will become the {label} group
                                </span>
                            </div>

                            {/* Blockers */}
                            {blocked && (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
                                    <p className="font-semibold">
                                        This change cannot be made:
                                    </p>

                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
                                        {preview.blockers.map((b, i) => (
                                            <li key={i}>{b}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Initial flag impact */}
                            {flag === 'initial' && (
                                <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-600">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Impact
                                    </p>

                                    <p className="mt-2 leading-6">
                                        <span className="font-semibold text-slate-900">
                                            No tasks are moved.
                                        </span>{' '}
                                        Only the flag changes. From now on,
                                        tasks created without choosing a group
                                        go to{' '}
                                        <span className="font-semibold text-slate-900">
                                            {preview.target.name}
                                        </span>
                                        .
                                    </p>
                                </div>
                            )}

                            {/* Completed flag impact */}
                            {flag === 'completed' && impact && (
                                <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-slate-600">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                        Impact on tasks
                                    </p>

                                    <p className="leading-6">
                                        <span className="font-semibold text-slate-900">
                                            {impact.tasks_to_move.toLocaleString()}
                                        </span>{' '}
                                        {impact.tasks_to_move === 1
                                            ? 'task'
                                            : 'tasks'}{' '}
                                        in{' '}
                                        <span className="font-semibold text-slate-900">
                                            {preview.current?.name ?? '—'}
                                        </span>{' '}
                                        will move to{' '}
                                        <span className="font-semibold text-slate-900">
                                            {preview.target.name}
                                        </span>
                                        . They stay completed and keep their
                                        original completion time.
                                    </p>

                                    <p className="leading-6">
                                        <span className="font-semibold text-slate-900">
                                            {impact.tasks_becoming_completed.toLocaleString()}
                                        </span>{' '}
                                        {impact.tasks_becoming_completed === 1
                                            ? 'task'
                                            : 'tasks'}{' '}
                                        already in{' '}
                                        <span className="font-semibold text-slate-900">
                                            {preview.target.name}
                                        </span>{' '}
                                        will be treated as completed from now
                                        on, and their completion time is set to
                                        this moment.
                                    </p>

                                    <p className="text-xs leading-5 text-slate-500">
                                        Includes archived tasks and tasks in
                                        completed or archived projects. Project
                                        completion checks use the new Completed
                                        group afterwards.
                                    </p>

                                    <div
                                        className={`rounded-lg px-3 py-2 text-xs ${
                                            impact.exceeds_limit
                                                ? 'border border-rose-200 bg-rose-50 text-rose-700'
                                                : 'bg-slate-50 text-slate-500'
                                        }`}
                                    >
                                        {impact.total_migrated.toLocaleString()}{' '}
                                        of {impact.limit.toLocaleString()}{' '}
                                        tasks allowed in a single change.
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={confirm}
                        disabled={!preview || blocked || busy}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {busy ? 'Changing…' : `Make ${label} group`}
                    </button>
                </div>
            </div>
        </div>
    );
}