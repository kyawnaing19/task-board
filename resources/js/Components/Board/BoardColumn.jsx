import React, { useEffect, useRef, useState } from 'react';
import GroupPill from '@/Components/GroupPill';
import TaskCard from './TaskCard';
import AddTaskForm from './AddTaskForm';

/**
 * movable      = Whether tasks can be moved.
 * drag         = { taskId, fromGroupId } | null
 * canPosition  = (fromGroupId, toGroupId) => whether positional drop is allowed.
 */
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
    const [dropIndex, setDropIndex] = useState(null);
   // const [addingTask, setAddingTask] = useState(false);


    // Clear the drop indicator when dragging ends.
    useEffect(() => {
        if (!drag) setDropIndex(null);
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
        ? group.tasks.filter((t) => t.id !== drag.taskId)
        : group.tasks;

    const indexFromPointer = (clientY) => {
        const cards = [
            ...(listRef.current?.querySelectorAll('[data-task-card]') ?? []),
        ].filter(
            (el) => Number(el.dataset.taskCard) !== drag.taskId,
        );

        const index = cards.findIndex((el) => {
            const rect = el.getBoundingClientRect();
            return clientY < rect.top + rect.height / 2;
        });

        return index === -1 ? cards.length : index;
    };

    const edgeFor = (task) => {
        if (!accepts || dropIndex === null) return null;

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

    const onDragOver = (e) => {
        if (!accepts) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        setDropIndex(
            positional
                ? indexFromPointer(e.clientY)
                : visible.length,
        );
    };

    const onDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDropIndex(null);
        }
    };

    const onDrop = (e) => {
        if (!accepts) return;

        e.preventDefault();

        const index = dropIndex ?? visible.length;

        setDropIndex(null);

        // Without positional permission, append to the end.
        onDropTask(
            group,
            positional ? visible[index]?.id ?? null : null,
        );
    };

    const hovering = accepts && dropIndex !== null;

    const addTaskFormRef = useRef(null);

useEffect(() => {
    if (!addingTask) return;

    const handleOutsideClick = (event) => {
        if (
            addTaskFormRef.current &&
            !addTaskFormRef.current.contains(event.target)
        ) {
            onAddTaskClose?.();
        }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
    };
}, [addingTask, onAddTaskClose]);

    return (
        <section
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`w-72 shrink-0 rounded-2xl border bg-slate-50/80 p-3 transition ${
                hovering
                    ? 'border-indigo-300 ring-2 ring-indigo-100'
                    : 'border-slate-200'
            }`}
        >
            <header className="mb-3 flex items-center gap-2 px-1">
                <GroupPill
                    name={group.name}
                    color={group.color}
                />

                <span className="text-sm font-medium text-slate-600">
                    {group.total}

                    {filtered && (
                        <span className="text-slate-400">
                            {' '}
                            / {group.unfiltered_total}
                        </span>
                    )}
                </span>
            </header>

            <div ref={listRef} className="space-y-2">
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
                        <TaskCard
                            key={task.id}
                            task={task}
                            onOpen={onOpen}
                            draggable={manageable}
                            dragging={drag?.taskId === task.id}
                            dropEdge={edgeFor(task)}
                            onDragStart={(t) =>
                                onDragStart(t, group)
                            }
                            onDragEnd={onDragEnd}
                            moveTargets={
                                manageable ? moveTargets : []
                            }
                            onMoveTo={onMoveTo}
                        />
                    );
                })}
            </div>

            {hovering && !positional && (
                <p className="mt-2 text-center text-[11px] font-medium text-indigo-600">
                    Will be added to the end of this group
                </p>
            )}

            {!group.fully_loaded && (
                <button
                    type="button"
                    onClick={() => onLoadMore(group)}
                    disabled={loadingMore}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loadingMore
                        ? 'Loading…'
                        : `Load more${remaining > 0 ? ` (${remaining})` : ''}`}
                </button>
            )}

            {canCreate && (
    <div className="mt-3">
        {!addingTask ? (
            <button
                type="button"
                onClick={onAddTaskOpen}
                className="..."
            >
                + Add Task
            </button>
        ) : (
            <div ref={addTaskFormRef}>
                <AddTaskForm
                    group={group}
                    members={members}
                    tags={tags}
                    onCreate={async (payload) => {
                        await onCreate(group, payload);
                        onAddTaskClose();
                    }}
                    onOpenChange={(open) => {
                        if (!open) {
                            onAddTaskClose();
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