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

        // Generate markers
        let markersHtml = '';
        if (plan.markers && plan.markers.length > 0) {
            plan.markers.forEach(marker => {
                const markerDate = new Date(marker.date);
                if (!isNaN(markerDate) && markerDate >= startDate && markerDate <= endDate) {
                    const daysOffset = Math.floor((markerDate - startDate) / (1000 * 60 * 60 * 24));
                    const leftPos = daysOffset * this.cellWidth;
                    
                    const markerColor = marker.color || '#ff4d4d';
                    
                    const safeLabel = this.escapeHtml(marker.label || 'Marker');

                    markersHtml += `
                        <div class="gantt-marker" style="left: ${leftPos + (this.cellWidth/2)}px; border-left: 2px solid ${markerColor};">
                            <div class="gantt-marker-label" style="color: ${markerColor};">
                                ${this.repeatString(safeLabel, 20)}
                            </div>
                        </div>
                    `;
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
                    <div class="gantt-rows mt-2 position-relative z-1" style="min-height: 300px;">
                        ${this.generateTasksHtml(plan, startDate, endDate)}
                    </div>
                </div>
            </div>
        `;

        // Bind events for tasks
        this.bindTaskEvents();
    }

    generateTasksHtml(plan, planStartDate, planEndDate) {
        if (!plan.tasks || plan.tasks.length === 0) return '';

        let tasksHtml = '';
        plan.tasks.forEach(task => {
            const taskStart = new Date(task.startDate);
            const taskEnd = new Date(task.endDate);

            // Skip invalid dates
            if (isNaN(taskStart) || isNaN(taskEnd) || taskStart > taskEnd) return;

            // Check if task is within plan timeline
            if (taskEnd < planStartDate || taskStart > planEndDate) return;

            // Calculate start and end offsets relative to plan timeline
            const effectiveStart = taskStart < planStartDate ? planStartDate : taskStart;
            const effectiveEnd = taskEnd > planEndDate ? planEndDate : taskEnd;

            const startDaysOffset = Math.floor((effectiveStart - planStartDate) / (1000 * 60 * 60 * 24));
            // Include the end day fully, so we add 1
            const durationDays = Math.floor((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;

            const leftPos = startDaysOffset * this.cellWidth;
            const width = durationDays * this.cellWidth;

            // Determine vertical position based on row
            const rowIndex = (task.row !== undefined && task.row > 0) ? task.row - 1 : 0;
            const topPos = rowIndex * this.rowHeight + this.taskMargin;
            const taskHeight = this.rowHeight - (this.taskMargin * 2);

            const fillColor = task.fillColor || '#4da3ff';
            const borderColor = task.borderColor || '#1c6ed5';

            const safeTitle = this.escapeHtml(task.title || 'Untitled');
            const safeId = this.escapeHtml(task.id || '');

            tasksHtml += `
                <div class="gantt-task" data-task-id="${safeId}" style="
                    left: ${leftPos}px;
                    width: ${width}px;
                    top: ${topPos}px;
                    height: ${taskHeight}px;
                    background-color: ${fillColor};
                    border-color: ${borderColor};
                ">
                    <div class="gantt-resize-handle left" data-resize="left"></div>
                    <div class="gantt-task-content">
                        <strong>${safeId}</strong><br>
                        ${safeTitle}
                    </div>
                    <div class="gantt-resize-handle right" data-resize="right"></div>
                </div>
            `;
        });

        return tasksHtml;
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
