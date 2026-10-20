import React from 'react';

export default function DashboardSkeleton() {
    return (
        <div className="space-y-4" aria-label="Loading dashboard">
            <div className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
                    <div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
                </div>

                <div className="space-y-4">
                    <div className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" />
                    <div className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" />
                </div>
            </div>
        </div>
    );
}