import React, { useRef, useState } from 'react';
import Avatar from '@/Components/Avatar';
import TagChip from '@/Components/TagChip';
import MoveToMenu from './MoveToMenu';
import { parseDate } from '@/lib/dates';

const FLAG_PATH =
    'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9';

const CALENDAR_PATH =
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';

// Normal priority is intentionally hidden.
const PRIORITIES = {
    LOW: {
        label: 'Low',
        icon: 'text-slate-500',
        text: 'text-slate-600',
    },
    HIGH: {
        label: 'High',
        icon: 'text-amber-600',
        text: 'text-amber-700',
    },
    URGENT: {
        label: 'Urgent',
        icon: 'text-rose-600',
        text: 'text-rose-700',
    },
};

const ASSIGNEE_LABELS = {
    inactive: 'inactive',
    non_member: 'no longer a member',
};

const chip =
    'inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs';

const short = (d) =>
    d.toLocaleDateString(undefined, {
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
            ? 'text-rose-700'
            : completed
              ? 'text-emerald-700'
              : 'text-slate-600',
    };
}

const EDGE_SHADOWS = {
    top: 'shadow-[0_-4px_0_0_#6366f1]',
    bottom: 'shadow-[0_4px_0_0_#6366f1]',
};

/**
 * draggable    = can the task be dragged?
 * dragging     = whether this card is currently being dragged
 * dropEdge     = drop indicator ('top' / 'bottom')
 * moveTargets  = available destination groups
 */
export default function TaskCard({
    task,
    onOpen,
    draggable = false,
    dragging = false,
    dropEdge = null,
    onDragStart,
    onDragEnd,
    moveTargets = [],
    onMoveTo,
}) {
    const [menu, setMenu] = useState(null);
    const moveButton = useRef(null);

    const date = dateInfo(task);
    const priority = PRIORITIES[task.priority];
    const shown = task.assignees.slice(0, 3);
    const extra = task.assignees.length - shown.length;
    const canMove = !!onMoveTo && moveTargets.length > 1;

    const open = () => onOpen?.(task);

    return (
        <div
            role="button"
            tabIndex={0}
            data-task-card={task.id}
            title={task.code}
            draggable={draggable}
            onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(task.id));
                onDragStart?.(task);
            }}
            onDragEnd={() => onDragEnd?.()}
            onClick={open}
            onKeyDown={(e) => {
                // Ignore keyboard events originating from child controls.
                if (e.target !== e.currentTarget) return;

                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            }}
            className={`group relative block w-full rounded-xl border bg-white p-3 text-left text-slate-800 shadow-sm outline-none transition duration-150 ${
                dragging
                    ? 'border-indigo-300 opacity-40'
                    : 'border-slate-200'
            } ${
                EDGE_SHADOWS[dropEdge] ?? ''
            } ${
                draggable ? 'cursor-grab active:cursor-grabbing' : ''
            } ${
                onOpen && !dragging
                    ? 'hover:border-indigo-300 hover:shadow-md'
                    : ''
            } focus-visible:ring-2 focus-visible:ring-indigo-500/60`}
        >
            <p
                className={`break-words text-sm font-medium leading-snug text-slate-900 ${
                    canMove ? 'pr-6' : ''
                }`}
            >
                {task.title}
            </p>

            {canMove && (
                <button
                    ref={moveButton}
                    type="button"
                    aria-label={`Move ${task.title} to another group`}
                    aria-haspopup="menu"
                    aria-expanded={!!menu}
                    onClick={(e) => {
                        e.stopPropagation();
                        setMenu(
                            moveButton.current.getBoundingClientRect(),
                        );
                    }}
                    className="absolute right-2 top-2 rounded-md p-1 text-slate-500 opacity-0 transition hover:bg-slate-100 hover:text-slate-900 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                    <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            )}

            {(shown.length > 0 || date || priority) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {shown.length > 0 && (
                        <div className="mr-1 flex -space-x-1.5">
                            {shown.map((a) => (
                                <span
                                    key={a.id}
                                    title={
                                        a.label
                                            ? `${a.name} (${ASSIGNEE_LABELS[a.label]})`
                                            : a.name
                                    }
                                    className={`rounded-full ring-2 ring-white ${
                                        a.label
                                            ? 'opacity-50 grayscale'
                                            : ''
                                    }`}
                                >
                                    <Avatar
                                        name={a.name}
                                        src={a.avatar_url}
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
                                aria-hidden="true"
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
                                fill="currentColor"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
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

            {task.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {task.tags.map((t) => (
                        <TagChip
                            key={t.id}
                            name={t.name}
                            color={t.color}
                            inactive={t.inactive}
                        />
                    ))}
                </div>
            )}

            {menu && (
                <MoveToMenu
                    anchor={menu}
                    groups={moveTargets}
                    currentGroupId={task.group?.id}
                    onSelect={(g) => {
                        setMenu(null);
                        onMoveTo(task, g.id);
                    }}
                    onClose={() => setMenu(null)}
                />
            )}
        </div>
    );
}