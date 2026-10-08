import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';

const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

const MAX_DESCRIPTION = 500;

export default function CreateTeamModal({ open, onClose }) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (!open) return null;

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('teams.store'), {
            preserveScroll: true,
            onSuccess: () => handleClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            New team
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            You can add members after the team is created.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={submit}
                    className="space-y-5 px-6 py-5"
                >
                    {/* Team Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Team name
                        </label>

                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) =>
                                setData('name', e.target.value)
                            }
                            maxLength={255}
                            className={inputClass}
                            autoFocus
                            required
                            placeholder="Enter team name"
                        />

                        {errors.name && (
                            <p className="mt-1.5 text-xs text-rose-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Short description{' '}
                            <span className="font-normal text-slate-400">
                                (optional)
                            </span>
                        </label>

                        <textarea
                            rows={3}
                            value={data.description}
                            onChange={(e) =>
                                setData(
                                    'description',
                                    e.target.value
                                )
                            }
                            maxLength={MAX_DESCRIPTION}
                            className={`${inputClass} resize-none`}
                            placeholder="Describe this team..."
                        />

                        <div className="mt-1.5 flex items-center justify-between text-xs">
                            <span className="text-rose-600">
                                {errors.description}
                            </span>

                            <span className="ml-auto text-slate-400">
                                {data.description.length}/{MAX_DESCRIPTION}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing
                                ? 'Creating...'
                                : 'Create team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}