import React, { useEffect, useState } from 'react';

import { useForm } from '@inertiajs/react';

const ROLE_LABELS = {
    SUPER_ADMIN: 'Super Admin',
    EMPLOYEE: 'Employee',
};

const inputClass =
    'mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

export default function CreateEmployeeModal({ open, onClose, roles }) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            email: '',
            job_title: '',
            role: '',
            avatar: null,
        });

    const [preview, setPreview] = useState(null);
    const [fileError, setFileError] = useState(null);

    // Escape နှိပ်ရင် ပိတ်မယ်
    useEffect(() => {
        if (!open) return;

        const onKey = (e) => e.key === 'Escape' && handleClose();

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    // Preview URL ကို memory ကနေ ပြန်ဖယ်မယ်
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    if (!open) return null;

    const handleClose = () => {
        reset();
        clearErrors();
        setPreview(null);
        setFileError(null);
        onClose();
    };

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        setFileError(null);

        if (!file) {
            setData('avatar', null);
            setPreview(null);
            return;
        }

        if (!file.type.startsWith('image/')) {
            setFileError('Please choose an image file.');
            e.target.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setFileError('Image must be 2MB or smaller.');
            e.target.value = '';
            return;
        }

        setData('avatar', file);
        setPreview(URL.createObjectURL(file));
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('employees.store'), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => handleClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                {/* Header */}
                <div className="border-b border-slate-200 bg-white px-6 py-5 sm:px-7">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 19a6 6 0 0 0-12 0m6-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-3v6m3-3h-6"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                    Create employee
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    Add a new employee account to your
                                    organization.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Close"
                        >
                            <svg
                                className="h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 6l12 12M18 6 6 18"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto bg-white px-6 py-6 sm:px-7">
                    {/* Temporary password notice */}
                    <div className="mb-6 flex gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75-3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                                />
                            </svg>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-indigo-700">
                                Temporary password
                            </p>

                            <p className="mt-0.5 text-xs leading-5 text-slate-600">
                                A temporary password valid for 24 hours will
                                be generated automatically.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Avatar */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                Profile photo
                                <span className="ml-1 text-xs font-normal text-slate-400">
                                    Optional
                                </span>
                            </label>

                            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt=""
                                        className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-slate-200"
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-500 ring-1 ring-slate-200">
                                        {data.name.charAt(0).toUpperCase() ||
                                            '?'}
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleFile}
                                        className="block w-full text-xs text-slate-500 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700 file:transition hover:file:bg-slate-300"
                                    />

                                    <p className="mt-1.5 text-[11px] text-slate-400">
                                        PNG, JPG or WebP · Maximum 2MB
                                    </p>

                                    {(fileError || errors.avatar) && (
                                        <p className="mt-1.5 text-xs text-rose-600">
                                            {fileError || errors.avatar}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Full name
                            </label>

                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className={inputClass}
                                placeholder="e.g. John Doe"
                                required
                            />

                            {errors.name && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Email address
                            </label>

                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                className={inputClass}
                                placeholder="name@example.com"
                                required
                            />

                            {errors.email && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Job title */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Job title
                                <span className="ml-1 text-xs font-normal text-slate-400">
                                    Optional
                                </span>
                            </label>

                            <input
                                type="text"
                                value={data.job_title}
                                onChange={(e) =>
                                    setData('job_title', e.target.value)
                                }
                                className={inputClass}
                                placeholder="e.g. Software Developer"
                            />

                            {errors.job_title && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.job_title}
                                </p>
                            )}
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Role
                            </label>

                            <div className="relative text-slate-900">
                                <select
                                    value={data.role}
                                    onChange={(e) =>
                                        setData('role', e.target.value)
                                    }
                                    className={`${inputClass} ${
                                        data.role
                                            ? 'text-slate-900'
                                            : 'text-slate-500'
                                    } appearance-none pr-10`}
                                    required
                                >
                                    <option
                                        value=""
                                        className="text-slate-500"
                                        disabled
                                    >
                                        Select a role…
                                    </option>

                                    {roles.map((role) => (
                                        <option
                                            key={role}
                                            value={role}
                                            className="text-slate-900"
                                        >
                                            {ROLE_LABELS[role] ?? role}
                                        </option>
                                    ))}
                                </select>

                                <svg
                                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m6 9 6 6 6-6"
                                    />
                                </svg>
                            </div>

                            {errors.role && (
                                <p className="mt-1.5 text-xs text-rose-600">
                                    {errors.role}
                                </p>
                            )}

                            {data.role === 'SUPER_ADMIN' && (
                                <div className="mt-2 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                                    <svg
                                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 9v4m0 4h.01M10.3 3.8 2.9 17a2 2 0 0 0 1.75 3h14.7a2 2 0 0 0 1.75 3L13.7 3.8a2 2 0 0 0-3.4 0Z"
                                        />
                                    </svg>

                                    <p className="text-xs leading-5 text-amber-700">
                                        Super admins have full access, including
                                        managing other employees.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing && (
                                    <svg
                                        className="h-4 w-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            className="opacity-30"
                                            cx="12"
                                            cy="12"
                                            r="9"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        />

                                        <path
                                            className="opacity-90"
                                            d="M21 12a9 9 0 0 0-9-9"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                )}

                                {processing
                                    ? 'Creating...'
                                    : 'Create employee'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

