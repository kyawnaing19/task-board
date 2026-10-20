import React, { useCallback, useEffect, useRef, useState } from 'react';

import { getJson, postJson, errorMessage } from '@/lib/http';
import { formatDateTime } from '@/lib/taskFormat';

import DashboardStats from './DashboardStats';
import DashboardSection from './DashboardSection';
import ProjectPreview from './ProjectPreview';
import TaskPreview from './TaskPreview';
import RecentlyUpdated from './RecentlyUpdated';
import RecentlyAssigned from './RecentlyAssigned';
import QuickLinks from './QuickLinks';
import DashboardSkeleton from './DashboardSkeleton';
import DashboardError from './DashboardError';

export default function EmployeeDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const requestRef = useRef(null);
    const acknowledgedRef = useRef(new Set());

    const loadDashboard = useCallback(
        async (silent = false) => {
            requestRef.current?.abort();

            const controller = new AbortController();
            requestRef.current = controller;

            if (silent && data) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            try {
                const result = await getJson(
                    '/dashboard/data',
                    controller.signal,
                );

                if (!controller.signal.aborted) {
                    setData(result);
                }
            } catch (err) {
                if (
                    err.name !== 'AbortError' &&
                    !controller.signal.aborted
                ) {
                    setError(errorMessage(err));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        },
        [data],
    );

    useEffect(() => {
        loadDashboard();

        return () => {
            requestRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        const asOf = data?.assignments_as_of;

        if (!asOf || acknowledgedRef.current.has(asOf)) {
            return;
        }

        acknowledgedRef.current.add(asOf);

        let cancelled = false;

        async function acknowledgeAssignments() {
            try {
                await postJson('/dashboard/assignments/seen', {
                    assignments_as_of: asOf,
                });
            } catch (err) {
                acknowledgedRef.current.delete(asOf);

                if (!cancelled) {
                    console.error(
                        'Unable to acknowledge dashboard assignments:',
                        err,
                    );
                }
            }
        }

        acknowledgeAssignments();

        return () => {
            cancelled = true;
        };
    }, [data?.assignments_as_of]);

    const projects = data?.my_projects ?? {};
    const openTasks = data?.open_tasks ?? {};
    const dueSoon = data?.due_soon ?? {};
    const overdue = data?.overdue ?? {};
    const updated = data?.recently_updated ?? {};
    const assigned = data?.recently_assigned ?? {};
    const links = data?.links ?? {};

    return (
        <div className="min-h-full bg-slate-50">
            <div className="space-y-4">

                {/* ───── Header strip ───── */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Welcome back
                        </h1>

                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                            {data?.generated_at ? (
                                <>
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    Updated {formatDateTime(data.generated_at)}
                                </>
                            ) : (
                                'Here is an overview of your projects and tasks.'
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadDashboard(Boolean(data))}
                        disabled={loading || refreshing}
                        title="Refresh dashboard"
                        aria-label="Refresh dashboard"
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg
                            className={`h-4 w-4 ${
                                refreshing ? 'animate-spin' : ''
                            }`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M20 7v5h-5M4 17v-5h5M5.5 9a7 7 0 0112-2L20 12M4 12l2.5 5a7 7 0 0012-2"
                            />
                        </svg>
                        {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                </div>

                {error && (
                    <DashboardError
                        message={error}
                        onRetry={() => loadDashboard(Boolean(data))}
                    />
                )}

                {loading && !data ? (
                    <DashboardSkeleton />
                ) : data ? (
                    <>
                        {/* ───── Stats strip ───── */}
                        <DashboardStats
                            projects={projects}
                            openTasks={openTasks}
                            dueSoon={dueSoon}
                            overdue={overdue}
                            links={links}
                        />

                        {/* ───── Main + side rail ───── */}
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            {/* Main column */}
                            <div className="space-y-4 lg:col-span-2">
                                <DashboardSection
                                    title="My projects"
                                    description="Projects you can access"
                                    count={projects.total ?? 0}
                                    href={links.my_projects}
                                    accent="indigo"
                                    empty={(projects.items ?? []).length === 0}
                                    emptyMessage="You don't have any projects yet."
                                >
                                    {(projects.items ?? []).map((project) => (
                                        <ProjectPreview
                                            key={project.id}
                                            project={project}
                                        />
                                    ))}
                                </DashboardSection>

                                <DashboardSection
                                    title="Open tasks"
                                    description="Assigned to you, still open"
                                    count={openTasks.count ?? 0}
                                    href={links.my_tasks}
                                    accent="blue"
                                    empty={(openTasks.items ?? []).length === 0}
                                    emptyMessage="You're all caught up."
                                >
                                    {(openTasks.items ?? []).map((task) => (
                                        <TaskPreview key={task.id} task={task} />
                                    ))}
                                </DashboardSection>

                                <RecentlyUpdated
                                    items={updated.items ?? []}
                                    href={links.my_tasks}
                                />
                            </div>

                            {/* Side rail */}
                            <div className="space-y-4">
                                <DashboardSection
                                    title="Overdue"
                                    description="Needs attention"
                                    count={overdue.count ?? 0}
                                    href={links.my_tasks}
                                    accent="rose"
                                    empty={(overdue.items ?? []).length === 0}
                                    emptyMessage="No overdue tasks."
                                >
                                    {(overdue.items ?? []).map((task) => (
                                        <TaskPreview
                                            key={task.id}
                                            task={task}
                                            overdue
                                        />
                                    ))}
                                </DashboardSection>

                                <DashboardSection
                                    title="Due soon"
                                    description={
                                        dueSoon.from && dueSoon.to
                                            ? `${dueSoon.from} – ${dueSoon.to}`
                                            : 'Upcoming deadlines'
                                    }
                                    count={dueSoon.count ?? 0}
                                    href={links.my_tasks}
                                    accent="amber"
                                    empty={(dueSoon.items ?? []).length === 0}
                                    emptyMessage="No tasks due soon."
                                >
                                    {(dueSoon.items ?? []).map((task) => (
                                        <TaskPreview key={task.id} task={task} />
                                    ))}
                                </DashboardSection>

                                <RecentlyAssigned
                                    items={assigned.items ?? []}
                                    count={assigned.newly_assigned ?? 0}
                                    href={links.my_tasks}
                                />

                                <QuickLinks links={links} />
                            </div>
                        </div>
                    </>
                ) : (
                    !error && (
                        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                            Dashboard data is unavailable.
                        </div>
                    )
                )}
            </div>
        </div>
    );
}