import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function EditEmployeeModal({ employee, onClose }) {
    const { data, setData, post, processing, errors, transform } = useForm({
        _method: 'put',
        name: employee.name,
        email: employee.email,
        job_title: employee.job_title ?? '',
        avatar: null,
        remove_avatar: false,
    });

    const [preview, setPreview] = useState(null);
    const [fileError, setFileError] = useState('');

    transform((d) => ({
        ...d,
        remove_avatar: d.remove_avatar ? 1 : 0,
    }));

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleFile = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        setFileError('');

        if (!file.type.startsWith('image/')) {
            setFileError('Please select an image file.');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setFileError('Image must be less than 2MB.');
            return;
        }

        setData((d) => ({
            ...d,
            avatar: file,
            remove_avatar: false,
        }));

        setPreview(URL.createObjectURL(file));
    };

    const removeAvatar = () => {
        setData((d) => ({
            ...d,
            avatar: null,
            remove_avatar: true,
        }));

        setPreview(null);
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('employees.update', employee.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const shownAvatar =
        preview ?? (data.remove_avatar ? null : employee.avatar_url);

    const inputClass =
        'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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
                                    d="M12 20h9"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                                />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-slate-900">
                                Edit Employee
                            </h2>

                            <p className="text-xs text-slate-500">
                                Update employee information
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
                                d="M6 6l12 12M18 6L6 18"
                            />
                        </svg>
                    </button>
                </div>

                <form onSubmit={submit}>
                    {/* Body */}
                    <div className="bg-white px-5 py-5">
                        {/* Profile */}
                        <div className="mb-5 flex items-center gap-4">
                            {/* Clean avatar */}
                            <div className="relative shrink-0">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                                    {shownAvatar ? (
                                        <img
                                            src={shownAvatar}
                                            alt={employee.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xl font-semibold text-slate-400">
                                            {employee.name
                                                ?.charAt(0)
                                                ?.toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <label
                                    htmlFor="edit-avatar"
                                    className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700"
                                    title="Change avatar"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M12 20h9"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
                                        />
                                    </svg>
                                </label>

                                <input
                                    id="edit-avatar"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFile}
                                />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-900">
                                    {employee.name}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    JPG, PNG or other image · Max 2MB
                                </p>

                                <div className="mt-2 flex items-center gap-2">
                                    {shownAvatar && (
                                        <button
                                            type="button"
                                            onClick={removeAvatar}
                                            className="text-xs font-medium text-rose-600 transition hover:text-rose-700"
                                        >
                                            Remove photo
                                        </button>
                                    )}

                                    {fileError && (
                                        <span className="text-xs text-rose-600">
                                            {fileError}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-xs font-medium text-slate-600">
                                    Full name
                                </label>

                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Employee name"
                                />

                                {errors.name && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-medium text-slate-600">
                                    Job title
                                </label>

                                <input
                                    type="text"
                                    value={data.job_title}
                                    onChange={(e) =>
                                        setData('job_title', e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="e.g. Software Engineer"
                                />

                                {errors.job_title && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {errors.job_title}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Account info */}
                        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-medium text-slate-600">
                                        Email
                                    </label>

                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData(
                                                'email',
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                        placeholder="employee@example.com"
                                    />

                                    {errors.email && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                        Role
                                    </p>

                                    <p className="mt-1 text-sm text-slate-700">
                                        {employee.role?.name ??
                                            employee.role ??
                                            '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

