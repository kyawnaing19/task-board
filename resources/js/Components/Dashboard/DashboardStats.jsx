import React from 'react';

function Icon({ children }) {
    return (
        <svg
            className="h-[18px] w-[18px]"
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

const TONES = {
    indigo: { tint: 'bg-indigo-50', ink: 'text-indigo-600', bar: 'bg-indigo-500' },
    blue: { tint: 'bg-blue-50', ink: 'text-blue-600', bar: 'bg-blue-500' },
    amber: { tint: 'bg-amber-50', ink: 'text-amber-600', bar: 'bg-amber-500' },
    rose: { tint: 'bg-rose-50', ink: 'text-rose-600', bar: 'bg-rose-500' },
};

function Stat({ label, value, description, href, icon, tone = 'indigo' }) {
    const t = TONES[tone] || TONES.indigo;

    const body = (
        <div className="group flex h-full flex-col justify-between gap-2 px-4 py-3.5 transition hover:bg-slate-50/80">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {label}
                </span>

                <span className={`flex h-7 w-7 items-center justify-center rounded-md ${t.tint} ${t.ink}`}>
                    {icon}
                </span>
            </div>

            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                    {value ?? 0}
                </span>
                <span className="truncate text-xs text-slate-500">
                    {description}
                </span>
            </div>

            <span className={`h-0.5 w-8 rounded-full ${t.bar}`} aria-hidden="true" />
        </div>
    );

    return href ? (
        <a
            href={href}
            className="block flex-1 border-l border-slate-100 first:border-l-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/30"
        >
            {body}
        </a>
    ) : (
        <div className="flex-1 border-l border-slate-100 first:border-l-0">{body}</div>
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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col divide-y divide-slate-100 sm:flex-row sm:divide-x sm:divide-y-0">
                <Stat
                    label="Projects"
                    value={projects.total}
                    description={`${projects.active ?? 0} active`}
                    href={links.my_projects}
                    tone="indigo"
                    icon={
                        <Icon>
                            <rect x="3" y="4" width="18" height="16" rx="2" />
                            <path d="M3 9h18M8 4v5" />
                        </Icon>
                    }
                />

                <Stat
                    label="Open tasks"
                    value={openTasks.count}
                    description="assigned to you"
                    href={links.my_tasks}
                    tone="blue"
                    icon={
                        <Icon>
                            <path d="M9 6h11M9 12h11M9 18h11" />
                            <path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2" />
                        </Icon>
                    }
                />

                <Stat
                    label="Due soon"
                    value={dueSoon.count}
                    description="upcoming"
                    href={links.my_tasks}
                    tone="amber"
                    icon={
                        <Icon>
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 7v5l3 2" />
                        </Icon>
                    }
                />

                <Stat
                    label="Overdue"
                    value={overdue.count}
                    description="needs attention"
                    href={links.my_tasks}
                    tone="rose"
                    icon={
                        <Icon>
                            <path d="M12 3 2.8 20h18.4L12 3Z" />
                            <path d="M12 9v4M12 16.5h.01" />
                        </Icon>
                    }
                />
            </div>
        </div>
    );
}