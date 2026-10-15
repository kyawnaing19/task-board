import React, { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { getJson, postJson } from '@/lib/http';
import BoardColumn from './BoardColumn';
import BoardFilters from './BoardFilters';

const PAGE_SIZE = 25;

const EMPTY_FILTERS = {
    q: '',
    assignee: '',
    priority: [],
    tag_ids: [],
};

// Server ကို ပို့တဲ့ query။ တန်ဖိုးအလွတ်တွေ မပို့ဘူး
const buildQuery = (filters) => {
    const params = {};

    if (filters.q) params.q = filters.q;
    if (filters.assignee) params.assignee = filters.assignee;
    if (filters.priority.length) params.priority = filters.priority;
    if (filters.tag_ids.length) params.tag_ids = filters.tag_ids;

    return params;
};

// Cursor နဲ့ ယူတဲ့ page အသစ်ကို ရှိပြီးသား task တွေနောက်မှာ ပေါင်းမယ် (ထပ်တာဖယ်)
const mergePage = (group, page) => {
    const seen = new Set(group.tasks.map((task) => task.id));

    return {
        ...page,
        tasks: [
            ...group.tasks,
            ...page.tasks.filter((task) => !seen.has(task.id)),
        ],
    };
};

export default function ProjectBoard({ projectId }) {
    const isAdmin =
        usePage().props.auth?.user?.role === 'SUPER_ADMIN';

    const [options, setOptions] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [loadingGroups, setLoadingGroups] = useState({});
    const [toast, setToast] = useState(null);

    const filterKey = JSON.stringify(filters);
    const filterKeyRef = useRef(filterKey);

    filterKeyRef.current = filterKey;

    const notify = (type, message) => {
        setToast({
            type,
            message,
            id: Date.now(),
        });
    };

    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => setToast(null), 4500);

        return () => clearTimeout(timer);
    }, [toast]);

    // Filter ရွေးစရာများကို တစ်ကြိမ်ယူမယ်
    useEffect(() => {
        const controller = new AbortController();

        getJson(
            route('projects.board.options', projectId),
            controller.signal,
        )
            .then(setOptions)
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    // Options မရရင် board ကို ဆက်အသုံးပြုခွင့်ပေးမယ်
                }
            });

        return () => controller.abort();
    }, [projectId]);

    // Search ကို 300ms debounce လုပ်မယ်
    useEffect(() => {
        const timer = setTimeout(() => {
            const next = searchInput.trim();

            setFilters((current) =>
                current.q === next
                    ? current
                    : { ...current, q: next },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Filter ပြောင်းတိုင်း board ကို ပြန်ယူမယ်
    useEffect(() => {
        const controller = new AbortController();

        setLoading(true);
        setError(null);

        getJson(
            route('projects.board', {
                project: projectId,
                ...buildQuery(filters),
                limit: PAGE_SIZE,
            }),
            controller.signal,
        )
            .then((data) => {
                setBoard(data);
                setLoadingGroups({});
            })
            .catch((err) => {
                if (err.name === 'AbortError') return;

                setError(
                    err.status === 404
                        ? 'This project is not available.'
                        : 'Could not load the board.',
                );
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [projectId, filterKey, reloadKey]);

    const changeFilters = (patch) => {
        setFilters((current) => ({
            ...current,
            ...patch,
        }));
    };

    const clearFilters = () => {
        setSearchInput('');
        setFilters({ ...EMPTY_FILTERS });
    };

    const loadMore = async (group) => {
        const keyAtStart = filterKeyRef.current;

        setLoadingGroups((current) => ({
            ...current,
            [group.id]: true,
        }));

        try {
            const page = await getJson(
                route('projects.board.group', {
                    project: projectId,
                    taskGroup: group.id,
                    ...buildQuery(filters),
                    limit: PAGE_SIZE,
                    after: group.next_cursor,
                }),
            );

            // Filter ပြောင်းသွားရင် အဟောင်း page ကို မထည့်ဘူး
            if (filterKeyRef.current !== keyAtStart) return;

            setBoard((current) => {
                if (!current) return current;

                return {
                    ...current,
                    groups: current.groups.map((item) =>
                        item.id === group.id
                            ? mergePage(item, page)
                            : item,
                    ),
                };
            });
        } catch (err) {
            if (err.name !== 'AbortError') {
                notify('error', 'Could not load more tasks.');
            }
        } finally {
            setLoadingGroups((current) => ({
                ...current,
                [group.id]: false,
            }));
        }
    };

    const createTask = async (group, title) => {
        const { task } = await postJson(
            route('projects.tasks.store', projectId),
            {
                title,
                group_id: group.id,
            },
        );

        // Filter ရှိရင် task က လက်ရှိ filter နဲ့ မကိုက်နိုင်လို့ board ပြန်ယူမယ်
        if (board.filters_active) {
            notify(
                'success',
                `${task.code} created. It may not match the current filters.`,
            );

            setReloadKey((current) => current + 1);
            return;
        }

        setBoard((current) => {
            if (!current) return current;

            return {
                ...current,
                groups: current.groups.map((item) => {
                    if (item.id !== group.id) return item;

                    const next = {
                        ...item,
                        total: item.total + 1,
                        unfiltered_total:
                            item.unfiltered_total + 1,
                    };

                    // Fully loaded group မှာပဲ task ကို ချက်ချင်းထည့်မယ်
                    return item.fully_loaded
                        ? {
                              ...next,
                              tasks: [...item.tasks, task],
                          }
                        : next;
                }),
            };
        });

        notify(
            'success',
            group.fully_loaded
                ? `${task.code} created.`
                : `${task.code} created at the end of the list.`,
        );
    };

    // Initial loading
    if (!board && loading) {
        return (
            <div
                className="flex gap-4 overflow-hidden"
                aria-busy="true"
            >
                {[0, 1, 2].map((index) => (
                    <div
                        key={index}
                        className="w-72 shrink-0 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                        <div className="mb-3 h-6 w-24 rounded-md bg-slate-200" />

                        <div className="space-y-2">
                            <div className="h-16 rounded-xl bg-slate-200/70" />
                            <div className="h-16 rounded-xl bg-slate-200/70" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Board loading failed
    if (!board) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                <p>{error ?? 'Could not load the board.'}</p>

                <button
                    type="button"
                    onClick={() =>
                        setReloadKey((current) => current + 1)
                    }
                    className="mt-2 rounded-lg border border-rose-300 px-3 py-1 text-xs transition hover:bg-rose-100"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            <BoardFilters
                options={options}
                search={searchInput}
                onSearch={setSearchInput}
                filters={filters}
                onChange={changeFilters}
                active={
                    board.filters_active ||
                    searchInput.trim() !== ''
                }
                onClear={clearFilters}
                isAdmin={isAdmin}
            />

            {error && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setReloadKey((current) => current + 1)
                        }
                        className="text-xs underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div
                className={`flex items-start gap-4 overflow-x-auto pb-4 transition-opacity ${
                    loading ? 'opacity-60' : ''
                }`}
                aria-busy={loading}
            >
                {board.groups.map((group) => (
                    <BoardColumn
                        key={group.id}
                        group={group}
                        filtersActive={board.filters_active}
                        canCreate={board.can_create}
                        loadingMore={!!loadingGroups[group.id]}
                        onLoadMore={loadMore}
                        onCreate={createTask}
                    />
                ))}
            </div>

            {toast && (
                <div
                    key={toast.id}
                    role="status"
                    aria-live="polite"
                    className={`fixed bottom-6 right-6 z-40 max-w-sm rounded-xl border px-4 py-3 text-sm shadow-xl ${
                        toast.type === 'error'
                            ? 'border-rose-200 bg-white text-rose-700'
                            : 'border-emerald-200 bg-white text-emerald-700'
                    }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
}