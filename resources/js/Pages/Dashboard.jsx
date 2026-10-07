import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Dashboard() {
    return (
        <AuthenticatedLayout header="Dashboard Overview">
            <Head title="Dashboard" />

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-2">Welcome Back!</h3>
                <p className="text-slate-400">
                    Your authenticated session and active middleware status are fully operational.
                </p>
            </div>
        </AuthenticatedLayout>
    );
}