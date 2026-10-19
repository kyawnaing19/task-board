import React from 'react';

function StatCard({ label, value, description, href, icon }) {
    const content = (
        <div className="flex h-full items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                    {label}
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                    {value ?? 0}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                    {description}
                </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                {icon}
            </div>
        </div>
    );

    return href ? (
        <a href={href} className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {content}
        </a>
    ) : (
        content
    );
}

function Icon({ children }) {
    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

export default function DashboardStats({
    projects,
    openTasks,
    dueSoon,
    overdue,
    links,
}) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                label="My Projects"
                value={projects.total}
                description={`${projects.active ?? 0} active projects`}
                href={links.my_projects}
                icon={
                    <Icon>
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M3 9h18M8 4v5" />
                    </Icon>
                }
            />

            <StatCard
                label="Open Tasks"
                value={openTasks.count}
                description="Tasks assigned to you"
                href={links.my_tasks}
                icon={
                    <Icon>
                        <path d="M9 6h11M9 12h11M9 18h11" />
                        <path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2" />
                    </Icon>
                }
            />

            <StatCard
                label="Due Soon"
                value={dueSoon.count}
                description="Upcoming deadlines"
                href={links.my_tasks}
                icon={
                    <Icon>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                    </Icon>
                }
            />

            <StatCard
                label="Overdue"
                value={overdue.count}
                description="Tasks past their due dates"
                href={links.my_tasks}
                icon={
                    <Icon>
                        <path d="M12 3 2.8 20h18.4L12 3Z" />
                        <path d="M12 9v4M12 16.5h.01" />
                    </Icon>
                }
            />
        </div>
    );
}