import React, { useState } from 'react';

import AddTaskPropertyBar from './AddTask/AddTaskPropertyBar';

export default function AddTaskForm({
    group,
    members = [],
    tags = [],
    onCreate,
    onOpenChange,
}) {
    const [title, setTitle] = useState('');
    const [assigneeIds, setAssigneeIds] = useState([]);
    const [tagIds, setTagIds] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [priority, setPriority] = useState('NORMAL');

    const [activePicker, setActivePicker] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const resetForm = () => {
        setTitle('');
        setAssigneeIds([]);
        setTagIds([]);
        setStartDate('');
        setEndDate('');
        setPriority('NORMAL');
        setActivePicker(null);
        setError('');
    };

    const handleCancel = () => {
        if (busy) return;

        resetForm();
        onOpenChange?.(false);
    };

    const handleSubmit = async (event) => {
    event.preventDefault();

    const taskTitle = title.trim();

    if (!taskTitle) {
        setError('Please enter a task name.');
        return;
    }

    if (startDate && endDate && endDate < startDate) {
        setError('The due date cannot be earlier than the start date.');
        return;
    }

    setBusy(true);
    setError('');
    setActivePicker(null);

    try {
        await onCreate({
            title: taskTitle,
            assignee_ids: assigneeIds,
            tag_ids: tagIds,
            start_date: startDate || null,
            end_date: endDate || null,
            priority,
        });

        resetForm();
        onOpenChange?.(false);
    } catch (exception) {
        setError(
            exception?.response?.data?.message ||
                exception?.message ||
                'Unable to create the task.',
        );
    } finally {
        setBusy(false);
    }
};

    return (
        <form
            onSubmit={handleSubmit}
            className="relative w-full overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow focus-within:border-indigo-300 focus-within:shadow-md"
        >
            {/* Task title */}
            <div className="flex items-start gap-3 px-4 py-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-300 text-sm text-slate-500">
                    +
                </span>

                <div className="min-w-0 flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(event) => {
                            setTitle(event.target.value);

                            if (error) setError('');
                        }}
                        placeholder={
                            group?.name
                                ? `Task name in ${group.name}...`
                                : 'Task name...'
                        }
                        autoFocus
                        maxLength={255}
                        disabled={busy}
                        className="w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-0 focus:ring-0 disabled:opacity-60"
                    />

                    {group?.name && (
                        <p className="mt-1 text-xs text-slate-400">
                            Creating task in{' '}
                            <span className="font-medium text-slate-500">
                                {group.name}
                            </span>
                        </p>
                    )}
                </div>
            </div>

            {/* Four separate property rows */}
            <div className="border-t border-slate-100 px-3 py-1">
                <AddTaskPropertyBar
                    members={members}
                    tags={tags}
                    assigneeIds={assigneeIds}
                    onAssigneeChange={setAssigneeIds}
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    priority={priority}
                    onPriorityChange={setPriority}
                    tagIds={tagIds}
                    onTagChange={setTagIds}
                    activePicker={activePicker}
                    onActivePickerChange={setActivePicker}
                />
            </div>

            {/* Validation / server error */}
            {error && (
                <div
                    role="alert"
                    className="mx-4 mb-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                    {error}
                </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
                <span className="text-xs text-slate-400">
                    {title.length}/255
                </span>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={busy}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200/70 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={busy || !title.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {busy && (
                            <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />

                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        )}

                        {busy ? 'Creating...' : 'Create task'}
                    </button>
                </div>
            </div>
        </form>
    );
}