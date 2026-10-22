import React, { useMemo, useState } from 'react';
import TagChip from '@/Components/TagChip';
import { errorMessage } from '@/lib/http';
import Section from './Section';

/**
 * tags       = current task tags (including archived tags, marked inactive)
 * candidates = active tags (null = not loaded yet).
 * Archived tags cannot be selected again.
 */
export default function TagsField({
    tags,
    candidates,
    editable,
    saving,
    onAdd,
    onRemove,
}) {
    const [error, setError] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [search, setSearch] = useState('');

    const current = new Set(tags.map((tag) => tag.id));
    const addable = (candidates ?? []).filter(
        (candidate) => !current.has(candidate.id),
    );
    const hasStale = tags.some((tag) => tag.inactive);

    const filteredAddable = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return addable;

        return addable.filter((tag) =>
            tag.name.toLowerCase().includes(query),
        );
    }, [addable, search]);

    const run = async (fn) => {
        setError(null);

        try {
            await fn();
        } catch (err) {
            setError(errorMessage(err, ['tag_ids', 'task', 'project']));
        }
    };

    const addTag = (tag) => {
        if (saving || current.has(tag.id)) return;

        run(() => onAdd(Number(tag.id)));
        // Keep the dropdown open so multiple tags can be added in sequence.
    };

    return (
        <Section title="Tags">
            {tags.length === 0 ? (
                <p className="text-sm text-slate-500">No tags</p>
            ) : (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                        <TagChip
                            key={tag.id}
                            name={tag.name}
                            color={tag.color}
                            inactive={tag.inactive}
                            onRemove={
                                editable && !saving
                                    ? () => run(() => onRemove(tag))
                                    : undefined
                            }
                        />
                    ))}
                </div>
            )}

            {hasStale && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                    Archived tags stay on this task until you remove them.
                    They cannot be selected again.
                </p>
            )}

            {editable && (
                <div className="relative mt-3">
                    <button
                        type="button"
                        onClick={() => {
                            setDropdownOpen((open) => !open);
                            setError(null);
                        }}
                        disabled={
                            saving ||
                            candidates === null ||
                            addable.length === 0
                        }
                        aria-expanded={dropdownOpen}
                        aria-haspopup="listbox"
                        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-800 shadow-sm transition hover:bg-slate-50 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-70"
                    >
                        <span>
                            {candidates === null
                                ? 'Loading tags…'
                                : addable.length === 0
                                  ? 'No more tags to add'
                                  : 'Add tags…'}
                        </span>
                        <svg
                            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                                dropdownOpen ? 'rotate-180' : ''
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.09 1.03l-4.25 4.5a.75.75 0 01-1.09 0l-4.25-4.5a.75.75 0 01.02-1.05z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>

                    {dropdownOpen && candidates !== null && addable.length > 0 && (
                        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                            <div className="border-b border-slate-100 p-2">
                                <div className="relative">
                                    <svg
                                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.5 3a5.5 5.5 0 103.478 9.76l3.631 3.63a.75.75 0 101.06-1.06l-3.63-3.631A5.5 5.5 0 008.5 3zM4.5 8.5a4 4 0 118 0 4 4 0 01-8 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search tags…"
                                        aria-label="Search tags"
                                        autoFocus
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                                    />
                                </div>
                            </div>

                            <ul
                                role="listbox"
                                aria-label="Available tags"
                                aria-multiselectable="true"
                                className="max-h-52 overflow-y-auto overscroll-contain p-1.5"
                            >
                                {filteredAddable.length === 0 ? (
                                    <li className="px-3 py-5 text-center text-xs text-slate-500">
                                        No matching tags
                                    </li>
                                ) : (
                                    filteredAddable.map((tag) => (
                                        <li key={tag.id}>
                                            <button
                                                type="button"
                                                role="option"
                                                aria-selected={current.has(tag.id)}
                                                disabled={saving}
                                                onClick={() => addTag(tag)}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-300 bg-white">
                                                    {current.has(tag.id) && (
                                                        <svg
                                                            className="h-3 w-3 text-indigo-600"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                            aria-hidden="true"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.704 5.29a1 1 0 010 1.42l-7.2 7.2a1 1 0 01-1.415 0l-3.5-3.5a1 1 0 011.414-1.42l2.793 2.794 6.493-6.494a1 1 0 011.415 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1 truncate text-slate-700">
                                                    {tag.name}
                                                </span>
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>

                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-3 py-2">
                                <span className="text-xs text-slate-500">
                                    {filteredAddable.length} available
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDropdownOpen(false);
                                        setSearch('');
                                    }}
                                    className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                    {error}
                </p>
            )}
        </Section>
    );
}
