const xsrfToken = () => {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
};

const baseHeaders = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
};

async function handle(res) {
    if (res.ok) return res.json();

    let body = null;
    try {
        body = await res.json();
    } catch {}

    const error = new Error(body?.message || 'Request failed');
    error.status = res.status;
    error.errors = body?.errors || {};
    throw error;
}

export function getJson(url, signal) {
    return fetch(url, { headers: baseHeaders, credentials: 'same-origin', signal }).then(handle);
}

export function postJson(url, data) {
    return fetch(url, {
        method: 'POST',
        headers: { ...baseHeaders, 'Content-Type': 'application/json', 'X-XSRF-TOKEN': xsrfToken() },
        credentials: 'same-origin',
        body: JSON.stringify(data),
    }).then(handle);
}