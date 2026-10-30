import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
            <Head title="Sign In - Project Management System" />

            {/* Header */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                </div>

                <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Project Management System
                </h2>

                <p className="mt-2 text-center text-sm text-slate-500">
                    Sign in to access your workspace
                </p>
            </div>

            {/* Login Card */}
            <div className="mt-8 w-full sm:mx-auto sm:max-w-md">
                <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-sm">

                    {/* Status */}
                    {status && (
                        <div className="mb-6 text-sm font-medium text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200">
                            {status}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={submit}>

                        {/* Email Address */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-semibold text-slate-700"
                            >
                                Email Address
                            </label>

                            <div className="mt-2">
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    className={`w-full px-4 py-3 rounded-xl bg-white border text-slate-900 placeholder-slate-400 text-sm outline-none transition-all duration-200 ${
                                        errors.email
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                            : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                    }`}
                                    placeholder="admin@admin.com"
                                />

                                {errors.email && (
                                    <p className="mt-2 text-xs font-medium text-rose-600">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-slate-700"
                            >
                                Password
                            </label>

                            <div className="mt-2 relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    className={`w-full px-4 py-3 pr-12 rounded-xl bg-white border text-slate-900 placeholder-slate-400 text-sm outline-none transition-all duration-200 ${
                                        errors.password
                                            ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                            : 'border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                    }`}
                                    placeholder="Enter your password"
                                />

                                {/* Show / Hide Password */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 transition-colors"
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        /* Eye Off Icon */
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.7}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M3 3l18 18M10.58 10.59a2 2 0 002.83 2.83M9.88 5.09A10.94 10.94 0 0112 4.5c5 0 8.5 4.5 9.5 7.5a11.8 11.8 0 01-3.1 4.7M6.1 6.1A12.2 12.2 0 002.5 12c1 3 4.5 7.5 9.5 7.5 1.5 0 2.9-.4 4.1-1.1"
                                            />
                                        </svg>
                                    ) : (
                                        /* Eye Icon */
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={1.7}
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.5 12s3.5-7.5 9.5-7.5 9.5 7.5 9.5 7.5-3.5 7.5-9.5 7.5S2.5 12 2.5 12z"
                                            />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>

                                {errors.password && (
                                    <p className="mt-2 text-xs font-medium text-rose-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData('remember', e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                                />

                                <span className="text-sm text-slate-600">
                                    Remember me
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-1">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm shadow-indigo-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg
                                            className="animate-spin h-4 w-4 text-white"
                                            viewBox="0 0 24 24"
                                            fill="none"
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
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>

                                        Signing in...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-slate-400">
                    Project Management System
                </p>
            </div>
        </div>
    );
}
