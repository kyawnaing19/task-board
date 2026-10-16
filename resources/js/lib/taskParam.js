// ?task=ID ကို URL နဲ့ ချိတ်မယ်။ ?tab= စတဲ့ တခြား param တွေကို မထိဘူး
export const readTaskParam = () => {
    const raw = new URLSearchParams(window.location.search).get('task');

    return raw && /^\d+$/.test(raw) ? Number(raw) : null;
};

export const writeTaskParam = (id) => {
    const url = new URL(window.location.href);

    if (id) url.searchParams.set('task', String(id));
    else url.searchParams.delete('task');

    window.history.replaceState(window.history.state, '', url);
};