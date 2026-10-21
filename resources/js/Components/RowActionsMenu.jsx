import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function RowActionsMenu({
    items,
    dropUp = false,
}) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);

    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    const updatePosition = () => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 192;
        const gap = 8;

        const left = Math.max(
            8,
            Math.min(
                rect.right - menuWidth,
                window.innerWidth - menuWidth - 8,
            ),
        );

        setPosition({
            left,
            top: rect.bottom + gap,
        });
    };

    // Update menu position when opened, scrolled, or resized.
    useEffect(() => {
        if (!open) return;

        updatePosition();

        const handleScroll = () => updatePosition();
        const handleResize = () => updatePosition();

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [open]);

    // Close the menu with Escape.
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    // Adjust the menu position after it renders.
    useEffect(() => {
        if (!open || !menuRef.current || !buttonRef.current) {
            return;
        }

        const buttonRect = buttonRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        const gap = 8;

        const shouldDropUp =
            dropUp ||
            (
                buttonRect.bottom + menuRect.height + gap >
                    window.innerHeight &&
                buttonRect.top > menuRect.height + gap
            );

        let top = shouldDropUp
            ? buttonRect.top - menuRect.height - gap
            : buttonRect.bottom + gap;

        // Keep the dropdown within the viewport.
        top = Math.max(
            8,
            Math.min(
                top,
                window.innerHeight - menuRect.height - 8,
            ),
        );

        setPosition((current) => ({
            ...current,
            top,
        }));
    }, [open, dropUp, items]);

    const toggleMenu = (event) => {
        event.preventDefault();
        event.stopPropagation();

        setOpen((current) => !current);
    };

    const handleItemClick = (event, item) => {
        event.preventDefault();
        event.stopPropagation();

        setOpen(false);

        if (!item.disabled && item.onClick) {
            item.onClick();
        }
    };

    const menu =
        open && position
            ? createPortal(
                  <>
                      {/* Backdrop */}
                      <div
                          className="fixed inset-0 z-[9998]"
                          onClick={(event) => {
                              event.stopPropagation();
                              setOpen(false);
                          }}
                      />

                      {/* Dropdown */}
                      <div
                          ref={menuRef}
                          role="menu"
                          onClick={(event) => event.stopPropagation()}
                          style={{
                              position: 'fixed',
                              top: position.top,
                              left: position.left,
                              width: 192,
                          }}
                          className="z-[9999] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl shadow-slate-900/20"
                      >
                          {items.map((item) => (
                              <React.Fragment key={item.label}>
                                  {item.separatorBefore && (
                                      <div className="my-1.5 border-t border-slate-200" />
                                  )}

                                  <button
                                      type="button"
                                      role="menuitem"
                                      disabled={item.disabled}
                                      title={item.title}
                                      onClick={(event) =>
                                          handleItemClick(event, item)
                                      }
                                      className={`w-full px-4 py-2 text-left text-sm transition
                                          disabled:cursor-not-allowed
                                          disabled:opacity-40
                                          ${
                                              item.danger
                                                  ? 'text-rose-600 hover:bg-rose-50'
                                                  : 'text-slate-700 hover:bg-slate-100'
                                          }
                                      `}
                                  >
                                      {item.label}
                                  </button>
                              </React.Fragment>
                          ))}
                      </div>
                  </>,
                  document.body,
              )
            : null;

    return (
        <>
            {/* Three-dots button: render only once */}
            <div className="relative inline-flex">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={toggleMenu}
                    onMouseDown={(event) => event.stopPropagation()}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-label="Row actions"
                    className={`rounded-lg p-1.5 transition
                        ${
                            open
                                ? 'bg-slate-100 text-slate-700'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                        }
                    `}
                >
                    <svg
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>

            {menu}
        </>
    );
}