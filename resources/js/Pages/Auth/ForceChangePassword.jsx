import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';

/**
 * Shared input styles
 */
const inputClass = (error) =>
    [
        'block w-full rounded-xl border bg-white px-4 py-3 pr-12',
        'text-sm text-slate-900 placeholder:text-slate-400',
        'outline-none transition duration-150',
        'focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500',
        error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100'
            : 'border-slate-200',
    ].join(' ');

/**
 * PasswordInput
 *
 * IMPORTANT:
 * Keep this component outside ForceChangePassword.
 * This prevents input remounting and cursor/focus loss.
 */
function PasswordInput({
    id,
    label,
    value,
    onChange,
    error,
    visible,
    onToggle,
}) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-medium text-slate-700"
            >
                {label}
            </label>

            <div className="relative">
                <input
                    id={id}
                    name={id}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    autoComplete="new-password"
                    className={inputClass(error)}
                />

                <button
                    type="button"
                    onClick={onToggle}
                    aria-label={visible ? 'Hide password' : 'Show password'}
                    aria-pressed={visible}
                    className="
                        absolute inset-y-0 right-0
                        flex items-center justify-center
                        px-4 text-slate-400
                        transition hover:text-indigo-600
                        focus:outline-none focus:text-indigo-600
                    "
                >
                    {visible ? (
                        // Eye slash icon
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 3l18 18" />
                            <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                            <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.5 9.5 7-.4 1-1.2 2.1-2.3 3.2" />
                            <path d="M6.2 6.2C3.9 7.7 2.6 10 2.5 12c.5 1.3 1.6 2.8 3.5 4.1A10.4 10.4 0 0012 19c1.2 0 2.3-.2 3.3-.6" />
                        </svg>
                    ) : (
                        // Eye icon
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                    )}
                </button>
            </div>

            {error && (
                <p className="mt-2 text-sm text-rose-600">
                    {error}
                </p>
            )}
        </div>
    );
}

/**
 * ForceChangePassword
 */
export default function ForceChangePassword() {
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        password: false,
        confirmation: false,
    });

    const {
        data,
        setData,
        post,
        processing,
        errors,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.update'));
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    const togglePassword = (field) => {
        setShowPasswords((previous) => ({
            ...previous,
            [field]: !previous[field],
        }));
    };

    return (
        <>
            <Head title="Change Password" />

            <div className="
                min-h-screen
                flex flex-col justify-center items-center
                bg-slate-50
                px-4 py-10
                sm:px-6 lg:px-8
            ">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="
                        mx-auto mb-4
                        flex h-14 w-14 items-center justify-center
                        rounded-2xl
                        border border-amber-200
                        bg-amber-50
                        text-amber-600
                    ">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-7 w-7"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect
                                x="3"
                                y="11"
                                width="18"
                                height="10"
                                rx="2"
                            />
                            <path d="M7 11V7a5 5 0 0110 0v4" />
                            <path d="M12 15v3" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Change Your Password
                    </h1>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        For your account security, please create a new password
                        before continuing.
                    </p>
                </div>

                {/* Form Card */}
                <div className="
                    w-full max-w-md
                    rounded-2xl
                    border border-slate-200
                    bg-white
                    px-6 py-8
                    shadow-sm
                    sm:px-10
                ">
                    <form onSubmit={submit} className="space-y-5">
                        {/* Current Password */}
                        <PasswordInput
                            id="current_password"
                            label="Current Password"
                            value={data.current_password}
                            onChange={(e) =>
                                setData('current_password', e.target.value)
                            }
                            error={errors.current_password}
                            visible={showPasswords.current}
                            onToggle={() => togglePassword('current')}
                        />

                        {/* New Password */}
                        <PasswordInput
                            id="password"
                            label="New Password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            error={errors.password}
                            visible={showPasswords.password}
                            onToggle={() => togglePassword('password')}
                        />

                        {/* Confirm Password */}
                        <PasswordInput
                            id="password_confirmation"
                            label="Confirm New Password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            error={errors.password_confirmation}
                            visible={showPasswords.confirmation}
                            onToggle={() => togglePassword('confirmation')}
                        />

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="
                                mt-2
                                flex w-full items-center justify-center
                                rounded-xl
                                bg-indigo-600
                                px-4 py-3
                                text-sm font-semibold text-white
                                shadow-sm
                                transition duration-150
                                hover:bg-indigo-700
                                focus:outline-none
                                focus:ring-2 focus:ring-indigo-500
                                focus:ring-offset-2
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            {processing ? (
                                <>
                                    <svg
                                        className="mr-2 h-4 w-4 animate-spin"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                        />
                                    </svg>

                                    Updating Password...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>

                    {/* Logout */}
                    <div className="
                        mt-6
                        border-t border-slate-100
                        pt-5
                        text-center
                    ">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="
                                inline-flex items-center gap-2
                                text-sm font-medium
                                text-slate-500
                                transition
                                hover:text-rose-600
                            "
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                                <path d="M16 17l5-5-5-5" />
                                <path d="M21 12H9" />
                            </svg>

                            Log out
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-8 text-xs text-slate-400">
                    PMS Admin
                </p>
            </div>
        </>
    );
}