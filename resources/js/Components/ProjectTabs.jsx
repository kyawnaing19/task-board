import React from 'react';

const TABS = [
    { key: 'board', label: 'Board' },
    { key: 'archived', label: 'Archived Tasks' },
    { key: 'overview', label: 'Overview' },
];

export default function ProjectTabs({ tab, onChange }) {
    return (
        <div
            role="tablist"
            aria-label="Project views"
            className="mb-4 inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        >
            {TABS.map((t) => {
                const isActive = tab === t.key;

                return (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        id={`project-tab-${t.key}`}
                        aria-selected={isActive}
                        aria-controls={`project-panel-${t.key}`}
                        onClick={() => onChange(t.key)}
                        className={`
                            rounded-lg px-4 py-2 text-sm font-medium
                            transition-all duration-200
                            focus:outline-none focus-visible:ring-2
                            focus-visible:ring-indigo-500 focus-visible:ring-offset-1
                            ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }
                        `}
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}