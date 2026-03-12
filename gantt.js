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
                    <div class="gantt-task-content">
                        <strong>${safeId}</strong><br>
                        ${safeTitle}
                    </div>
                </div>
            `;
        });

        return tasksHtml;
    }

    bindTaskEvents() {
        if (!this.container) return;

        const tasks = this.container.querySelectorAll('.gantt-task');
        tasks.forEach(taskEl => {
            taskEl.addEventListener('click', (e) => {
                const taskId = taskEl.getAttribute('data-task-id');
                if (taskId && window.UIController) {
                    window.UIController.openTaskModal(taskId);
                }
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
