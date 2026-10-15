import React from 'react';
import Avatar from '@/Components/Avatar';
import TagChip from '@/Components/TagChip';
import { parseDate } from '@/lib/dates';

const FLAG_PATH =
    'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9';

const CALENDAR_PATH =
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';

// Normal priority is intentionally hidden.
const PRIORITIES = {
    LOW: {
        label: 'Low',
        icon: 'text-slate-400',
        text: 'text-slate-400',
    },
    HIGH: {
        label: 'High',
        icon: 'text-amber-400',
        text: 'text-amber-300',
    },
    URGENT: {
        label: 'Urgent',
        icon: 'text-rose-400',
        text: 'text-rose-300',
    },
};

const ASSIGNEE_LABELS = {
    inactive: 'inactive',
    non_member: 'no longer a member',
};

const chip =
    'inline-flex items-center gap-1 rounded-md border border-slate-700/70 bg-slate-900 px-1.5 py-0.5 text-xs';

const short = (date) =>
    date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });

function dateInfo(task) {
    const start = parseDate(task.start_date);
    const end = parseDate(task.end_date);

    if (!start && !end) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completed = !!task.group?.is_completed;
    const overdue = !!end && !completed && end < today;

    let label;

    if (start && end && start.getTime() !== end.getTime()) {
        label = `${short(start)} - ${short(end)}`;
    } else {
        const day = end ?? start;
        const diff = Math.round((day - today) / 86400000);

        label =
            diff === -1
                ? 'Yesterday'
                : diff === 0
                  ? 'Today'
                  : diff === 1
                    ? 'Tomorrow'
                    : short(day);
    }

    return {
        label,
        tone: overdue
            ? 'text-rose-400'
            : completed
              ? 'text-emerald-400'
              : 'text-slate-300',
    };
}

export default function TaskCard({ task, onOpen }) {
    const date = dateInfo(task);
    const priority = PRIORITIES[task.priority];

    const assignees = task.assignees ?? [];
    const tags = task.tags ?? [];

    const shown = assignees.slice(0, 3);
    const extra = assignees.length - shown.length;

    const Tag = onOpen ? 'button' : 'div';

    return (
        <Tag
            {...(onOpen
                ? {
                      type: 'button',
                      onClick: () => onOpen(task),
                  }
                : {})}
            title={task.code}
            className={`block w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm ${
                onOpen
                    ? 'transition hover:border-indigo-300 hover:shadow-md'
                    : ''
            }`}
        >
            <p className="break-words text-sm font-medium leading-snug text-slate-900">
                {task.title}
            </p>

            {(shown.length > 0 || date || priority) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {shown.length > 0 && (
                        <div className="mr-1 flex -space-x-1.5">
                            {shown.map((assignee) => (
                                <span
                                    key={assignee.id}
                                    title={
                                        assignee.label
                                            ? `${assignee.name} (${
                                                  ASSIGNEE_LABELS[
                                                      assignee.label
                                                  ] ?? assignee.label
                                              })`
                                            : assignee.name
                                    }
                                    className={`rounded-full ring-2 ring-white ${
                                        assignee.label
                                            ? 'opacity-50 grayscale'
                                            : ''
                                    }`}
                                >
                                    <Avatar
                                        name={assignee.name}
                                        src={assignee.avatar_url}
                                        className="h-6 w-6 text-[10px]"
                                    />
                                </span>
                            ))}

                            {extra > 0 && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600 ring-2 ring-white">
                                    +{extra}
                                </span>
                            )}
                        </div>
                    )}

                    {date && (
                        <span className={`${chip} ${date.tone}`}>
                            <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={CALENDAR_PATH}
                                />
                            </svg>

                            {date.label}
                        </span>
                    )}

                    {priority && (
                        <span className={`${chip} ${priority.text}`}>
                            <svg
                                className={`h-3.5 w-3.5 ${priority.icon}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={FLAG_PATH}
                                />
                            </svg>

                            {priority.label}
                        </span>
                    )}
                </div>
            )}

            {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                        <TagChip
                            key={tag.id}
                            name={tag.name}
                            color={tag.color}
                            inactive={tag.inactive}
                        />
                    ))}
                </div>
            )}
        </Tag>
    );
}