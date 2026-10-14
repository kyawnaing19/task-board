import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import TagChip from '@/Components/TagChip';

export default function RestoreTagModal({ tag, activeNames, onClose }) {
    const { data, setData, post, processing, errors } = useForm({ name: '' });

    const conflict = activeNames.some(
        (n) => n.toLowerCase() === tag.name.toLowerCase()
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

        post(route('tags.restore', tag.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {needsName ? 'Rename & restore' : 'Restore tag'}
                    </h2>

                    <TagChip name={tag.name} color={tag.color} />
                </div>

                <form onSubmit={submit} className="mt-5 space-y-4 text-sm">
                    <p className="text-slate-500">
                        The tag becomes selectable again on tasks.
                    </p>

                    {needsName && (
                        <div>
                            {/* Conflict warning */}
                            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
                                An active tag named “{tag.name}” already
                                exists. Give this tag a new name to restore it.
                            </p>

                            <label className="block text-sm font-medium text-slate-700">
                                New name
                            </label>

                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                maxLength={30}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                autoFocus
                            />

                            {errors.name && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                    )}

                    {errors.tag && (
                        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                            {errors.tag}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing || (needsName && !data.name.trim())}
                            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {processing
                                ? 'Restoring…'
                                : needsName
                                  ? 'Rename & restore'
                                  : 'Restore tag'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}