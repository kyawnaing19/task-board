import React, { useRef, useState } from 'react';
import Avatar from '@/Components/Avatar';
import MoveToMenu from './MoveToMenu';
import { parseDate } from '@/lib/dates';

const FLAG_PATH =
    'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9';

const CALENDAR_PATH =
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';

const TAG_ICON_PATH =
    'M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3H4a1 1 0 0 0-1 1v5.59a2 2 0 0 0 .59 1.41l9.58 9.59a2 2 0 0 0 2.83 0l4.59-4.59a2 2 0 0 0 0-2.59Z M7 7h.01';

export const TAG_COLORS = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    violet: 'bg-violet-100 text-violet-700 border-violet-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
};

// Chips get a tinted background to match the tag family, plus a leading accent dot/icon.
const PRIORITIES = {
    LOW: {
        label: 'Low',
        chip: 'bg-slate-50 text-slate-600 border-slate-200',
        icon: 'text-slate-400',
        accent: 'bg-slate-300',
    },
    NORMAL: {
        label: 'Normal',
        chip: 'bg-blue-50 text-blue-700 border-blue-200/70',
        icon: 'text-blue-500',
        accent: 'bg-blue-400',
    },
    HIGH: {
        label: 'High',
        chip: 'bg-amber-50 text-amber-800 border-amber-200/70',
        icon: 'text-amber-500',
        accent: 'bg-amber-400',
    },
    URGENT: {
        label: 'Urgent',
        chip: 'bg-rose-50 text-rose-700 border-rose-200/70',
        icon: 'text-rose-500',
        accent: 'bg-rose-500',
    },
};

const ASSIGNEE_LABELS = {
    inactive: 'inactive',
    non_member: 'no longer a member',
};

const chip =
    'inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-lg border bg-white px-2 py-1 text-xs font-medium';

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
            diff === -1 ? 'Yesterday'
            : diff === 0 ? 'Today'
            : diff === 1 ? 'Tomorrow'
            : short(day);
    }

    return {
        label,
        tone: overdue
            ? 'bg-rose-50 text-rose-700 border-rose-200/70'
            : completed
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
              : 'bg-white text-slate-600 border-slate-200',
        overdue,
    };
}

// Inset shadows so the card doesn't visibly grow during drag.
const EDGE_SHADOWS = {
    top: 'shadow-[inset_0_3px_0_0_#6366f1]',
    bottom: 'shadow-[inset_0_-3px_0_0_#6366f1]',
};

const MAX_VISIBLE_TAGS = 3;

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
    const completed = !!task.group?.is_completed;

    const assignees = task.assignees ?? [];
    const tags = task.tags ?? [];

    const shown = assignees.slice(0, 3);
    const extra = assignees.length - shown.length;

    const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
    const hiddenTags = tags.slice(MAX_VISIBLE_TAGS);
    const canMove = !!onMoveTo && moveTargets.length > 1;

    const openTask = () => onOpen?.(task);

    // Left accent stripe: priority color, overridden by overdue.
    const accentClass = date?.overdue
        ? 'bg-rose-500'
        : priority?.accent ?? 'bg-transparent';

    return (
        <div
            role="button"
            tabIndex={0}
            data-task-card={task.id}
            title={task.code}
            draggable={draggable}
            onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(task.id));
                onDragStart?.(task);
            }}
            onDragEnd={() => onDragEnd?.()}
            onClick={openTask}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openTask();
                }
            }}
            className={`group relative block w-full overflow-hidden rounded-xl border bg-white p-3.5 text-left transition-all duration-200 ${
                dragging
                    ? 'border-indigo-300 opacity-40 shadow-none'
                    : 'border-slate-200/90 hover:-translate-y-px hover:border-slate-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_-4px_rgba(15,23,42,0.08)]'
            } ${EDGE_SHADOWS[dropEdge] ?? ''} ${
                draggable ? 'cursor-grab active:cursor-grabbing' : ''
            } focus-visible:ring-2 focus-visible:ring-indigo-500/60 focus-visible:outline-none`}
        >
            {/* Left accent stripe — priority, or overdue */}
            <span
                aria-hidden="true"
                className={`absolute inset-y-3 left-0 w-[3px] rounded-r-full ${accentClass}`}
            />

            {/* Task title */}
            <p
                className={`line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-slate-800 ${
                    canMove ? 'pr-6' : ''
                } ${completed ? 'text-slate-500' : ''}`}
            >
                {task.title}
            </p>

            {/* Move action */}
            {canMove && (
                <button
                    ref={moveButton}
                    type="button"
                    aria-label={`Move ${task.title} to another group`}
                    aria-haspopup="menu"
                    aria-expanded={!!menu}
                    onClick={(event) => {
                        event.stopPropagation();
                        setMenu(moveButton.current.getBoundingClientRect());
                    }}
                    className="absolute right-2.5 top-2.5 rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 focus:opacity-100 focus:outline-none group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            )}

            {/* Assignees, dates and priority */}
            {(shown.length > 0 || date || priority) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    {/* Assignee avatars */}
                    {shown.length > 0 && (
                        <div className="flex shrink-0 items-center -space-x-1.5">
                            {shown.map((assignee) => (
                                <span
                                    key={assignee.id}
                                    title={
                                        assignee.label
                                            ? `${assignee.name} (${ASSIGNEE_LABELS[assignee.label]})`
                                            : assignee.name
                                    }
                                    className={`rounded-full shadow-xs ring-2 ring-white ${
                                        assignee.label ? 'opacity-50 grayscale' : ''
                                    }`}
                                >
                                    <Avatar
                                        name={assignee.name}
                                        src={assignee.avatar_url}
                                        className="h-6 w-6 text-[10px] font-semibold"
                                    />
                                </span>
                            ))}
                            {extra > 0 && (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600 shadow-xs ring-2 ring-white">
                                    +{extra}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Date */}
                    {date && (
                        <span className={`${chip} ${date.tone}`}>
                            <svg
                                className="h-3.5 w-3.5 shrink-0 opacity-80"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d={CALENDAR_PATH} />
                            </svg>
                            <span>{date.label}</span>
                        </span>
                    )}

                    {/* Priority */}
                    {priority && (
                        <span className={`${chip} ${priority.chip}`}>
                            <svg
                                className={`h-3.5 w-3.5 shrink-0 ${priority.icon}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d={FLAG_PATH} />
                            </svg>
                            <span>{priority.label}</span>
                        </span>
                    )}
                </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
                <div className="mt-3 flex min-w-0 items-start gap-2">
                    {/* Ghost tag icon — same size, no filled box */}
                    <span
                        className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center text-slate-400"
                        title="Tags"
                    >
                        <svg
                            className="h-4 w-4 shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.2}
                            aria-hidden="true"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d={TAG_ICON_PATH} />
                        </svg>
                    </span>

                    {/* Tag labels — same height as chips */}
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        {visibleTags.map((tag) => {
                            const colorClass = TAG_COLORS[tag.color] || TAG_COLORS.slate;
                            return (
                                <span
                                    key={tag.id}
                                    title={tag.name}
                                    className={`inline-flex max-w-full items-center rounded-md border px-1.5 py-[3px] text-[11px] font-medium leading-none ${
                                        tag.inactive
                                            ? 'border-slate-200 bg-slate-100 text-slate-400 line-through'
                                            : colorClass
                                    }`}
                                >
                                    <span className="truncate">{tag.name}</span>
                                </span>
                            );
                        })}

                        {hiddenTags.length > 0 && (
                            <span
                                title={hiddenTags.map((tag) => tag.name).join(', ')}
                                aria-label={`${hiddenTags.length} more tags: ${hiddenTags
                                    .map((tag) => tag.name)
                                    .join(', ')}`}
                                className="inline-flex shrink-0 cursor-help items-center rounded-md border border-slate-200 bg-slate-50 px-1.5 py-[3px] text-[11px] font-semibold leading-none text-slate-600"
                            >
                                +{hiddenTags.length}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Move menu */}
            {menu && (
                <MoveToMenu
                    anchor={menu}
                    groups={moveTargets}
                    currentGroupId={task.group?.id}
                    onSelect={(group) => {
                        setMenu(null);
                        onMoveTo(task, group.id);
                    }}
                    onClose={() => setMenu(null)}
                />
            )}
        </div>
    );
}