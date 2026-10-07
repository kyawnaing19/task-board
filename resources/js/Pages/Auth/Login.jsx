import React from 'react';
import { Head, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
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
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 px-4 sm:px-6 lg:px-8">
            <Head title="Sign In - Project Management System" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
                    Project Management System
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    Enter your credentials to access your workspace
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 shadow-2xl border border-slate-700/60 rounded-2xl sm:px-10">
                    {status && (
                        <div className="mb-4 text-sm font-medium text-emerald-400 bg-emerald-950/50 p-3 rounded-lg border border-emerald-800/50">
                            {status}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={submit}>
                        {/* Email Address */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                Email Address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    focus="true"
                                    onChange={(e) => setData('email', e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl bg-slate-900/90 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition duration-200 ${
                                        errors.email
                                            ? 'border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                                    }`}
                                    placeholder="admin@admin.com"
                                />
                                {errors.email && (
                                    <p className="mt-2 text-sm text-rose-400 flex items-center gap-1">
                                        <span>•</span> {errors.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                    Password
                                </label>
                            </div>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl bg-slate-900/90 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition duration-200 ${
                                        errors.password
                                            ? 'border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                                    }`}
                                    placeholder="••••••••"
                                />
                                {errors.password && (
                                    <p className="mt-2 text-sm text-rose-400 flex items-center gap-1">
                                        <span>•</span> {errors.password}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500/20 bg-slate-900 focus:ring-offset-slate-900"
                                />
                                <span className="text-sm text-slate-400">Remember me</span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                            >
                                {processing ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Authenticating...
                                    </span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}