import React from 'react';

export default function QuickLinks({ links = {} }) {
    const items = [
        { label: 'My Tasks', href: links.my_tasks, icon: '◧' },
        { label: 'Created by me', href: links.created_by_me, icon: '✦' },
        { label: 'My Projects', href: links.my_projects, icon: '▤' },
        { label: 'Archived', href: links.archived_projects, icon: '◌' },
    ].filter((item) => Boolean(item.href));

    if (items.length === 0) return null;

    return (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold tracking-tight text-slate-800">
                    Quick links
                </h2>
            </div>

            <div className="divide-y divide-slate-100">
                {items.map((item) => (
                    <a
                        key={item.label}
                        href={item.href}
                        className="group flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-50/80 hover:text-indigo-700"
                    >
                        <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                            aria-hidden="true"
                        >
                            {item.icon}
                        </span>

                        <span className="flex-1 truncate font-medium">
                            {item.label}
                        </span>

                        <span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500">
                            →
                        </span>
                    </a>
                ))}
            </div>
        </section>
    );
}