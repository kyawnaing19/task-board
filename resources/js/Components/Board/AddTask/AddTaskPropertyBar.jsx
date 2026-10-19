import React from 'react';

import AssigneePicker from './AssigneePicker';
import DatePicker from './DatePicker';
import PriorityPicker from './PriorityPicker';
import TagPicker from './TagPicker';

export default function AddTaskPropertyBar({
    members = [],
    tags = [],
    assigneeIds,
    onAssigneeChange,
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
    priority,
    onPriorityChange,
    tagIds,
    onTagChange,
    activePicker,
    onActivePickerChange,
}) {
    const togglePicker = (picker) => (nextOpen) => {
        onActivePickerChange(nextOpen ? picker : null);
    };

    return (
        <div className="divide-y divide-slate-100">
            <AssigneePicker
                members={members}
                value={assigneeIds}
                onChange={onAssigneeChange}
                open={activePicker === 'assignee'}
                onToggle={togglePicker('assignee')}
            />

            <DatePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
                open={activePicker === 'dates'}
                onToggle={togglePicker('dates')}
            />

            <PriorityPicker
                value={priority}
                onChange={onPriorityChange}
                open={activePicker === 'priority'}
                onToggle={togglePicker('priority')}
            />

            <TagPicker
                tags={tags}
                value={tagIds}
                onChange={onTagChange}
                open={activePicker === 'tags'}
                onToggle={togglePicker('tags')}
            />
        </div>
    );
}