import React from 'react';

const TABS = [
    { key: 'board', label: 'Board' },
    { key: 'overview', label: 'Overview' },
];

export default function ProjectTabs({ tab, onChange }) {
    return (
        <div
            role="tablist"
            aria-label="Project views"
            className="mb-6 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1"
        >
            {TABS.map((t) => (
                <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => onChange(t.key)}
                    className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                        tab === t.key
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}