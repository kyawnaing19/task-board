import React, { useState } from 'react';
import { errorMessage } from '@/lib/http';
import Section, { EditActions, EditLink } from './Section';

const MAX = 20000;

export default function DescriptionField({
    value,
    editable,
    saving,
    onSave,
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [error, setError] = useState(null);

    const start = () => {
        setDraft(value ?? '');
        setError(null);
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        setError(null);
    };

    const commit = async () => {
        const next = draft.replace(/\r\n?/g, '\n').trim();

        if (next === (value ?? '').trim()) {
            cancel();
            return;
        }

        try {
            await onSave({
                description: next === '' ? null : next,
            });

            setEditing(false);
            setError(null);
        } catch (err) {
            setError(
                errorMessage(err, ['description', 'task', 'project']),
            );
        }
    };

    return (
        <Section
            title="Description"
            action={
                editable && !editing ? (
                    <EditLink onClick={start} disabled={saving} />
                ) : null
            }
        >
            {editing ? (
                <div className="space-y-2">
                    <textarea
                        rows={8}
                        value={draft}
                        maxLength={MAX}
                        disabled={saving}
                        autoFocus
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                e.stopPropagation();
                                cancel();
                            }
                        }}
                        placeholder="Add a description…"
                        className="
                            w-full resize-y rounded-xl
                            border border-slate-200
                            bg-white px-3.5 py-3
                            text-sm leading-6 text-slate-800
                            placeholder:text-slate-400
                            shadow-sm
                            transition-colors
                            focus:border-indigo-400
                            focus:outline-none
                            focus:ring-4 focus:ring-indigo-50
                            disabled:cursor-not-allowed
                            disabled:bg-slate-50
                            disabled:opacity-70
                        "
                    />

                    <div className="flex items-start justify-between gap-3 text-xs">
                        <span
                            role={error ? 'alert' : undefined}
                            className="min-w-0 text-rose-600"
                        >
                            {error}
                        </span>

                        <span className="shrink-0 tabular-nums text-slate-400">
                            {draft.length.toLocaleString()}/
                            {MAX.toLocaleString()}
                        </span>
                    </div>

                    <EditActions
                        onCancel={cancel}
                        onSave={commit}
                        saving={saving}
                    />
                </div>
            ) : value ? (
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {value}
                </p>
            ) : (
                <p className="text-sm italic text-slate-400">
                    No description added yet.
                </p>
            )}
        </Section>
    );
}