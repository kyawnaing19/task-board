import React from 'react';

const ACCENTS = {
    indigo: 'bg-indigo-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
};

export default function DashboardSection({
    title,
    description,
    count,
    href,
    empty,
    emptyMessage = 'Nothing to show right now.',
    accent = 'indigo',
    children,
}) {
    const spine = ACCENTS[accent] || ACCENTS.indigo;

    return (
        <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span
                className={`absolute inset-y-0 left-0 w-[3px] ${spine}`}
                aria-hidden="true"
            />

            <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${spine}`} />

                    <h2 className="truncate text-sm font-semibold tracking-tight text-slate-800">
                        {title}
                    </h2>

                    {count !== undefined && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-[11px] font-bold tabular-nums text-slate-600">
                            {count}
                        </span>
                    )}

                    {description && (
                        <span className="hidden truncate text-xs text-slate-400 sm:inline">
                            · {description}
                        </span>
                    )}
                </div>

                {href && (
                    <a
                        href={href}
                        className="shrink-0 text-xs font-medium text-slate-400 transition hover:text-indigo-600"
                    >
                        View all →
                    </a>
                )}
            </div>

            <div className="border-t border-slate-100">
                {empty ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-slate-400">
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.8}
                            aria-hidden="true"
                        >
                            <circle cx="12" cy="12" r="9" />
                            <path strokeLinecap="round" d="M9 15h6" />
                        </svg>
                        {emptyMessage}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">{children}</div>
                )}
            </div>
        </section>
    );
}