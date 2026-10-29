import React, { useCallback, useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function RichTextEditor({
    value = '',
    onChange,
    disabled = false,
    placeholder = 'Add a description...',
    maxLength = 20000,
}) {
    const [characterCount, setCharacterCount] = useState(() =>
        getTextLength(value),
    );

    // Forces the toolbar to refresh after formatting or selection changes.
    const [, setToolbarVersion] = useState(0);

    const refreshToolbar = useCallback(() => {
        setToolbarVersion((version) => version + 1);
    }, []);

    const updateCharacterCount = useCallback((editor) => {
        setCharacterCount(getTextLength(editor.getText()));
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                blockquote: false,
                codeBlock: false,
                horizontalRule: false,
                link: false,
                underline: false,
            }),
        ],

        content: value || '',

        editable: !disabled,

        editorProps: {
            attributes: {
                class: [
                    'min-h-[150px]',
                    'w-full',
                    'px-4',
                    'py-3',
                    'text-sm',
                    'leading-6',
                    'text-slate-700',
                    'outline-none',
                    'break-words',
                    '[&_p]:my-2',
                    '[&_p:first-child]:mt-0',
                    '[&_p:last-child]:mb-0',
                    '[&_ul]:my-2',
                    '[&_ul]:list-disc',
                    '[&_ul]:pl-6',
                    '[&_ol]:my-2',
                    '[&_ol]:list-decimal',
                    '[&_ol]:pl-6',
                    '[&_li]:my-1',
                    '[&_strong]:font-semibold',
                    '[&_em]:italic',
                    '[&_p]:leading-6',
                ].join(' '),
            },

            // Enforce the character limit for normal text input.
            // Deleting text and replacing selected text are still allowed.
            handleTextInput: (view, from, to, text) => {
                const currentLength = getTextLength(
                    view.state.doc.textContent,
                );

                const selectedLength = getTextLength(
                    view.state.doc.textBetween(from, to, ' '),
                );

                const nextLength =
                    currentLength - selectedLength + getTextLength(text);

                return nextLength > maxLength;
            },

            // Prevent an oversized paste from exceeding the limit.
            handlePaste: (view, event) => {
                const pastedText = event.clipboardData?.getData('text/plain');

                if (pastedText == null) {
                    return false;
                }

                const { from, to } = view.state.selection;

                const currentLength = getTextLength(
                    view.state.doc.textContent,
                );

                const selectedLength = getTextLength(
                    view.state.doc.textBetween(from, to, ' '),
                );

                const available =
                    maxLength - (currentLength - selectedLength);

                if (getTextLength(pastedText) <= available) {
                    return false;
                }

                event.preventDefault();

                const allowedText = Array.from(pastedText)
                    .slice(0, Math.max(0, available))
                    .join('');

                if (allowedText.length > 0 || from !== to) {
                    view.dispatch(
                        view.state.tr.insertText(allowedText, from, to),
                    );
                }

                return true;
            },
        },

        onCreate: ({ editor }) => {
            updateCharacterCount(editor);
            refreshToolbar();
        },

        onUpdate: ({ editor }) => {
            updateCharacterCount(editor);
            refreshToolbar();
            onChange?.(editor.getHTML());
        },

        onSelectionUpdate: refreshToolbar,

        onTransaction: ({ editor, transaction }) => {
            if (transaction.docChanged || transaction.storedMarksSet) {
                updateCharacterCount(editor);
            }

            refreshToolbar();
        },
    });

    useEffect(() => {
        if (!editor) return;

        editor.setEditable(!disabled);
    }, [editor, disabled]);

    // Sync external changes without resetting the editor on every keystroke.
    useEffect(() => {
        if (!editor) return;

        const nextValue = value || '';

        if (editor.getHTML() !== nextValue) {
            editor.commands.setContent(nextValue, {
                emitUpdate: false,
            });

            updateCharacterCount(editor);
            refreshToolbar();
        }
    }, [editor, value, updateCharacterCount, refreshToolbar]);

    if (!editor) {
        return (
            <div className="min-h-[230px] animate-pulse rounded-xl border border-slate-200 bg-slate-50" />
        );
    }

    const isEmpty = editor.isEmpty;
    const isAtLimit = characterCount >= maxLength;

    const toggleBold = () => {
        editor.chain().focus().toggleBold().run();
        refreshToolbar();
    };

    const toggleItalic = () => {
        editor.chain().focus().toggleItalic().run();
        refreshToolbar();
    };

    const toggleBulletList = () => {
        editor.chain().focus().toggleBulletList().run();
        refreshToolbar();
    };

    const toggleOrderedList = () => {
        editor.chain().focus().toggleOrderedList().run();
        refreshToolbar();
    };

    return (
        <div
            className={[
                'overflow-hidden rounded-xl border bg-white transition-all duration-150',
                disabled
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50'
                    : 'border-slate-200 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50/80',
            ].join(' ')}
        >
            {/* Formatting toolbar */}
            <div className="flex min-h-[46px] flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/70 px-2.5 py-2">
                <ToolbarButton
                    label="Paragraph"
                    title="Paragraph"
                    active={editor.isActive('paragraph')}
                    disabled={disabled}
                    onClick={() =>
                        editor.chain().focus().setParagraph().run()
                    }
                >
                    <ParagraphIcon />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Bold"
                    title="Bold (Ctrl+B)"
                    active={editor.isActive('bold')}
                    disabled={disabled}
                    onClick={toggleBold}
                >
                    <BoldIcon />
                </ToolbarButton>

                <ToolbarButton
                    label="Italic"
                    title="Italic (Ctrl+I)"
                    active={editor.isActive('italic')}
                    disabled={disabled}
                    onClick={toggleItalic}
                >
                    <ItalicIcon />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Bullet list"
                    title="Bullet list"
                    active={editor.isActive('bulletList')}
                    disabled={disabled}
                    onClick={toggleBulletList}
                >
                    <BulletListIcon />
                </ToolbarButton>

                <ToolbarButton
                    label="Numbered list"
                    title="Numbered list"
                    active={editor.isActive('orderedList')}
                    disabled={disabled}
                    onClick={toggleOrderedList}
                >
                    <OrderedListIcon />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    label="Undo"
                    title="Undo (Ctrl+Z)"
                    disabled={disabled || !editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <UndoIcon />
                </ToolbarButton>

                <ToolbarButton
                    label="Redo"
                    title="Redo (Ctrl+Shift+Z)"
                    disabled={disabled || !editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <RedoIcon />
                </ToolbarButton>
            </div>

            {/* Editable area */}
            <div
                className={[
                    'relative',
                    disabled ? 'bg-slate-50' : 'bg-white',
                ].join(' ')}
            >
                <EditorContent editor={editor} />

                {isEmpty && (
                    <div className="pointer-events-none absolute left-4 top-3 text-sm text-slate-400">
                        {placeholder}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                        Tip: Select text to format it
                    </span>
                </div>

                <span
                    className={[
                        'text-[11px] tabular-nums transition-colors',
                        isAtLimit
                            ? 'font-semibold text-rose-600'
                            : 'text-slate-400',
                    ].join(' ')}
                    aria-live="polite"
                >
                    {characterCount.toLocaleString()} /{' '}
                    {maxLength.toLocaleString()}
                </span>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Toolbar components                                                         */
/* -------------------------------------------------------------------------- */

function ToolbarButton({
    children,
    label,
    title,
    active = false,
    disabled = false,
    onClick,
}) {
    return (
        <button
            type="button"
            title={title || label}
            aria-label={label}
            aria-pressed={active}
            disabled={disabled}
            onMouseDown={(event) => {
                // Preserve the current editor selection.
                event.preventDefault();
            }}
            onClick={onClick}
            className={[
                'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1',
                active
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-transparent text-slate-500 hover:bg-slate-200/70 hover:text-slate-800',
                disabled ? 'cursor-not-allowed opacity-40' : '',
            ].join(' ')}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return (
        <div
            className="mx-1 h-5 w-px bg-slate-200"
            aria-hidden="true"
        />
    );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getTextLength(text = '') {
    return Array.from(text).length;
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function ParagraphIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
                d="M13 20V4H9a5 5 0 0 0 0 10h4M17 4v16"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function BoldIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
                d="M7 5h6a4 4 0 0 1 0 8H7V5Zm0 8h7a4 4 0 0 1 0 8H7v-8Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ItalicIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
                d="M19 4h-9M14 20H5M15 4 9 20"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
        </svg>
    );
}

function BulletListIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
                d="M9 6h11M9 12h11M9 18h11"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
            <circle cx="4.5" cy="6" r="1" fill="currentColor" />
            <circle cx="4.5" cy="12" r="1" fill="currentColor" />
            <circle cx="4.5" cy="18" r="1" fill="currentColor" />
        </svg>
    );
}

function OrderedListIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
                d="M10 6h10M10 12h10M10 18h10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
            />
            <path
                d="M3.5 5h1v3M3.5 8h2M3.5 11h2l-2 2h2M3.5 16h1.5a1 1 0 0 1 0 2H4m1 0a1 1 0 0 1 0 2H3.5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function UndoIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
                d="M9 14 4 9l5-5M4 9h9a7 7 0 0 1 0 14h-2"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function RedoIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path
                d="m15 14 5-5-5-5m5 5h-9a7 7 0 0 0 0 14h2"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}