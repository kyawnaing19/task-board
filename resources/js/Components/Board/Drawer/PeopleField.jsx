import React, { useState } from 'react';
import Avatar from '@/Components/Avatar';
import { errorMessage } from '@/lib/http';
import Section from './Section';

const LABELS = {
    inactive: 'inactive',
    non_member: 'no longer a member',
};

/**
 * people     = task's current assignees (including inactive / non-members)
 * candidates = active effective project members (null = not loaded yet)
 */
export default function PeopleField({
    people,
    candidates,
    editable,
    saving,
    onAdd,
    onRemove,
}) {
    const [error, setError] = useState(null);

    const assigned = new Set(people.map((p) => p.id));
    const addable = (candidates ?? []).filter((c) => !assigned.has(c.id));
    const hasStale = people.some((p) => p.label);

    const run = async (fn) => {
        setError(null);

        try {
            await fn();
        } catch (err) {
            setError(errorMessage(err, ['assignee_ids', 'task', 'project']));
        }
    };

    return (
        <Section title="Assignees">
            {people.length === 0 ? (
                <p className="text-sm text-slate-500">Unassigned</p>
            ) : (
                <ul className="flex flex-wrap gap-2">
                    {people.map((person) => (
                        <li
                            key={person.id}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-xs text-slate-700 shadow-sm"
                        >
                            <span
                                className={
                                    person.label ? 'opacity-50 grayscale' : ''
                                }
                            >
                                <Avatar
                                    name={person.name}
                                    src={person.avatar_url}
                                    className="h-5 w-5 text-[10px]"
                                />
                            </span>

                            <span
                                className={
                                    person.label
                                        ? 'text-slate-400'
                                        : 'font-medium text-slate-800'
                                }
                            >
                                {person.name}
                            </span>

                            {person.label && (
                                <span className="text-slate-500">
                                    ({LABELS[person.label] ?? person.label})
                                </span>
                            )}

                            {editable && (
                                <button
                                    type="button"
                                    onClick={() => run(() => onRemove(person))}
                                    disabled={saving}
                                    aria-label={`Remove ${person.name}`}
                                    className="rounded px-0.5 leading-none text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    ✕
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {hasStale && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                    Inactive people stay assigned until you remove them. They
                    can only be assigned again once they are active project
                    members.
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
                    aria-label="Add assignee"
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-70"
                >
                    <option value="">
                        {candidates === null
                            ? 'Loading…'
                            : addable.length === 0
                              ? 'No one else to assign'
                              : 'Add assignee…'}
                    </option>

                    {addable.map((member) => (
                        <option key={member.id} value={member.id}>
                            {member.name}
                            {member.job_title
                                ? ` · ${member.job_title}`
                                : ''}
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