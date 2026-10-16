import { useState } from 'react';

const TABS = ['board', 'archived', 'overview'];

// Tab ကို URL (?tab=archived / ?tab=overview) နဲ့ ချိတ်ထားမယ်။ Board က default
export default function useProjectTab() {
    const param = new URLSearchParams(window.location.search).get('tab');
    const [tab, setTabState] = useState(TABS.includes(param) ? param : 'board');

    const setTab = (next) => {
        setTabState(next);

        const url = new URL(window.location.href);

        if (next === 'board') url.searchParams.delete('tab');
        else url.searchParams.set('tab', next);

        // Drawer နှစ်ခု တစ်ပြိုင်နက် မပွင့်အောင် tab ပြောင်းတိုင်း ?task= ကို ဖျက်မယ်
        url.searchParams.delete('task');

        window.history.replaceState(window.history.state, '', url);
    };

    return [tab, setTab];
}