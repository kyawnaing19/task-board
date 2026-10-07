import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';

export default function ForceChangePassword() {
    const { data, setData, post, processing, errors } = useForm({
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

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-4 sm:px-6 lg:px-8 text-slate-100">
            <Head title="Security Update - Force Password Change" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-white">
                    Action Required: Update Password
                </h2>
                <p className="mt-2 text-center text-sm text-slate-400">
                    You are logged in with temporary seeded credentials. Please create a new secure password before continuing.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-slate-900 py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10">
                    <form className="space-y-5" onSubmit={submit}>
                        {/* Current Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                Current (Default) Password
                            </label>
                            <input
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                                required
                            />
                            {errors.current_password && (
                                <p className="mt-1 text-xs text-rose-400">{errors.current_password}</p>
                            )}
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                                required
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-rose-400">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="mt-1 w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-indigo-500 focus:outline-none"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                        >
                            {processing ? 'Updating...' : 'Update Password & Access System'}
                        </button>
                    </form>

                    <div className="mt-6 border-t border-slate-800 pt-4 text-center">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-xs text-slate-500 hover:text-slate-300 transition"
                        >
                            Sign out and return to login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}