import React from 'react';
import PropertyDropdown from './PropertyDropdown';

const PRIORITIES = [
    {
        value: 'URGENT',
        label: 'Urgent',
        icon: '🔴',
        className: 'text-red-700',
    },
    {
        value: 'HIGH',
        label: 'High',
        icon: '🟠',
        className: 'text-orange-700',
    },
    {
        value: 'NORMAL',
        label: 'Normal',
        icon: '🔵',
        className: 'text-blue-700',
    },
    {
        value: 'LOW',
        label: 'Low',
        icon: '⚪',
        className: 'text-slate-600',
    },
];

export default function PriorityPicker({
    value = 'NORMAL',
    onChange,
    open,
    onToggle,
}) {
    const selected = PRIORITIES.find(
        (priority) => priority.value === value,
    );

    return (
        <PropertyDropdown
            icon="⚑"
            label="Priority"
            summary={selected?.label || 'Normal'}
            open={open}
            onToggle={onToggle}
            width={240}
        >
            <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                    Set priority
                </h3>
            </div>

            <div className="p-2">
                {PRIORITIES.map((priority) => {
                    const active = priority.value === value;

                    return (
                        <button
                            key={priority.value}
                            type="button"
                            onClick={() => {
                                onChange(priority.value);
                                onToggle(false);
                            }}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                                active
                                    ? 'bg-slate-100'
                                    : 'hover:bg-slate-50'
                            }`}
                        >
                            <span>{priority.icon}</span>

                            <span
                                className={`flex-1 text-sm font-medium ${priority.className}`}
                            >
                                {priority.label}
                            </span>

                            {active && (
                                <svg
                                    className="h-4 w-4 text-indigo-600"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.415 0l-3.25-3.25a1 1 0 011.415-1.42l2.542 2.543 6.543-6.543a1 1 0 011.415 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </button>
                    );
                })}
            </div>
        </PropertyDropdown>
    );
}