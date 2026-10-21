import React, { useEffect, useRef, useState } from 'react';

import GroupPill from '@/Components/GroupPill';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';

export default function BoardColumn({
    group,
    addingTask,
    onAddTaskOpen,
    onAddTaskClose,
    filtersActive,
    canCreate,
    loadingMore,
    onLoadMore,
    onCreate,
    onOpen,
    movable,
    drag,
    canPosition,
    onDragStart,
    onDragEnd,
    onDropTask,
    moveTargets,
    onMoveTo,
    members = [],
    tags = [],
}) {
    const listRef = useRef(null);
    const addTaskFormRef = useRef(null);

    const [dropIndex, setDropIndex] = useState(null);

    // Clear the drop indicator when dragging ends.
    useEffect(() => {
        if (!drag) {
            setDropIndex(null);
        }
    }, [drag]);

    const remaining = Math.max(
        group.total - group.tasks.length,
        0,
    );

    const filtered =
        filtersActive &&
        group.total !== group.unfiltered_total;

    const sameGroup =
        !!drag && drag.fromGroupId === group.id;

    const positional =
        !!drag && canPosition(drag.fromGroupId, group.id);

    // Same-group reorder requires positional permission.
    // Cross-group moves can append to the destination group.
    const accepts = !!drag && (!sameGroup || positional);

    const visible = drag
        ? group.tasks.filter((task) => task.id !== drag.taskId)
        : group.tasks;

    const indexFromPointer = (clientY) => {
        const cards = [
            ...(listRef.current?.querySelectorAll(
                '[data-task-card]',
            ) ?? []),
        ].filter(
            (element) =>
                Number(element.dataset.taskCard) !== drag.taskId,
        );

        const index = cards.findIndex((element) => {
            const rect = element.getBoundingClientRect();

            return clientY < rect.top + rect.height / 2;
        });

        return index === -1 ? cards.length : index;
    };

    const edgeFor = (task) => {
        if (!accepts || dropIndex === null) {
            return null;
        }

        if (visible[dropIndex]?.id === task.id) {
            return 'top';
        }

        if (
            dropIndex >= visible.length &&
            visible[visible.length - 1]?.id === task.id
        ) {
            return 'bottom';
        }

        return null;
    };

    const handleDragOver = (event) => {
        if (!accepts) {
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        setDropIndex(
            positional
                ? indexFromPointer(event.clientY)
                : visible.length,
        );
    };

    const handleDragLeave = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setDropIndex(null);
        }
    };

    const handleDrop = (event) => {
        if (!accepts) {
            return;
        }

        event.preventDefault();

        const index = dropIndex ?? visible.length;

        setDropIndex(null);

        // Preserve the original handler API.
        // When reordering is unavailable, append to the group.
        onDropTask(
            group,
            positional ? visible[index]?.id ?? null : null,
        );
    };

    const hovering = accepts && dropIndex !== null;

    // Close Add Task when clicking outside the form.
    // useEffect(() => {
    //     if (!addingTask) {
    //         return undefined;
    //     }

    //     const handleOutsideClick = (event) => {
    //         if (
    //             addTaskFormRef.current &&
    //             !addTaskFormRef.current.contains(event.target)
    //         ) {
    //             onAddTaskClose?.();
    //         }
    //     };

    //     document.addEventListener(
    //         'mousedown',
    //         handleOutsideClick,
    //     );

    //     return () => {
    //         document.removeEventListener(
    //             'mousedown',
    //             handleOutsideClick,
    //         );
    //     };
    // }, [addingTask, onAddTaskClose]);

    return (
        <section
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                flex
                min-h-0
                max-h-[calc(100vh-190px)]
                max-h-[calc(100dvh-190px)]
                w-[min(19rem,calc(100vw-2rem))]
                shrink-0
                flex-col
                overflow-hidden
                rounded-2xl
                border
                bg-white
                p-2.5
                shadow-sm
                transition
                sm:w-72
                sm:p-3
                ${
                    hovering
                        ? 'border-indigo-300 ring-2 ring-indigo-100'
                        : 'border-slate-200'
                }
            `}
        >
            {/* Header stays visible */}
            <header className="mb-3 flex shrink-0 items-center gap-2 px-1">
                <div className="min-w-0 flex-1">
                    <GroupPill
                        name={group.name}
                        color={group.color}
                    />
                </div>

                <span className="shrink-0 text-sm font-medium text-slate-600">
                    {group.total}

                    {filtered && (
                        <span className="text-slate-400">
                            {' '}
                            / {group.unfiltered_total}
                        </span>
                    )}
                </span>
            </header>

            {/* Only this area scrolls vertically */}
            <div
                ref={listRef}
                className="
                    min-h-0
                    flex-1
                    space-y-2
                    overflow-x-hidden
                    overflow-y-auto
                    overscroll-contain
                    pr-1
                    [scrollbar-width:thin]
                    [scrollbar-color:#cbd5e1_transparent]
                    [&::-webkit-scrollbar]:w-1
                    sm:[&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:bg-slate-300
                    [&::-webkit-scrollbar-track]:bg-transparent
                "
            >
                {group.tasks.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-5 text-center text-xs text-slate-400">
                        {filtersActive
                            ? 'No matching tasks'
                            : 'No tasks'}
                    </p>
                )}

                {group.tasks.map((task) => {
                    const manageable =
                        movable && task.can_manage;

                    return (
                        <div
                            key={task.id}
                            data-task-card={task.id}
                        >
                            <TaskCard
                                task={task}
                                onOpen={onOpen}
                                draggable={manageable}
                                dragging={drag?.taskId === task.id}
                                dropEdge={edgeFor(task)}
                                onDragStart={(currentTask) =>
                                    onDragStart(currentTask, group)
                                }
                                onDragEnd={onDragEnd}
                                moveTargets={
                                    manageable ? moveTargets : []
                                }
                                onMoveTo={onMoveTo}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Drop message */}
            {hovering && !positional && (
                <p className="mt-2 shrink-0 text-center text-[11px] font-medium text-indigo-600">
                    Will be added to the end of this group
                </p>
            )}

            {/* Load more stays outside the scrollable list */}
            {!group.fully_loaded && (
                <button
                    type="button"
                    onClick={() => onLoadMore(group)}
                    disabled={loadingMore}
                    className="
                        mt-2
                        w-full
                        shrink-0
                        rounded-lg
                        border
                        border-slate-200
                        bg-white
                        px-3
                        py-2
                        text-xs
                        font-medium
                        text-slate-600
                        shadow-sm
                        transition
                        hover:border-slate-300
                        hover:bg-slate-50
                        hover:text-slate-900
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-indigo-500
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    {loadingMore
                        ? 'Loading…'
                        : `Load more${
                              remaining > 0
                                  ? ` (${remaining})`
                                  : ''
                          }`}
                </button>
            )}

            {/* Add Task stays visible and closed by default */}
            {canCreate && (
                <div className="mt-3 shrink-0">
                    {!addingTask ? (
                        <button
                            type="button"
                            onClick={onAddTaskOpen}
                            className="
                                flex
                                w-full
                                items-center
                                gap-2
                                rounded-xl
                                border
                                border-dashed
                                border-slate-300
                                bg-white
                                px-3
                                py-2.5
                                text-sm
                                font-medium
                                text-slate-500
                                transition
                                hover:border-indigo-300
                                hover:bg-indigo-50/50
                                hover:text-indigo-600
                                focus:outline-none
                                focus-visible:ring-2
                                focus-visible:ring-indigo-500
                            "
                        >
                            <span className="text-lg leading-none">
                                +
                            </span>

                            <span>Add Task</span>
                        </button>
                    ) : (
                        <div ref={addTaskFormRef}>
                            <AddTaskForm
                                group={group}
                                members={members}
                                tags={tags}
                                onCreate={async (payload) => {
                                    await onCreate(group, payload);
                                    onAddTaskClose?.();
                                }}
                                onOpenChange={(open) => {
                                    if (!open) {
                                        onAddTaskClose?.();
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}