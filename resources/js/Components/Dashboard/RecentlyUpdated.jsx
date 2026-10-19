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
            title="Recently Updated"
            description="Recent activity on your tasks"
            count={items.length}
            href={href}
            empty={items.length === 0}
            emptyMessage="No recent task updates."
        >
            {items.map((task) => (
                <div key={task.id}>
                    <TaskPreview task={task} />

                    <p className="px-5 pb-3 text-xs text-slate-400">
                        Updated {formatUpdatedAt(task.updated_at)}
                    </p>
                </div>
            ))}
        </DashboardSection>
    );
}