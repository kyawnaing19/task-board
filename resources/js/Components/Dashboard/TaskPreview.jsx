import React from 'react';
import { formatDate } from '@/lib/dates';

const PRIORITY_DOT = {
    LOW: 'bg-slate-300',
    NORMAL: 'bg-blue-400',
    HIGH: 'bg-amber-400',
    URGENT: 'bg-rose-500',
};

export default function TaskPreview({ task, overdue = false }) {
    const project = task.project ?? {};

    const taskUrl = project.id
        ? `/my-projects/${project.id}?task=${encodeURIComponent(task.id)}`
        : null;

    const dot = overdue
        ? 'bg-rose-500'
        : PRIORITY_DOT[task.priority] || 'bg-slate-300';

    const Tag = taskUrl ? 'a' : 'div';
    const tagProps = taskUrl ? { href: taskUrl } : {};

    return (
        <Tag
            {...tagProps}
            className="group flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50/80"
        >
            <span
                className={`h-2 w-2 shrink-0 rounded-full ${dot}`}
                aria-hidden="true"
            />

            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {task.code && (
                        <span className="font-mono text-[11px] font-medium text-slate-400">
                            {task.code}
                        </span>
                    )}

                    <span className="truncate text-sm font-medium text-slate-800 group-hover:text-indigo-700">
                        {task.title || 'Untitled task'}
                    </span>

                    {task.is_new && (
                        <span className="shrink-0 rounded bg-indigo-50 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                            New
                        </span>
                    )}
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-slate-400">
                    {project.name && <span>{project.name}</span>}
                    {task.group?.name && (
                        <>
                            <span>·</span>
                            <span>{task.group.name}</span>
                        </>
                    )}
                </div>
            </div>

            {task.end_date && (
                <span
                    className={`shrink-0 text-xs ${
                        overdue
                            ? 'font-semibold text-rose-600'
                            : 'text-slate-400'
                    }`}
                >
                    {overdue ? 'Overdue' : formatDate(task.end_date)}
                </span>
            )}
        </Tag>
    );
}