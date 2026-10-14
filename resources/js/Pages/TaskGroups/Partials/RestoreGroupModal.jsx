import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import GroupPill from '@/Components/GroupPill';

export default function RestoreGroupModal({ group, activeNames, onClose }) {
    const { data, setData, post, processing, errors } = useForm({ name: '' });

    const conflict = activeNames.some(
        (n) => n.toLowerCase() === group.name.toLowerCase(),
    );

    // Client က မမြင်ခဲ့ပေမယ့် server က နာမည်ပယ်ရင်လည်း input ပေါ်ပါမယ်
    const needsName = conflict || !!errors.name;

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const submit = (e) => {
        e.preventDefault();

        post(route('task-groups.restore', group.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative my-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {needsName ? 'Rename & restore' : 'Restore group'}
                    </h2>

                    <GroupPill name={group.name} color={group.color} />
                </div>

                <form onSubmit={submit} className="mt-5 space-y-4 text-sm">
                    <p className="leading-5 text-slate-500">
                        The group returns at the end of the list without an
                        Initial or Completed flag.
                    </p>

                    {/* Name conflict */}
                    {needsName && (
                        <div>
                            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                                An active group named “{group.name}” already
                                exists. Give this group a new name to restore
                                it.
                            </p>

                            <label
                                htmlFor="restore-group-name"
                                className="block text-sm font-medium text-slate-700"
                            >
                                New name
                            </label>

                            <input
                                id="restore-group-name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                maxLength={50}
                                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                autoFocus
                            />

                            {errors.name && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* General error */}
                    {errors.group && (
                        <p
                            role="alert"
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
                        >
                            {errors.group}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                processing ||
                                (needsName && !data.name.trim())
                            }
                            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {processing
                                ? 'Restoring…'
                                : needsName
                                  ? 'Rename & restore'
                                  : 'Restore group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}