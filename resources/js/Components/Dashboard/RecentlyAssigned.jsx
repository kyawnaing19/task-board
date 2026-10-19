import React from 'react';
import { parseDate } from '@/lib/dates';

import DashboardSection from './DashboardSection';
import TaskPreview from './TaskPreview';

function formatAssignedAt(value) {
    const date = parseDate(value);

    if (!date) return 'Assignment time unavailable';

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
            title="Recently Assigned"
            description="Tasks recently assigned to you"
            count={count}
            href={href}
            empty={items.length === 0}
            emptyMessage="No recently assigned tasks."
        >
            {items.map((task) => (
                <div key={task.id}>
                    <TaskPreview task={task} />

                    <p className="px-5 pb-3 text-xs text-slate-400">
                        Assigned {formatAssignedAt(task.assigned_at)}
                    </p>
                </div>
            ))}
        </DashboardSection>
    );
}