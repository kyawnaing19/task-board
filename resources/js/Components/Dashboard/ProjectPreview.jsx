import React from 'react';
import { formatDate } from '@/lib/dates';

const STATUS = {
    ACTIVE: 'bg-emerald-500',
    COMPLETED: 'bg-blue-500',
    ARCHIVED: 'bg-slate-400',
};

export default function ProjectPreview({ project }) {
    const href =
        typeof route === 'function'
            ? route('my-projects.show', project.id)
            : `/my-projects/${project.id}`;

    const dot = STATUS[project.status] || 'bg-slate-400';

    return (
        <a
            href={href}
            className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/80"
        >
            <span
                className={`h-2 w-2 shrink-0 rounded-full ${dot}`}
                aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {project.code && (
                        <span className="font-mono text-[11px] font-medium text-slate-400">
                            {project.code}
                        </span>
                    )}
                    <span className="truncate text-sm font-medium text-slate-800 group-hover:text-indigo-700">
                        {project.name}
                    </span>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-xs">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold tabular-nums text-slate-600">
                    {project.open_tasks ?? 0} open
                </span>

                {project.due_date && (
                    <span className="hidden text-slate-400 sm:inline">
                        {formatDate(project.due_date)}
                    </span>
                )}
            </div>
        </a>
    );
}