import React, { useEffect, useState } from 'react';

/**
 * items: [{ label, onClick, danger?, disabled?, title?, separatorBefore? }]
 */
export default function RowActionsMenu({ items, dropUp = false }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;

        const onKey = (e) => e.key === 'Escape' && setOpen(false);

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <div className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Row actions"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
                <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpen(false)}
                    />

                    <div
                        role="menu"
                        className={`absolute right-0 z-20 w-48 rounded-xl border border-slate-800 bg-slate-900 py-1.5 shadow-xl ${
                            dropUp
                                ? 'bottom-full mb-1'
                                : 'top-full mt-1'
                        }`}
                    >
                        {items.map((item) => (
                            <React.Fragment key={item.label}>
                                {item.separatorBefore && (
                                    <div className="my-1.5 border-t border-slate-800" />
                                )}

                                <button
                                    type="button"
                                    role="menuitem"
                                    disabled={item.disabled}
                                    title={item.title}
                                    onClick={() => {
                                        setOpen(false);
                                        item.onClick();
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                        item.danger
                                            ? 'text-rose-400 hover:bg-rose-500/10'
                                            : 'text-slate-200 hover:bg-slate-800'
                                    }`}
                                >
                                    {item.label}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
