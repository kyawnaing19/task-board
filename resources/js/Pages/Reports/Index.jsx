import React, { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TagChip from '@/Components/TagChip';

const FILTER_KEYS = [
    'team_id',
    'employee_id',
    'tag_id',
    'date_from',
    'date_to',
];

const TABS = [
    { key: 'open', label: 'Open' },
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
];

const formatDate = (value) => {
    if (!value) return '—';

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          });
};

const PriorityBadge = ({ priority }) => {
    const styles = {
        LOW: 'bg-slate-100 text-slate-600',
        NORMAL: 'bg-indigo-50 text-indigo-700',
        HIGH: 'bg-amber-50 text-amber-700',
        URGENT: 'bg-rose-50 text-rose-700',
    };

    const value = (priority || 'NORMAL').toUpperCase();

    return (
        <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                styles[value] ?? styles.NORMAL
            }`}
        >
            {value.toLowerCase()}
        </span>
    );
};

const FilterLabel = ({ children }) => (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {children}
    </span>
);

const SelectFilter = ({
    label,
    value,
    onChange,
    options,
    placeholder,
}) => (
    <div className="min-w-0">
        <FilterLabel>{label}</FilterLabel>

        <div className="relative">
            <select
                value={value}
                onChange={onChange}
                className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-[13px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            >
                <option value="">{placeholder}</option>

                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>

            <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
            >
                <path
                    d="m5 7.5 5 5 5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    </div>
);

const DateFilter = ({ label, value, onChange }) => (
    <div className="min-w-0">
        <FilterLabel>{label}</FilterLabel>

        <input
            type="date"
            value={value}
            onChange={onChange}
            className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
        />
    </div>
);

export default function Index({
    filter_options = {
        teams: [],
        employees: [],
        tags: [],
    },
    filters = {},
    tasks = {
        data: [],
        links: [],
        total: 0,
        from: null,
        to: null,
    },
    task_counts = {
        open: 0,
        all: 0,
        completed: 0,
    },
}) {
    const [form, setForm] = useState({
        team_id: filters.team_id ?? '',
        employee_id: filters.employee_id ?? '',
        tag_id: filters.tag_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    useEffect(() => {
        setForm({
            team_id: filters.team_id ?? '',
            employee_id: filters.employee_id ?? '',
            tag_id: filters.tag_id ?? '',
            date_from: filters.date_from ?? '',
            date_to: filters.date_to ?? '',
        });
    }, [
        filters.team_id,
        filters.employee_id,
        filters.tag_id,
        filters.date_from,
        filters.date_to,
    ]);

    const activeTab = filters.task_status ?? 'open';

    const hasFilters = FILTER_KEYS.some(
        (key) => form[key] !== '',
    );

    const thClass =
        'whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';

    const tdClass =
        'px-4 py-3 align-middle text-sm text-slate-700';

    const visit = (nextFilters, taskStatus = activeTab) => {
        const query = Object.fromEntries(
            Object.entries({
                ...nextFilters,
                task_status: taskStatus,
            }).filter(
                ([, value]) => value !== '' && value != null,
            ),
        );

        router.get(route('reports.index'), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const updateFilter = (key, value) => {
        const next = {
            ...form,
            [key]: value,
        };

        setForm(next);
        visit(next);
    };

    const clearFilters = () => {
        const cleared = Object.fromEntries(
            FILTER_KEYS.map((key) => [key, '']),
        );

        setForm(cleared);
        visit(cleared);
    };

    return (
        <AuthenticatedLayout header="Reports">
            <Head title="Task Report" />

            <div className="w-full min-w-0 space-y-5">

                {/* FILTER SECTION */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">

                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                Filters
                            </h3>

                            <p className="mt-0.5 text-xs text-slate-400">
                                Refine tasks by team, employee, tag and date.
                            </p>
                        </div>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-indigo-600"
                            >
                                <svg
                                    className="h-3.5 w-3.5"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                >
                                    <path
                                        d="M4 7h12M7 7V4h6v3m-7 0 1 9h6l1-9"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                Clear filters
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-x-4 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:px-5 sm:py-4">

                        <SelectFilter
                            label="Team"
                            value={form.team_id}
                            placeholder="All teams"
                            options={filter_options.teams}
                            onChange={(event) =>
                                updateFilter(
                                    'team_id',
                                    event.target.value,
                                )
                            }
                        />

                        <SelectFilter
                            label="Employee"
                            value={form.employee_id}
                            placeholder="All employees"
                            options={filter_options.employees}
                            onChange={(event) =>
                                updateFilter(
                                    'employee_id',
                                    event.target.value,
                                )
                            }
                        />

                        <SelectFilter
                            label="Tag"
                            value={form.tag_id}
                            placeholder="All tags"
                            options={filter_options.tags}
                            onChange={(event) =>
                                updateFilter(
                                    'tag_id',
                                    event.target.value,
                                )
                            }
                        />

                        <DateFilter
                            label="Date From"
                            value={form.date_from}
                            onChange={(event) =>
                                updateFilter(
                                    'date_from',
                                    event.target.value,
                                )
                            }
                        />

                        <DateFilter
                            label="Date To"
                            value={form.date_to}
                            onChange={(event) =>
                                updateFilter(
                                    'date_to',
                                    event.target.value,
                                )
                            }
                        />

                    </div>
                </section>

                {/* TASK TABLE */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    {/* TABS */}
                    <div className="border-b border-slate-200 px-4 pt-3 sm:px-5">

                        <div
                            className="flex flex-wrap gap-5"
                            role="tablist"
                            aria-label="Task status"
                        >
                            {TABS.map((tab) => {
                                const active = activeTab === tab.key;

                                return (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() =>
                                            visit(form, tab.key)
                                        }
                                        className={`relative flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-semibold transition ${
                                            active
                                                ? 'border-indigo-600 text-indigo-700'
                                                : 'border-transparent text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        {tab.label}

                                        <span
                                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                active
                                                    ? 'bg-indigo-50 text-indigo-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {task_counts[tab.key] ?? 0}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1350px]">

                            <thead className="bg-slate-50/70">
                                <tr>
                                    <th className={thClass}>No.</th>
                                    <th className={thClass}>Task</th>
                                    <th className={thClass}>Employee</th>
                                    <th className={thClass}>Project</th>
                                    <th className={thClass}>Team</th>
                                    <th className={thClass}>Tags</th>
                                    <th className={thClass}>Start Date</th>
                                    <th className={thClass}>Due Date</th>
                                    <th className={thClass}>Completed Date</th>
                                    <th className={thClass}>Status</th>
                                    <th className={thClass}>Priority</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {(tasks.data ?? []).length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={11}
                                            className="px-4 py-10 text-center text-sm text-slate-500"
                                        >
                                            No tasks match the current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    tasks.data.map((task, index) => (
                                        <tr
                                            key={task.id}
                                            className="transition hover:bg-slate-50/80"
                                        >
                                            <td className={tdClass}>
                                                {(tasks.from ?? 1) + index}
                                            </td>

                                            <td className={tdClass}>
                                                <div className="font-medium text-slate-900">
                                                    {task.title}
                                                </div>

                                                <div className="mt-0.5 text-xs text-slate-500">
                                                    {task.code}
                                                </div>
                                            </td>

                                            <td className={tdClass}>
                                                <div className="flex min-w-36 flex-col gap-1.5">
                                                    {(task.assignees ?? []).length === 0
                                                        ? '—'
                                                        : task.assignees.map(
                                                              (employee) => (
                                                                  <span
                                                                      key={employee.id}
                                                                      className="inline-flex items-center gap-2 whitespace-nowrap"
                                                                  >
                                                                      <Avatar
                                                                          name={employee.name}
                                                                          src={employee.avatar_url}
                                                                          size="xs"
                                                                      />

                                                                      {employee.name}
                                                                  </span>
                                                              ),
                                                          )}
                                                </div>
                                            </td>

                                            <td className={tdClass}>
                                                <span title={task.project_name}>
                                                    {task.project_name ||
                                                        task.project_code ||
                                                        '—'}
                                                </span>
                                            </td>

                                            <td className={tdClass}>
                                                {(task.teams ?? []).join(', ') || '—'}
                                            </td>

                                            <td className={tdClass}>
                                                <div className="flex max-w-48 flex-wrap gap-1">
                                                    {(task.tags ?? []).length === 0
                                                        ? '—'
                                                        : task.tags.map((tag) => (
                                                              <TagChip
                                                                  key={tag.id}
                                                                  name={tag.name}
                                                                  color={tag.color}
                                                              />
                                                          ))}
                                                </div>
                                            </td>

                                            <td className={tdClass}>
                                                {formatDate(task.start_date)}
                                            </td>

                                            <td className={tdClass}>
                                                {formatDate(task.end_date)}
                                            </td>

                                            <td className={tdClass}>
                                                {formatDate(task.completed_at)}
                                            </td>

                                            <td className={tdClass}>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                        task.is_completed
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {task.group_name ||
                                                        (task.is_completed
                                                            ? 'Completed'
                                                            : 'Open')}
                                                </span>
                                            </td>

                                            <td className={tdClass}>
                                                <PriorityBadge
                                                    priority={task.priority}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}

                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    {(tasks.links ?? []).length > 3 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 sm:px-5">

                            <p className="text-xs text-slate-500">
                                Showing {tasks.from}–{tasks.to} of {tasks.total} tasks
                            </p>

                            <div className="flex flex-wrap gap-1">
                                {tasks.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`rounded-lg px-3 py-1.5 text-xs ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : link.url
                                                  ? 'text-slate-600 hover:bg-slate-100'
                                                  : 'pointer-events-none text-slate-300'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                </section>
            </div>
        </AuthenticatedLayout>
    );
}