import React, { useMemo, useState } from 'react';
import PropertyDropdown from './PropertyDropdown';

const TAG_COLOR_CLASSES = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-green-100 text-green-700',
    violet: 'bg-violet-100 text-violet-700',
    rose: 'bg-rose-100 text-rose-700',
    teal: 'bg-teal-100 text-teal-700',
    orange: 'bg-orange-100 text-orange-700',
};

function tagClass(color) {
    return TAG_COLOR_CLASSES[color] || TAG_COLOR_CLASSES.slate;
}

export default function TagPicker({
    tags = [],
    value = [],
    onChange,
    open,
    onToggle,
}) {
    const [search, setSearch] = useState('');

    const selectedTags = tags.filter((tag) =>
        value.includes(Number(tag.id)),
    );

    const filteredTags = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return tags;

        return tags.filter((tag) =>
            String(tag.name || '')
                .toLowerCase()
                .includes(query),
        );
    }, [tags, search]);

    const toggleTag = (id) => {
        const numericId = Number(id);

        onChange(
            value.includes(numericId)
                ? value.filter((item) => item !== numericId)
                : [...value, numericId],
        );
    };

    return (
        <PropertyDropdown
            icon="#"
            label="Tags"
            summary={
                selectedTags.length
                    ? selectedTags.length === 1
                        ? selectedTags[0].name
                        : `${selectedTags.length} tags`
                    : ''
            }
            open={open}
            onToggle={onToggle}
            width={280}
        >
            <div className="border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                    Add tags
                </h3>

                <div className="mt-3">
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search tags..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>
            </div>

            <div className="max-h-60 overflow-y-auto p-2">
                {filteredTags.length ? (
                    filteredTags.map((tag) => {
                        const id = Number(tag.id);
                        const checked = value.includes(id);

                        return (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(id)}
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                            >
                                <span
                                    className={`min-w-0 flex-1 truncate rounded-md px-2.5 py-1 text-xs font-semibold ${tagClass(tag.color)}`}
                                >
                                    {tag.name}
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
                        No tags found.
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