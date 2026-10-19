import React from 'react';

export default function AdminDashboard() {
    return (
        <div className="min-h-full bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-xl font-bold text-slate-900">
                    Admin Dashboard
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    The system-wide employee, project, and task overview
                    will be implemented here.
                </p>
            </div>
        </div>
    );
}