import React from 'react';
import { parseDate } from '@/lib/dates';

import DashboardSection from './DashboardSection';
import TaskPreview from './TaskPreview';

function formatUpdatedAt(value) {
    const date = parseDate(value);

    if (!date) return 'Recently updated';

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export default function RecentlyUpdated({ items = [], href }) {
    return (
        <DashboardSection
            title="Recently updated"
            description="Recent activity on your tasks"
            count={items.length}
            href={href}
            accent="violet"
            empty={items.length === 0}
            emptyMessage="No recent task updates."
        >
            {items.map((task) => (
                <div key={task.id} className="relative">
                    <TaskPreview task={task} />

                    <p className="pointer-events-none absolute right-4 top-2 text-[10.5px] tabular-nums text-slate-300">
                        {formatUpdatedAt(task.updated_at)}
                    </p>
                </div>
            ))}
        </DashboardSection>
    );
}