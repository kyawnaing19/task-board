import React from 'react';
import { formatDate } from '@/lib/dates';

function PriorityBadge({ priority }) {
    if (!priority) return null;

    const styles = {
        LOW: 'bg-slate-100 text-slate-600',
        NORMAL: 'bg-blue-50 text-blue-700',
        HIGH: 'bg-orange-50 text-orange-700',
        URGENT: 'bg-red-50 text-red-700',
    };

    return (
        <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
                styles[priority] || 'bg-slate-100 text-slate-600'
            }`}
        >
            {priority}
        </span>
    );
}

export default function TaskPreview({ task, overdue = false }) {
    const project = task.project ?? {};

  const taskUrl = project.id
    ? `/my-projects/${project.id}?task=${encodeURIComponent(task.id)}`
    : null;

    return (
        <div className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    {task.code && (
                        <span className="font-mono text-xs text-slate-400">
                            {task.code}
                        </span>
                    )}

                    <PriorityBadge priority={task.priority} />

                    {task.is_new && (
                        <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                            New
                        </span>
                    )}

                    {overdue && (
                        <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                            Overdue
                        </span>
                    )}
                </div>

                {taskUrl ? (
                    <a
                        href={taskUrl}
                        className="mt-1 inline-block break-words font-semibold text-slate-900 hover:text-indigo-600"
                    >
                        {task.title || 'Untitled task'}
                    </a>
                ) : (
                    <p className="mt-1 break-words font-semibold text-slate-900">
                        {task.title || 'Untitled task'}
                    </p>
                )}

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                    {project.name && <span>{project.name}</span>}

                    {task.group?.name && (
                        <>
                            <span aria-hidden="true">·</span>
                            <span>{task.group.name}</span>
                        </>
                    )}

                    {task.end_date && (
                        <>
                            <span aria-hidden="true">·</span>
                            <span>Due {formatDate(task.end_date)}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}