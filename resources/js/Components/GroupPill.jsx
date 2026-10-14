import React from 'react';
import { colorOf } from '@/lib/groupColors';

export default function GroupPill({ name, color, className = '' }) {
    return (
        <span
            className={`inline-flex max-w-full items-center truncate rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                colorOf(color).pill
            } ${className}`}
        >
            {name}
        </span>
    );
}