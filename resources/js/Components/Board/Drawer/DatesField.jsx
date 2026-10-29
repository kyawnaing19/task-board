import React, { useState } from 'react';
import { errorMessage } from '@/lib/http';
import { formatDate } from '@/lib/dates';
import Section, { EditActions, EditLink } from './Section';

const inputClass = `
    w-full rounded-xl
    border border-slate-200
    bg-white px-3 py-2.5
    text-sm text-slate-800
    shadow-sm
    transition-colors
    focus:border-indigo-400
    focus:outline-none
    focus:ring-4 focus:ring-indigo-50
    disabled:cursor-not-allowed
    disabled:bg-slate-50
    disabled:opacity-60
    [color-scheme:light]
`;

export default function DatesField({
    start,
    end,
    editable,
    saving,
    onSave,
}) {
    const [editing, setEditing] = useState(false);
    const [draftStart, setDraftStart] = useState('');
    const [draftEnd, setDraftEnd] = useState('');
    const [error, setError] = useState(null);

    const open = () => {
        setDraftStart(start ?? '');
        setDraftEnd(end ?? '');
        setError(null);
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        setError(null);
    };

    const commit = async () => {
        if (draftStart && draftEnd && draftEnd < draftStart) {
            setError('The end date cannot be earlier than the start date.');
            return;
        }

        if (
            draftStart === (start ?? '') &&
            draftEnd === (end ?? '')
        ) {
            cancel();
            return;
        }

        try {
            await onSave({
                start_date: draftStart || null,
                end_date: draftEnd || null,
            });

            setEditing(false);
            setError(null);
        } catch (err) {
            setError(
                errorMessage(err, [
                    'end_date',
                    'start_date',
                    'task',
                    'project',
                ]),
            );
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancel();
        }
    };

    return (
    <div className="min-w-0">
        {editing ? (
            <div className="space-y-4">
                <div className="space-y-3">
                    {/* Start date */}
                    <div className="min-w-0">
                        <label
                            htmlFor="task-start-date"
                            className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-slate-600"
                        >
                            <span>Start date</span>

                            {draftStart && (
                                <button
                                    type="button"
                                    onClick={() => setDraftStart('')}
                                    disabled={saving}
                                    className="rounded-md px-1.5 py-0.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                                >
                                    Clear
                                </button>
                            )}
                        </label>

                        <input
                            id="task-start-date"
                            type="date"
                            value={draftStart}
                            max={draftEnd || undefined}
                            disabled={saving}
                            onChange={(e) =>
                                setDraftStart(e.target.value)
                            }
                            onKeyDown={onKeyDown}
                            className={inputClass}
                        />
                    </div>

                    {/* End date */}
                    <div className="min-w-0">
                        <label
                            htmlFor="task-end-date"
                            className="mb-1.5 flex items-center justify-between gap-2 text-xs font-medium text-slate-600"
                        >
                            <span>Due date</span>

                            {draftEnd && (
                                <button
                                    type="button"
                                    onClick={() => setDraftEnd('')}
                                    disabled={saving}
                                    className="rounded-md px-1.5 py-0.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50"
                                >
                                    Clear
                                </button>
                            )}
                        </label>

                        <input
                            id="task-end-date"
                            type="date"
                            value={draftEnd}
                            min={draftStart || undefined}
                            disabled={saving}
                            onChange={(e) =>
                                setDraftEnd(e.target.value)
                            }
                            onKeyDown={onKeyDown}
                            className={inputClass}
                        />
                    </div>
                </div>

                {error && (
                    <p
                        role="alert"
                        className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-600"
                    >
                        {error}
                    </p>
                )}

                <EditActions
                    onCancel={cancel}
                    onSave={commit}
                    saving={saving}
                />
            </div>
        ) : (
            <div className="space-y-3">
                {/* Start date */}
                <div className="flex min-w-0 items-start gap-3 rounded-lg bg-slate-50/80 px-3 py-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.7}
                            stroke="currentColor"
                            className="h-4 w-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 4.5h13.5A1.5 1.5 0 0 1 20.25 6v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Z"
                            />
                        </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">
                            Start date
                        </p>

                        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                            {formatDate(start)}
                        </p>
                    </div>
                </div>

                {/* Due date */}
                <div className="flex min-w-0 items-start gap-3 rounded-lg bg-slate-50/80 px-3 py-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-500">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.7}
                            stroke="currentColor"
                            className="h-4 w-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6.75 3v2.25M17.25 3v2.25M3.75 8.25h16.5M5.25 4.5h13.5A1.5 1.5 0 0 1 20.25 6v13.5a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Z"
                            />
                        </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">
                            Due date
                        </p>

                        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                            {formatDate(end)}
                        </p>
                    </div>
                </div>

                {editable && (
                    <button
                        type="button"
                        onClick={open}
                        disabled={saving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="h-3.5 w-3.5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m16.862 4.487 1.687-1.687a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13l-2.76.92.92-2.76a4.5 4.5 0 0 1 1.13-1.897l8.887-8.976ZM19.5 7.125 16.875 4.5"
                            />
                        </svg>

                        Edit schedule
                    </button>
                )}
            </div>
        )}
    </div>
);
}