import React from 'react';
import Avatar from '@/Components/Avatar';
import { formatChange, formatDateTime } from '@/lib/taskFormat';

export default function HistoryTimeline({ history, loading, onLoadOlder }) {
    if (history.data.length === 0) {
        return (
            <p className="text-sm text-slate-500">
                No activity yet.
            </p>
        );
    }

    return (
        <div>
            <ol className="space-y-4">
                {history.data.map((item) => (
                    <li key={item.id} className="flex gap-3">
                        <Avatar
                            name={item.actor?.name ?? '?'}
                            src={item.actor?.avatar_url}
                            className="h-7 w-7 text-xs"
                        />

                        <div className="min-w-0 flex-1">
                            <p className="break-words text-sm leading-5 text-slate-700">
                                <span className="font-semibold text-slate-900">
                                    {item.actor?.name ?? 'Someone'}
                                </span>{' '}
                                {item.summary}
                            </p>

                            {item.details.length > 0 && (
                                <ul className="mt-1 space-y-1 text-xs">
                                    {item.details.map((d) => (
                                        <li
                                            key={d.field}
                                            className="break-words leading-5 text-slate-500"
                                        >
                                            <span className="font-medium text-slate-600">
                                                {d.label}:
                                            </span>{' '}
                                            <span className="text-slate-500">
                                                {formatChange(d.field, d.from)}
                                            </span>
                                            {' → '}
                                            <span className="font-medium text-slate-700">
                                                {formatChange(d.field, d.to)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <time
                                dateTime={item.created_at}
                                className="mt-1 block text-xs text-slate-400"
                            >
                                {formatDateTime(item.created_at)}
                            </time>
                        </div>
                    </li>
                ))}
            </ol>

            {history.next_cursor && (
                <button
                    type="button"
                    onClick={onLoadOlder}
                    disabled={loading}
                    className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? 'Loading…' : 'Load older activity'}
                </button>
            )}
        </div>
    );
}