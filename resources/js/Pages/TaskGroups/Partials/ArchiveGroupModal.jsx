import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import GroupPill from '@/Components/GroupPill';
import { getJson } from '@/lib/http';

export default function ArchiveGroupModal({ group, onClose }) {
    const [preview, setPreview] = useState(null);
    const [replacementId, setReplacementId] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        const controller = new AbortController();

        getJson(
            route('task-groups.archive-preview', group.id),
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
    }, [group.id]);

    const blocked = preview?.blockers?.length > 0;

    const confirm = () => {
        setBusy(true);

        router.post(
            route('task-groups.archive', group.id),
            { replacement_group_id: Number(replacementId) },
            {
                preserveScroll: true,
                onSuccess: () => onClose(),
                onError: (errs) =>
                    setError(
                        errs.replacement_group_id ||
                            errs.group ||
                            'Something went wrong.',
                    ),
                onFinish: () => setBusy(false),
            },
        );
    };

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
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Archive group
                    </h2>

                    <GroupPill name={group.name} color={group.color} />
                </div>

                <p className="mt-1 text-sm text-slate-500">
                    Review the impact and choose a replacement group before
                    archiving.
                </p>

                <div className="mt-5 space-y-4 text-sm">
                    {/* Loading */}
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

                    {/* Blockers */}
                    {blocked && (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-800">
                            <p className="font-semibold">
                                This group cannot be archived yet:
                            </p>

                            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5">
                                {preview.blockers.map((b, i) => (
                                    <li key={i}>{b}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Impact and replacement group */}
                    {preview && !blocked && (
                        <>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-slate-600">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    Impact
                                </p>

                                <p className="mt-2 leading-6">
                                    <span className="font-semibold text-slate-900">
                                        {preview.impact.tasks.toLocaleString()}
                                    </span>{' '}
                                    {preview.impact.tasks === 1
                                        ? 'task'
                                        : 'tasks'}{' '}
                                    will move to the replacement group.
                                </p>

                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                    Includes archived tasks and tasks in
                                    completed or archived projects.
                                </p>
                            </div>

                            {/* Replacement group */}
                            <div>
                                <label
                                    htmlFor="replacement-group"
                                    className="block text-sm font-medium text-slate-700"
                                >
                                    Replacement group
                                </label>

                                <select
                                    id="replacement-group"
                                    value={replacementId}
                                    onChange={(e) =>
                                        setReplacementId(e.target.value)
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="" disabled>
                                        Choose a group…
                                    </option>

                                    {preview.replacements.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                            {g.is_initial ? ' (Initial)' : ''}
                                            {g.is_completed
                                                ? ' (Completed)'
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
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
                        disabled={
                            !preview ||
                            blocked ||
                            !replacementId ||
                            busy
                        }
                        className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {busy ? 'Archiving…' : 'Archive group'}
                    </button>
                </div>
            </div>
        </div>
    );
}