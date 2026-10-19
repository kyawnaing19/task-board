import React from 'react';

export default function DashboardError({ message, onRetry }) {
    return (
        <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center"
        >
            <div>
                <h2 className="text-sm font-semibold text-red-800">
                    Unable to load dashboard
                </h2>

                <p className="mt-1 text-sm text-red-700">
                    {message}
                </p>
            </div>

            <button
                type="button"
                onClick={onRetry}
                className="shrink-0 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
                Try again
            </button>
        </div>
    );
}