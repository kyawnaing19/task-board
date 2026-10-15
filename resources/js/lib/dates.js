export const parseDate = (value) => {
    if (!value) return null;

    // Handle date-only values: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        const date = new Date(y, m - 1, d);

        return date.getFullYear() === y &&
            date.getMonth() === m - 1 &&
            date.getDate() === d
            ? date
            : null;
    }

    // Handle datetime values returned by Laravel
    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value) => {
    const date = parseDate(value);

    return date
        ? date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
          })
        : '—';
};

export const isOverdue = (project) => {
    if (
        project.status !== 'ACTIVE' ||
        project.archived_at ||
        !project.due_date
    ) {
        return false;
    }

    const dueDate = parseDate(project.due_date);

    if (!dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
};