import React, { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { errorMessage, getJson, patchJson, postJson } from '@/lib/http';
import BoardColumn from './BoardColumn';
import BoardFilters from './BoardFilters';
import TaskDrawer from './TaskDrawer';
import { readTaskParam, writeTaskParam } from '@/lib/taskParam';

const PAGE_SIZE = 20;
const EMPTY_FILTERS = {
    q: '',
    assignee: '',
    priority: [],
    tag_ids: [],
};

// Build the server query without empty values.
const buildQuery = (filters) => {
    const params = {};

    if (filters.q) params.q = filters.q;
    if (filters.assignee) params.assignee = filters.assignee;
    if (filters.priority.length) params.priority = filters.priority;
    if (filters.tag_ids.length) params.tag_ids = filters.tag_ids;

    return params;
};

// Merge cursor pagination results without duplicate tasks.
const mergePage = (group, page) => {
    const seen = new Set(group.tasks.map((t) => t.id));

    return {
        ...page,
        tasks: [
            ...group.tasks,
            ...page.tasks.filter((t) => !seen.has(t.id)),
        ],
    };
};

// Read ?task=ID without affecting other URL parameters.
// const readTaskParam = () => {
//     const raw = new URLSearchParams(window.location.search).get('task');

//     return raw && /^\d+$/.test(raw) ? Number(raw) : null;
// };

// const writeTaskParam = (id) => {
//     const url = new URL(window.location.href);

//     if (id) {
//         url.searchParams.set('task', String(id));
//     } else {
//         url.searchParams.delete('task');
//     }

//     window.history.replaceState(window.history.state, '', url);
// };

const groupRef = (g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
    is_completed: g.is_completed,
});

// Insert an item before anchorId.
// If anchorId is null or isn't found, append to the end.
const place = (list, item, anchorId) => {
    const i =
        anchorId === null
            ? -1
            : list.findIndex((t) => t.id === anchorId);

    const at = i === -1 ? list.length : i;

    return [
        ...list.slice(0, at),
        item,
        ...list.slice(at),
    ];
};

const sameOrder = (a, b) =>
    a.length === b.length && a.every((t, i) => t.id === b[i].id);

export default function ProjectBoard({ projectId, active = true, refreshToken = 0 }) {
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
    //const [openTaskId, setOpenTaskId] = useState(readTaskParam);
    const [openTaskId, setOpenTaskId] = useState(() => (active ? readTaskParam() : null));
    const [drag, setDrag] = useState(null);
    const [moving, setMoving] = useState(false);

    const scrollerRef = useRef(null);
    const movingRef = useRef(false);
    // Board tab မဟုတ်တော့ရင် drawer ကို ပိတ်မယ် (Archived tab ကလည်း ?task= ကို သုံးလို့ နှစ်ခု တစ်ပြိုင်နက် မပွင့်ရအောင်)
    useEffect(() => {
        if (!active) setOpenTaskId(null);
    }, [active]);
    const filterKey = JSON.stringify(filters);
    const filterKeyRef = useRef(filterKey);

    filterKeyRef.current = filterKey;

    

    const notify = (type, message) =>
        setToast({
            type,
            message,
            id: Date.now(),
        });

    // Automatically dismiss notifications.
    useEffect(() => {
        if (!toast) return;

        const timer = setTimeout(() => setToast(null), 4500);

        return () => clearTimeout(timer);
    }, [toast]);

    // Load filter options once per project.
    useEffect(() => {
        const controller = new AbortController();

        getJson(
            route('projects.board.options', projectId),
            controller.signal,
        )
            .then(setOptions)
            .catch(() => {});

        return () => controller.abort();
    }, [projectId]);

    // Debounce search input.
    useEffect(() => {
        const timer = setTimeout(() => {
            const next = searchInput.trim();

            setFilters((f) =>
                f.q === next ? f : { ...f, q: next },
            );
        }, 300);

        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch the board whenever the project, filters, or reload key changes.
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
    }, [projectId, filterKey, reloadKey, refreshToken]);

    const changeFilters = (patch) => {
        setFilters((f) => ({ ...f, ...patch }));
    };

    const clearFilters = () => {
        setSearchInput('');
        setFilters(EMPTY_FILTERS);
    };

    // Include pending debounced search input when checking active filters.
    const hasFilters =
        Boolean(board?.filters_active) ||
        searchInput.trim() !== '' ||
        filters.q !== '' ||
        filters.assignee !== '' ||
        filters.priority.length > 0 ||
        filters.tag_ids.length > 0;

    // Load another page of tasks for a group.
    const loadMore = async (group) => {
        const keyAtStart = filterKeyRef.current;

        setLoadingGroups((s) => ({
            ...s,
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

            // Discard stale results if filters changed during the request.
            if (filterKeyRef.current !== keyAtStart) return;

            setBoard((b) => ({
                ...b,
                groups: b.groups.map((g) =>
                    g.id === group.id ? mergePage(g, page) : g,
                ),
            }));
        } catch {
            notify('error', 'Could not load more tasks.');
        } finally {
            setLoadingGroups((s) => ({
                ...s,
                [group.id]: false,
            }));
        }
    };

    // Create a task.
    const createTask = async (group, title) => {
        const { task } = await postJson(
            route('projects.tasks.store', projectId),
            {
                title,
                group_id: group.id,
            },
        );

        // Reload when filters may exclude the new task.
        if (board.filters_active) {
            notify(
                'success',
                `${task.code} created. It may not match the current filters.`,
            );

            setReloadKey((k) => k + 1);
            return;
        }

        setBoard((b) => ({
            ...b,
            groups: b.groups.map((g) => {
                if (g.id !== group.id) return g;

                const next = {
                    ...g,
                    total: g.total + 1,
                    unfiltered_total: g.unfiltered_total + 1,
                };

                // Add directly only when the group is fully loaded.
                return g.fully_loaded
                    ? { ...next, tasks: [...g.tasks, task] }
                    : next;
            }),
        }));

        notify(
            'success',
            group.fully_loaded
                ? `${task.code} created.`
                : `${task.code} created at the end of the list.`,
        );
    };

    // ───────── Drawer ─────────

    const openTask = (task) => {
        setOpenTaskId(task.id);
        writeTaskParam(task.id);
    };

    const closeTask = () => {
        setOpenTaskId(null);
        writeTaskParam(null);
    };

    // Replace a card with the latest server response.
    const replaceCard = (card) =>
        setBoard((b) => ({
            ...b,
            groups: b.groups.map((g) =>
                g.tasks.some((t) => t.id === card.id)
                    ? {
                          ...g,
                          tasks: g.tasks.map((t) =>
                              t.id === card.id ? card : t,
                          ),
                      }
                    : g,
            ),
        }));

    // Remove an archived task from the board.
    const handleArchived = (card) => {
        notify('success', `${card.code} archived.`);

        if (board.filters_active) {
            setReloadKey((k) => k + 1);
            return;
        }

        setBoard((b) => {
            // Find the current group or use the group returned by the server.
            const holder =
                b.groups.find((g) =>
                    g.tasks.some((t) => t.id === card.id),
                )?.id ?? card.group?.id;

            return {
                ...b,
                groups: b.groups.map((g) => {
                    const tasks = g.tasks.filter(
                        (t) => t.id !== card.id,
                    );

                    if (g.id !== holder) {
                        return tasks.length === g.tasks.length
                            ? g
                            : { ...g, tasks };
                    }

                    return {
                        ...g,
                        tasks,
                        total: Math.max(g.total - 1, 0),
                        unfiltered_total: Math.max(
                            g.unfiltered_total - 1,
                            0,
                        ),
                    };
                }),
            };
        });
    };

    // Restore a task to its group.
    const handleRestored = (card) => {
        if (board.filters_active) {
            notify('success', `${card.code} restored.`);
            setReloadKey((k) => k + 1);
            return;
        }

        const target = board.groups.find(
            (g) => g.id === card.group?.id,
        );

        notify(
            'success',
            target && !target.fully_loaded
                ? `${card.code} restored at the end of its group.`
                : `${card.code} restored.`,
        );

        setBoard((b) => ({
            ...b,
            groups: b.groups.map((g) => {
                if (
                    g.id !== card.group?.id ||
                    g.tasks.some((t) => t.id === card.id)
                ) {
                    return g;
                }

                const next = {
                    ...g,
                    total: g.total + 1,
                    unfiltered_total: g.unfiltered_total + 1,
                };

                // Insert the restored task only if the group is fully loaded.
                return g.fully_loaded
                    ? { ...next, tasks: [...g.tasks, card] }
                    : next;
            }),
        }));
    };

    // ───────── Move ─────────

    // Reordering is allowed only when there are no filters
    // and both groups are fully loaded.
    const canPosition = (fromId, toId) => {
        if (!board || hasFilters) return false;

        const from = board.groups.find((g) => g.id === fromId);
        const to = board.groups.find((g) => g.id === toId);

        return !!from?.fully_loaded && !!to?.fully_loaded;
    };

    /**
     * Optimistic task move.
     * If the request fails, restore the affected groups or reload the board.
     *
     * @returns {Promise<boolean>}
     */
    const moveTask = async (
        taskId,
        toGroupId,
        beforeTaskId = null,
        { announce = false } = {},
    ) => {
        if (!board || movingRef.current) return false;

        const dst = board.groups.find((g) => g.id === toGroupId);

        if (!dst) return false;

        // The task may not be present in the currently loaded board.
        const src =
            board.groups.find((g) =>
                g.tasks.some((t) => t.id === taskId),
            ) ?? null;

        const sameGroup = !!src && src.id === dst.id;

        if (sameGroup && !canPosition(src.id, dst.id)) {
            notify(
                'error',
                'Reordering inside a group is unavailable while a filter is active or the list is only partly loaded.',
            );

            return false;
        }

        const anchor =
            src && canPosition(src.id, dst.id)
                ? beforeTaskId
                : null;

        const payload = {
            group_id: dst.id,
        };

        if (anchor !== null) {
            payload.before_task_id = anchor;
        }

        if (hasFilters) {
            payload.filters = buildQuery(filters);
        }

        let snapshot = null;

        if (src) {
            const card = src.tasks.find((t) => t.id === taskId);
            const without = src.tasks.filter(
                (t) => t.id !== taskId,
            );

            const moved = {
                ...card,
                group: groupRef(dst),
            };

            const reordered = sameGroup
                ? place(without, card, anchor)
                : null;

            // Skip requests when the order has not changed.
            if (sameGroup && sameOrder(reordered, src.tasks)) {
                return true;
            }

            snapshot = {
                [src.id]: src,
                [dst.id]: dst,
            };

            setBoard((b) => ({
                ...b,
                groups: b.groups.map((g) => {
                    if (sameGroup && g.id === src.id) {
                        return {
                            ...g,
                            tasks: reordered,
                        };
                    }

                    if (g.id === src.id) {
                        return {
                            ...g,
                            tasks: without,
                            total: Math.max(g.total - 1, 0),
                            unfiltered_total: Math.max(
                                g.unfiltered_total - 1,
                                0,
                            ),
                        };
                    }

                    if (g.id === dst.id) {
                        const base = {
                            ...g,
                            total: g.total + 1,
                            unfiltered_total: g.unfiltered_total + 1,
                        };

                        // Insert immediately only when fully loaded.
                        return g.fully_loaded
                            ? {
                                  ...base,
                                  tasks: place(g.tasks, moved, anchor),
                              }
                            : base;
                    }

                    return g;
                }),
            }));
        }

        const keyAtStart = filterKeyRef.current;

        movingRef.current = true;
        setMoving(true);

        try {
            const res = await patchJson(
                route('tasks.move', taskId),
                payload,
            );

            if (!src) {
                notify(
                    'success',
                    `${res.task.code} moved to ${dst.name}.`,
                );

                setReloadKey((k) => k + 1);
                return true;
            }

            if (res.matches_filters === false) {
                // The moved task no longer matches the active filters.
                setBoard((b) => ({
                    ...b,
                    groups: b.groups.map((g) =>
                        g.id === dst.id
                            ? {
                                  ...g,
                                  tasks: g.tasks.filter(
                                      (t) => t.id !== taskId,
                                  ),
                                  total: Math.max(g.total - 1, 0),
                              }
                            : g,
                    ),
                }));

                notify(
                    'success',
                    res.notice ??
                        'Task moved; it no longer matches current filters.',
                );
            } else {
                replaceCard(res.task);

                const hidden =
                    !sameGroup && !dst.fully_loaded;

                if (announce || hidden) {
                    notify(
                        'success',
                        hidden
                            ? `${res.task.code} moved to the end of ${dst.name}.`
                            : `${res.task.code} moved to ${dst.name}.`,
                    );
                }
            }

            return true;
        } catch (err) {
            notify(
                'error',
                errorMessage(err, [
                    'before_task_id',
                    'group_id',
                    'task',
                    'project',
                ]),
            );

            if (
                err.status === 404 ||
                err.errors?.before_task_id ||
                filterKeyRef.current !== keyAtStart ||
                !snapshot
            ) {
                // The board may be stale; reload rather than rolling back.
                setReloadKey((k) => k + 1);
            } else {
                setBoard((b) => ({
                    ...b,
                    groups: b.groups.map(
                        (g) => snapshot[g.id] ?? g,
                    ),
                }));
            }

            return false;
        } finally {
            movingRef.current = false;
            setMoving(false);
        }
    };

    const startDrag = (task, group) => {
        setDrag({
            taskId: task.id,
            fromGroupId: group.id,
        });
    };

    const endDrag = () => setDrag(null);

    const dropTask = (group, beforeTaskId) => {
        const current = drag;

        setDrag(null);

        if (current) {
            moveTask(current.taskId, group.id, beforeTaskId);
        }
    };

    // Automatically scroll horizontally while dragging near the board edges.
    const edgeScroll = (e) => {
        const el = scrollerRef.current;

        if (!drag || !el) return;

        const rect = el.getBoundingClientRect();
        const zone = 80;

        if (e.clientX < rect.left + zone) {
            el.scrollLeft -= 24;
        } else if (e.clientX > rect.right - zone) {
            el.scrollLeft += 24;
        }
    };

    // ───────── Loading ─────────

    if (!board && loading) {
        return (
            <div
                className="flex gap-4 overflow-hidden"
                aria-busy="true"
                aria-label="Loading project board"
            >
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-72 shrink-0 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                        <div className="mb-3 h-6 w-24 rounded-md bg-slate-200" />

                        <div className="space-y-2">
                            <div className="h-16 rounded-xl bg-slate-200/80" />
                            <div className="h-16 rounded-xl bg-slate-200/80" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!board) {
        return (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                <p>{error ?? 'Could not load the board.'}</p>

                <button
                    type="button"
                    onClick={() => setReloadKey((k) => k + 1)}
                    className="mt-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                    Retry
                </button>
            </div>
        );
    }

    const movable = !board.read_only && !moving && !loading;
    const moveTargets = board.groups.map(groupRef);

    const reorderBlocked =
        !!drag &&
        !canPosition(drag.fromGroupId, drag.fromGroupId);

    return (
        <div className="min-w-0">
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
                    <span className="min-w-0 flex-1">{error}</span>

                    <button
                        type="button"
                        onClick={() => setReloadKey((k) => k + 1)}
                        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-rose-700 underline decoration-rose-300 underline-offset-2 transition hover:text-rose-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                        Retry
                    </button>
                </div>
            )}

            <div
                ref={scrollerRef}
                onDragOver={edgeScroll}
                aria-busy={moving}
                className={`flex items-start gap-4 overflow-x-auto pb-4 transition-opacity ${
                    loading ? 'opacity-60' : ''
                }`}
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
                        onOpen={openTask}
                        movable={movable}
                        drag={drag}
                        canPosition={canPosition}
                        onDragStart={startDrag}
                        onDragEnd={endDrag}
                        onDropTask={dropTask}
                        moveTargets={moveTargets}
                        onMoveTo={(task, groupId) =>
                            moveTask(task.id, groupId, null, {
                                announce: true,
                            })
                        }
                    />
                ))}
            </div>

            {/* Fixed position prevents the board layout shifting during drag. */}
            {reorderBlocked && (
                <div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none fixed bottom-6 left-1/2 z-[60] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-center text-xs leading-5 text-amber-800 shadow-xl shadow-slate-900/10"
                >
                    Reordering inside a group is unavailable while a
                    filter is active or a list is only partly loaded.
                    Drop the task on another group to move it; it is
                    added to the end of that group.
                </div>
            )}

            {openTaskId && (
                <TaskDrawer
                    key={openTaskId}
                    taskId={openTaskId}
                    projectId={projectId}
                    options={options}
                    onClose={closeTask}
                    onCardChange={replaceCard}
                    onArchived={handleArchived}
                    onRestored={handleRestored}
                    onMove={(id, groupId) =>
                        moveTask(id, groupId, null, {
                            announce: true,
                        })
                    }
                />
            )}

            {toast && (
                <div
                    key={toast.id}
                    role="status"
                    aria-live="polite"
                    className={`fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-xl shadow-slate-900/10 ${
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