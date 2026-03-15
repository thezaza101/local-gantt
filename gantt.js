/* Gantt Engine */

class Gantt {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.cellWidth = 40; // width of each day column in pixels
        this.rowHeight = 43; // height of each row in pixels
        this.taskMargin = 5; // top/bottom margin for tasks
        this.isLegendCollapsed = false; // State for legend collapse/expand
    }

    getSafeDate(dateString) {
        if (!dateString) return new Date(NaN);
        const parts = dateString.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        return new Date(dateString);
    }

    render(plan) {
        if (!this.container || !plan) {
            if (this.container) {
                this.container.innerHTML = `<div class="p-3 border rounded text-center text-muted">Select or create a plan to view the Gantt chart</div>`;
            }
            return;
        }

        const startDate = this.getSafeDate(plan.timeline.startDate);
        const endDate = this.getSafeDate(plan.timeline.endDate);

        if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
            this.container.innerHTML = `<div class="p-3 border rounded text-center text-danger">Invalid plan dates</div>`;
            return;
        }

        // Get zoom level from planner state (default to daily if missing)
        const zoomLevel = window.PlannerState ? window.PlannerState.getZoomLevel() : 'daily';

        // Determine the visual width of a single day based on zoom level
        let dayWidth;
        switch(zoomLevel) {
            case 'monthly':
                dayWidth = 2;
                break;
            case 'fortnight':
                dayWidth = 6;
                break;
            case 'weekly':
                dayWidth = 10;
                break;
            case 'daily':
            default:
                dayWidth = 40;
                break;
        }

        this.cellWidth = dayWidth;

        // Calculate total days
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const totalWidth = totalDays * this.cellWidth;

        // Generate Grid Headers
        let headersHtml = '';
        let topHeadersHtml = '';

        if (zoomLevel === 'daily') {
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
                        topHeadersHtml += `<div class="gantt-month text-center border-end border-bottom fw-bold" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none;">${currentMonthName}</div>`;
                    }
                    currentMonth = monthNum;
                    currentMonthName = monthName;
                    daysInCurrentMonth = 1;
                } else {
                    daysInCurrentMonth++;
                }

                headersHtml += `<div class="gantt-day text-center border-end border-bottom" style="width: ${this.cellWidth}px; flex: none; font-size: 0.8em; padding: 2px 0;">${dayNum}</div>`;
            }
            if (daysInCurrentMonth > 0) {
                topHeadersHtml += `<div class="gantt-month text-center border-end border-bottom fw-bold" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none;">${currentMonthName}</div>`;
            }
        } else if (zoomLevel === 'weekly' || zoomLevel === 'fortnight') {
            let currentMonth = -1;
            let daysInCurrentMonth = 0;
            let currentMonthName = '';

            // Bottom headers for weeks/fortnights
            const periodDays = zoomLevel === 'weekly' ? 7 : 14;
            let currentPeriodStart = new Date(startDate);
            let daysInCurrentPeriod = 0;

            for (let i = 0; i < totalDays; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const monthNum = date.getMonth();
                const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });

                // Top header logic
                if (monthNum !== currentMonth) {
                    if (currentMonth !== -1) {
                        topHeadersHtml += `<div class="gantt-month text-center border-end border-bottom fw-bold" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currentMonthName}</div>`;
                    }
                    currentMonth = monthNum;
                    currentMonthName = monthName;
                    daysInCurrentMonth = 1;
                } else {
                    daysInCurrentMonth++;
                }

                // Bottom header logic
                daysInCurrentPeriod++;
                if (daysInCurrentPeriod === periodDays || i === totalDays - 1) {
                    const periodEnd = new Date(date);
                    const startDay = currentPeriodStart.getDate();
                    const startMonth = currentPeriodStart.toLocaleString('default', { month: 'short' });
                    const endDay = periodEnd.getDate();
                    const endMonth = periodEnd.toLocaleString('default', { month: 'short' });

                    let label = `${startDay} ${startMonth}`;
                    if (startMonth !== endMonth) label += ` - ${endDay} ${endMonth}`;
                    else label += `-${endDay}`;

                    headersHtml += `<div class="gantt-day text-center border-end border-bottom" style="width: ${daysInCurrentPeriod * this.cellWidth}px; flex: none; font-size: 0.7em; padding: 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${label}</div>`;

                    // Reset for next period
                    currentPeriodStart = new Date(date);
                    currentPeriodStart.setDate(currentPeriodStart.getDate() + 1);
                    daysInCurrentPeriod = 0;
                }
            }
            if (daysInCurrentMonth > 0) {
                topHeadersHtml += `<div class="gantt-month text-center border-end border-bottom fw-bold" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currentMonthName}</div>`;
            }
        } else if (zoomLevel === 'monthly') {
            let currentYear = -1;
            let daysInCurrentYear = 0;

            let currentMonth = -1;
            let daysInCurrentMonth = 0;
            let currentMonthName = '';

            for (let i = 0; i < totalDays; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const yearNum = date.getFullYear();
                const monthNum = date.getMonth();
                const monthName = date.toLocaleString('default', { month: 'short' });

                // Top header (Years)
                if (yearNum !== currentYear) {
                    if (currentYear !== -1) {
                        topHeadersHtml += `<div class="gantt-month text-center border-end border-bottom fw-bold" style="width: ${daysInCurrentYear * this.cellWidth}px; flex: none;">${currentYear}</div>`;
                    }
                    currentYear = yearNum;
                    daysInCurrentYear = 1;
                } else {
                    daysInCurrentYear++;
                }

                // Bottom header (Months)
                if (monthNum !== currentMonth) {
                    if (currentMonth !== -1) {
                        headersHtml += `<div class="gantt-day text-center border-end border-bottom" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none; font-size: 0.8em; padding: 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currentMonthName}</div>`;
                    }
                    currentMonth = monthNum;
                    currentMonthName = monthName;
                    daysInCurrentMonth = 1;
                } else {
                    daysInCurrentMonth++;
                }
            }
            if (daysInCurrentYear > 0) {
                topHeadersHtml += `<div class="gantt-month text-center border-end border-bottom fw-bold" style="width: ${daysInCurrentYear * this.cellWidth}px; flex: none;">${currentYear}</div>`;
            }
            if (daysInCurrentMonth > 0) {
                headersHtml += `<div class="gantt-day text-center border-end border-bottom" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none; font-size: 0.8em; padding: 2px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currentMonthName}</div>`;
            }
        }

        const { html: tasksHtml, maxRow, rowMap, renderedTasks } = this.generateTasksHtml(plan, startDate, endDate);

        // Calculate the required height to ensure the grid background goes down properly
        const requiredHeight = Math.max(300, (maxRow + 2) * this.rowHeight); // At least 300px, or tall enough for the rows + padding

        // Save scroll position before re-rendering
        let savedScrollTop = 0;
        let savedScrollLeft = 0;
        const ganttWrapper = this.container.querySelector('.gantt-wrapper');
        if (ganttWrapper) {
            savedScrollTop = ganttWrapper.scrollTop;
            savedScrollLeft = ganttWrapper.scrollLeft;
        }

        // Generate dependencies SVG
        let dependenciesHtml = '';
        if (window.PlannerState && window.PlannerState.getShowDependencies()) {
            dependenciesHtml = this.generateDependencyArrows(renderedTasks, requiredHeight, totalWidth);
        }

        // Generate markers
        let markersHtml = '';
        if (plan.markers && plan.markers.length > 0) {
            const plannerState = window.PlannerState || (window.UIController ? window.UIController.planner : null);

            plan.markers.forEach(marker => {
                // Check individual marker visibility
                if (marker.visible === false) return;

                // Check visibility state for the marker based on its importance
                if (plannerState) {
                    const importance = marker.importance || 'minor';
                    if (importance === 'major' && !plannerState.getShowMarkerMajor()) return;
                    if (importance === 'minor' && !plannerState.getShowMarkerMinor()) return;
                    if (importance === 'note' && !plannerState.getShowMarkerNote()) return;
                }

                const markerColor = marker.color || '#ff4d4d';
                const safeLabel = this.escapeHtml(marker.label || 'Marker');
                const importanceClass = marker.importance ? `marker-${marker.importance}` : 'marker-minor';

                if (marker.type === 'horizontal') {
                    // Map the requested row to the visual row if filtering/compacting
                    const rawRowIndex = (marker.row !== undefined && marker.row > 0) ? marker.row - 1 : 0;
                    const mappedRowIndex = rowMap.has(rawRowIndex) ? rowMap.get(rawRowIndex) : rawRowIndex;
                    
                    // Top position should be at the very top edge of the row
                    const topPos = mappedRowIndex * this.rowHeight;

                    const repeats = marker.repeats !== false; // default to true if undefined
                    const labelContent = repeats ? this.repeatString(safeLabel, 20) : `<span>${safeLabel}</span>`;
                    const repeatClass = repeats ? 'repeats' : 'no-repeats';

                    markersHtml += `
                        <div class="gantt-marker-horizontal ${importanceClass}" style="top: ${topPos}px; border-top-color: ${markerColor}; width: ${totalWidth}px;">
                            <div class="gantt-marker-horizontal-label ${repeatClass}" style="color: ${markerColor};">
                                ${labelContent}
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
                            <div class="gantt-marker ${importanceClass}" style="left: ${leftPos + (this.cellWidth/2)}px; border-left-color: ${markerColor}; min-height: ${requiredHeight + 50}px;">
                                <div class="gantt-marker-label ${repeatClass}" style="color: ${markerColor};">
                                    ${labelContent}
                                </div>
                            </div>
                        `;
                    }
                }
            });
        }

        const legendHtml = this.generateLegendHtml(plan);
        // Generate Row Numbers HTML
        let rowNumbersHtml = '';

        // Reverse rowMap to map visual row back to original row index
        const reversedRowMap = new Map();
        for (const [orig, mapped] of rowMap.entries()) {
            reversedRowMap.set(mapped, orig);
        }

        for (let i = 0; i <= maxRow; i++) {
            const originalRowIndex = reversedRowMap.has(i) ? reversedRowMap.get(i) : i;
            const displayRowNumber = originalRowIndex + 1; // 1-based index
            // Height is rowHeight. We align top border
            rowNumbersHtml += `
                <div class="gantt-row-number" style="height: ${this.rowHeight}px; width: 40px;">
                    ${displayRowNumber}
                    <button class="gantt-insert-row-btn" data-row-index="${displayRowNumber}" title="Insert row above">Insert row above</button>
                </div>`;
        }

        // Adjust top header heights for syncing
        // The gantt header has two parts: months (padding 2px 0) and days (padding 2px 0).
        // We will compute their combined height, but since they rely on CSS padding and fonts,
        // a simple approach is to use a container that perfectly matches their height.
        // Actually, let's just use the same classes or explicit heights.
        // In original: top headers are font-size: 0.9em (implied by gantt-month) or fw-bold, days font-size: 0.8em/0.7em
        // The sticky headers top-0 and top: 25px. So total height is roughly 25px + ~23px = 48px.

        this.container.innerHTML = `
            <div class="d-flex" style="width: 100%; height: 100%; overflow: hidden;">
                <!-- Left Sidebar for Row Numbers -->
                <div class="gantt-sidebar d-flex flex-column z-3" style="width: 40px; flex-shrink: 0; background-color: #f8f9fa; border-right: 1px solid #dee2e6;">
                    <div class="gantt-sidebar-header bg-white border-bottom" style="height: 48px; flex: none;">
                        <!-- Placeholder to match Gantt header height -->
                    </div>
                    <div class="gantt-sidebar-rows flex-grow-1 overflow-hidden" style="position: relative;">
                        <div class="gantt-sidebar-rows-content" style="position: absolute; top: 0; left: 0; width: 100%; margin-top: 8px;">
                            ${rowNumbersHtml}
                        </div>
                    </div>
                </div>

                <!-- Gantt Content Wrapper -->
                <div class="gantt-wrapper position-relative" style="flex-grow: 1; height: 100%; overflow: auto;" id="gantt-wrapper-scroll">
                    <div class="gantt-content" style="width: ${totalWidth}px; min-height: 100%; position: relative;">
                        <!-- Headers -->
                        <div class="gantt-header d-flex position-sticky top-0 bg-white z-2" id="gantt-header-top">
                            <div class="gantt-months d-flex w-100">
                                ${topHeadersHtml}
                            </div>
                        </div>
                        <div class="gantt-header-days d-flex position-sticky bg-white z-2" style="top: 25px;" id="gantt-header-bottom">
                            ${headersHtml}
                        </div>

                        <!-- Grid Background -->
                        <div class="gantt-grid position-absolute top-0 bottom-0 d-flex z-0" style="left: 0; right: 0; pointer-events: none; min-height: ${requiredHeight + 50}px;">
                            ${this.generateGridLines(totalDays, zoomLevel, startDate)}
                        </div>

                        <!-- Markers -->
                        ${markersHtml}

                        <!-- Rows Container -->
                        <div class="gantt-rows mt-2 position-relative z-1" style="min-height: ${requiredHeight}px;">
                            ${dependenciesHtml}
                            ${tasksHtml}
                        </div>
                    </div>
                </div>
            </div>
            ${legendHtml}
        `;

        // Sync vertical scrolling between wrapper and sidebar
        const wrapper = this.container.querySelector('#gantt-wrapper-scroll');
        const sidebarRows = this.container.querySelector('.gantt-sidebar-rows-content');
        const sidebarHeader = this.container.querySelector('.gantt-sidebar-header');
        const ganttHeaderTop = this.container.querySelector('#gantt-header-top');
        const ganttHeaderBottom = this.container.querySelector('#gantt-header-bottom');

        if (wrapper && sidebarRows) {
            wrapper.addEventListener('scroll', () => {
                sidebarRows.style.transform = `translateY(-${wrapper.scrollTop}px)`;
            });

            // Adjust sidebar header height dynamically just in case it differs from 48px
            setTimeout(() => {
                if (ganttHeaderTop && ganttHeaderBottom) {
                    const topHeight = ganttHeaderTop.offsetHeight;
                    const bottomHeight = ganttHeaderBottom.offsetHeight;
                    sidebarHeader.style.height = `${topHeight + bottomHeight}px`;
                    // Adjust bottom header top offset dynamically to match top height
                    ganttHeaderBottom.style.top = `${topHeight}px`;
                }
            }, 0);
        }


        // Restore scroll position after re-rendering
        const newGanttWrapper = this.container.querySelector('.gantt-wrapper');
        if (newGanttWrapper) {
            // Need to set timeout to allow DOM to render before setting scroll position sometimes,
            // but setting it directly usually works since it's synchronous after innerHTML.
            newGanttWrapper.scrollTop = savedScrollTop;
            newGanttWrapper.scrollLeft = savedScrollLeft;
        }

        // Bind events for tasks
        this.bindTaskEvents();
        this.bindLegendEvents();
        this.bindRowEvents();
        this.bindBackgroundEvents();
    }

    generateTasksHtml(plan, planStartDate, planEndDate) {
        if (!plan.tasks || plan.tasks.length === 0) return { html: '', maxRow: 0 };

        const filterState = window.PlannerState.getFilterState();
        let tasksHtml = '';

        // Filter and collect tasks
        const visibleTasks = [];
        plan.tasks.forEach(task => {
            const taskStart = this.getSafeDate(task.startDate);
            const taskEnd = this.getSafeDate(task.endDate);

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
        const renderedTasks = [];

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

            // Check if there is a status and corresponding color
            let statusBorderStyle = '';
            const plannerState = window.PlannerState || (window.UIController ? window.UIController.planner : null);
            if (task.status && plannerState && typeof plannerState.getStatusColors === 'function') {
                const statusColors = plannerState.getStatusColors();
                if (statusColors[task.status]) {
                    statusBorderStyle = `--status-shadow: inset 6px 0 0 ${statusColors[task.status]};`;
                }
            }

            const isSelected = plannerState ? plannerState.isTaskSelected(task.id) : false;
            const selectedClass = isSelected ? 'selected' : '';

            const safeTitle = this.escapeHtml(task.title || 'Untitled');
            const safeId = this.escapeHtml(task.id || '');

            // Apply visual mode styles if it's highlight mode and it doesn't match
            const opacityStyle = (filterState.visualMode === 'highlight' && !isMatch) ? 'opacity: 0.3;' : '';
            const pointerEventsStyle = (filterState.visualMode === 'highlight' && !isMatch) ? 'pointer-events: none;' : '';

            let effortHtml = '';
            if (plannerState && plannerState.getShowEffortPerDay()) {
                const totalEffort = (task.effort?.design || 0) + (task.effort?.dev || 0) + (task.effort?.test || 0);

                let workingDays = 0;
                let current = new Date(taskStart);
                while (current <= taskEnd) {
                    const dayOfWeek = current.getDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                        workingDays++;
                    }
                    current.setDate(current.getDate() + 1);
                }

                if (workingDays > 0) {
                    const effortPerDay = (totalEffort / workingDays).toFixed(1);
                    effortHtml = `<div class="gantt-task-effort">${effortPerDay}</div>`;
                }
            }

            renderedTasks.push({
                id: task.id,
                dependencies: task.dependencies || [],
                left: leftPos,
                top: topPos,
                width: width,
                height: taskHeight
            });

            tasksHtml += `
                <div class="gantt-task ${selectedClass}" data-task-id="${safeId}" style="
                    left: ${leftPos}px;
                    width: ${width}px;
                    top: ${topPos}px;
                    height: ${taskHeight}px;
                    background-color: ${fillColor};
                    border-color: ${borderColor};
                    ${statusBorderStyle}
                    ${opacityStyle}
                    ${pointerEventsStyle}
                ">
                    <div class="gantt-resize-handle left" data-resize="left"></div>
                    <div class="gantt-task-content">
                        <strong>${safeId}</strong><br>
                        ${safeTitle}
                    </div>
                    ${effortHtml}
                    <div class="gantt-task-controls">
                        <button class="gantt-task-control-btn sync-plan-btn" title="Sync to Plan">⇄</button>
                        <button class="gantt-task-control-btn sync-all-btn" title="Sync to All Plans">⇶</button>
                        <button class="gantt-task-control-btn duplicate-btn" title="Duplicate Task">⧉</button>
                        <button class="gantt-task-control-btn delete-btn" title="Delete Task">🗑</button>
                        <button class="gantt-task-control-btn link-btn" title="Open Link">🔗</button>
                    </div>
                    <div class="gantt-resize-handle right" data-resize="right"></div>
                </div>
            `;
        });

        return { html: tasksHtml, maxRow, rowMap, renderedTasks };
    }

    generateDependencyArrows(renderedTasks, containerHeight, containerWidth) {
        if (!renderedTasks || renderedTasks.length === 0) return '';

        let svgContent = '';
        const taskMap = new Map();
        renderedTasks.forEach(rt => taskMap.set(rt.id, rt));

        renderedTasks.forEach(rt => {
            if (rt.dependencies && rt.dependencies.length > 0) {
                rt.dependencies.forEach(depId => {
                    const depTask = taskMap.get(depId);
                    if (depTask) {
                        // Arrow from depTask to rt (dependent task)
                        const startX = depTask.left + depTask.width;
                        const startY = depTask.top + (depTask.height / 2);
                        const endX = rt.left;
                        const endY = rt.top + (rt.height / 2);

                        let pathD = '';
                        const r = 5; // corner radius

                        // Right-angled path
                        if (Math.abs(startY - endY) < 5) {
                            // Same row, straight line
                            pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                        } else {
                            // Different rows, need right angles
                            const midX = startX + 10;
                            const midX2 = endX - 20;

                            // To make corners rounded, we use arcs
                            const yDir = endY > startY ? 1 : -1;

                            if (endX > startX + 30) {
                                // Normal case: dependent task is to the right
                                pathD = `M ${startX} ${startY} ` +
                                        `L ${midX2 - r} ${startY} ` +
                                        `Q ${midX2} ${startY} ${midX2} ${startY + r * yDir} ` +
                                        `L ${midX2} ${endY - r * yDir} ` +
                                        `Q ${midX2} ${endY} ${midX2 + r} ${endY} ` +
                                        `L ${endX} ${endY}`;
                            } else {
                                // Dependent task is to the left or directly below/above
                                const dropY = startY + (depTask.height / 2) + 5 * yDir;

                                pathD = `M ${startX} ${startY} ` +
                                        `L ${startX + 10 - r} ${startY} ` +
                                        `Q ${startX + 10} ${startY} ${startX + 10} ${startY + r * yDir} ` +
                                        `L ${startX + 10} ${dropY - r * yDir} ` +
                                        `Q ${startX + 10} ${dropY} ${startX + 10 - r} ${dropY} ` +
                                        `L ${endX - 20 + r} ${dropY} ` +
                                        `Q ${endX - 20} ${dropY} ${endX - 20} ${dropY + r * yDir} ` +
                                        `L ${endX - 20} ${endY - r * yDir} ` +
                                        `Q ${endX - 20} ${endY} ${endX - 20 + r} ${endY} ` +
                                        `L ${endX} ${endY}`;
                            }
                        }

                        svgContent += `
                            <path d="${pathD}"
                                  fill="none"
                                  stroke="rgba(128, 128, 128, 0.5)"
                                  stroke-width="3"
                                  stroke-linejoin="round"
                                  marker-end="url(#arrowhead)" />
                        `;
                    }
                });
            }
        });

        if (!svgContent) return '';

        return `
            <svg class="gantt-dependencies-svg" style="position: absolute; top: 0; left: 0; width: ${containerWidth}px; height: ${containerHeight}px; pointer-events: none; z-index: 25;">
                <defs>
                    <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                        <polygon points="0 0, 6 2, 0 4" fill="rgba(128, 128, 128, 0.5)" />
                    </marker>
                </defs>
                ${svgContent}
            </svg>
        `;
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
        let dragGroup = []; // Elements and their initial positions for group dragging
        const MOVE_THRESHOLD = 3;

        const onMouseMove = (e) => {
            if (!activeTaskEl) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            if (!hasMoved && (Math.abs(deltaX) > MOVE_THRESHOLD || Math.abs(deltaY) > MOVE_THRESHOLD)) {
                hasMoved = true;
                if (isDragging) {
                    dragGroup.forEach(item => item.el.classList.add('dragging'));
                }
                if (isResizing) activeTaskEl.classList.add('resizing');
            }

            if (!hasMoved) return;

            if (isDragging) {
                // Determine bounding box limits for the group
                let minAllowedDeltaX = -Infinity;
                let minAllowedDeltaY = -Infinity;

                dragGroup.forEach(item => {
                    // Item cannot go left of 0
                    const itemMinDeltaX = 0 - item.initialLeft;
                    if (itemMinDeltaX > minAllowedDeltaX) {
                        minAllowedDeltaX = itemMinDeltaX;
                    }
                    // Item cannot go above taskMargin
                    const itemMinDeltaY = this.taskMargin - item.initialTop;
                    if (itemMinDeltaY > minAllowedDeltaY) {
                        minAllowedDeltaY = itemMinDeltaY;
                    }
                });

                let safeDeltaX = Math.max(deltaX, minAllowedDeltaX);
                let safeDeltaY = Math.max(deltaY, minAllowedDeltaY);

                // Apply to all selected elements
                dragGroup.forEach(item => {
                    item.el.style.left = `${item.initialLeft + safeDeltaX}px`;
                    item.el.style.top = `${item.initialTop + safeDeltaY}px`;
                });
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

            activeTaskEl.classList.remove('resizing');
            dragGroup.forEach(item => item.el.classList.remove('dragging'));

            if (hasMoved) {
                const plan = window.PlannerState.getCurrentPlan();
                if (plan) {
                    // Format dates to YYYY-MM-DD
                    const formatDate = (date) => {
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                        const dd = String(date.getDate()).padStart(2, '0');
                        return `${yyyy}-${mm}-${dd}`;
                    };
                    const planStartDate = this.getSafeDate(plan.timeline.startDate);

                    if (isDragging) {
                        // Apply drop logic for the whole group based on delta
                        const finalLeft = parseFloat(activeTaskEl.style.left);
                        const finalTop = parseFloat(activeTaskEl.style.top);

                        const initialDaysOffset = Math.round(initialLeft / this.cellWidth);
                        const snappedDaysOffset = Math.round(finalLeft / this.cellWidth);
                        const daysDelta = snappedDaysOffset - initialDaysOffset;

                        const initialRowIndex = Math.max(0, Math.round((initialTop - this.taskMargin) / this.rowHeight));
                        const snappedRowIndex = Math.max(0, Math.round((finalTop - this.taskMargin) / this.rowHeight));
                        const rowDelta = snappedRowIndex - initialRowIndex;

                        if (daysDelta !== 0 || rowDelta !== 0) {
                            dragGroup.forEach(item => {
                                const t = plan.tasks.find(tsk => tsk.id === item.taskId);
                                if (t) {
                                    // Calculate existing start/end as offsets
                                    const taskStart = this.getSafeDate(t.startDate);
                                    const taskEnd = this.getSafeDate(t.endDate);

                                    const currentDaysOffset = Math.floor((taskStart - planStartDate) / (1000 * 60 * 60 * 24));
                                    const durationDays = Math.floor((taskEnd - taskStart) / (1000 * 60 * 60 * 24)); // -1 day effectively handles it correctly based on logic

                                    const newStartDate = new Date(planStartDate);
                                    newStartDate.setDate(planStartDate.getDate() + currentDaysOffset + daysDelta);

                                    const newEndDate = new Date(newStartDate);
                                    newEndDate.setDate(newStartDate.getDate() + durationDays);

                                    t.startDate = formatDate(newStartDate);
                                    t.endDate = formatDate(newEndDate);

                                    const currentRow = (t.row !== undefined && t.row > 0) ? t.row : 1;
                                    t.row = Math.max(1, currentRow + rowDelta);
                                }
                            });
                            this.render(plan);
                        } else {
                            // If no actual logical delta, snap them all back to their initial spot visually
                            dragGroup.forEach(item => {
                                item.el.style.left = `${item.initialLeft}px`;
                                item.el.style.top = `${item.initialTop}px`;
                            });
                        }


                    } else if (isResizing) {
                        // Handle resize logic for single active task
                        const task = plan.tasks.find(t => t.id === activeTaskId);
                        if (task) {
                            const finalLeft = parseFloat(activeTaskEl.style.left);
                            const finalWidth = parseFloat(activeTaskEl.style.width);

                            const snappedDaysOffset = Math.round(finalLeft / this.cellWidth);
                            const snappedDurationDays = Math.round(finalWidth / this.cellWidth);

                            const newStartDate = new Date(planStartDate);
                            newStartDate.setDate(planStartDate.getDate() + snappedDaysOffset);

                            const newEndDate = new Date(newStartDate);
                            newEndDate.setDate(newStartDate.getDate() + snappedDurationDays - 1); // duration includes start day

                            task.startDate = formatDate(newStartDate);
                            task.endDate = formatDate(newEndDate);

                            // Force re-render with snapped positions
                            this.render(plan);
                        }
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
            dragGroup = [];
        };

        tasks.forEach(taskEl => {
            taskEl.addEventListener('mousedown', (e) => {
                // Ignore clicks on task control buttons
                if (e.target.closest('.gantt-task-control-btn')) {
                    return;
                }

                activeTaskId = taskEl.getAttribute('data-task-id');

                // Handle Selection Logic
                if (window.PlannerState) {
                    if (e.ctrlKey || e.metaKey) {
                        // Toggle selection
                        window.PlannerState.toggleTaskSelection(activeTaskId);
                        this.render(window.PlannerState.getCurrentPlan());
                        return; // Stop drag initiation on ctrl click
                    } else if (!window.PlannerState.isTaskSelected(activeTaskId)) {
                        // Clicked an unselected task without ctrl: clear others and select this one
                        window.PlannerState.setSelectedTaskIds([activeTaskId]);
                        this.render(window.PlannerState.getCurrentPlan());
                        // Need to re-acquire the element since we just re-rendered
                        taskEl = this.container.querySelector(`.gantt-task[data-task-id="${activeTaskId}"]`);
                        if (!taskEl) return;
                    }
                }

                // Determine if we clicked a resize handle or the task body
                activeTaskEl = taskEl;
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

                // Initialize drag group
                dragGroup = [];
                if (isDragging && window.PlannerState) {
                    const selectedIds = window.PlannerState.getSelectedTaskIds();
                    selectedIds.forEach(id => {
                        const el = this.container.querySelector(`.gantt-task[data-task-id="${id}"]`);
                        if (el) {
                            dragGroup.push({
                                el: el,
                                taskId: id,
                                initialLeft: parseFloat(el.style.left) || 0,
                                initialTop: parseFloat(el.style.top) || 0
                            });
                        }
                    });
                }

                // Prevent text selection during drag
                e.preventDefault();

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });

            // Handle control buttons
            const syncPlanBtn = taskEl.querySelector('.sync-plan-btn');
            const syncAllBtn = taskEl.querySelector('.sync-all-btn');
            const duplicateBtn = taskEl.querySelector('.duplicate-btn');
            const deleteBtn = taskEl.querySelector('.delete-btn');
            const linkBtn = taskEl.querySelector('.link-btn');
            const taskId = taskEl.getAttribute('data-task-id');

            if (syncPlanBtn) {
                syncPlanBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.container.dispatchEvent(new CustomEvent('sync-plan-request', {
                        detail: { taskId },
                        bubbles: true
                    }));
                });
            }

            if (syncAllBtn) {
                syncAllBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.container.dispatchEvent(new CustomEvent('sync-all-request', {
                        detail: { taskId },
                        bubbles: true
                    }));
                });
            }

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

    generateGridLines(totalDays, zoomLevel, startDate) {
        let lines = '';

        if (zoomLevel === 'daily') {
            for (let i = 0; i < totalDays; i++) {
                lines += `<div class="gantt-grid-line border-end" style="width: ${this.cellWidth}px; flex: none;"></div>`;
            }
        } else if (zoomLevel === 'weekly' || zoomLevel === 'fortnight') {
            const periodDays = zoomLevel === 'weekly' ? 7 : 14;
            let daysInCurrentPeriod = 0;
            for (let i = 0; i < totalDays; i++) {
                daysInCurrentPeriod++;
                if (daysInCurrentPeriod === periodDays || i === totalDays - 1) {
                    lines += `<div class="gantt-grid-line border-end" style="width: ${daysInCurrentPeriod * this.cellWidth}px; flex: none;"></div>`;
                    daysInCurrentPeriod = 0;
                }
            }
        } else if (zoomLevel === 'monthly') {
            let currentMonth = -1;
            let daysInCurrentMonth = 0;
            for (let i = 0; i < totalDays; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                const monthNum = date.getMonth();

                if (monthNum !== currentMonth) {
                    if (currentMonth !== -1) {
                        lines += `<div class="gantt-grid-line border-end" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none;"></div>`;
                    }
                    currentMonth = monthNum;
                    daysInCurrentMonth = 1;
                } else {
                    daysInCurrentMonth++;
                }
            }
            if (daysInCurrentMonth > 0) {
                lines += `<div class="gantt-grid-line border-end" style="width: ${daysInCurrentMonth * this.cellWidth}px; flex: none;"></div>`;
            }
        }
        return lines;
    }

    generateLegendHtml() {
        if (!window.PlannerState) return '';

        const fillLegends = window.PlannerState.getFillLegends();
        const borderLegends = window.PlannerState.getBorderLegends();
        const statusColors = window.PlannerState.getStatusColors();

        const collapsedClass = this.isLegendCollapsed ? 'collapsed' : '';
        const arrow = this.isLegendCollapsed ? '▲' : '▼';

        let html = `
            <div class="gantt-legend ${collapsedClass}" id="ganttLegend">
                <div class="gantt-legend-header" id="ganttLegendHeader">
                    <span>Legend</span>
                    <span id="ganttLegendArrow">${arrow}</span>
                </div>
                <div class="gantt-legend-content">
        `;

        // Fill Colors
        if (fillLegends && fillLegends.length > 0) {
            html += `<div class="gantt-legend-section"><h6>Fill Colors</h6>`;
            fillLegends.forEach(legend => {
                const label = this.escapeHtml(legend.label);
                html += `
                    <div class="gantt-legend-item">
                        <div class="gantt-legend-color-box" style="background-color: ${legend.color};"></div>
                        <span>${label}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Border Colors
        if (borderLegends && borderLegends.length > 0) {
            html += `<div class="gantt-legend-section"><h6>Border Colors</h6>`;
            borderLegends.forEach(legend => {
                const label = this.escapeHtml(legend.label);
                html += `
                    <div class="gantt-legend-item">
                        <div class="gantt-legend-color-box" style="border: 2px solid ${legend.color}; background-color: transparent;"></div>
                        <span>${label}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Status Colors
        if (statusColors && Object.keys(statusColors).length > 0) {
            html += `<div class="gantt-legend-section"><h6>Status Indicators</h6>`;
            for (const [status, color] of Object.entries(statusColors)) {
                const label = this.escapeHtml(status);
                html += `
                    <div class="gantt-legend-item">
                        <div class="gantt-legend-color-box" style="box-shadow: inset 6px 0 0 ${color}; background-color: #f8f9fa;"></div>
                        <span>${label}</span>
                    </div>
                `;
            }
            html += `</div>`;
        }

        html += `
                </div>
            </div>
        `;

        return html;
    }

    bindBackgroundEvents() {
        if (!this.container) return;
        const ganttContent = this.container.querySelector('.gantt-content');
        if (ganttContent) {
            ganttContent.addEventListener('mousedown', (e) => {
                // If the click is directly on the background (not on a task)
                if (!e.target.closest('.gantt-task') && !e.target.closest('.gantt-marker-horizontal') && !e.target.closest('.gantt-marker') && !e.target.closest('.gantt-row-number')) {
                    if (window.PlannerState) {
                        const selectedIds = window.PlannerState.getSelectedTaskIds();
                        if (selectedIds && selectedIds.length > 0) {
                            window.PlannerState.clearTaskSelection();
                            this.render(window.PlannerState.getCurrentPlan());
                        }
                    }
                }
            });
        }
    }

    bindRowEvents() {
        if (!this.container) return;
        const insertBtns = this.container.querySelectorAll('.gantt-insert-row-btn');
        insertBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const rowIndex = parseInt(btn.getAttribute('data-row-index'), 10);
                if (!isNaN(rowIndex) && window.PlannerState) {
                    if (window.PlannerState.insertRowBefore(rowIndex)) {
                        if (window.UIController) {
                            window.UIController.updateUI();
                        } else {
                            this.render(window.PlannerState.getCurrentPlan());
                        }
                    }
                }
            });
        });
    }

    bindLegendEvents() {
        const header = document.getElementById('ganttLegendHeader');
        if (header) {
            header.addEventListener('click', () => {
                this.isLegendCollapsed = !this.isLegendCollapsed;
                const legend = document.getElementById('ganttLegend');
                const arrow = document.getElementById('ganttLegendArrow');

                if (this.isLegendCollapsed) {
                    legend.classList.add('collapsed');
                    arrow.textContent = '▲';
                } else {
                    legend.classList.remove('collapsed');
                    arrow.textContent = '▼';
                }
            });
        }
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
