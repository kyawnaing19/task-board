import React from 'react';
import { formatDate } from '@/lib/dates';

function StatusBadge({ status }) {
    const styles = {
        ACTIVE: 'bg-emerald-50 text-emerald-700',
        COMPLETED: 'bg-blue-50 text-blue-700',
        ARCHIVED: 'bg-slate-100 text-slate-600',
    };

    return (
        <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                styles[status] || 'bg-slate-100 text-slate-600'
            }`}
        >
            {(status || 'UNKNOWN').replaceAll('_', ' ')}
        </span>
    );
}

export default function ProjectPreview({ project }) {
    const href =
        typeof route === 'function'
            ? route('my-projects.show', project.id)
            : `/my-projects/${project.id}`;

    return (
        <div className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    {project.code && (
                        <span className="font-mono text-xs text-slate-400">
                            {project.code}
                        </span>
                    )}

                    <StatusBadge status={project.status} />
                </div>

                <a
                    href={href}
                    className="mt-1 inline-block break-words font-semibold text-slate-900 hover:text-indigo-600"
                >
                    {project.name}
                </a>

                {project.due_date && (
                    <p className="mt-1 text-sm text-slate-500">
                        Due {formatDate(project.due_date)}
                    </p>
                )}
            </div>

            <div className="shrink-0 text-sm text-slate-500">
                <span className="font-semibold text-slate-800">
                    {project.open_tasks ?? 0}
                </span>{' '}
                open tasks
            </div>
        </div>
    );
}