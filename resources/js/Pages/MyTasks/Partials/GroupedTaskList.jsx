import React, { useMemo } from 'react';

import TaskGroupSection from './TaskGroupSection';

function getTaskId(task) {
    return task?.id ?? task?.task_id;
}

function getTaskGroup(task) {
    return task?.group || task?.task_group || null;
}

function getGroupId(group) {
    return group?.id ?? group?.group_id ?? null;
}

export default function GroupedTaskList({
    tasks = [],
    groups = [],
    onOpen,
    onRestore,
    restoringId,
}) {
    const groupedTasks = useMemo(() => {
        const result = new Map();

        // Initialize groups in the order supplied by the API.
        groups.forEach((group) => {
            const id = getGroupId(group);

            if (id !== null && id !== undefined) {
                result.set(String(id), {
                    group,
                    tasks: [],
                });
            }
        });

        // Place each task into its actual group.
        tasks.forEach((task) => {
            const taskGroup = getTaskGroup(task);
            const groupId = getGroupId(taskGroup);
            const key =
                groupId === null || groupId === undefined
                    ? '__no_group__'
                    : String(groupId);

            if (!result.has(key)) {
                result.set(key, {
                    group: taskGroup || {
                        id: '__no_group__',
                        name: 'No group',
                    },
                    tasks: [],
                });
            }

            result.get(key).tasks.push(task);
        });

        // Hide empty groups when showing a partial, paginated task list.
        return Array.from(result.values()).filter(
            (item) => item.tasks.length > 0,
        );
    }, [tasks, groups]);

    if (groupedTasks.length === 0) {
        return null;
    }

    return (
        <div className="mt-2 space-y-6">
            {groupedTasks.map(({ group, tasks: groupTasks }) => (
                <TaskGroupSection
                    key={
                        getGroupId(group) ??
                        group?.name ??
                        'no-group'
                    }
                    group={group}
                    tasks={groupTasks}
                    onOpen={onOpen}
                    onRestore={onRestore}
                    restoringId={restoringId}
                />
            ))}
        </div>
    );
}