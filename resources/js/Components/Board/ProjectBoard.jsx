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
    mine: false,
};

// Build the server query without empty values.
const buildQuery = (filters) => {
    const params = {};

    if (filters.q) {
        params.q = filters.q;
    }

    if (filters.assignee) {
        params.assignee = filters.assignee;
    }

    if (filters.priority.length) {
        params.priority = filters.priority;
    }

    if (filters.tag_ids.length) {
        params.tag_ids = filters.tag_ids;
    }

    // My Tasks quick filter.
    if (filters.mine) {
        params.mine = 1;
    }

    return params;
};

// Merge cursor pagination results without duplicate tasks.
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

const groupRef = (group) => ({
    id: group.id,
    name: group.name,
    color: group.color,
    is_completed: group.is_completed,
});

// Insert an item before anchorId.
// If anchorId is null or isn't found, append to the end.
const place = (list, item, anchorId) => {
    const index =
        anchorId === null
            ? -1
            : list.findIndex((task) => task.id === anchorId);

    const at = index === -1 ? list.length : index;

    return [
        ...list.slice(0, at),
        item,
        ...list.slice(at),
    ];
};

const sameOrder = (a, b) =>
    a.length === b.length &&
    a.every((task, index) => task.id === b[index].id);

export default function ProjectBoard({
    projectId,
    active = true,
    refreshToken = 0,
}) {
    const { auth } = usePage().props;

    const isAdmin = auth?.user?.role === 'SUPER_ADMIN';

    const [options, setOptions] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        ...EMPTY_FILTERS,
        priority: [],
        tag_ids: [],
    });
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [loadingGroups, setLoadingGroups] = useState({});
    const [toast, setToast] = useState(null);

    // const [openTaskId, setOpenTaskId] = useState(() =>
    //     active ? readTaskParam() : null,
    // );
    const [openTaskId, setOpenTaskId] = useState(() => readTaskParam());

    const [drag, setDrag] = useState(null);
    const [moving, setMoving] = useState(false);

    const scrollerRef = useRef(null);
    const movingRef = useRef(false);

    const filterKey = JSON.stringify(filters);
    const filterKeyRef = useRef(filterKey);

    filterKeyRef.current = filterKey;

    // Close the drawer when switching away from the board tab.
    // useEffect(() => {
    //     if (!active) {
    //         setOpenTaskId(null);
    //     }
    // }, [active]);
    // Sync the drawer with the URL when the Board tab becomes active.
useEffect(() => {
    if (!active) {
        setOpenTaskId(null);
        return;
    }

    const taskId = readTaskParam();

    if (taskId) {
        setOpenTaskId(taskId);
    }
}, [active, projectId]);

    const notify = (type, message) => {
        setToast({
            type,
            message,
            id: Date.now(),
        });
    };

    // Automatically dismiss notifications.
    useEffect(() => {
        if (!toast) {
            return undefined;
        }

        const timer = setTimeout(() => {
            setToast(null);
        }, 4500);

        return () => clearTimeout(timer);
    }, [toast]);

    // Load filter options once per project.
    useEffect(() => {
        const controller = new AbortController();

        setOptions(null);

        getJson(
            route('projects.board.options', projectId),
            controller.signal,
        )
            .then(setOptions)
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    setOptions(null);
                }
            });

        return () => controller.abort();
    }, [projectId]);

    // Debounce search input.
    useEffect(() => {
        const timer = setTimeout(() => {
            const next = searchInput.trim();

            setFilters((current) =>
                current.q === next
                    ? current
                    : {
                          ...current,
                          q: next,
                      },
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
                if (err.name === 'AbortError') {
                    return;
                }

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
        setFilters((current) => ({
            ...current,
            ...patch,
        }));
    };

    // Clear all filters, including My Tasks.
    const clearFilters = () => {
        setSearchInput('');

        setFilters({
            ...EMPTY_FILTERS,
            priority: [],
            tag_ids: [],
        });
    };

    // Include pending debounced search input when checking active filters.
    const hasFilters =
        Boolean(board?.filters_active) ||
        searchInput.trim() !== '' ||
        filters.q !== '' ||
        filters.assignee !== '' ||
        filters.priority.length > 0 ||
        filters.tag_ids.length > 0 ||
        filters.mine;

    // Load another page of tasks for a group.
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

            // Discard stale results if filters changed during the request.
            if (filterKeyRef.current !== keyAtStart) {
                return;
            }

            setBoard((current) => {
                if (!current) {
                    return current;
                }

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

    // Create a task.
    // const createTask = async (group, title) => {
    //     try {
    //         const { task } = await postJson(
    //             route('projects.tasks.store', projectId),
    //             {
    //                 title,
    //                 group_id: group.id,
    //             },
    //         );
   const createTask = async (group, payload) => {
    try {
        const response = await postJson(
            route('projects.tasks.store', projectId),
            {
                ...payload,
                group_id: group.id,
            },
        );

        // Support either a direct task response or a wrapped response.
        const task =
            response?.task ??
            response?.data?.task ??
            response?.data ??
            response;

        if (!task?.id) {
            throw new Error(
                'The task was created, but the server response did not contain a valid task.',
            );
        }

        // Keep the rest of your existing createTask success logic here.

        // Reload when filters may exclude the new task.
        if (board.filters_active || filters.mine) {
            notify(
                'success',
                `${task.code} created. It may not match the current filters.`,
            );

            setReloadKey((current) => current + 1);
            return task;
        }

        // Update the board without a full reload.
        setBoard((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                groups: current.groups.map((item) => {
                    if (item.id !== group.id) {
                        return item;
                    }

                    const next = {
                        ...item,
                        total: item.total + 1,
                        unfiltered_total: item.unfiltered_total + 1,
                    };

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

        return task;
    } catch (err) {
        notify(
            'error',
            errorMessage(err, [
                'title',
                'group_id',
                'assignee_ids',
                'tag_ids',
                'start_date',
                'end_date',
                'priority',
                'project',
            ]),
        );

        throw err;
    }
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
    const replaceCard = (card) => {
        setBoard((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                groups: current.groups.map((group) =>
                    group.tasks.some((task) => task.id === card.id)
                        ? {
                              ...group,
                              tasks: group.tasks.map((task) =>
                                  task.id === card.id ? card : task,
                              ),
                          }
                        : group,
                ),
            };
        });
    };

    // Remove an archived task from the board.
    const handleArchived = (card) => {
        notify('success', `${card.code} archived.`);

        if (board.filters_active || filters.mine) {
            setReloadKey((current) => current + 1);
            return;
        }

        setBoard((current) => {
            if (!current) {
                return current;
            }

            const holder =
                current.groups.find((group) =>
                    group.tasks.some((task) => task.id === card.id),
                )?.id ?? card.group?.id;

            return {
                ...current,
                groups: current.groups.map((group) => {
                    const tasks = group.tasks.filter(
                        (task) => task.id !== card.id,
                    );

                    if (group.id !== holder) {
                        return tasks.length === group.tasks.length
                            ? group
                            : {
                                  ...group,
                                  tasks,
                              };
                    }

                    return {
                        ...group,
                        tasks,
                        total: Math.max(group.total - 1, 0),
                        unfiltered_total: Math.max(
                            group.unfiltered_total - 1,
                            0,
                        ),
                    };
                }),
            };
        });
    };

    // Restore a task to its group.
    const handleRestored = (card) => {
        if (board.filters_active || filters.mine) {
            notify('success', `${card.code} restored.`);
            setReloadKey((current) => current + 1);
            return;
        }

        const target = board.groups.find(
            (group) => group.id === card.group?.id,
        );

        notify(
            'success',
            target && !target.fully_loaded
                ? `${card.code} restored at the end of its group.`
                : `${card.code} restored.`,
        );

        setBoard((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                groups: current.groups.map((group) => {
                    if (
                        group.id !== card.group?.id ||
                        group.tasks.some((task) => task.id === card.id)
                    ) {
                        return group;
                    }

                    const next = {
                        ...group,
                        total: group.total + 1,
                        unfiltered_total:
                            group.unfiltered_total + 1,
                    };

                    return group.fully_loaded
                        ? {
                              ...next,
                              tasks: [...group.tasks, card],
                          }
                        : next;
                }),
            };
        });
    };

    // ───────── Move ─────────

    // Reordering is allowed only when there are no filters
    // and both groups are fully loaded.
    const canPosition = (fromId, toId) => {
        if (!board || hasFilters) {
            return false;
        }

        const from = board.groups.find(
            (group) => group.id === fromId,
        );

        const to = board.groups.find(
            (group) => group.id === toId,
        );

        return Boolean(from?.fully_loaded && to?.fully_loaded);
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
        if (!board || movingRef.current) {
            return false;
        }

        const destination = board.groups.find(
            (group) => group.id === toGroupId,
        );

        if (!destination) {
            return false;
        }

        const source =
            board.groups.find((group) =>
                group.tasks.some((task) => task.id === taskId),
            ) ?? null;

        const sameGroup =
            Boolean(source) && source.id === destination.id;

        if (sameGroup && !canPosition(source.id, destination.id)) {
            notify(
                'error',
                'Reordering inside a group is unavailable while a filter is active or the list is only partly loaded.',
            );

            return false;
        }

        const anchor =
            source && canPosition(source.id, destination.id)
                ? beforeTaskId
                : null;

        const payload = {
            group_id: destination.id,
        };

        if (anchor !== null) {
            payload.before_task_id = anchor;
        }

        if (hasFilters) {
            payload.filters = buildQuery(filters);
        }

        let snapshot = null;

        if (source) {
            const card = source.tasks.find(
                (task) => task.id === taskId,
            );

            const without = source.tasks.filter(
                (task) => task.id !== taskId,
            );

            const moved = {
                ...card,
                group: groupRef(destination),
            };

            const reordered = sameGroup
                ? place(without, card, anchor)
                : null;

            // Skip requests when the order has not changed.
            if (sameGroup && sameOrder(reordered, source.tasks)) {
                return true;
            }

            snapshot = {
                [source.id]: source,
                [destination.id]: destination,
            };

            setBoard((current) => {
                if (!current) {
                    return current;
                }

                return {
                    ...current,
                    groups: current.groups.map((group) => {
                        if (sameGroup && group.id === source.id) {
                            return {
                                ...group,
                                tasks: reordered,
                            };
                        }

                        if (group.id === source.id) {
                            return {
                                ...group,
                                tasks: without,
                                total: Math.max(group.total - 1, 0),
                                unfiltered_total: Math.max(
                                    group.unfiltered_total - 1,
                                    0,
                                ),
                            };
                        }

                        if (group.id === destination.id) {
                            const next = {
                                ...group,
                                total: group.total + 1,
                                unfiltered_total:
                                    group.unfiltered_total + 1,
                            };

                            return group.fully_loaded
                                ? {
                                      ...next,
                                      tasks: place(
                                          group.tasks,
                                          moved,
                                          anchor,
                                      ),
                                  }
                                : next;
                        }

                        return group;
                    }),
                };
            });
        }

        const keyAtStart = filterKeyRef.current;

        movingRef.current = true;
        setMoving(true);

        try {
            const response = await patchJson(
                route('tasks.move', taskId),
                payload,
            );

            if (!source) {
                notify(
                    'success',
                    `${response.task.code} moved to ${destination.name}.`,
                );

                setReloadKey((current) => current + 1);
                return true;
            }

            if (response.matches_filters === false) {
                // The moved task no longer matches the active filters.
                setBoard((current) => {
                    if (!current) {
                        return current;
                    }

                    return {
                        ...current,
                        groups: current.groups.map((group) =>
                            group.id === destination.id
                                ? {
                                      ...group,
                                      tasks: group.tasks.filter(
                                          (task) => task.id !== taskId,
                                      ),
                                      total: Math.max(
                                          group.total - 1,
                                          0,
                                      ),
                                  }
                                : group,
                        ),
                    };
                });

                notify(
                    'success',
                    response.notice ??
                        'Task moved; it no longer matches current filters.',
                );
            } else {
                replaceCard(response.task);

                const hidden =
                    !sameGroup && !destination.fully_loaded;

                if (announce || hidden) {
                    notify(
                        'success',
                        hidden
                            ? `${response.task.code} moved to the end of ${destination.name}.`
                            : `${response.task.code} moved to ${destination.name}.`,
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
                setReloadKey((current) => current + 1);
            } else {
                setBoard((current) => {
                    if (!current) {
                        return current;
                    }

                    return {
                        ...current,
                        groups: current.groups.map(
                            (group) => snapshot[group.id] ?? group,
                        ),
                    };
                });
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

    const endDrag = () => {
        setDrag(null);
    };

    const dropTask = (group, beforeTaskId) => {
        const current = drag;

        setDrag(null);

        if (current) {
            moveTask(current.taskId, group.id, beforeTaskId);
        }
    };

    // Automatically scroll horizontally while dragging near the board edges.
    const edgeScroll = (event) => {
        const element = scrollerRef.current;

        if (!drag || !element) {
            return;
        }

        const rect = element.getBoundingClientRect();
        const zone = 80;

        if (event.clientX < rect.left + zone) {
            element.scrollLeft -= 24;
        } else if (event.clientX > rect.right - zone) {
            element.scrollLeft += 24;
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
                {[0, 1, 2].map((index) => (
                    <div
                        key={index}
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
                    onClick={() => setReloadKey((current) => current + 1)}
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
        Boolean(drag) &&
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
                    Boolean(board.filters_active) ||
                    searchInput.trim() !== '' ||
                    filters.mine
                }
                onClear={clearFilters}
                isAdmin={isAdmin}
            />

            {error && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                    <span className="min-w-0 flex-1">{error}</span>

                    <button
                        type="button"
                        onClick={() => setReloadKey((current) => current + 1)}
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
            filtersActive={board.filters_active || hasFilters}
            canCreate={board.can_create}
            loadingMore={Boolean(loadingGroups[group.id])}
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
            members={options?.members ?? []}
            tags={options?.tags ?? []}
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

            {openTaskId && active && (
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