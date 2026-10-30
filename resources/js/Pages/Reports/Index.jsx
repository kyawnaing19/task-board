import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Head, Link, router } from '@inertiajs/react';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import TagChip from '@/Components/TagChip';

const formatDate = (value) => {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const PRIORITY_STYLES = {
    LOW: 'bg-slate-100 text-slate-600',
    NORMAL: 'bg-indigo-50 text-indigo-700',
    HIGH: 'bg-amber-50 text-amber-700',
    URGENT: 'bg-rose-50 text-rose-700',
};

const PriorityBadge = ({ priority }) => {
    const style =
        PRIORITY_STYLES[(priority || '').toUpperCase()] ??
        'bg-slate-100 text-slate-600';

    return (
        <span
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}
        >
            {(priority || 'NORMAL').toLowerCase()}
        </span>
    );
};

const StatCard = ({ label, value, tone = 'slate' }) => {
    const tones = {
        slate: 'text-slate-900',
        indigo: 'text-indigo-600',
        rose: 'text-rose-600',
        amber: 'text-amber-600',
        emerald: 'text-emerald-600',
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p
                className={`mt-2 text-2xl font-bold ${tones[tone] ?? tones.slate}`}
            >
                {value}
            </p>
        </div>
    );
};

const Rank = ({ index }) => (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
        {index + 1}
    </span>
);

const EmptyRow = ({ colSpan, label }) => (
    <tr>
        <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
            {label}
        </td>
    </tr>
);

export default function Index({
    filter_options = { teams: [], employees: [], tags: [] },
    filters = {},
    summary = {},
    projects = [],
    top_employees = [],
    top_tags = [],
    top_teams = [],
    tasks = { data: [], links: [], current_page: 1, last_page: 1, total: 0, from: null, to: null },
}) {
    const [form, setForm] = useState({
        team_id: filters.team_id ?? '',
        employee_id: filters.employee_id ?? '',
        tag_id: filters.tag_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });

    const isFiltered = Boolean(
        filters.team_id ||
            filters.employee_id ||
            filters.tag_id ||
            filters.date_from ||
            filters.date_to,
    );

    const applyFilter = (patch = {}) => {
        const next = { ...form, ...patch };

        setForm(next);

        router.get(
            route('reports.index'),
            Object.fromEntries(
                Object.entries(next).filter(
                    ([, value]) => value !== '' && value !== null,
                ),
            ),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        const cleared = {
            team_id: '',
            employee_id: '',
            tag_id: '',
            date_from: '',
            date_to: '',
        };

        setForm(cleared);

        router.get(route('reports.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const sectionClass =
        'flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm';
    const thClass =
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
    const tdClass = 'px-4 py-3 align-middle text-sm text-slate-700';

    return (
        <AuthenticatedLayout header="Reports">
            <Head title="Reports" />

            <div className="reports-page w-full min-w-0 space-y-5 sm:space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
                    <StatCard
                        label="Active projects"
                        value={summary.active_projects ?? 0}
                        tone="indigo"
                    />
                    <StatCard
                        label="Open tasks"
                        value={summary.total_open_tasks ?? 0}
                    />
                    <StatCard
                        label="Overdue"
                        value={summary.overdue_tasks ?? 0}
                        tone="rose"
                    />
                    <StatCard
                        label="Due soon"
                        value={summary.due_soon_tasks ?? 0}
                        tone="amber"
                    />
                    <StatCard
                        label="Busy employees"
                        value={`${summary.employees_with_tasks ?? 0}/${summary.total_employees ?? 0}`}
                        tone="emerald"
                    />
                    <StatCard
                        label="Teams / Tags"
                        value={`${summary.total_teams ?? 0} / ${summary.total_tags ?? 0}`}
                    />
                </div>

                {/* Filters bar */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
                        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 xl:flex xl:flex-1 xl:items-end">
                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-slate-500">
                                    Team
                                </span>
                                <select
                                    value={form.team_id}
                                    onChange={(e) =>
                                        applyFilter({ team_id: e.target.value })
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">All teams</option>
                                    {filter_options.teams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-slate-500">
                                    Employee
                                </span>
                                <select
                                    value={form.employee_id}
                                    onChange={(e) =>
                                        applyFilter({
                                            employee_id: e.target.value,
                                        })
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">All employees</option>
                                    {filter_options.employees.map(
                                        (employee) => (
                                            <option
                                                key={employee.id}
                                                value={employee.id}
                                            >
                                                {employee.name}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-slate-500">
                                    Tag
                                </span>
                                <select
                                    value={form.tag_id}
                                    onChange={(e) =>
                                        applyFilter({ tag_id: e.target.value })
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    <option value="">All tags</option>
                                    {filter_options.tags.map((tag) => (
                                        <option key={tag.id} value={tag.id}>
                                            {tag.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-slate-500">
                                    Date from
                                </span>
                                <input
                                    type="date"
                                    value={form.date_from}
                                    onChange={(e) =>
                                        applyFilter({
                                            date_from: e.target.value,
                                        })
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-slate-500">
                                    Date to
                                </span>
                                <input
                                    type="date"
                                    value={form.date_to}
                                    onChange={(e) =>
                                        applyFilter({ date_to: e.target.value })
                                    }
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </label>
                        </div>

                        {isFiltered && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Projects overview */}
                <section className={sectionClass}>
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Projects
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Active projects with their task progress
                            </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {projects.length}{' '}
                            {projects.length === 1 ? 'project' : 'projects'}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-0">
                            <thead className="bg-slate-50/70">
                                <tr>
                                    <th className={thClass}>Project</th>
                                    <th className={thClass}>Open</th>
                                    <th className={thClass}>Overdue</th>
                                    <th className={thClass}>Completed</th>
                                    <th className={thClass}>Progress</th>
                                    <th className={thClass}>Due date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {projects.length === 0 ? (
                                    <EmptyRow
                                        colSpan={6}
                                        label="No active projects match the current filters."
                                    />
                                ) : (
                                    projects.map((project) => (
                                        <tr
                                            key={project.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className={tdClass}>
                                                <div className="font-medium text-slate-900">
                                                    {project.name}
                                                </div>
                                                <div className="mt-0.5 text-xs text-slate-500">
                                                    {project.code}
                                                    {project.type
                                                        ? ` · ${project.type}`
                                                        : ''}
                                                </div>
                                            </td>
                                            <td className={tdClass}>
                                                {project.open_tasks}
                                            </td>
                                            <td className={tdClass}>
                                                <span
                                                    className={
                                                        project.overdue_tasks > 0
                                                            ? 'font-semibold text-rose-600'
                                                            : ''
                                                    }
                                                >
                                                    {project.overdue_tasks}
                                                </span>
                                            </td>
                                            <td className={tdClass}>
                                                {project.completed_tasks}/
                                                {project.total_tasks}
                                            </td>
                                            <td className={tdClass}>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500"
                                                            style={{
                                                                width: `${project.progress?.percent ?? 0}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500">
                                                        {project.progress
                                                            ?.percent ??
                                                            0}
                                                        %
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={tdClass}>
                                                {formatDate(project.due_date)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Task list (filter result) */}
                <section className={sectionClass}>
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Tasks
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Open tasks matching the current filters
                            </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {tasks.total ?? 0}{' '}
                            {tasks.total === 1 ? 'task' : 'tasks'}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-0">
                            <thead className="bg-slate-50/70">
                                <tr>
                                    <th className={thClass}>Task</th>
                                    <th className={thClass}>Project</th>
                                    <th className={thClass}>Assignees</th>
                                    <th className={thClass}>Group</th>
                                    <th className={thClass}>Priority</th>
                                    <th className={thClass}>Tags</th>
                                    <th className={thClass}>End date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(tasks.data ?? []).length === 0 ? (
                                    <EmptyRow
                                        colSpan={7}
                                        label="No tasks match the current filters."
                                    />
                                ) : (
                                    tasks.data.map((task) => (
                                        <tr
                                            key={task.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className={tdClass}>
                                                <div className="font-medium text-slate-900">
                                                    {task.title}
                                                </div>
                                                <div className="mt-0.5 text-xs text-slate-500">
                                                    {task.code}
                                                </div>
                                            </td>
                                            <td className={tdClass}>
                                                <span
                                                    className="text-slate-700"
                                                    title={task.project_name}
                                                >
                                                    {task.project_code}
                                                </span>
                                            </td>
                                            <td className={tdClass}>
                                                <div className="flex min-w-32 flex-wrap items-center gap-1.5">
                                                    {(task.assignees ?? [])
                                                        .length === 0 && '—'}
                                                    {(task.assignees ?? []).map(
                                                        (assignee) => (
                                                            <span
                                                                key={assignee.id}
                                                                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                                                                title={
                                                                    assignee.name
                                                                }
                                                            >
                                                                <Avatar
                                                                    name={
                                                                        assignee.name
                                                                    }
                                                                    size="xs"
                                                                />
                                                                {
                                                                    assignee.name
                                                                }
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                            <td className={tdClass}>
                                                {task.group_name || '—'}
                                            </td>
                                            <td className={tdClass}>
                                                <PriorityBadge
                                                    priority={task.priority}
                                                />
                                            </td>
                                            <td className={tdClass}>
                                                <div className="flex max-w-[12rem] flex-wrap gap-1">
                                                    {(task.tags ?? []).length ===
                                                        0 && '—'}
                                                    {(task.tags ?? []).map(
                                                        (tag) => (
                                                            <TagChip
                                                                key={tag.id}
                                                                name={tag.name}
                                                                color={tag.color}
                                                            />
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                            <td className={tdClass}>
                                                <div className="flex flex-col gap-1">
                                                    {task.is_overdue ? (
                                                        <span className="inline-flex w-fit items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                                                            Overdue
                                                        </span>
                                                    ) : null}
                                                    <span
                                                        className={
                                                            task.is_overdue
                                                                ? 'font-semibold text-rose-600'
                                                                : ''
                                                        }
                                                    >
                                                        {formatDate(
                                                            task.end_date,
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination (Employees page pattern) */}
                    {(tasks.links ?? []).length > 3 && (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 sm:px-5">
                            <p className="text-xs text-slate-500">
                                Showing {tasks.from}
                                {tasks.to && `–${tasks.to}`} of{' '}
                                {tasks.total} tasks
                            </p>

                            <div className="flex flex-wrap gap-1">
                                {tasks.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`rounded-lg px-3 py-1.5 text-xs transition ${
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

                {/* Employee workload */}
                <section className={sectionClass}>
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Employee workload
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Currently assigned open tasks per active
                                employee
                            </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {top_employees.length}{' '}
                            {top_employees.length === 1
                                ? 'employee'
                                : 'employees'}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-0">
                            <thead className="bg-slate-50/70">
                                <tr>
                                    <th className={thClass}>#</th>
                                    <th className={thClass}>Employee</th>
                                    <th className={thClass}>Assigned open</th>
                                    <th className={thClass}>Overdue</th>
                                    <th className={thClass}>Due soon</th>
                                    <th className={thClass}>Projects</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {top_employees.length === 0 ? (
                                    <EmptyRow
                                        colSpan={6}
                                        label="No active employees match the current filters."
                                    />
                                ) : (
                                    top_employees.map((employee, index) => (
                                        <tr
                                            key={employee.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className={tdClass}>
                                                <Rank index={index} />
                                            </td>
                                            <td className={tdClass}>
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        name={employee.name}
                                                        src={employee.avatar_url}
                                                        size="sm"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="truncate font-medium text-slate-900">
                                                            {employee.name}
                                                        </div>
                                                        <div className="truncate text-xs text-slate-500">
                                                            {employee.job_title ||
                                                                '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={tdClass}>
                                                <span className="font-semibold text-slate-900">
                                                    {employee.assigned_open}
                                                </span>
                                            </td>
                                            <td className={tdClass}>
                                                <span
                                                    className={
                                                        employee.overdue > 0
                                                            ? 'font-semibold text-rose-600'
                                                            : ''
                                                    }
                                                >
                                                    {employee.overdue}
                                                </span>
                                            </td>
                                            <td className={tdClass}>
                                                <span
                                                    className={
                                                        employee.due_soon > 0
                                                            ? 'font-semibold text-amber-600'
                                                            : ''
                                                    }
                                                >
                                                    {employee.due_soon}
                                                </span>
                                            </td>
                                            <td className={tdClass}>
                                                <div className="flex max-w-xs flex-wrap gap-1">
                                                    {(
                                                        employee.projects ??
                                                        []
                                                    ).map((project) => (
                                                        <span
                                                            key={project.id}
                                                            className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                                                            title={`${project.code} — ${project.name}`}
                                                        >
                                                            {project.code}
                                                        </span>
                                                    ))}
                                                    {(
                                                        employee.projects ?? []
                                                    ).length === 0 && '—'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Tags and Teams */}
                <div className="grid gap-5 lg:grid-cols-2">
                    <section className={sectionClass}>
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Tags
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Tasks and projects per tag
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {top_tags.length}{' '}
                                {top_tags.length === 1 ? 'tag' : 'tags'}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-0">
                                <thead className="bg-slate-50/70">
                                    <tr>
                                        <th className={thClass}>Tag</th>
                                        <th className={thClass}>Tasks</th>
                                        <th className={thClass}>Overdue</th>
                                        <th className={thClass}>Projects</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {top_tags.length === 0 ? (
                                        <EmptyRow
                                            colSpan={4}
                                            label="No tagged tasks match the current filters."
                                        />
                                    ) : (
                                        top_tags.map((tag) => (
                                            <tr
                                                key={tag.id}
                                                className="transition-colors hover:bg-slate-50/80"
                                            >
                                                <td className={tdClass}>
                                                    <span className="inline-flex items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    tag.color ||
                                                                    '#94a3b8',
                                                            }}
                                                        />
                                                        <span className="font-medium text-slate-900">
                                                            {tag.name}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className={tdClass}>
                                                    {tag.task_count}
                                                </td>
                                                <td className={tdClass}>
                                                    <span
                                                        className={
                                                            tag.overdue_tasks > 0
                                                                ? 'font-semibold text-rose-600'
                                                                : ''
                                                        }
                                                    >
                                                        {tag.overdue_tasks}
                                                    </span>
                                                </td>
                                                <td className={tdClass}>
                                                    <div className="flex max-w-[10rem] flex-wrap gap-1">
                                                        {(
                                                            tag.projects ?? []
                                                        ).map((project) => (
                                                            <span
                                                                key={project.id}
                                                                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                                                                title={`${project.code} — ${project.name}`}
                                                            >
                                                                {project.code}
                                                            </span>
                                                        ))}
                                                        {(
                                                            tag.projects ?? []
                                                        ).length === 0 && '—'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className={sectionClass}>
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Teams
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Tasks and projects per team
                                </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {top_teams.length}{' '}
                                {top_teams.length === 1 ? 'team' : 'teams'}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-0">
                                <thead className="bg-slate-50/70">
                                    <tr>
                                        <th className={thClass}>Team</th>
                                        <th className={thClass}>Tasks</th>
                                        <th className={thClass}>Overdue</th>
                                        <th className={thClass}>Projects</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {top_teams.length === 0 ? (
                                        <EmptyRow
                                            colSpan={4}
                                            label="No linked projects match the current filters."
                                        />
                                    ) : (
                                        top_teams.map((team) => (
                                            <tr
                                                key={team.id}
                                                className="transition-colors hover:bg-slate-50/80"
                                            >
                                                <td className={tdClass}>
                                                    <div className="font-medium text-slate-900">
                                                        {team.name}
                                                    </div>
                                                    {team.description && (
                                                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                                            {team.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className={tdClass}>
                                                    {team.task_count}
                                                </td>
                                                <td className={tdClass}>
                                                    <span
                                                        className={
                                                            team.overdue_tasks > 0
                                                                ? 'font-semibold text-rose-600'
                                                                : ''
                                                        }
                                                    >
                                                        {team.overdue_tasks}
                                                    </span>
                                                </td>
                                                <td className={tdClass}>
                                                    <div className="flex max-w-[10rem] flex-wrap gap-1">
                                                        {(
                                                            team.projects ?? []
                                                        ).map((project) => (
                                                            <span
                                                                key={project.id}
                                                                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                                                                title={`${project.code} — ${project.name}`}
                                                            >
                                                                {project.code}
                                                            </span>
                                                        ))}
                                                        {(
                                                            team.projects ?? []
                                                        ).length === 0 && '—'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}