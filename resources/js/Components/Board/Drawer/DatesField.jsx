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
        <Section
            title="Dates"
            action={
                editable && !editing ? (
                    <EditLink onClick={open} disabled={saving} />
                ) : null
            }
        >
            {editing ? (
                <div className="space-y-3">
                    <div className="grid gap-4 sm:grid-cols-2">
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
                                        className="rounded-md px-1.5 py-0.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
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
                                <span>End date</span>

                                {draftEnd && (
                                    <button
                                        type="button"
                                        onClick={() => setDraftEnd('')}
                                        disabled={saving}
                                        className="rounded-md px-1.5 py-0.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
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
                <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                        <dt className="text-xs font-medium text-slate-500">
                            Start date
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-800">
                            {formatDate(start)}
                        </dd>
                    </div>

                    <div className="min-w-0">
                        <dt className="text-xs font-medium text-slate-500">
                            End date
                        </dt>

                        <dd className="mt-1 text-sm font-medium text-slate-800">
                            {formatDate(end)}
                        </dd>
                    </div>
                </dl>
            )}
        </Section>
    );
}