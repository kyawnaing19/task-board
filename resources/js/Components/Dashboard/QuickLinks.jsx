import React from 'react';

export default function QuickLinks({ links = {} }) {
    const items = [
        {
            label: 'My Tasks',
            href: links.my_tasks,
            description: 'View your assigned tasks',
        },
        {
            label: 'Tasks Created by Me',
            href: links.created_by_me,
            description: 'View tasks you created',
        },
        {
            label: 'My Projects',
            href: links.my_projects,
            description: 'Open your projects',
        },
        {
            label: 'Archived Projects',
            href: links.archived_projects,
            description: 'Browse archived projects',
        },
    ].filter((item) => Boolean(item.href));

    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
                <h2 className="text-base font-semibold text-slate-900">
                    Quick Links
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Jump directly to the things you use most.
                </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {items.map((item) => (
                    <a
                        key={item.label}
                        href={item.href}
                        className="group rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-semibold text-slate-800 group-hover:text-indigo-700">
                                {item.label}
                            </span>

                            <span className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600">
                                →
                            </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                            {item.description}
                        </p>
                    </a>
                ))}
            </div>
        </section>
    );
}