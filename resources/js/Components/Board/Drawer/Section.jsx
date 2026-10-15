import React from 'react';

export default function Section({ title, action = null, children }) {
    return (
        <section>
            <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {title}
                </h3>

                {action}
            </div>

            {children}
        </section>
    );
}

export function EditLink({ onClick, disabled }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
            Edit
        </button>
    );
}

export function EditActions({ onCancel, onSave, saving }) {
    return (
        <div className="mt-2 flex justify-end gap-2">
            <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
                Cancel
            </button>

            <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {saving ? 'Saving…' : 'Save'}
            </button>
        </div>
    );
}