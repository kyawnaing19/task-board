import React, { useState } from 'react';
import Avatar from '@/Components/Avatar';
import { formatChange, formatDateTime } from '@/lib/taskFormat';

export default function HistoryTimeline({
    history,
    loading,
    onLoadOlder,
}) {
    const [open, setOpen] = useState(false);

    const activities = history?.data ?? [];
    const hasOlder = Boolean(history?.next_cursor);

    return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {/* Dropdown Header */}
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-5 w-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                        </svg>
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                            Activity History
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                            {activities.length === 0
                                ? 'No activity yet'
                                : `${activities.length} ${
                                      activities.length === 1
                                          ? 'activity'
                                          : 'activities'
                                  }`}
                        </p>
                    </div>
                </div>

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                    }`}
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m6 9 6 6 6-6"
                    />
                </svg>
            </button>

            {/* Dropdown Content */}
            {open && (
                <div className="border-t border-slate-200 px-4 py-4">
                    {activities.length === 0 ? (
                        <p className="py-2 text-sm text-slate-500">
                            No activity yet.
                        </p>
                    ) : (
                        <>
                            <ol className="space-y-5">
                                {activities.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex gap-3"
                                    >
                                        <Avatar
                                            name={item.actor?.name ?? '?'}
                                            src={item.actor?.avatar_url}
                                            className="h-7 w-7 shrink-0 text-xs"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p className="break-words text-sm leading-5 text-slate-700">
                                                <span className="font-semibold text-slate-900">
                                                    {item.actor?.name ??
                                                        'Someone'}
                                                </span>{' '}
                                                {item.summary}
                                            </p>

                                            {item.details?.length > 0 && (
                                                <ul className="mt-2 space-y-1">
                                                    {item.details.map((d) => (
                                                        <li
                                                            key={d.field}
                                                            className="break-words text-xs leading-5 text-slate-500"
                                                        >
                                                            <span className="font-medium text-slate-600">
                                                                {d.label}:
                                                            </span>{' '}
                                                            <span>
                                                                {formatChange(
                                                                    d.field,
                                                                    d.from,
                                                                )}
                                                            </span>
                                                            {' → '}
                                                            <span className="font-medium text-slate-700">
                                                                {formatChange(
                                                                    d.field,
                                                                    d.to,
                                                                )}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            <time
                                                dateTime={item.created_at}
                                                className="mt-1.5 block text-xs text-slate-400"
                                            >
                                                {formatDateTime(
                                                    item.created_at,
                                                )}
                                            </time>
                                        </div>
                                    </li>
                                ))}
                            </ol>

                            {hasOlder && (
                                <button
                                    type="button"
                                    onClick={onLoadOlder}
                                    disabled={loading}
                                    className="mt-5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading
                                        ? 'Loading…'
                                        : 'Load older activity'}
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}