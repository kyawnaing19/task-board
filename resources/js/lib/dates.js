export const parseDate = (value) => {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const formatDate = (value) => {
    const date = parseDate(value);
    return date ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
};

export const isOverdue = (project) => {
    if (project.status !== 'ACTIVE' ||  project.archived_at ||  !project.due_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parseDate(project.due_date) < today;
};