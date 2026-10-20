import React from 'react';
import { parseDate } from '@/lib/dates';

import DashboardSection from './DashboardSection';
import TaskPreview from './TaskPreview';

function formatAssignedAt(value) {
    const date = parseDate(value);

    if (!date) return '';

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export default function RecentlyAssigned({
    items = [],
    count = 0,
    href,
}) {
    return (
        <DashboardSection
            title="Recently assigned"
            description="New tasks for you"
            count={count}
            href={href}
            accent="emerald"
            empty={items.length === 0}
            emptyMessage="No recently assigned tasks."
        >
            {items.map((task) => (
                <div key={task.id} className="relative">
                    <TaskPreview task={task} />

                    <p className="pointer-events-none absolute right-4 top-2 text-[10.5px] tabular-nums text-slate-300">
                        {formatAssignedAt(task.assigned_at)}
                    </p>
                </div>
            ))}
        </DashboardSection>
    );
}