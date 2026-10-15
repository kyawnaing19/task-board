import React, { useEffect, useRef, useState } from 'react';
import GroupPill from '@/Components/GroupPill';
import TaskCard from './TaskCard';

function AddTask({ onCreate }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            inputRef.current?.focus();
        }
    }, [open]);

    const submit = async () => {
        const value = title.trim();

        if (!value || busy) return;

        setBusy(true);
        setError(null);

        try {
            await onCreate(value);
            setTitle('');
        } catch (err) {
            setError(
                err?.errors?.title?.[0] ||
                    err?.errors?.group_id?.[0] ||
                    err?.errors?.project?.[0] ||
                    err?.message ||
                    'Unable to create task. Please try again.',
            );
        } finally {
            setBusy(false);
            inputRef.current?.focus();
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-blue-600 transition hover:bg-slate-100 hover:text-blue-800 font-medium"
            >
                <span className="text-base leading-none">+</span >
                Add Task
            </button>

        );
    }

    return (
        <div className="mt-2 rounded-xl border border-indigo-200 bg-white p-2 shadow-sm">
            <input
                ref={inputRef}
                type="text"
                value={title}
                maxLength={200}
                disabled={busy}
                placeholder="Task title…"
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        submit();
                    }

                    if (e.key === 'Escape' && !busy) {
                        setOpen(false);
                        setTitle('');
                        setError(null);
                    }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />

            {error && (
                <p className="mt-1.5 text-xs text-rose-600">
                    {error}
                </p>
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">
                    Enter to add · Esc to close
                </span>

                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                            setOpen(false);
                            setTitle('');
                            setError(null);
                        }}
                        className="rounded-lg px-2.5 py-1 text-xs text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={submit}
                        disabled={busy || !title.trim()}
                        className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy ? 'Adding…' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BoardColumn({
    group,
    filtersActive,
    canCreate,
    loadingMore,
    onLoadMore,
    onCreate,
    onOpen,
}) {
    const remaining = Math.max(
        group.total - group.tasks.length,
        0,
    );

    const filtered =
        filtersActive &&
        group.total !== group.unfiltered_total;

    return (
        <section className="w-72 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <header className="mb-3 flex items-center gap-2 px-1">
                <GroupPill
                    name={group.name}
                    color={group.color}
                />

                <span className="text-sm font-medium text-slate-600">
                    {group.total}

                    {filtered && (
                        <span className="text-slate-400">
                            {' '}
                            / {group.unfiltered_total}
                        </span>
                    )}
                </span>
            </header>

            <div className="space-y-2">
                {group.tasks.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-xs text-slate-500">
                        {filtersActive
                            ? 'No matching tasks'
                            : 'No tasks'}
                    </p>
                )}

                {group.tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onOpen={onOpen}
                    />
                ))}
            </div>

            {!group.fully_loaded && (
                <button
                    type="button"
                    onClick={() => onLoadMore(group)}
                    disabled={loadingMore}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loadingMore
                        ? 'Loading…'
                        : `Load more${remaining > 0 ? ` (${remaining})` : ''}`}
                </button>
            )}

            {canCreate && (
                <AddTask
                    onCreate={(title) => onCreate(group, title)}
                />
            )}
        </section>
    );
}