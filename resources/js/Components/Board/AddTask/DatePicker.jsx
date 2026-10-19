import React from 'react';
import PropertyDropdown from './PropertyDropdown';

function formatDate(value) {
    if (!value) return '';

    const [year, month, day] = value.split('-');

    if (!year || !month || !day) return value;

    return `${month}/${day}/${year}`;
}

export default function DatePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    open,
    onToggle,
}) {
    const summary = [
        startDate && formatDate(startDate),
        endDate && formatDate(endDate),
    ]
        .filter(Boolean)
        .join(' – ');

    return (
        <PropertyDropdown
            icon="📅"
            label="Dates"
            summary={summary}
            open={open}
            onToggle={onToggle}
            width={320}
        >
            <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                    Set dates
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                    Choose when the task starts and is due.
                </p>
            </div>

            <div className="space-y-4 p-4">
                <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">
                        Start date
                    </span>

                    <input
                        type="date"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={(event) =>
                            onStartDateChange(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </label>

                <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-600">
                        Due date
                    </span>

                    <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(event) =>
                            onEndDateChange(event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </label>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <button
                    type="button"
                    onClick={() => {
                        onStartDateChange('');
                        onEndDateChange('');
                    }}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                    Clear dates
                </button>

                <button
                    type="button"
                    onClick={() => onToggle(false)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                    Done
                </button>
            </div>
        </PropertyDropdown>
    );
}