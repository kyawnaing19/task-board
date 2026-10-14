// Server ရဲ့ GroupColor enum နဲ့ key တူရမယ်
export const GROUP_COLORS = {
    slate: { pill: 'bg-slate-600 text-slate-50', swatch: 'bg-slate-500' },
    blue: { pill: 'bg-blue-600 text-white', swatch: 'bg-blue-500' },
    amber: { pill: 'bg-amber-500 text-slate-900', swatch: 'bg-amber-400' },
    green: { pill: 'bg-emerald-600 text-white', swatch: 'bg-emerald-500' },
    violet: { pill: 'bg-violet-600 text-white', swatch: 'bg-violet-500' },
    rose: { pill: 'bg-rose-600 text-white', swatch: 'bg-rose-500' },
    teal: { pill: 'bg-teal-600 text-white', swatch: 'bg-teal-500' },
    orange: { pill: 'bg-orange-500 text-white', swatch: 'bg-orange-400' },
};

export const colorOf = (key) => GROUP_COLORS[key] ?? GROUP_COLORS.slate;