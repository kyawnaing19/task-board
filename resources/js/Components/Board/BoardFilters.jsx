import React from 'react';

const PRIORITY_LABELS = {
    LOW: 'Low',
    NORMAL: 'Normal',
    HIGH: 'High',
    URGENT: 'Urgent',
};

const selectClass =
    'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-50';

export default function BoardFilters({
    options,
    search,
    onSearch,
    filters,
    onChange,
    active,
    onClear,
    isAdmin,
}) {
    const togglePriority = (value) => {
        const has = filters.priority.includes(value);

        onChange({
            priority: has
                ? filters.priority.filter((p) => p !== value)
                : [...filters.priority, value],
        });
    };

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            {/* Search */}
            <input
                type="search"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search title or code…"
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:w-60"
                aria-label="Search tasks"
            />

            {/* Assignee */}
            <select
                value={filters.assignee}
                onChange={(e) =>
                    onChange({ assignee: e.target.value })
                }
                disabled={!options}
                className={selectClass}
                aria-label="Assignee"
            >
                <option value="">All assignees</option>

                {!isAdmin && (
                    <option value="me">Assigned to me</option>
                )}

                <option value="unassigned">Unassigned</option>

                {options?.members?.map((member) => (
                    <option
                        key={member.id}
                        value={String(member.id)}
                    >
                        {member.name}
                    </option>
                ))}
            </select>

            {/* Tag */}
            <select
                value={filters.tag_ids[0] ?? ''}
                onChange={(e) =>
                    onChange({
                        tag_ids: e.target.value
                            ? [Number(e.target.value)]
                            : [],
                    })
                }
                disabled={!options}
                className={selectClass}
                aria-label="Tag"
            >
                <option value="">Any tag</option>

                {options?.tags?.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                        {tag.name}
                    </option>
                ))}
            </select>

            {/* Priority */}
            <div
                className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-100 p-0.5"
                role="group"
                aria-label="Priority"
            >
                {Object.entries(PRIORITY_LABELS).map(
                    ([value, label]) => {
                        const selected =
                            filters.priority.includes(value);

                        return (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                    togglePriority(value)
                                }
                                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                                    selected
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    },
                )}
            </div>

            {/* My Tasks quick filter */}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition hover:bg-slate-50">
                <input
                    type="checkbox"
                    checked={Boolean(filters.mine)}
                    onChange={(event) =>
                        onChange({
                            mine: event.target.checked,
                        })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span>My Tasks</span>
            </label>

            {/* Clear filters */}
            {active && (
                <button
                    type="button"
                    onClick={onClear}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}