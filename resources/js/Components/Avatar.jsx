import React, { useEffect, useState } from 'react';

const AVATAR_SIZES = {
    xs: 'h-5 w-5 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-xl',
};

export default function Avatar({
    user = null,
    name,
    src,
    size = 'md',
    className = '',
}) {
    // Support both old and new usage.
    const displayName = name ?? user?.name ?? '';

    const imageSrc =
        src ??
        user?.avatar_url ??
        user?.avatar ??
        null;

    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
    }, [imageSrc]);

    const avatarClass = [
        AVATAR_SIZES[size] ?? AVATAR_SIZES.md,
        className,
        'shrink-0 rounded-full',
    ]
        .filter(Boolean)
        .join(' ');

    if (imageSrc && !imageError) {
        return (
            <img
                src={imageSrc}
                alt={displayName}
                title={displayName}
                className={`${avatarClass} object-cover`}
                onError={() => setImageError(true)}
            />
        );
    }

    return (
        <div
            title={displayName}
            aria-label={displayName || 'Unknown user'}
            className={[
                avatarClass,
                'flex items-center justify-center',
                'border border-indigo-200 bg-indigo-50',
                'font-semibold text-indigo-600',
            ].join(' ')}
        >
            {displayName.charAt(0).toUpperCase() || '?'}
        </div>
    );
}