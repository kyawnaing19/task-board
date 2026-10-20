import React, { useState } from 'react';

const PRIORITY_LABELS = {
    LOW: 'Low',
    NORMAL: 'Normal',
    HIGH: 'High',
    URGENT: 'Urgent',
};

const PRIORITY_VALUES = Object.keys(PRIORITY_LABELS);

function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

function SelectField({ label, value, onChange, children }) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
                {children}
            </select>
        </label>
    );
}

function DateField({ label, value, onChange, min, max }) {
    return (
        <label className="block min-w-0">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {label}
            </span>
            <input
                type="date"
                value={value}
                min={min}
                max={max}
                onChange={(event) => onChange(event.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
        </label>
    );
}

export default function TaskFilters({
    searchInput,
    onSearchChange,
    projectId,
    onProjectChange,
    groupId,
    onGroupChange,
    priority,
    onPriorityChange,
    tagId,
    onTagChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    projectOptions = [],
    groupOptions = [],
    tagOptions = [],
    priorityOptions = PRIORITY_VALUES,
    hasFilters,
    onReset,
    optionsLoading,
}) {
    const [open, setOpen] = useState(false);

    const activeFilterCount = [
        projectId,
        groupId,
        priority,
        tagId,
        dateFrom,
        dateTo,
    ].filter(Boolean).length;

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Slim header row — always visible */}
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
                {/* Search is always visible — primary filter */}
                <div className="relative min-w-0 flex-1 sm:max-w-xs">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path strokeLinecap="round" d="m16 16 4 4" />
                    </svg>
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(event) =>
                            onSearchChange(event.target.value)
                        }
                        placeholder="Search tasks…"
                        className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setOpen((value) => !value)}
                    aria-expanded={open}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 5h18M6 12h12M10 19h4"
                        />
                    </svg>
                    Filters
                    {activeFilterCount > 0 && (
                        <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {hasFilters && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="shrink-0 text-xs font-semibold text-slate-500 transition hover:text-blue-600"
                    >
                        Reset
                    </button>
                )}

                {optionsLoading && (
                    <span className="ml-auto text-[11px] text-slate-400">
                        Loading…
                    </span>
                )}
            </div>

            {/* Collapsible filter grid */}
            {open && (
                <div className="grid grid-cols-1 gap-3 border-t border-slate-100 px-3 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:px-4">
                    <SelectField
                        label="Project"
                        value={projectId}
                        onChange={onProjectChange}
                    >
                        <option value="">All projects</option>
                        {projectOptions.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.code
                                    ? `${project.code} — ${project.name}`
                                    : project.name}
                                {project.archived ? ' (Archived)' : ''}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField
                        label="Group"
                        value={groupId}
                        onChange={onGroupChange}
                    >
                        <option value="">All groups</option>
                        {groupOptions.map((group) => (
                            <option key={group.id} value={group.id}>
                                {group.name}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField
                        label="Priority"
                        value={priority}
                        onChange={onPriorityChange}
                    >
                        <option value="">All priorities</option>
                        {priorityOptions.map((item) => (
                            <option key={item} value={item}>
                                {PRIORITY_LABELS[item] || item}
                            </option>
                        ))}
                    </SelectField>

                    <SelectField
                        label="Tag"
                        value={tagId}
                        onChange={onTagChange}
                    >
                        <option value="">All tags</option>
                        {tagOptions.map((tag) => (
                            <option key={tag.id} value={tag.id}>
                                {tag.name}
                                {tag.inactive ? ' (Inactive)' : ''}
                            </option>
                        ))}
                    </SelectField>

                    <DateField
                        label="From"
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={onDateFromChange}
                    />

                    <DateField
                        label="To"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={onDateToChange}
                    />
                </div>
            )}
        </section>
    );
}