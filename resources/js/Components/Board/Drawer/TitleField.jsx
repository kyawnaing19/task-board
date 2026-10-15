import React, { useState } from 'react';
import { errorMessage } from '@/lib/http';
import { EditActions } from './Section';

export default function TitleField({ value, editable, saving, onSave }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [error, setError] = useState(null);

    const start = () => {
        setDraft(value);
        setError(null);
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        setError(null);
    };

    const commit = async () => {
        const next = draft.replace(/\s+/g, ' ').trim();

        if (!next) {
            setError('The title is required.');
            return;
        }

        if (next === value) {
            cancel();
            return;
        }

        try {
            await onSave({ title: next });
            setEditing(false);
            setError(null);
        } catch (err) {
            setError(errorMessage(err, ['title', 'task', 'project']));
        }
    };

    if (!editing) {
        return editable ? (
            <button
                type="button"
                onClick={start}
                title="Click to edit"
                className="-mx-2 block w-[calc(100%+1rem)] break-words rounded-lg px-2 py-1 text-left text-xl font-semibold leading-snug text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
                {value}
            </button>
        ) : (
            <h2 className="break-words text-xl font-semibold leading-snug text-slate-900">
                {value}
            </h2>
        );
    }

    return (
        <div>
            <input
                type="text"
                value={draft}
                maxLength={200}
                disabled={saving}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        commit();
                    }

                    if (e.key === 'Escape') {
                        // Close only the editor, not the drawer.
                        e.preventDefault();
                        e.stopPropagation();
                        cancel();
                    }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-lg font-semibold text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
            />

            <div className="mt-1 flex justify-between text-xs">
                <span className="text-rose-600">{error}</span>
                <span className="text-slate-400">{draft.length}/200</span>
            </div>

            <EditActions
                onCancel={cancel}
                onSave={commit}
                saving={saving}
            />
        </div>
    );
}