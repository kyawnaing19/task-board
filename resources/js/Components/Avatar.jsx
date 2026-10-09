import React from 'react';

export default function Avatar({ name, src, className = 'h-9 w-9 text-sm' }) {
    if (src) {
        return <img src={src} alt="" className={`${className}shrink-0 rounded-full object-cover`} />;
    }

    return (
        <div
            className={`${className} flex shrink-0 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 font-bold text-indigo-400`}
        >
            {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
    );
}