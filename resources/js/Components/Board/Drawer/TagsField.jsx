import React, { useState } from 'react';
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

    const current = new Set(tags.map((tag) => tag.id));
    const addable = (candidates ?? []).filter(
        (candidate) => !current.has(candidate.id),
    );
    const hasStale = tags.some((tag) => tag.inactive);

    const run = async (fn) => {
        setError(null);

        try {
            await fn();
        } catch (err) {
            setError(errorMessage(err, ['tag_ids', 'task', 'project']));
        }
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
                <select
                    value=""
                    disabled={
                        saving ||
                        candidates === null ||
                        addable.length === 0
                    }
                    onChange={(e) => {
                        const value = e.target.value;

                        if (value) {
                            run(() => onAdd(Number(value)));
                        }
                    }}
                    aria-label="Add tag"
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-70"
                >
                    <option value="">
                        {candidates === null
                            ? 'Loading…'
                            : addable.length === 0
                              ? 'No more tags to add'
                              : 'Add tag…'}
                    </option>

                    {addable.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                            {tag.name}
                        </option>
                    ))}
                </select>
            )}

            {error && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                    {error}
                </p>
            )}
        </Section>
    );
}