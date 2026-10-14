import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import TagChip from '@/Components/TagChip';
import { TAG_SWATCHES } from '@/lib/tagColors';

const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';

// tag = null ဆိုရင် Create၊ tag ပါရင် Edit
export default function TagFormModal({ tag, colors, onClose }) {
    const isEdit = !!tag;

    const { data, setData, post, put, processing, errors } = useForm({
        name: tag?.name ?? '',
        color: tag?.color ?? colors[1] ?? colors[0] ?? 'slate',
    });

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const submit = (e) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (isEdit) {
            put(route('tags.update', tag.id), options);
        } else {
            post(route('tags.store'), options);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            {/* Modal backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative my-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            {isEdit ? 'Edit tag' : 'New tag'}
                        </h2>

                        <p className="mt-1 text-sm leading-relaxed text-slate-500">
                            Employees choose from active tags when they create
                            or edit a task.
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

                <form onSubmit={submit} className="mt-6 space-y-5">
                    {/* Tag name */}
                    <div>
                        <label
                            htmlFor="tag-name"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Tag name
                        </label>

                        <input
                            id="tag-name"
                            type="text"
                            value={data.name}
                            onChange={(e) =>
                                setData('name', e.target.value)
                            }
                            maxLength={30}
                            className={inputClass}
                            autoFocus
                            required
                        />

                        <div className="mt-1.5 flex justify-between text-xs">
                            <span className="text-rose-600">
                                {errors.name || errors.tag}
                            </span>

                            <span className="text-slate-400">
                                {data.name.length}/30
                            </span>
                        </div>
                    </div>

                    {/* Colour selection */}
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
                                    aria-label={`Select ${key} color`}
                                    aria-pressed={data.color === key}
                                    title={key}
                                    className={`h-8 w-8 rounded-full border border-slate-200 ${
                                        TAG_SWATCHES[key] ??
                                        TAG_SWATCHES.slate
                                    } ring-offset-2 ring-offset-white transition ${
                                        data.color === key
                                            ? 'scale-110 ring-2 ring-indigo-500'
                                            : 'hover:scale-110 hover:opacity-90'
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

                        <TagChip
                            name={data.name.trim() || 'Tag name'}
                            color={data.color}
                        />
                    </div>

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
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing
                                ? 'Saving…'
                                : isEdit
                                  ? 'Save changes'
                                  : 'Create tag'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}