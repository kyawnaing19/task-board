import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';

const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100';

const MAX_DESCRIPTION = 150;
const MAX_TYPE_LENGTH = 100;

export default function CreateProjectModal({
    open,
    onClose,
    typeSuggestions = [],
}) {
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
        type: '',
        description: '',
        start_date: '',
        due_date: '',
    });

    const handleClose = () => {
        if (processing) return;

        reset();
        clearErrors();
        onClose();
    };

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [open, processing]);

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();

        post(route('projects.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            {/* Background overlay */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-900">
                            New project
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-slate-500">
                            A reference code (e.g. PRJ-001) is generated
                            automatically. Teams and members can be added
                            after the project is created.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={processing}
                        className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="mt-6 space-y-5">
                    {/* Project name */}
                    <div>
                        <label
                            htmlFor="project-name"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Project name
                        </label>

                        <input
                            id="project-name"
                            type="text"
                            value={data.name}
                            onChange={(e) =>
                                setData('name', e.target.value)
                            }
                            maxLength={255}
                            className={inputClass}
                            placeholder="Enter project name"
                            autoFocus
                            required
                        />

                        {errors.name && (
                            <p className="mt-1.5 text-xs text-rose-600">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Project type */}
                    <div>
                        <label
                            htmlFor="project-type"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Type{' '}
                            <span className="font-normal text-slate-400">
                                (optional)
                            </span>
                        </label>

                        <input
                            id="project-type"
                            type="text"
                            list="project-type-options"
                            value={data.type}
                            onChange={(e) =>
                                setData('type', e.target.value)
                            }
                            maxLength={MAX_TYPE_LENGTH}
                            //placeholder="e.g. Client work, Internal, Product"
                            className={inputClass}
                        />

                        <datalist id="project-type-options">
                            {typeSuggestions.map((type) => (
                                <option key={type} value={type} />
                            ))}
                        </datalist>

                        {errors.type && (
                            <p className="mt-1.5 text-xs text-rose-600">
                                {errors.type}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="project-description"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Description{' '}
                            <span className="font-normal text-slate-400">
                                (optional)
                            </span>
                        </label>

                        <textarea
                            id="project-description"
                            rows={4}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            maxLength={MAX_DESCRIPTION}
                            placeholder="Describe the project..."
                            className={`${inputClass} resize-none`}
                        />

                        <div className="mt-1.5 flex items-start justify-between gap-3 text-xs">
                            <span className="text-rose-600">
                                {errors.description}
                            </span>

                            <span className="shrink-0 text-slate-400">
                                {data.description.length}/{MAX_DESCRIPTION}
                            </span>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Start date */}
                        <div>
                            <label
                                htmlFor="project-start-date"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Start date{' '}
                                <span className="font-normal text-slate-400">
                                    (optional)
                                </span>
                            </label>

                            <input
                                id="project-start-date"
                                type="date"
                                value={data.start_date}
                                max={data.due_date || undefined}
                                onChange={(e) =>
                                    setData('start_date', e.target.value)
                                }
                                className={inputClass}
                            />

                            {errors.start_date && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.start_date}
                                </p>
                            )}
                        </div>

                        {/* Target due date */}
                        <div>
                            <label
                                htmlFor="project-due-date"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Target due date{' '}
                                <span className="font-normal text-slate-400">
                                    (optional)
                                </span>
                            </label>

                            <input
                                id="project-due-date"
                                type="date"
                                value={data.due_date}
                                min={data.start_date || undefined}
                                onChange={(e) =>
                                    setData('due_date', e.target.value)
                                }
                                className={inputClass}
                            />

                            {errors.due_date && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.due_date}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={processing}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}