import React, { useState } from 'react';
import { errorMessage } from '@/lib/http';
import Section, { EditActions, EditLink } from './Section';
import RichTextEditor from '@/Components/RichTextEditor';

const MAX = 20000;

export default function DescriptionField({
    value,
    editable,
    saving,
    onSave,
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [error, setError] = useState(null);

    const start = () => {
        setDraft(value ?? '');
        setError(null);
        setEditing(true);
    };

    const cancel = () => {
        setEditing(false);
        setDraft('');
        setError(null);
    };

    const commit = async () => {
        const next = draft.trim();

        // HTML ကို plain text ပြောင်းပြီး စာလုံးရေတွက်မယ်။
        const doc = new DOMParser().parseFromString(
            next,
            'text/html',
        );

        const text = (doc.body.textContent ?? '').trim();

        if (text.length > MAX) {
            setError(
                `Description cannot exceed ${MAX.toLocaleString()} characters.`,
            );
            return;
        }

        // Editor မှာ စာမရှိတော့ရင် null သိမ်းမယ်။
        const description = text ? next : null;

        // မူလ description နဲ့ မပြောင်းလဲရင် save မလုပ်ဘူး။
        if (description === (value ?? '').trim()) {
            cancel();
            return;
        }

        setError(null);

        try {
            const success = await onSave({
                description,
            });

            // Parent က false ပြန်ပေးရင် editing ကို ဆက်ထားမယ်။
            if (success === false) {
                return;
            }

            setEditing(false);
            setDraft('');
        } catch (err) {
            setError(
                errorMessage(err, [
                    'description',
                    'task',
                    'project',
                ]),
            );
        }
    };

    return (
        <Section
            title="Description"
            action={
                editable && !editing ? (
                    <EditLink
                        onClick={start}
                        disabled={saving}
                    />
                ) : null
            }
        >
            {editing ? (
                <div className="space-y-3">
                    <RichTextEditor
                        value={draft}
                        onChange={setDraft}
                        disabled={saving}
                        placeholder="Add a description..."
                        maxLength={MAX}
                    />

                    <div className="flex items-start justify-between gap-3 text-xs">
                        <span
                            role={error ? 'alert' : undefined}
                            className="min-w-0 break-words text-rose-600"
                        >
                            {error}
                        </span>

                        <span className="shrink-0 tabular-nums text-slate-400">
                            {textLength(draft).toLocaleString()}
                            {' / '}
                            {MAX.toLocaleString()}
                        </span>
                    </div>

                    <EditActions
                        onCancel={cancel}
                        onSave={commit}
                        saving={saving}
                    />
                </div>
            ) : value ? (
                <div
                    className="
                        prose prose-sm max-w-none break-words
                        text-slate-600
                        [&_p]:my-2
                        [&_p:first-child]:mt-0
                        [&_p:last-child]:mb-0
                        [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6
                        [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6
                        [&_li]:my-1
                        [&_strong]:font-semibold [&_b]:font-semibold
                        [&_em]:italic [&_i]:italic
                    "
                    dangerouslySetInnerHTML={{
                        __html: value,
                    }}
                />
            ) : (
                <p className="text-sm italic text-slate-400">
                    No description added yet.
                </p>
            )}
        </Section>
    );
}

/**
 * HTML ထဲက မြင်ရတဲ့စာသားရဲ့ အရှည်ကို ရေတွက်မယ်။
 */
function textLength(html) {
    if (!html) {
        return 0;
    }

    const doc = new DOMParser().parseFromString(
        html,
        'text/html',
    );

    return (doc.body.textContent ?? '').trim().length;
}