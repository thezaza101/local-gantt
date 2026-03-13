/* Gantt Engine */

class Gantt {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cellWidth = 40; // width of each day column in pixels
        this.rowHeight = 40; // height of each row in pixels
        this.taskMargin = 5; // top/bottom margin for tasks
    }

    render(plan) {
        if (!this.container || !plan) {
            if (this.container) {
                this.container.innerHTML = `<div class="p-3 border rounded text-center text-muted">Select or create a plan to view the Gantt chart</div>`;
            }
            return;
        }

        const startDate = new Date(plan.timeline.startDate);
        const endDate = new Date(plan.timeline.endDate);

        if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
            this.container.innerHTML = `<div class="p-3 border rounded text-center text-danger">Invalid plan dates</div>`;
            return;
        }

        // Calculate total days
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const totalWidth = totalDays * this.cellWidth;

        // Generate Grid Headers
        let headersHtml = '';
        let currentMonthHtml = '';
        let currentMonth = -1;
        let daysInCurrentMonth = 0;
        let currentMonthName = '';

        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dayNum = date.getDate();
            const monthNum = date.getMonth();
            const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });

            if (monthNum !== currentMonth) {
                if (currentMonth !== -1) {
                    currentMonthHtml += `<div class="gantt-month text-center border-end border-bottom fw-bold" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none;">${currentMonthName}</div>`;
                }
                currentMonth = monthNum;
                currentMonthName = monthName; // Store name for next loop
                daysInCurrentMonth = 1;
            } else {
                daysInCurrentMonth++;
            }

            headersHtml += `<div class="gantt-day text-center border-end border-bottom" style="width: ${this.cellWidth}px; flex: none; font-size: 0.8em; padding: 2px 0;">${dayNum}</div>`;
        }
        
        // Add the last month
        if (daysInCurrentMonth > 0) {
            currentMonthHtml += `<div class="gantt-month text-center border-end border-bottom fw-bold" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none;">${currentMonthName}</div>`;
        }

        const { html: tasksHtml, maxRow, rowMap } = this.generateTasksHtml(plan, startDate, endDate);

        // Calculate the required height to ensure the grid background goes down properly
        const requiredHeight = Math.max(300, (maxRow + 2) * this.rowHeight); // At least 300px, or tall enough for the rows + padding

        // Generate markers
        let markersHtml = '';
        if (plan.markers && plan.markers.length > 0) {
            plan.markers.forEach(marker => {
                const markerColor = marker.color || '#ff4d4d';
                const safeLabel = this.escapeHtml(marker.label || 'Marker');
                const importanceClass = marker.importance ? `marker-${marker.importance}` : 'marker-minor';

                if (marker.type === 'horizontal') {
                    // Map the requested row to the visual row if filtering/compacting
                    const rawRowIndex = (marker.row !== undefined && marker.row > 0) ? marker.row - 1 : 0;
                    const mappedRowIndex = rowMap.has(rawRowIndex) ? rowMap.get(rawRowIndex) : rawRowIndex;
                    
                    // Top position should be just above the row tasks
                    const topPos = mappedRowIndex * this.rowHeight + (this.taskMargin / 2);

                    markersHtml += `
                        <div class="gantt-marker-horizontal ${importanceClass}" style="top: ${topPos}px; border-top-color: ${markerColor}; width: ${totalWidth}px;">
                            <div class="gantt-marker-horizontal-label" style="color: ${markerColor}; background-color: rgba(255,255,255,0.8);">
                                ${safeLabel}
                            </div>
                        </div>
                    `;
                } else {
                    // Vertical marker
                    const markerDate = new Date(marker.date);
                    if (!isNaN(markerDate) && markerDate >= startDate && markerDate <= endDate) {
                        const daysOffset = Math.floor((markerDate - startDate) / (1000 * 60 * 60 * 24));
                        const leftPos = daysOffset * this.cellWidth;

                        const repeats = marker.repeats !== false; // default to true if undefined
                        const labelContent = repeats ? this.repeatString(safeLabel, 20) : `<span>${safeLabel}</span>`;
                        const repeatClass = repeats ? 'repeats' : 'no-repeats';

                        markersHtml += `
                            <div class="gantt-marker ${importanceClass}" style="left: ${leftPos + (this.cellWidth/2)}px; border-left-color: ${markerColor};">
                                <div class="gantt-marker-label ${repeatClass}" style="color: ${markerColor};">
                                    ${labelContent}
                                </div>
                            </div>
                        `;
                    }
                }
            });
        }

        this.container.innerHTML = `
            <div class="gantt-wrapper position-relative" style="width: 100%; height: 100%; overflow: auto;">
                <div class="gantt-content" style="width: ${totalWidth}px; min-height: 100%; position: relative;">
                    <!-- Headers -->
                    <div class="gantt-header d-flex position-sticky top-0 bg-white z-2">
                        <div class="gantt-months d-flex w-100">
                            ${currentMonthHtml}
                        </div>
                    </div>
                    <div class="gantt-header-days d-flex position-sticky bg-white z-2" style="top: 25px;">
                        ${headersHtml}
                    </div>
                    
                    <!-- Grid Background -->
                    <div class="gantt-grid position-absolute top-0 bottom-0 d-flex z-0" style="left: 0; right: 0; pointer-events: none;">
                        ${this.generateGridLines(totalDays)}
                    </div>

                    <!-- Markers -->
                    ${markersHtml}

                    <!-- Rows Container -->
                    <div class="gantt-rows mt-2 position-relative z-1" style="min-height: ${requiredHeight}px;">
                        ${tasksHtml}
                    </div>
                </div>
            </div>
        `;

        // Bind events for tasks
        this.bindTaskEvents();
    }

    generateTasksHtml(plan, planStartDate, planEndDate) {
        if (!plan.tasks || plan.tasks.length === 0) return { html: '', maxRow: 0 };

        const filterState = window.PlannerState.getFilterState();
        let tasksHtml = '';

        // Filter and collect tasks
        const visibleTasks = [];
        plan.tasks.forEach(task => {
            const taskStart = new Date(task.startDate);
            const taskEnd = new Date(task.endDate);

            // Skip invalid dates
            if (isNaN(taskStart) || isNaN(taskEnd) || taskStart > taskEnd) return;

            // Check if task is within plan timeline
            if (taskEnd < planStartDate || taskStart > planEndDate) return;

            const isMatch = window.AnalyticsEngine ?
                window.AnalyticsEngine.taskMatchesTags(task, filterState.selectedTags, filterState.matchMode) : true;

            // If mode is "show only" and it doesn't match, completely skip rendering this task
            if (filterState.visualMode === 'show' && !isMatch) return;

            visibleTasks.push({ task, isMatch, taskStart, taskEnd });
        });

        // Map visible rows to dense indices to hide empty rows
        const uniqueRows = Array.from(new Set(visibleTasks.map(t => (t.task.row !== undefined && t.task.row > 0) ? t.task.row - 1 : 0))).sort((a, b) => a - b);
        const rowMap = new Map();
        uniqueRows.forEach((row, index) => {
            // In highlight mode, we don't compact rows to avoid tasks jumping around,
            // but in show mode, we do compact them.
            if (filterState.visualMode === 'show') {
                rowMap.set(row, index);
            } else {
                rowMap.set(row, row);
            }
        });

        let maxRow = 0;

        visibleTasks.forEach(({ task, isMatch, taskStart, taskEnd }) => {
            // Calculate start and end offsets relative to plan timeline
            const effectiveStart = taskStart < planStartDate ? planStartDate : taskStart;
            const effectiveEnd = taskEnd > planEndDate ? planEndDate : taskEnd;

            const startDaysOffset = Math.floor((effectiveStart - planStartDate) / (1000 * 60 * 60 * 24));
            // Include the end day fully, so we add 1
            const durationDays = Math.floor((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;

            const leftPos = startDaysOffset * this.cellWidth;
            const width = durationDays * this.cellWidth;

            // Determine vertical position based on mapped row
            const rawRowIndex = (task.row !== undefined && task.row > 0) ? task.row - 1 : 0;
            const mappedRowIndex = rowMap.has(rawRowIndex) ? rowMap.get(rawRowIndex) : rawRowIndex;

            const topPos = mappedRowIndex * this.rowHeight + this.taskMargin;
            const taskHeight = this.rowHeight - (this.taskMargin * 2);

            if (mappedRowIndex > maxRow) {
                maxRow = mappedRowIndex;
            }

            const fillColor = task.fillColor || '#4da3ff';
            const borderColor = task.borderColor || '#1c6ed5';

            const safeTitle = this.escapeHtml(task.title || 'Untitled');
            const safeId = this.escapeHtml(task.id || '');

            // Apply visual mode styles if it's highlight mode and it doesn't match
            const opacityStyle = (filterState.visualMode === 'highlight' && !isMatch) ? 'opacity: 0.3;' : '';
            const pointerEventsStyle = (filterState.visualMode === 'highlight' && !isMatch) ? 'pointer-events: none;' : '';

            tasksHtml += `
                <div class="gantt-task" data-task-id="${safeId}" style="
                    left: ${leftPos}px;
                    width: ${width}px;
                    top: ${topPos}px;
                    height: ${taskHeight}px;
                    background-color: ${fillColor};
                    border-color: ${borderColor};
                    ${opacityStyle}
                    ${pointerEventsStyle}
                ">
                    <div class="gantt-resize-handle left" data-resize="left"></div>
                    <div class="gantt-task-content">
                        <strong>${safeId}</strong><br>
                        ${safeTitle}
                    </div>
                    <div class="gantt-task-controls">
                        <button class="gantt-task-control-btn duplicate-btn" title="Duplicate Task">⧉</button>
                        <button class="gantt-task-control-btn delete-btn" title="Delete Task">🗑</button>
                        <button class="gantt-task-control-btn link-btn" title="Open Link">🔗</button>
                    </div>
                    <div class="gantt-resize-handle right" data-resize="right"></div>
                </div>
            `;
        });

        return { html: tasksHtml, maxRow, rowMap };
    }

    bindTaskEvents() {
        if (!this.container) return;

        const tasks = this.container.querySelectorAll('.gantt-task');

        let isDragging = false;
        let isResizing = false;
        let resizeDirection = null; // 'left' or 'right'
        let startX = 0;
        let startY = 0;
        let initialLeft = 0;
        let initialTop = 0;
        let initialWidth = 0;
        let activeTaskEl = null;
        let activeTaskId = null;
        let hasMoved = false; // to distinguish click from drag
        const MOVE_THRESHOLD = 3;

        const onMouseMove = (e) => {
            if (!activeTaskEl) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            if (!hasMoved && (Math.abs(deltaX) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD)) {
                hasMoved = true;
                if (isDragging) activeTaskEl.classList.add('dragging');
                if (isResizing) activeTaskEl.classList.add('resizing');
            }

            if (!hasMoved) return;

            if (isDragging) {
                // Drag task block (update left and top)
                let newLeft = initialLeft + deltaX;
                let newTop = initialTop + deltaY;

                // Optional: basic bounds checking visually
                if (newLeft < 0) newLeft = 0;
                if (newTop < this.taskMargin) newTop = this.taskMargin;

                activeTaskEl.style.left = `${newLeft}px`;
                activeTaskEl.style.top = `${newTop}px`;
            } else if (isResizing) {
                if (resizeDirection === 'left') {
                    // Update left and width
                    let newLeft = initialLeft + deltaX;
                    let newWidth = initialWidth - deltaX;

                    if (newWidth < this.cellWidth) {
                        // Max drag right (cannot be smaller than 1 day)
                        newWidth = this.cellWidth;
                        newLeft = initialLeft + (initialWidth - this.cellWidth);
                    }
                    if (newLeft < 0) {
                        // Max drag left (cannot go beyond timeline start)
                        newLeft = 0;
                        newWidth = initialWidth + initialLeft;
                    }

                    activeTaskEl.style.left = `${newLeft}px`;
                    activeTaskEl.style.width = `${newWidth}px`;
                } else if (resizeDirection === 'right') {
                    // Update width
                    let newWidth = initialWidth + deltaX;
                    if (newWidth < this.cellWidth) newWidth = this.cellWidth;

                    activeTaskEl.style.width = `${newWidth}px`;
                }
            }
        };

        const onMouseUp = (e) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (!activeTaskEl) return;

            activeTaskEl.classList.remove('dragging', 'resizing');

            if (hasMoved) {
                // Handle the drop/resize finish
                const plan = window.PlannerState.getCurrentPlan();
                if (plan) {
                    const task = plan.tasks.find(t => t.id === activeTaskId);
                    if (task) {
                        const finalLeft = parseFloat(activeTaskEl.style.left);
                        const finalWidth = parseFloat(activeTaskEl.style.width);
                        const finalTop = parseFloat(activeTaskEl.style.top);

                        // Snap to grid calculations
                        const snappedDaysOffset = Math.round(finalLeft / this.cellWidth);
                        const snappedDurationDays = Math.round(finalWidth / this.cellWidth);

                        // Row calculation (minimum row 1)
                        const snappedRowIndex = Math.max(0, Math.round((finalTop - this.taskMargin) / this.rowHeight));
                        const newRow = snappedRowIndex + 1;

                        // Parse the YYYY-MM-DD string as local time to avoid timezone offset issues
                        const [year, month, day] = plan.timeline.startDate.split('-');
                        const planStartDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));

                        // Calculate new start and end dates based on offset
                        const newStartDate = new Date(planStartDate);
                        newStartDate.setDate(planStartDate.getDate() + snappedDaysOffset);

                        const newEndDate = new Date(newStartDate);
                        newEndDate.setDate(newStartDate.getDate() + snappedDurationDays - 1); // duration includes start day

                        // Format dates to YYYY-MM-DD
                        const formatDate = (date) => {
                            const yyyy = date.getFullYear();
                            const mm = String(date.getMonth() + 1).padStart(2, '0');
                            const dd = String(date.getDate()).padStart(2, '0');
                            return `${yyyy}-${mm}-${dd}`;
                        };

                        task.startDate = formatDate(newStartDate);
                        task.endDate = formatDate(newEndDate);
                        task.row = newRow;

                        // Force re-render with snapped positions
                        this.render(plan);
                    }
                }
            } else {
                // It was just a click, open modal
                if (window.UIController) {
                    window.UIController.openTaskModal(activeTaskId);
                }
            }

            // Reset state
            isDragging = false;
            isResizing = false;
            resizeDirection = null;
            activeTaskEl = null;
            activeTaskId = null;
            hasMoved = false;
        };

        tasks.forEach(taskEl => {
            taskEl.addEventListener('mousedown', (e) => {
                // Ignore clicks on task control buttons
                if (e.target.closest('.gantt-task-control-btn')) {
                    return;
                }

                // Determine if we clicked a resize handle or the task body
                activeTaskEl = taskEl;
                activeTaskId = taskEl.getAttribute('data-task-id');
                startX = e.clientX;
                startY = e.clientY;
                initialLeft = parseFloat(taskEl.style.left) || 0;
                initialTop = parseFloat(taskEl.style.top) || 0;
                initialWidth = parseFloat(taskEl.style.width) || 0;
                hasMoved = false;

                if (e.target.classList.contains('gantt-resize-handle')) {
                    isResizing = true;
                    resizeDirection = e.target.getAttribute('data-resize'); // 'left' or 'right'
                } else {
                    // Clicked the task body
                    isDragging = true;
                }

                // Prevent text selection during drag
                e.preventDefault();

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            // Handle control buttons
            const duplicateBtn = taskEl.querySelector('.duplicate-btn');
            const deleteBtn = taskEl.querySelector('.delete-btn');
            const linkBtn = taskEl.querySelector('.link-btn');
            const taskId = taskEl.getAttribute('data-task-id');

            if (duplicateBtn) {
                duplicateBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent triggering task drag/click
                    if (window.PlannerState.duplicateTask(taskId)) {
                        if (window.UIController) {
                            window.UIController.updateUI();
                        } else {
                            this.render(window.PlannerState.getCurrentPlan());
                        }
                    }
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent triggering task drag/click
                    if (confirm(`Are you sure you want to delete task "${taskId}"?`)) {
                        if (window.PlannerState.deleteTask(taskId)) {
                            if (window.UIController) {
                                window.UIController.updateUI();
                            } else {
                                this.render(window.PlannerState.getCurrentPlan());
                            }
                        }
                    }
                });
            }

            if (linkBtn) {
                linkBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent triggering task drag/click
                    const baseLink = window.PlannerState.getState().settings?.baseLink;
                    const url = baseLink ? baseLink + taskId : taskId;
                    window.open(url, '_blank');
                });
            }
        });
    }

    repeatString(str, count) {
        let result = '';
        for (let i = 0; i < count; i++) {
            result += `<span>${str}</span>`;
        }
        return result;
    }

    generateGridLines(totalDays) {
        let lines = '';
        for (let i = 0; i < totalDays; i++) {
            lines += `<div class="gantt-grid-line border-end" style="width: ${this.cellWidth}px; flex: none;"></div>`;
        }
        return lines;
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
