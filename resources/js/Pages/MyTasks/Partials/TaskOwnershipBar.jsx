import React from 'react';

const MODES = ['assigned', 'created', 'both'];

const MODE_ITEMS = [
    { value: 'assigned', label: 'Assigned' },
    { value: 'created', label: 'Created' },
    { value: 'both', label: 'Both' },
];

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

function CheckboxFilter({ checked, onChange, children }) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{children}</span>
        </label>
    );
}

export default function TaskOwnershipBar({
    mode,
    onModeChange,
    archivedTasks,
    onArchivedTasksChange,
    archivedProjects,
    onArchivedProjectsChange,
    loading,
    total,
    activeCount,
}) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                {/* Segmented mode control */}
                <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                    {MODE_ITEMS.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => onModeChange(item.value)}
                            aria-pressed={mode === item.value}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-xs font-semibold transition',
                                mode === item.value
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700',
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <span className="hidden h-4 w-px bg-slate-200 sm:block" />

                {/* Archived toggles */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <CheckboxFilter
                        checked={archivedTasks}
                        onChange={onArchivedTasksChange}
                    >
                        Archived tasks
                    </CheckboxFilter>

                    <CheckboxFilter
                        checked={archivedProjects}
                        onChange={onArchivedProjectsChange}
                    >
                        Archived projects
                    </CheckboxFilter>
                </div>

                {/* Live status */}
                <div className="ml-auto flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {loading
                        ? 'Loading…'
                        : `${total ?? activeCount} tasks`}
                </div>
            </div>
        </section>
    );
}