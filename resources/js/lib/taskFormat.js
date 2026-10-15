import { formatDate } from '@/lib/dates';

export const PRIORITY_LABELS = {
    LOW: 'Low',
    NORMAL: 'Normal',
    HIGH: 'High',
    URGENT: 'Urgent',
};

export const formatDateTime = (value) =>
    value
        ? new Date(value).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : '—';

/** History ရဲ့ from / to တန်ဖိုးကို ဖတ်လို့ရတဲ့ စာသားအဖြစ် */
export function formatChange(field, value) {
    if (value === null || value === undefined || value === '') {
        return 'empty';
    }

    if (field === 'priority') {
        return PRIORITY_LABELS[value] ?? value;
    }

    if (field === 'start_date' || field === 'end_date') {
        return formatDate(value);
    }

    return String(value);
}