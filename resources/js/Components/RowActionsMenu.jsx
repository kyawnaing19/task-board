import React, {
    useEffect,
    useRef,
    useState,
} from 'react';
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

        const rect =
            buttonRef.current.getBoundingClientRect();

        const menuWidth = 192;
        const gap = 8;

        let left = rect.right - menuWidth;

        // Prevent going outside the viewport horizontally
        left = Math.max(
            8,
            Math.min(
                left,
                window.innerWidth - menuWidth - 8
            )
        );

        setPosition({
            left,
            top: rect.bottom + gap,
        });
    };

    useEffect(() => {
        if (!open) return;

        updatePosition();

        const handleScroll = () => {
            updatePosition();
        };

        const handleResize = () => {
            updatePosition();
        };

        window.addEventListener(
            'scroll',
            handleScroll,
            true
        );

        window.addEventListener(
            'resize',
            handleResize
        );

        return () => {
            window.removeEventListener(
                'scroll',
                handleScroll,
                true
            );

            window.removeEventListener(
                'resize',
                handleResize
            );
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        window.addEventListener(
            'keydown',
            onKeyDown
        );

        return () => {
            window.removeEventListener(
                'keydown',
                onKeyDown
            );
        };
    }, [open]);

    useEffect(() => {
        if (!open || !menuRef.current || !buttonRef.current) {
            return;
        }

        const rect =
            buttonRef.current.getBoundingClientRect();

        const menuRect =
            menuRef.current.getBoundingClientRect();

        const gap = 8;

        let top;

        // Use requested dropUp behavior,
        // but also prevent viewport overflow.
        const shouldDropUp =
            dropUp ||
            (
                rect.bottom + menuRect.height + gap >
                    window.innerHeight &&
                rect.top > menuRect.height + gap
            );

        if (shouldDropUp) {
            top =
                rect.top -
                menuRect.height -
                gap;
        } else {
            top = rect.bottom + gap;
        }

        setPosition((current) => ({
            ...current,
            top,
        }));
    }, [open, dropUp]);

    const toggleMenu = () => {
        setOpen((current) => !current);
    };

    const menu = open && position
        ? createPortal(
              <>
                  {/* Backdrop */}
                  <div
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setOpen(false)}
                  />

                  {/* Dropdown */}
                  <div
                      ref={menuRef}
                      role="menu"
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
                                  onClick={() => {
                                      setOpen(false);
                                      item.onClick();
                                  }}
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
              document.body
          )
        : null;

    return (
        <>
            <div className="relative inline-flex">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={toggleMenu}
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
                    >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>

            {menu}
        </>
    );
}