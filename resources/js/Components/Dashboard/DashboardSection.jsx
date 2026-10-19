import React from 'react';

export default function DashboardSection({
    title,
    description,
    count,
    href,
    empty,
    emptyMessage = 'Nothing to show right now.',
    children,
}) {
    return (
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-900">
                        {title}
                    </h2>

                    {description && (
                        <p className="mt-1 text-sm text-slate-500">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {count !== undefined && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {count}
                        </span>
                    )}

                    {href && (
                        <a
                            href={href}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                            View all
                        </a>
                    )}
                </div>
            </div>

            {empty ? (
                <div className="px-5 py-10 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.7}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8 12h8M12 8v8"
                            />
                            <circle cx="12" cy="12" r="9" />
                        </svg>
                    </div>

                    <p className="mt-3 text-sm text-slate-500">
                        {emptyMessage}
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {children}
                </div>
            )}
        </section>
    );
}