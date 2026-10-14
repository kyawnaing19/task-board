export const TAG_COLORS = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    violet: 'bg-violet-100 text-violet-700 border-violet-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
};

// Solid colors for the circular color picker
export const TAG_SWATCHES = {
    slate: 'bg-slate-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    green: 'bg-emerald-500',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    teal: 'bg-teal-500',
    orange: 'bg-orange-500',
};

// Return the tag's background, text, and border classes
export const tagClass = (key) =>
    TAG_COLORS[key] ?? TAG_COLORS.slate;