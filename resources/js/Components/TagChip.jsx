import React from 'react';
import { tagClass } from '@/lib/tagColors';

export default function TagChip({
    name,
    color,
    inactive = false,
    onRemove,
    className = '',
}) {
    return (
        <span
            title={inactive ? `${name} (archived tag)` : name}
            className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${
                inactive
                    ? 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
                    : tagClass(color)
            } ${className}`}
        >
            <span className="truncate">{name}</span>

            {inactive && (
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-500">
                    inactive
                </span>
            )}

            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${name}`}
                    className="shrink-0 rounded px-0.5 leading-none opacity-70 transition hover:opacity-100"
                >
                    ✕
                </button>
            )}
        </span>
    );
}