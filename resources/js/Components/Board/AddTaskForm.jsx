import React, { useEffect, useRef, useState } from 'react';
import Avatar from '@/Components/Avatar';

const PRIORITIES = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
];

function Icon({ type }) {
    const common = {
        className: 'h-5 w-5 shrink-0',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
    };

    const paths = {
        person: (
            <>
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
                <circle cx="12" cy="12" r="10" />
            </>
        ),
        calendar: (
            <>
                <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
                <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
            </>
        ),
        flag: (
            <>
                <path d="M5 21V4" />
                <path d="M5 5c5-3 9 3 14 0v10c-5 3-9-3-14 0" />
            </>
        ),
        tag: (
            <>
                <path d="M20.5 13 13 20.5a2 2 0 0 1-2.8 0L3.5 13.8a2 2 0 0 1 0-2.8L11 3.5h7.5V11z" />
                <circle cx="15.5" cy="7.5" r="1" />
            </>
        ),
    };

    return <svg {...common}>{paths[type]}</svg>;
}

function SelectableRow({ icon, label, active, children }) {
    return (
        <div
            className={`rounded-lg px-3 py-2 transition-colors ${
                active ? 'bg-slate-100' : 'hover:bg-slate-50'
            }`}
        >
            <div className="flex min-w-0 items-center gap-3 text-sm text-slate-600">
                <Icon type={icon} />
                <span className="min-w-0 flex-1 break-words">
                    {label}
                </span>
            </div>

            {children && <div className="mt-2 pl-8">{children}</div>}
        </div>
    );
}

const checkboxClass =
    'rounded border-slate-300 text-indigo-600 focus:ring-indigo-500';

const dateInputClass =
    'mt-1 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 [color-scheme:light]';

export default function AddTaskForm({
    group,
    members = [],
    tags = [],
    onCreate,
}) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [assigneeIds, setAssigneeIds] = useState([]);
    const [tagIds, setTagIds] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [priority, setPriority] = useState('NORMAL');
    const [activePanel, setActivePanel] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            inputRef.current?.focus();
        }
    }, [open]);

    const reset = () => {
        setTitle('');
        setAssigneeIds([]);
        setTagIds([]);
        setStartDate('');
        setEndDate('');
        setPriority('NORMAL');
        setActivePanel(null);
        setError(null);
    };

    const close = () => {
        if (busy) return;

        setOpen(false);
        reset();
    };

    const toggleId = (id, values, setter) => {
        setter(
            values.includes(id)
                ? values.filter((item) => item !== id)
                : [...values, id],
        );
    };

    const submit = async () => {
        const value = title.trim();

        if (!value || busy) return;

        if (startDate && endDate && endDate < startDate) {
            setError(
                'The end date cannot be earlier than the start date.',
            );
            setActivePanel('dates');
            return;
        }

        setBusy(true);
        setError(null);

        try {
await onCreate({
    title: value,
    assignee_ids: assigneeIds,
    tag_ids: tagIds,
    start_date: startDate || null,
    end_date: endDate || null,
    priority,
});

setTitle('');
setAssigneeIds([]);
setTagIds([]);
setStartDate('');
setEndDate('');
setPriority('NORMAL');
setActivePanel(null);
setError(null);

inputRef.current?.focus();

            setOpen(false);
            reset();
        } catch (err) {
            setError(
                err?.errors?.title?.[0] ||
                    err?.errors?.group_id?.[0] ||
                    err?.errors?.assignee_ids?.[0] ||
                    err?.errors?.tag_ids?.[0] ||
                    err?.errors?.start_date?.[0] ||
                    err?.errors?.end_date?.[0] ||
                    err?.errors?.priority?.[0] ||
                    err?.message ||
                    'Unable to create task.',
            );
        } finally {
            setBusy(false);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
                <span className="text-xl leading-none">+</span>
                Add Task
            </button>
        );
    }

    const selectedMembers = members.filter((member) =>
        assigneeIds.includes(Number(member.id)),
    );

    const selectedTags = tags.filter((tag) =>
        tagIds.includes(Number(tag.id)),
    );

    const togglePanel = (panel) => {
        setActivePanel((current) =>
            current === panel ? null : panel,
        );
    };

    return (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            {/* Task title */}
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
            >
                <div className="flex items-start gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={title}
                        maxLength={200}
                        disabled={busy}
                        required
                        placeholder="Task Name..."
                        onChange={(event) =>
                            setTitle(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                                event.preventDefault();
                                close();
                            }
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-transparent bg-white px-2 py-2 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-200 focus:ring-2 focus:ring-indigo-50 disabled:opacity-60"
                    />

                    <button
                        type="submit"
                        disabled={busy || !title.trim()}
                        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? 'Saving…' : 'Save ↵'}
                    </button>
                </div>
            </form>

            {/* Group name */}
            <div className="px-2 pb-2 text-sm text-slate-500">
                {group?.name ?? 'List'}
            </div>

            {/* Assignees */}
            <div className="space-y-0.5">
                <SelectableRow
                    icon="person"
                    label={
                        selectedMembers.length
                            ? selectedMembers
                                  .map((member) => member.name)
                                  .join(', ')
                            : 'Add assignee'
                    }
                    active={activePanel === 'assignees'}
                >
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => togglePanel('assignees')}
                        className="mb-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                        {activePanel === 'assignees'
                            ? 'Done'
                            : 'Choose assignees'}
                    </button>

                    {activePanel === 'assignees' && (
                        <div className="max-h-36 space-y-1 overflow-y-auto">
                            {members.length === 0 ? (
                                <p className="py-1 text-xs text-slate-500">
                                    No available project members.
                                </p>
                            ) : (
                                members.map((member) => {
                                    const id = Number(member.id);

                                    return (
                                        <label
                                            key={member.id}
                                            className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={assigneeIds.includes(id)}
                                                disabled={busy}
                                                onChange={() =>
                                                    toggleId(
                                                        id,
                                                        assigneeIds,
                                                        setAssigneeIds,
                                                    )
                                                }
                                                className={checkboxClass}
                                            />

                                            <Avatar
                                                name={member.name}
                                                src={member.avatar_url}
                                                className="h-6 w-6 text-[9px]"
                                            />

                                            <span className="min-w-0 flex-1 truncate">
                                                {member.name}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    )}
                </SelectableRow>

                {/* Dates */}
                <SelectableRow
                    icon="calendar"
                    label={
                        startDate || endDate
                            ? `${startDate || 'No start date'} → ${
                                  endDate || 'No end date'
                              }`
                            : 'Add dates'
                    }
                    active={activePanel === 'dates'}
                >
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => togglePanel('dates')}
                        className="mb-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                        {activePanel === 'dates'
                            ? 'Done'
                            : 'Set dates'}
                    </button>

                    {activePanel === 'dates' && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="min-w-0 text-xs text-slate-500">
                                Start date

                                <input
                                    type="date"
                                    value={startDate}
                                    max={endDate || undefined}
                                    disabled={busy}
                                    onChange={(event) =>
                                        setStartDate(event.target.value)
                                    }
                                    className={dateInputClass}
                                />
                            </label>

                            <label className="min-w-0 text-xs text-slate-500">
                                End date

                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate || undefined}
                                    disabled={busy}
                                    onChange={(event) =>
                                        setEndDate(event.target.value)
                                    }
                                    className={dateInputClass}
                                />
                            </label>
                        </div>
                    )}
                </SelectableRow>

                {/* Priority */}
                <SelectableRow
                    icon="flag"
                    label={
                        priority === 'NORMAL'
                            ? 'Add priority'
                            : `Priority: ${
                                  PRIORITIES.find(
                                      (item) =>
                                          item.value === priority,
                                  )?.label ?? 'Normal'
                              }`
                    }
                    active={activePanel === 'priority'}
                >
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => togglePanel('priority')}
                        className="mb-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                        {activePanel === 'priority'
                            ? 'Close'
                            : 'Choose priority'}
                    </button>

                    {activePanel === 'priority' && (
                        <select
                            aria-label="Task priority"
                            value={priority}
                            disabled={busy}
                            onChange={(event) =>
                                setPriority(event.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            {PRIORITIES.map((item) => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                >
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    )}
                </SelectableRow>

                {/* Tags */}
                <SelectableRow
                    icon="tag"
                    label={
                        selectedTags.length
                            ? selectedTags
                                  .map((tag) => tag.name)
                                  .join(', ')
                            : 'Add tag'
                    }
                    active={activePanel === 'tags'}
                >
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => togglePanel('tags')}
                        className="mb-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                        {activePanel === 'tags'
                            ? 'Done'
                            : 'Choose tags'}
                    </button>

                    {activePanel === 'tags' && (
                        <div className="max-h-36 space-y-1 overflow-y-auto">
                            {tags.length === 0 ? (
                                <p className="py-1 text-xs text-slate-500">
                                    No available tags.
                                </p>
                            ) : (
                                tags.map((tag) => {
                                    const id = Number(tag.id);

                                    return (
                                        <label
                                            key={tag.id}
                                            className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={tagIds.includes(id)}
                                                disabled={busy}
                                                onChange={() =>
                                                    toggleId(
                                                        id,
                                                        tagIds,
                                                        setTagIds,
                                                    )
                                                }
                                                className={checkboxClass}
                                            />

                                            <span className="min-w-0 flex-1">
                                                {tag.name}
                                            </span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    )}
                </SelectableRow>
            </div>

            {/* Validation error */}
            {error && (
                <p
                    role="alert"
                    className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-600"
                >
                    {error}
                </p>
            )}

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between gap-2 px-2 pb-1">
                <span className="text-[10px] text-slate-400">
                    Enter to save · Esc to close
                </span>

                <button
                    type="button"
                    onClick={close}
                    disabled={busy}
                    className="rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}