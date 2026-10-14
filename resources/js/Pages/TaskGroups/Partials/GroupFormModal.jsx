import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import GroupPill from '@/Components/GroupPill';
import { colorOf } from '@/lib/groupColors';

const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';

// group = null ဆိုရင် Create၊ group ပါရင် Edit
export default function GroupFormModal({ group, colors, onClose }) {
    const isEdit = !!group;

    const { data, setData, post, put, processing, errors } = useForm({
        name: group?.name ?? '',
        color: group?.color ?? colors[0],
    });

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const submit = (e) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (isEdit) put(route('task-groups.update', group.id), options);
        else post(route('task-groups.store'), options);
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
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-900">
                            {isEdit ? 'Edit group' : 'New group'}
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                            {isEdit
                                ? 'Rename the group or change its colour. Initial / Completed flags are changed from the group menu.'
                                : 'New groups are added at the end and do not carry an Initial or Completed flag.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={submit} className="mt-5 space-y-5">
                    {/* Group name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Group name
                        </label>

                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            maxLength={50}
                            className={inputClass}
                            autoFocus
                            required
                        />

                        <div className="mt-1 flex justify-between gap-3 text-xs">
                            <span className="text-rose-600">
                                {errors.name || errors.group}
                            </span>

                            <span className="shrink-0 text-slate-400">
                                {data.name.length}/50
                            </span>
                        </div>
                    </div>

                    {/* Colour */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Colour
                        </label>

                        <div className="mt-3 flex flex-wrap gap-3">
                            {colors.map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setData('color', key)}
                                    aria-label={key}
                                    aria-pressed={data.color === key}
                                    className={`h-8 w-8 rounded-full ${colorOf(key).swatch} transition ${
                                        data.color === key
                                            ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white'
                                            : 'opacity-70 hover:scale-110 hover:opacity-100'
                                    }`}
                                />
                            ))}
                        </div>

                        {errors.color && (
                            <p className="mt-2 text-xs text-rose-600">
                                {errors.color}
                            </p>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Preview
                        </p>

                        <GroupPill
                            name={data.name.trim() || 'Group name'}
                            color={data.color}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing
                                ? 'Saving…'
                                : isEdit
                                  ? 'Save changes'
                                  : 'Create group'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}