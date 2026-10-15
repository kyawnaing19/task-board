import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { colorOf } from '@/lib/groupColors';

const WIDTH = 208;
const VIEWPORT_PADDING = 8;
const MENU_GAP = 4;

export default function MoveToMenu({
    anchor,
    groups,
    currentGroupId,
    onSelect,
    onClose,
}) {
    const ref = useRef(null);

    const getPosition = () => ({
        top: anchor.bottom + MENU_GAP,
        left: Math.max(
            VIEWPORT_PADDING,
            Math.min(
                anchor.right - WIDTH,
                window.innerWidth - WIDTH - VIEWPORT_PADDING,
            ),
        ),
    });

    const [pos, setPos] = useState(getPosition);

    useLayoutEffect(() => {
        const menu = ref.current;

        if (!menu) return;

        const height = menu.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const left = Math.max(
            VIEWPORT_PADDING,
            Math.min(
                anchor.right - WIDTH,
                viewportWidth - WIDTH - VIEWPORT_PADDING,
            ),
        );

        let top = anchor.bottom + MENU_GAP;

        // Open above the button if there is insufficient space below.
        if (top + height > viewportHeight - VIEWPORT_PADDING) {
            top = anchor.top - height - MENU_GAP;
        }

        // Keep the menu inside the viewport.
        top = Math.max(
            VIEWPORT_PADDING,
            Math.min(
                top,
                viewportHeight - height - VIEWPORT_PADDING,
            ),
        );

        setPos({ top, left });
    }, [anchor, groups.length]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };

        const handleViewportChange = () => onClose();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleViewportChange);
        window.addEventListener('scroll', handleViewportChange, true);

        ref.current
            ?.querySelector('button:not(:disabled)')
            ?.focus();

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', handleViewportChange);
            window.removeEventListener('scroll', handleViewportChange, true);
        };
    }, [onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-[55]"
            onClick={(event) => {
                event.stopPropagation();
                onClose();
            }}
        >
            {/* Menu container */}
            <div
                ref={ref}
                role="menu"
                aria-label="Move to"
                style={{
                    position: 'fixed',
                    top: pos.top,
                    left: pos.left,
                    width: WIDTH,
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    borderColor: '#e2e8f0',
                }}
                onClick={(event) => event.stopPropagation()}
                className="
                    fixed overflow-hidden rounded-xl
                    !border !border-solid !border-slate-200
                    !bg-white !text-slate-700
                    py-1.5
                    shadow-lg shadow-slate-900/10
                    ring-1 ring-slate-900/5
                "
            >
                {/* Heading */}
                <p
                    className="
                        !bg-white
                        px-3 pb-1 pt-1.5
                        text-[10px] font-semibold uppercase
                        tracking-wider !text-slate-500
                    "
                >
                    Move to…
                </p>

                {/* Empty state */}
                {groups.length === 0 ? (
                    <p className="!bg-white px-3 py-3 text-sm !text-slate-500">
                        No groups available
                    </p>
                ) : (
                    groups.map((group) => {
                        const current = group.id === currentGroupId;

                        return (
                            <button
                                key={group.id}
                                type="button"
                                role="menuitem"
                                disabled={current}
                                onClick={() => onSelect(group)}
                                style={{
                                    backgroundColor: current
                                        ? '#ffffff'
                                        : '#ffffff',
                                    color: current
                                        ? '#94a3b8'
                                        : '#334155',
                                }}
                                className="
                                    flex w-full items-center gap-2.5
                                    !bg-white
                                    px-3 py-2.5 text-left text-sm
                                    !text-slate-700
                                    transition-colors duration-150
                                    hover:!bg-slate-50
                                    hover:!text-slate-950
                                    focus:!bg-slate-50
                                    focus:outline-none
                                    focus-visible:ring-2
                                    focus-visible:ring-inset
                                    focus-visible:ring-indigo-500
                                    disabled:cursor-default
                                    disabled:!bg-white
                                    disabled:!text-slate-400
                                "
                            >
                                {/* Group color */}
                                <span
                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                                        colorOf(group.color).swatch
                                    }`}
                                />

                                {/* Group name */}
                                <span className="min-w-0 flex-1 truncate font-medium">
                                    {group.name}
                                </span>

                                {/* Current group indicator */}
                                {current && (
                                    <span
                                        className="
                                            ml-auto shrink-0
                                            rounded-md !bg-slate-100
                                            px-1.5 py-0.5
                                            text-[10px] font-medium
                                            !text-slate-500
                                        "
                                    >
                                        Current
                                    </span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>,
        document.body,
    );
}