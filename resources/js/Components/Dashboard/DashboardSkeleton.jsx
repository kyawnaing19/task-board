import React from 'react';

export default function DashboardSkeleton() {
    return (
        <div className="space-y-6" aria-label="Loading dashboard">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                    <div
                        key={item}
                        className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                        key={item}
                        className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
                    />
                ))}
            </div>
        </div>
    );
}