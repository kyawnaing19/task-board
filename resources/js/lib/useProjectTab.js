import { useState } from 'react';

// Tab ကို URL (?tab=overview) နဲ့ ချိတ်ထားမယ်။ Board က default
export default function useProjectTab() {
    const initial = new URLSearchParams(window.location.search).get('tab') === 'overview' ? 'overview' : 'board';
    const [tab, setTabState] = useState(initial);

    const setTab = (next) => {
        setTabState(next);

        const url = new URL(window.location.href);
        if (next === 'board') url.searchParams.delete('tab');
        else url.searchParams.set('tab', next);

        window.history.replaceState(window.history.state, '', url);
    };

    return [tab, setTab];
}