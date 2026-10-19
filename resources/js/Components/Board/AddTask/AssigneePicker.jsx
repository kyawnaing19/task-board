import React, { useMemo, useState } from 'react';
import PropertyDropdown from './PropertyDropdown';

function getInitials(name = '') {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function getName(member) {
    return member.name || member.email || `User ${member.id}`;
}

export default function AssigneePicker({
    members = [],
    value = [],
    onChange,
    open,
    onToggle,
}) {
    const [search, setSearch] = useState('');

    const selectedMembers = members.filter((member) =>
        value.includes(Number(member.id)),
    );

    const filteredMembers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return members;

        return members.filter((member) =>
            `${member.name ?? ''} ${member.email ?? ''}`
                .toLowerCase()
                .includes(query),
        );
    }, [members, search]);

    const toggleMember = (id) => {
        const numericId = Number(id);

        onChange(
            value.includes(numericId)
                ? value.filter((item) => item !== numericId)
                : [...value, numericId],
        );
    };

    return (
        <PropertyDropdown
            icon="👤"
            label="Assignee"
            summary={
                selectedMembers.length
                    ? selectedMembers.length === 1
                        ? getName(selectedMembers[0])
                        : `${selectedMembers.length} people`
                    : ''
            }
            open={open}
            onToggle={onToggle}
            width={300}
        >
            <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                    Assign to
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                    Select one or more people.
                </p>

                <div className="relative mt-3">
                    <svg
                        className="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.5 3a5.5 5.5 0 103.47 9.77l3.63 3.63a.75.75 0 101.06-1.06l-3.63-3.63A5.5 5.5 0 008.5 3zM4.5 8.5a4 4 0 118 0 4 4 0 01-8 0z"
                            clipRule="evenodd"
                        />
                    </svg>

                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search people..."
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
                {filteredMembers.length ? (
                    filteredMembers.map((member) => {
                        const id = Number(member.id);
                        const checked = value.includes(id);

                        return (
                            <button
                                key={member.id}
                                type="button"
                                onClick={() => toggleMember(id)}
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                            >
                                {member.avatar_url ? (
                                    <img
                                        src={member.avatar_url}
                                        alt=""
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                                        {getInitials(getName(member))}
                                    </span>
                                )}

                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium text-slate-800">
                                        {getName(member)}
                                    </span>

                                    {member.email && member.name && (
                                        <span className="block truncate text-xs text-slate-500">
                                            {member.email}
                                        </span>
                                    )}
                                </span>

                                <span
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                        checked
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border-slate-300 bg-white'
                                    }`}
                                >
                                    {checked && (
                                        <svg
                                            viewBox="0 0 16 16"
                                            fill="none"
                                            className="h-3 w-3"
                                        >
                                            <path
                                                d="M3 8l3 3 7-7"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    )}
                                </span>
                            </button>
                        );
                    })
                ) : (
                    <p className="px-3 py-8 text-center text-sm text-slate-500">
                        No people found.
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                    Clear
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