import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { createPortal } from 'react-dom';

export default function PropertyDropdown({
    icon,
    label,
    summary,
    open,
    onToggle,
    children,
    width = 280,
}) {
    const triggerRef = useRef(null);
    const popoverRef = useRef(null);
    const [position, setPosition] = useState(null);

    const updatePosition = useCallback(() => {
        const trigger = triggerRef.current;

        if (!trigger) return;

        const rect = trigger.getBoundingClientRect();
        const gap = 6;
        const margin = 12;
        const popoverWidth = Math.min(width, window.innerWidth - margin * 2);

        const estimatedHeight =
            popoverRef.current?.getBoundingClientRect().height ?? 300;

        let top = rect.bottom + gap;

        if (
            top + estimatedHeight > window.innerHeight - margin &&
            rect.top > estimatedHeight + gap
        ) {
            top = rect.top - estimatedHeight - gap;
        }

        top = Math.max(
            margin,
            Math.min(top, window.innerHeight - margin - estimatedHeight),
        );

        let left = rect.left;

        left = Math.max(
            margin,
            Math.min(left, window.innerWidth - popoverWidth - margin),
        );

        setPosition({ top, left, width: popoverWidth });
    }, [width]);

    useEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }

        updatePosition();

        const handlePointerDown = (event) => {
            if (
                triggerRef.current?.contains(event.target) ||
                popoverRef.current?.contains(event.target)
            ) {
                return;
            }

            onToggle(false);
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onToggle(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, onToggle, updatePosition]);

    useEffect(() => {
        if (!open || !popoverRef.current) return;

        const observer = new ResizeObserver(updatePosition);
        observer.observe(popoverRef.current);

        return () => observer.disconnect();
    }, [open, updatePosition]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => onToggle(!open)}
                aria-expanded={open}
                className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    open
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
            >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-base">
                    {icon}
                </span>

                <span className="min-w-0 flex-1 font-medium">
                    {label}
                </span>

                <span className="max-w-[55%] truncate text-right text-xs text-slate-500">
                    {summary || 'Add'}
                </span>

                <svg
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        open ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.09 1.032l-4.25 4.51a.75.75 0 01-1.09 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        ref={popoverRef}
                        style={{
                            position: 'fixed',
                            top: position?.top ?? 0,
                            left: position?.left ?? 0,
                            width: position?.width ?? width,
                            visibility: position ? 'visible' : 'hidden',
                        }}
                        className="z-[9999] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
                    >
                        {children}
                    </div>,
                    document.body,
                )}
        </>
    );
}