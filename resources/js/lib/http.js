const xsrfToken = () => {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
};

const baseHeaders = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
};

const FALLBACK_MESSAGES = {
    401: 'Please sign in again.',
    403: 'You do not have permission to do that.',
    404: 'This item is no longer available.',
    419: 'Your session expired. Reload the page and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
};

async function handle(res) {
    // Successful response
    if (res.ok) {
        if (res.status === 204) return null;
        return res.json();
    }

    // Read error response
    let body = null;

    try {
        body = await res.json();
    } catch {
        // Response is not valid JSON
    }

    const fallback = FALLBACK_MESSAGES[res.status];

    // 404 မှာ framework ရဲ့ "No query results for model..." စာကို မပြဘူး
    const message =
        res.status === 404
            ? fallback
            : body?.message || fallback || 'Request failed';

    const error = new Error(message);

    error.status = res.status;
    error.errors = body?.errors || {};

    throw error;
}

export function getJson(url, signal) {
    return fetch(url, {
        headers: baseHeaders,
        credentials: 'same-origin',
        signal,
    }).then(handle);
}

export function sendJson(method, url, data = {}) {
    return fetch(url, {
        method,
        headers: {
            ...baseHeaders,
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': xsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(data),
    }).then(handle);
}

export const postJson = (url, data) =>
    sendJson('POST', url, data);

export const patchJson = (url, data) =>
    sendJson('PATCH', url, data);

/**
 * Validation error (keys အစဉ်အတိုင်း)
 * → ပထမဆုံး message၊ မရှိရင် ကျန်တာ၊ နောက်ဆုံး err.message
 */
export function errorMessage(err, keys = []) {
    for (const key of keys) {
        const message = err.errors?.[key]?.[0];

        if (message) {
            return message;
        }
    }

    return (
        Object.values(err.errors ?? {}).flat()[0] ||
        err.message ||
        'Something went wrong.'
    );
}