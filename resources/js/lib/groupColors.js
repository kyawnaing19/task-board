// Server ရဲ့ GroupColor enum နဲ့ key တူရမယ်
export const GROUP_COLORS = {
    slate: {
        pill: 'border-slate-200 bg-slate-100 text-slate-700',
        swatch: 'bg-slate-500',
    },
    blue: {
        pill: 'border-blue-200 bg-blue-50 text-blue-700',
        swatch: 'bg-blue-500',
    },
    amber: {
        pill: 'border-amber-200 bg-amber-50 text-amber-800',
        swatch: 'bg-amber-400',
    },
    green: {
        pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        swatch: 'bg-emerald-500',
    },
    violet: {
        pill: 'border-violet-200 bg-violet-50 text-violet-700',
        swatch: 'bg-violet-500',
    },
    rose: {
        pill: 'border-rose-200 bg-rose-50 text-rose-700',
        swatch: 'bg-rose-500',
    },
    teal: {
        pill: 'border-teal-200 bg-teal-50 text-teal-700',
        swatch: 'bg-teal-500',
    },
    orange: {
        pill: 'border-orange-200 bg-orange-50 text-orange-700',
        swatch: 'bg-orange-400',
    },
};

export const colorOf = (key) => GROUP_COLORS[key] ?? GROUP_COLORS.slate;