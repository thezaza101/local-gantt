/* Analytics Engine */

class Analytics {
    constructor(plannerState) {
        this.planner = plannerState;
        this.charts = {}; // Store chart instances to destroy them before re-rendering

        // Setup predefined colors for charts
        this.chartColors = [
            '#4da3ff', '#ff6b6b', '#51cf66', '#fcc419', '#20c997',
            '#cc5de8', '#ff922b', '#845ef7', '#339af0', '#f06595'
        ];

        // Analytics-specific filter state
        this.filterState = {
            selectedTags: [],
            startDate: '',
            endDate: ''
        };
    }

    /**
     * Filters tasks based on the Analytics panel filter state.
     * @param {Object} plan The plan object containing tasks.
     * @returns {Array} Filtered list of tasks.
     */
    getFilteredTasks(plan) {
        if (!plan || !plan.tasks) return [];

        let filtered = plan.tasks;

        // Apply Tag Filter (OR logic)
        if (this.filterState.selectedTags && this.filterState.selectedTags.length > 0) {
            filtered = filtered.filter(task => {
                const taskTags = (task.tags || []).map(t => t.trim()).filter(t => t);
                return this.filterState.selectedTags.some(tag => taskTags.includes(tag));
            });
        }

        // Apply Date Range Filter (Overlap logic)
        if (this.filterState.startDate || this.filterState.endDate) {
            const startStr = this.filterState.startDate;
            const endStr = this.filterState.endDate;

            let filterStart = new Date(-8640000000000000); // Min date
            if (startStr) {
                const parts = startStr.split('-');
                if (parts.length === 3) filterStart = new Date(parts[0], parts[1] - 1, parts[2]);
            }

            let filterEnd = new Date(8640000000000000); // Max date
            if (endStr) {
                const parts = endStr.split('-');
                if (parts.length === 3) filterEnd = new Date(parts[0], parts[1] - 1, parts[2]);
            }

            // Ensure valid Date objects
            if (!isNaN(filterStart) && !isNaN(filterEnd)) {
                filtered = filtered.filter(task => {
                    if (!task.startDate || !task.endDate) return false;

                    const startParts = task.startDate.split('-');
                    const endParts = task.endDate.split('-');
                    if (startParts.length !== 3 || endParts.length !== 3) return false;

                    const taskStart = new Date(startParts[0], startParts[1] - 1, startParts[2]);
                    const taskEnd = new Date(endParts[0], endParts[1] - 1, endParts[2]);

                    if (isNaN(taskStart) || isNaN(taskEnd)) return false;

                    // Task overlaps with filter range if its start is before the filter end AND its end is after the filter start
                    return taskStart <= filterEnd && taskEnd >= filterStart;
                });
            }
        }

        return filtered;
    }

    /**
     * Extracts all unique tags from the tasks in the current plan.
     * @returns {string[]} An array of unique tag strings, sorted alphabetically.
     */
    getUniqueTags() {
        const plan = this.planner.getCurrentPlan();
        if (!plan || !plan.tasks) return [];

        const tags = new Set();
        plan.tasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
                task.tags.forEach(tag => {
                    const t = tag.trim();
                    if (t) tags.add(t);
                });
            }
        });

        return Array.from(tags).sort((a, b) => a.localeCompare(b));
    }

    /**
     * Determines if a task matches the selected tags based on the match mode.
     * @param {Object} task The task object.
     * @param {string[]} selectedTags Array of selected tags.
     * @param {string} matchMode 'any' (OR) or 'all' (AND).
     * @returns {boolean} True if the task matches, false otherwise.
     */
    taskMatchesTags(task, selectedTags, matchMode = 'any') {
        if (!selectedTags || selectedTags.length === 0) {
            // If no tags are selected, by default we show everything or nothing?
            // Usually, no filters = show everything.
            return true;
        }

        const taskTags = (task.tags || []).map(t => t.trim()).filter(t => t);

        if (matchMode === 'any') {
            // OR condition: task must have at least one of the selected tags
            return selectedTags.some(tag => taskTags.includes(tag));
        } else if (matchMode === 'all') {
            // AND condition: task must have ALL of the selected tags
            return selectedTags.every(tag => taskTags.includes(tag));
        }

        return true;
    }

    /**
     * Calculates total effort for each tag across given tasks.
     * @param {Object} plan - The plan data model
     * @param {Array} filteredTasks - The list of tasks to include in the calculation
     * @returns {Object} Data object for Effort by Tag { labels: [...], values: [...] }
     */
    calculateEffortByTag(plan, filteredTasks) {
        if (!plan || !filteredTasks) return { labels: [], values: [] };

        const tagEffortMap = {};

        filteredTasks.forEach(task => {
            const effort = task.effort || { design: 0, dev: 0, test: 0 };
            const totalEffort = (effort.design || 0) + (effort.dev || 0) + (effort.test || 0);

            if (totalEffort > 0 && task.tags && Array.isArray(task.tags)) {
                task.tags.forEach(tag => {
                    const t = tag.trim();
                    if (t) {
                        tagEffortMap[t] = (tagEffortMap[t] || 0) + totalEffort;
                    }
                });
            }
        });

        // Convert map to sorted arrays
        const labels = Object.keys(tagEffortMap).sort((a, b) => tagEffortMap[b] - tagEffortMap[a]); // Sort descending by effort
        const values = labels.map(label => tagEffortMap[label]);

        return { labels, values };
    }

    /**
     * Calculates total effort by task status.
     * @param {Object} plan - The plan data model
     * @param {Array} filteredTasks - The list of tasks to include in the calculation
     * @returns {Object} Data object for Effort by Status { labels: [...], values: [...] }
     */
    calculateEffortByStatus(plan, filteredTasks) {
        if (!plan || !filteredTasks) return { labels: [], values: [] };

        const statusEffortMap = {};

        filteredTasks.forEach(task => {
            const effort = task.effort || { design: 0, dev: 0, test: 0 };
            const totalEffort = (effort.design || 0) + (effort.dev || 0) + (effort.test || 0);

            if (totalEffort > 0) {
                const status = task.status || 'None';
                statusEffortMap[status] = (statusEffortMap[status] || 0) + totalEffort;
            }
        });

        // Convert map to sorted arrays
        const labels = Object.keys(statusEffortMap).sort((a, b) => statusEffortMap[b] - statusEffortMap[a]); // Sort descending by effort
        const values = labels.map(label => statusEffortMap[label]);

        return { labels, values };
    }

    /**
     * Calculates task count by status.
     * @param {Object} plan - The plan data model
     * @param {Array} filteredTasks - The list of tasks to include in the calculation
     * @returns {Object} Data object for Task Count by Status { labels: [...], values: [...] }
     */
    calculateTaskCountByStatus(plan, filteredTasks) {
        if (!plan || !filteredTasks) return { labels: [], values: [] };

        const statusCountMap = {};

        filteredTasks.forEach(task => {
            const status = task.status || 'None';
            statusCountMap[status] = (statusCountMap[status] || 0) + 1;
        });

        // Convert map to sorted arrays
        const labels = Object.keys(statusCountMap).sort((a, b) => statusCountMap[b] - statusCountMap[a]); // Sort descending by count
        const values = labels.map(label => statusCountMap[label]);

        return { labels, values };
    }

    /**
     * Calculates total effort by work type (design, dev, test) across given tasks.
     * @param {Object} plan - The plan data model
     * @param {Array} filteredTasks - The list of tasks to include in the calculation
     * @returns {Object} Data object for Effort by Type { labels: ['Design', 'Dev', 'Test'], values: [...] }
     */
    calculateEffortByType(plan, filteredTasks) {
        if (!plan || !filteredTasks) return { labels: ['Design', 'Dev', 'Test'], values: [0, 0, 0] };

        let totalDesign = 0;
        let totalDev = 0;
        let totalTest = 0;

        filteredTasks.forEach(task => {
            const effort = task.effort || { design: 0, dev: 0, test: 0 };
            totalDesign += (effort.design || 0);
            totalDev += (effort.dev || 0);
            totalTest += (effort.test || 0);
        });

        return {
            labels: ['Design', 'Dev', 'Test'],
            values: [totalDesign, totalDev, totalTest]
        };
    }

    /**
     * Calculates total effort per task and returns top tasks sorted descending by effort.
     * @param {Object} plan - The plan data model
     * @param {Array} filteredTasks - The list of tasks to include in the calculation
     * @returns {Array} List of task objects { id, title, effort } sorted descending
     */
    calculateEffortByTask(plan, filteredTasks) {
        if (!plan || !filteredTasks) return [];

        const taskEffortList = filteredTasks.map(task => {
            const effort = task.effort || { design: 0, dev: 0, test: 0 };
            const totalEffort = (effort.design || 0) + (effort.dev || 0) + (effort.test || 0);
            return {
                id: task.id,
                title: task.title,
                effort: totalEffort
            };
        }).filter(item => item.effort > 0);

        taskEffortList.sort((a, b) => b.effort - a.effort);

        return taskEffortList;
    }

    /**
     * Calculates Demand vs Capacity summary.
     * Combines data from CapacityEngine and filters tasks to calculate demand.
     * @param {Object} plan - The plan data model
     * @param {Array} filteredTasks - The list of tasks to include in demand calculation
     * @returns {Array} List of objects { period, capacity, demand, utilization }
     */
    calculateDemandCapacity(plan, filteredTasks) {
        if (!plan || !window.CapacityEngine) return [];

        const capacityData = window.CapacityEngine.calculateExpandedCapacity(plan);

        // We need to calculate demand using ONLY the filtered tasks.
        // We create a temporary plan object just for the demand calculation.
        const tempPlan = {
            ...plan,
            tasks: filteredTasks
        };
        const demandData = window.CapacityEngine.calculateDemand(tempPlan);

        // Merge capacity and demand data by period
        const periodMap = new Map();

        capacityData.forEach(item => {
            periodMap.set(item.period, { capacity: item.capacity, demand: 0 });
        });

        demandData.forEach(item => {
            if (periodMap.has(item.period)) {
                periodMap.get(item.period).demand = item.demand;
            } else {
                periodMap.set(item.period, { capacity: 0, demand: item.demand });
            }
        });

        const result = [];
        let periods = Array.from(periodMap.keys()).sort();

        // If date range filter is active, filter out periods that fall entirely outside
        if (this.filterState.startDate || this.filterState.endDate) {
            let filterStart = new Date(-8640000000000000); // Min date
            if (this.filterState.startDate) {
                const parts = this.filterState.startDate.split('-');
                if (parts.length === 3) filterStart = new Date(parts[0], parts[1] - 1, parts[2]);
            }

            let filterEnd = new Date(8640000000000000); // Max date
            if (this.filterState.endDate) {
                const parts = this.filterState.endDate.split('-');
                if (parts.length === 3) filterEnd = new Date(parts[0], parts[1] - 1, parts[2]);
            }

            if (!isNaN(filterStart) && !isNaN(filterEnd)) {
                periods = periods.filter(period => {
                    const parts = period.split('-');
                    if (parts.length !== 2 && parts.length !== 3) return true; // keep if format is unexpected

                    const year = parseInt(parts[0], 10);
                    const subPeriod = parts[1];

                    let periodStart, periodEnd;

                    if (parts.length === 3) {
                        // Daily: e.g. "2024-01-01"
                        const m = parseInt(parts[1], 10);
                        const d = parseInt(parts[2], 10);
                        periodStart = new Date(year, m - 1, d);
                        periodEnd = new Date(year, m - 1, d);
                    } else if (subPeriod.startsWith('Q')) {
                        // Quarter: e.g. "2024-Q1"
                        const q = parseInt(subPeriod.substring(1), 10);
                        periodStart = new Date(year, (q - 1) * 3, 1);
                        periodEnd = new Date(year, q * 3, 0); // Last day of quarter
                    } else if (subPeriod.startsWith('W')) {
                        // Week: e.g. "2024-W01"
                        const w = parseInt(subPeriod.substring(1), 10);
                        // Approximate start of week (using ISO week logic)
                        const simple = new Date(year, 0, 1 + (w - 1) * 7);
                        const dow = simple.getDay();
                        const ISOweekStart = simple;
                        if (dow <= 4)
                            ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
                        else
                            ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());

                        periodStart = new Date(ISOweekStart);
                        periodEnd = new Date(ISOweekStart);
                        periodEnd.setDate(periodStart.getDate() + 6);
                    } else {
                        // Month: e.g. "2024-01"
                        const m = parseInt(subPeriod, 10);
                        periodStart = new Date(year, m - 1, 1);
                        periodEnd = new Date(year, m, 0); // Last day of month
                    }

                    // A period overlaps with the filter range if its start is before filterEnd AND its end is after filterStart
                    return periodStart <= filterEnd && periodEnd >= filterStart;
                });
            }
        }

        periods.forEach(period => {
            const data = periodMap.get(period);
            let utilization = 0;
            if (data.capacity > 0) {
                utilization = (data.demand / data.capacity) * 100;
            } else if (data.demand > 0) {
                utilization = Infinity; // Or some high number to indicate over capacity
            }

            result.push({
                period: period,
                capacity: data.capacity,
                demand: data.demand,
                utilization: utilization
            });
        });

        return result;
    }

    /**
     * Aggregates tasks by tag to calculate min start date, max end date, and status counts.
     * @param {Object} plan - The plan data model
     * @param {Array} filteredTasks - The list of tasks to include in the calculation
     * @returns {Object} Data object containing aggregated tag information and overall date range
     */
    calculateTagAggregates(plan, filteredTasks) {
        if (!plan || !filteredTasks || filteredTasks.length === 0) return { tags: [], minDate: null, maxDate: null };

        const tagMap = new Map();
        let overallMinDate = null;
        let overallMaxDate = null;

        filteredTasks.forEach(task => {
            if (!task.startDate || !task.endDate) return;

            const startParts = task.startDate.split('-');
            const endParts = task.endDate.split('-');
            if (startParts.length !== 3 || endParts.length !== 3) return;

            const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
            const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

            if (isNaN(startDate) || isNaN(endDate)) return;

            // Track overall min/max dates
            if (!overallMinDate || startDate < overallMinDate) overallMinDate = startDate;
            if (!overallMaxDate || endDate > overallMaxDate) overallMaxDate = endDate;

            const tags = task.tags && Array.isArray(task.tags) ? task.tags : [];
            const status = task.status || 'Not started';

            tags.forEach(tag => {
                const t = tag.trim();
                if (!t) return;

                if (!tagMap.has(t)) {
                    tagMap.set(t, {
                        tag: t,
                        minStartDate: startDate,
                        maxEndDate: endDate,
                        totalTasks: 0,
                        statusCounts: {}
                    });
                }

                const agg = tagMap.get(t);

                // Update min/max for this tag
                if (startDate < agg.minStartDate) agg.minStartDate = startDate;
                if (endDate > agg.maxEndDate) agg.maxEndDate = endDate;

                // Update counts
                agg.totalTasks++;
                agg.statusCounts[status] = (agg.statusCounts[status] || 0) + 1;
            });
        });

        // Convert Map to Array and sort by minStartDate
        const tags = Array.from(tagMap.values()).sort((a, b) => a.minStartDate - b.minStartDate);

        // For each tag, calculate status percentages
        tags.forEach(agg => {
            agg.statusPercentages = {};
            for (const [status, count] of Object.entries(agg.statusCounts)) {
                agg.statusPercentages[status] = (count / agg.totalTasks) * 100;
            }
        });

        return {
            tags: tags,
            minDate: overallMinDate,
            maxDate: overallMaxDate
        };
    }

    /**
     * Calculates effort by tag grouped by period.
     * @param {Object} plan - The plan data model
     * @param {Array} filteredTasks - The list of tasks to include in the calculation
     * @returns {Object} Data object { periods: [], datasets: [{ label: 'tag', data: [] }] }
     */
    calculateTagEffortByPeriod(plan, filteredTasks) {
        if (!plan || !filteredTasks || !window.CapacityEngine) return { periods: [], datasets: [] };

        const granularity = (plan.capacity && plan.capacity.granularity) ? plan.capacity.granularity : 'month';
        const tagPeriodMap = {}; // { tag: { period: effort } }
        const allPeriods = new Set();
        const tags = new Set();

        filteredTasks.forEach(task => {
            if (!task.startDate || !task.endDate) return;

            const startParts = task.startDate.split('-');
            const endParts = task.endDate.split('-');
            if (startParts.length !== 3 || endParts.length !== 3) return;

            const startDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
            const endDate = new Date(endParts[0], endParts[1] - 1, endParts[2]);

            if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) return;

            const effort = task.effort || { design: 0, dev: 0, test: 0 };
            const totalEffort = (effort.design || 0) + (effort.dev || 0) + (effort.test || 0);

            if (totalEffort <= 0 || !task.tags || !Array.isArray(task.tags)) return;

            // Calculate working days
            let workingDays = 0;
            let current = new Date(startDate);
            while (current <= endDate) {
                const dayOfWeek = current.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                    workingDays++;
                }
                current.setDate(current.getDate() + 1);
            }

            if (workingDays === 0) return;

            const effortPerDay = totalEffort / workingDays;

            // Distribute effort to tags per period
            task.tags.forEach(tag => {
                const t = tag.trim();
                if (!t) return;
                tags.add(t);

                if (!tagPeriodMap[t]) tagPeriodMap[t] = {};

                let currDay = new Date(startDate);
                while (currDay <= endDate) {
                    const dayOfWeek = currDay.getDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                        const periodKey = window.CapacityEngine.getPeriodKey(currDay, granularity);
                        allPeriods.add(periodKey);
                        tagPeriodMap[t][periodKey] = (tagPeriodMap[t][periodKey] || 0) + effortPerDay;
                    }
                    currDay.setDate(currDay.getDate() + 1);
                }
            });
        });

        const sortedPeriods = Array.from(allPeriods).sort();
        const datasets = [];

        Array.from(tags).forEach(tag => {
            const data = sortedPeriods.map(period => {
                return tagPeriodMap[tag][period] || 0;
            });
            datasets.push({
                label: tag,
                data: data
            });
        });

        // Sort datasets by total effort (optional, but nice)
        datasets.sort((a, b) => {
            const sumA = a.data.reduce((sum, val) => sum + val, 0);
            const sumB = b.data.reduce((sum, val) => sum + val, 0);
            return sumB - sumA;
        });

        return {
            periods: sortedPeriods,
            datasets: datasets
        };
    }

    /**
     * Renders the Analytics UI based on the current plan and filter state.
     * @param {Object} plan - The plan data model
     */
    render(plan) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        // Clean up old charts
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
                delete this.charts[key];
            }
        });

        if (!plan || !plan.tasks || plan.tasks.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted">
                    <h5>Analytics Panel</h5>
                    <p class="small">Add tasks to see analytics.</p>
                </div>
            `;
            return;
        }

        // Generate UI for Analytics Filters
        const uniqueTags = this.getUniqueTags();
        let tagFilterHtml = `<div class="d-flex flex-wrap gap-2 me-3">`;
        if (uniqueTags.length === 0) {
            tagFilterHtml += `<span class="text-muted small">No tags available</span>`;
        } else {
            uniqueTags.forEach(tag => {
                const isChecked = this.filterState.selectedTags.includes(tag) ? 'checked' : '';
                const safeTagAttr = tag.replace(/"/g, '&quot;');
                const safeTagText = this.escapeHtml(tag);
                tagFilterHtml += `
                    <div class="form-check form-check-inline m-0 d-flex align-items-center">
                        <input class="form-check-input analytics-tag-checkbox me-1" type="checkbox" id="analyticsTagFilter_${safeTagAttr}" value="${safeTagAttr}" ${isChecked}>
                        <label class="form-check-label small" for="analyticsTagFilter_${safeTagAttr}">${safeTagText}</label>
                    </div>
                `;
            });
        }
        tagFilterHtml += `</div>`;

        const filterBarHtml = `
            <div class="analytics-filters d-flex justify-content-between align-items-center flex-wrap p-3 mb-3 bg-white border-bottom shadow-sm rounded">
                <div class="d-flex align-items-center flex-wrap" id="analyticsTagFiltersContainer">
                    <span class="fw-bold text-muted small me-2">Tags:</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2 me-1" id="analyticsSelectAllTagsBtn" style="font-size: 0.75rem;">All</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2 me-3" id="analyticsUnselectAllTagsBtn" style="font-size: 0.75rem;">None</button>
                    ${tagFilterHtml}
                </div>
                <div class="d-flex align-items-center gap-2 border-start ps-3 ms-auto" id="analyticsDateFiltersContainer">
                    <span class="fw-bold text-muted small">Date Range:</span>
                    <input type="date" class="form-control form-control-sm" id="analyticsStartDate" value="${this.filterState.startDate}" title="Start Date">
                    <span class="text-muted small">to</span>
                    <input type="date" class="form-control form-control-sm" id="analyticsEndDate" value="${this.filterState.endDate}" title="End Date">
                    <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" id="analyticsClearDateFilterBtn" style="font-size: 0.75rem;" title="Clear Dates">&times;</button>
                </div>
            </div>
        `;

        // Get filtered tasks ONLY for specific charts, or apply different rules
        // As requested: the global filters still apply to ALL charts (we were previously using this.getFilteredTasks)
        // Wait, the prompt said: "can the charts in the analytics have filters to filter out tags/date ranges"
        // And then: "the only change i want beyond what you have already done is #3" (keep applying filters to all charts, but add the X-axis restriction to the Demand chart)

        // Let's use getFilteredTasks for all charts, as I previously implemented (and as requested).
        const filteredTasks = this.getFilteredTasks(plan);

        // Calculate Data using FILTERED tasks for all charts
        const effortByTagData = this.calculateEffortByTag(plan, filteredTasks);
        const effortByStatusData = this.calculateEffortByStatus(plan, filteredTasks);
        const taskCountByStatusData = this.calculateTaskCountByStatus(plan, filteredTasks);
        const effortByTypeData = this.calculateEffortByType(plan, filteredTasks);
        const topTasksData = this.calculateEffortByTask(plan, filteredTasks);
        const tagEffortOverTimeData = this.calculateTagEffortByPeriod(plan, filteredTasks);
        const tagAggregateData = this.calculateTagAggregates(plan, filteredTasks);

        // Calculate Demand/Capacity using FILTERED tasks
        const demandCapacityData = this.calculateDemandCapacity(plan, filteredTasks);

        // Build UI Framework
        container.innerHTML = `
            <div class="container-fluid p-0">
                ${filterBarHtml}
                <div class="row g-4">
                    <!-- Top Row -->
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 shadow-sm">
                            <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 text-muted">Effort by Tag</h6>
                                <button class="btn btn-sm btn-link text-muted p-0 export-chart-btn" data-chart-id="effortByTag" title="Export Chart to Image" style="text-decoration: none;">⬇️</button>
                            </div>
                            <div class="card-body d-flex flex-column">
                                <div style="height: 150px; position: relative;">
                                    <canvas id="chartEffortByTag"></canvas>
                                </div>
                                ${this.renderEffortTable(effortByTagData, 'Tag')}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 shadow-sm">
                            <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 text-muted">Effort by Status</h6>
                                <button class="btn btn-sm btn-link text-muted p-0 export-chart-btn" data-chart-id="effortByStatus" title="Export Chart to Image" style="text-decoration: none;">⬇️</button>
                            </div>
                            <div class="card-body d-flex flex-column">
                                <div style="height: 150px; position: relative;">
                                    <canvas id="chartEffortByStatus"></canvas>
                                </div>
                                ${this.renderEffortTable(effortByStatusData, 'Status')}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3">
                        <div class="card h-100 shadow-sm">
                            <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 text-muted">Task Count by Status</h6>
                                <button class="btn btn-sm btn-link text-muted p-0 export-chart-btn" data-chart-id="taskCountByStatus" title="Export Chart to Image" style="text-decoration: none;">⬇️</button>
                            </div>
                            <div class="card-body d-flex flex-column align-items-center">
                                <div style="width: 100%; height: 150px; position: relative;">
                                    <canvas id="chartTaskCountByStatus"></canvas>
                                </div>
                                ${this.renderTaskCountTable(taskCountByStatusData)}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12 col-lg-3">
                        <div class="card h-100 shadow-sm">
                            <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 text-muted">Effort by Type</h6>
                                <button class="btn btn-sm btn-link text-muted p-0 export-chart-btn" data-chart-id="effortByType" title="Export Chart to Image" style="text-decoration: none;">⬇️</button>
                            </div>
                            <div class="card-body d-flex flex-column justify-content-center align-items-center">
                                <div style="width: 80%; height: 250px; position: relative;">
                                    <canvas id="chartEffortByType"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Middle Row: Top Tasks & Capacity vs Demand -->
                    <div class="col-md-12 col-lg-4">
                        <div class="card h-100 shadow-sm">
                            <div class="card-header bg-white py-2">
                                <h6 class="mb-0 text-muted">Top Tasks by Effort</h6>
                            </div>
                            <div class="card-body p-0 overflow-auto" style="max-height: 350px;">
                                ${this.renderTopTasksTable(topTasksData)}
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12 col-lg-8">
                        <div class="card shadow-sm">
                            <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 text-muted">Capacity vs Demand</h6>
                                <button class="btn btn-sm btn-link text-muted p-0 export-chart-btn" data-chart-id="capacityVsDemand" title="Export Chart to Image" style="text-decoration: none;">⬇️</button>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-7">
                                        <canvas id="chartCapacityVsDemand" style="aspect-ratio: 16/9; max-height: 300px; width: 100%;"></canvas>
                                    </div>
                                    <div class="col-md-5 overflow-auto" style="max-height: 300px;">
                                        ${this.renderDemandCapacityTable(demandCapacityData)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Row -->
                    <div class="col-12">
                        <div class="card h-100 shadow-sm">
                            <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 text-muted">Tag Aggregates (Mini Gantt)</h6>
                                <div class="d-flex align-items-center">
                                    <div class="form-check form-switch m-0 me-3">
                                        <input class="form-check-input" type="checkbox" id="analyticsToggleTagText" ${this.planner.getShowTagAggregateText() ? 'checked' : ''} title="Show Text on Bars">
                                        <label class="form-check-label small text-muted" for="analyticsToggleTagText">Text</label>
                                    </div>
                                    <button class="btn btn-sm btn-link text-muted p-0 export-html-btn" data-target-id="tagAggregateGanttWrapper" data-export-name="tagAggregates" title="Export to Image" style="text-decoration: none;">⬇️</button>
                                </div>
                            </div>
                            <div class="card-body">
                                ${this.renderTagAggregateGantt(tagAggregateData)}
                            </div>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="card h-100 shadow-sm">
                            <div class="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                <h6 class="mb-0 text-muted">Effort by Tag Over Time</h6>
                                <button class="btn btn-sm btn-link text-muted p-0 export-chart-btn" data-chart-id="tagEffortOverTime" title="Export Chart to Image" style="text-decoration: none;">⬇️</button>
                            </div>
                            <div class="card-body">
                                <canvas id="chartTagEffortOverTime" style="max-height: 300px;"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bind Filter Events
        setTimeout(() => {
            this.bindFilterEvents();
        }, 0);

        // Wait a tick for DOM to update before rendering charts
        setTimeout(() => {
            this.renderChartEffortByTag(effortByTagData);
            this.renderChartEffortByStatus(effortByStatusData);
            this.renderChartTaskCountByStatus(taskCountByStatusData);
            this.renderChartEffortByType(effortByTypeData);
            this.renderChartTagEffortOverTime(tagEffortOverTimeData);
            this.renderChartCapacityVsDemand(demandCapacityData);

            this.bindExportEvents();
        }, 0);
    }

    /**
     * Binds events for the analytics filter UI elements.
     */
    bindFilterEvents() {
        const tagFiltersContainer = document.getElementById('analyticsTagFiltersContainer');
        const dateFiltersContainer = document.getElementById('analyticsDateFiltersContainer');

        if (tagFiltersContainer) {
            tagFiltersContainer.addEventListener('change', (e) => {
                if (e.target.matches('.analytics-tag-checkbox')) {
                    this.updateFilterState();
                }
            });

            tagFiltersContainer.addEventListener('click', (e) => {
                if (e.target.id === 'analyticsSelectAllTagsBtn') {
                    const checkboxes = tagFiltersContainer.querySelectorAll('.analytics-tag-checkbox');
                    checkboxes.forEach(cb => cb.checked = true);
                    this.updateFilterState();
                } else if (e.target.id === 'analyticsUnselectAllTagsBtn') {
                    const checkboxes = tagFiltersContainer.querySelectorAll('.analytics-tag-checkbox');
                    checkboxes.forEach(cb => cb.checked = false);
                    this.updateFilterState();
                }
            });
        }

        if (dateFiltersContainer) {
            const startDateInput = document.getElementById('analyticsStartDate');
            const endDateInput = document.getElementById('analyticsEndDate');
            const clearDatesBtn = document.getElementById('analyticsClearDateFilterBtn');

            if (startDateInput) {
                startDateInput.addEventListener('change', () => this.updateFilterState());
            }
            if (endDateInput) {
                endDateInput.addEventListener('change', () => this.updateFilterState());
            }
            if (clearDatesBtn) {
                clearDatesBtn.addEventListener('click', () => {
                    if (startDateInput) startDateInput.value = '';
                    if (endDateInput) endDateInput.value = '';
                    this.updateFilterState();
                });
            }
        }

        const tagTextToggle = document.getElementById('analyticsToggleTagText');
        if (tagTextToggle) {
            tagTextToggle.addEventListener('change', (e) => {
                this.planner.setShowTagAggregateText(e.target.checked);
                const plan = this.planner.getCurrentPlan();
                if (plan) {
                    this.render(plan);
                }
            });
        }
    }

    /**
     * Updates the internal filter state from the UI and re-renders the analytics.
     */
    updateFilterState() {
        const tagFiltersContainer = document.getElementById('analyticsTagFiltersContainer');
        if (tagFiltersContainer) {
            const selectedTags = Array.from(tagFiltersContainer.querySelectorAll('.analytics-tag-checkbox:checked')).map(cb => cb.value);
            this.filterState.selectedTags = selectedTags;
        }

        const startDateInput = document.getElementById('analyticsStartDate');
        const endDateInput = document.getElementById('analyticsEndDate');

        if (startDateInput) {
            this.filterState.startDate = startDateInput.value;
        }
        if (endDateInput) {
            this.filterState.endDate = endDateInput.value;
        }

        // Re-render
        const plan = this.planner ? this.planner.getCurrentPlan() : null;
        if (plan) {
            this.render(plan);
        }
    }

    /**
     * Gets all unique tags across all tasks in the current plan.
     * @returns {string[]} Array of unique tags.
     */
    getUniqueTags() {
        const plan = this.planner.getCurrentPlan();
        if (!plan || !plan.tasks) return [];

        const tags = new Set();
        plan.tasks.forEach(task => {
            if (task.tags && Array.isArray(task.tags)) {
                task.tags.forEach(tag => tags.add(tag));
            }
        });

        return Array.from(tags).sort();
    }

    /**
     * Helper to safely escape HTML to prevent XSS.
     * @param {string} unsafe
     * @returns {string} Safe HTML string.
     */
    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    bindExportEvents() {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        const exportBtns = container.querySelectorAll('.export-chart-btn');
        exportBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const chartId = btn.getAttribute('data-chart-id');
                this.exportChartToImage(chartId);
            });
        });

        const exportHtmlBtns = container.querySelectorAll('.export-html-btn');
        exportHtmlBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.getAttribute('data-target-id');
                const exportName = btn.getAttribute('data-export-name');
                this.exportHtmlToImage(targetId, exportName);
            });
        });
    }

    exportHtmlToImage(targetId, exportName) {
        const targetElement = document.getElementById(targetId);
        if (!targetElement) {
            console.error(`Element with ID ${targetId} not found.`);
            return;
        }

        if (typeof html2canvas === 'undefined') {
            console.error("html2canvas library is not loaded.");
            alert("Export failed: html2canvas library is missing.");
            return;
        }

        // Temporarily adjust styles to capture the full scrolling content
        const originalStyle = targetElement.getAttribute('style') || '';
        const scrollWidth = targetElement.scrollWidth;
        const scrollHeight = targetElement.scrollHeight;

        targetElement.style.width = scrollWidth + 'px';
        targetElement.style.height = scrollHeight + 'px';
        targetElement.style.overflow = 'visible';
        targetElement.style.maxWidth = 'none';

        html2canvas(targetElement, {
            scale: 2, // High resolution
            useCORS: true,
            backgroundColor: '#ffffff',
            width: scrollWidth,
            height: scrollHeight,
            windowWidth: scrollWidth,
            windowHeight: scrollHeight
        }).then(canvas => {
            // Restore original styles
            targetElement.setAttribute('style', originalStyle);

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');

            const planName = this.planner.getCurrentPlan()?.name || 'Unnamed_Plan';
            const sanitizedPlanName = planName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            const today = new Date();
            const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            link.download = `${sanitizedPlanName}_${exportName}_${dateString}.png`;
            link.href = image;
            link.click();
        }).catch(err => {
            console.error("Error exporting HTML to image:", err);
            targetElement.setAttribute('style', originalStyle);
            alert("An error occurred while exporting the image.");
        });
    }

    exportChartToImage(chartId) {
        if (!this.charts[chartId]) {
            console.error(`Chart with ID ${chartId} not found.`);
            return;
        }

        const chart = this.charts[chartId];
        // Ensure background is white before exporting (default canvas is transparent)
        // Chart.js allows us to do this by forcing a render with a white background, or we can use toBase64Image directly
        // if we set the backgroundColor option, or we can use a temporary canvas.
        // A simpler approach is to draw the existing canvas onto a new canvas with a white background.

        const originalCanvas = chart.canvas;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalCanvas.width;
        tempCanvas.height = originalCanvas.height;
        const ctx = tempCanvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        ctx.drawImage(originalCanvas, 0, 0);

        const image = tempCanvas.toDataURL("image/png");
        const link = document.createElement('a');

        const planName = this.planner.getCurrentPlan()?.name || 'Unnamed_Plan';
        const sanitizedPlanName = planName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        link.download = `${sanitizedPlanName}_${chartId}_${dateString}.png`;
        link.href = image;
        link.click();
    }

    renderChartCapacityVsDemand(data) {
        const ctx = document.getElementById('chartCapacityVsDemand');
        if (!ctx || !data || data.length === 0) return;

        const labels = data.map(item => item.period);
        const capacityValues = data.map(item => item.capacity);
        const demandValues = data.map(item => item.demand);

        this.charts['capacityVsDemand'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Demand',
                        data: demandValues,
                        backgroundColor: '#ff6b6b',
                        borderColor: '#fa5252',
                        borderWidth: 1,
                        borderRadius: 4,
                        order: 2
                    },
                    {
                        label: 'Capacity',
                        data: capacityValues,
                        type: 'line',
                        fill: false,
                        borderColor: '#339af0',
                        backgroundColor: '#339af0',
                        tension: 0.1,
                        borderWidth: 3,
                        pointBackgroundColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 16 / 9,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Effort'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Period'
                        }
                    }
                }
            }
        });
    }

    renderEffortTable(data, labelHeader) {
        if (!data.labels || data.labels.length === 0) return `<p class="text-muted small mt-3 mb-0 text-center">No ${labelHeader.toLowerCase()} data</p>`;

        let rows = '';
        for (let i = 0; i < data.labels.length; i++) {
            rows += `
                <tr>
                    <td class="small py-1">${this.escapeHtml(data.labels[i])}</td>
                    <td class="small py-1 text-end">${data.values[i].toFixed(1)}</td>
                </tr>
            `;
        }

        return `
            <div class="table-responsive mt-3 mb-0 flex-grow-1" style="max-height: 150px; overflow-y: auto;">
                <table class="table table-sm table-borderless mb-0">
                    <thead class="table-light sticky-top">
                        <tr>
                            <th class="small fw-normal py-1">${labelHeader}</th>
                            <th class="small fw-normal py-1 text-end">Effort</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    renderTaskCountTable(data) {
        if (!data.labels || data.labels.length === 0) return '<p class="text-muted small mt-3 mb-0 text-center">No status data</p>';

        let rows = '';
        for (let i = 0; i < data.labels.length; i++) {
            rows += `
                <tr>
                    <td class="small py-1">${this.escapeHtml(data.labels[i])}</td>
                    <td class="small py-1 text-end">${data.values[i]}</td>
                </tr>
            `;
        }

        return `
            <div class="table-responsive mt-3 mb-0 flex-grow-1" style="max-height: 150px; overflow-y: auto;">
                <table class="table table-sm table-borderless mb-0">
                    <thead class="table-light sticky-top">
                        <tr>
                            <th class="small fw-normal py-1">Status</th>
                            <th class="small fw-normal py-1 text-end">Count</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    renderTopTasksTable(data) {
        if (!data || data.length === 0) return '<div class="p-3 text-center text-muted small">No tasks with effort defined</div>';

        let rows = '';
        data.forEach((task, index) => {
            rows += `
                <tr>
                    <td class="small text-muted py-2" style="width: 30px;">${index + 1}</td>
                    <td class="small fw-bold py-2" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px;" title="${this.escapeHtml(task.id)}">${this.escapeHtml(task.id)}</td>
                    <td class="small py-2 text-truncate" style="max-width: 150px;" title="${this.escapeHtml(task.title)}">${this.escapeHtml(task.title)}</td>
                    <td class="small py-2 text-end fw-bold text-primary">${task.effort.toFixed(1)}</td>
                </tr>
            `;
        });

        return `
            <table class="table table-sm table-hover mb-0">
                <thead class="table-light sticky-top">
                    <tr>
                        <th class="small fw-normal text-muted border-bottom-0 py-2">#</th>
                        <th class="small fw-normal text-muted border-bottom-0 py-2">ID</th>
                        <th class="small fw-normal text-muted border-bottom-0 py-2">Title</th>
                        <th class="small fw-normal text-muted border-bottom-0 py-2 text-end">Effort</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    renderDemandCapacityTable(data) {
        if (!data || data.length === 0) return '<div class="p-3 text-center text-muted small">No capacity data defined</div>';

        let rows = '';
        data.forEach(row => {
            const isOverCapacity = row.demand > row.capacity;
            const utilText = row.capacity === 0 && row.demand > 0 ? '∞%' : `${row.utilization.toFixed(0)}%`;
            const rowClass = isOverCapacity ? 'table-danger' : '';
            const utilBadge = isOverCapacity ? `<span class="badge bg-danger rounded-pill">${utilText} ⚠</span>` : utilText;

            rows += `
                <tr class="${rowClass}">
                    <td class="small py-2 fw-medium">${this.escapeHtml(row.period)}</td>
                    <td class="small py-2 text-end">${row.capacity.toFixed(1)}</td>
                    <td class="small py-2 text-end">${row.demand.toFixed(1)}</td>
                    <td class="small py-2 text-end">${utilBadge}</td>
                </tr>
            `;
        });

        return `
            <table class="table table-sm mb-0">
                <thead class="table-light sticky-top">
                    <tr>
                        <th class="small fw-normal text-muted py-2">Period</th>
                        <th class="small fw-normal text-muted py-2 text-end">Capacity</th>
                        <th class="small fw-normal text-muted py-2 text-end">Demand</th>
                        <th class="small fw-normal text-muted py-2 text-end">Utilization</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    }

    renderChartEffortByTag(data) {
        const ctx = document.getElementById('chartEffortByTag');
        if (!ctx || !data.labels || data.labels.length === 0) return;

        this.charts['effortByTag'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Effort',
                    data: data.values,
                    backgroundColor: this.chartColors.slice(0, data.labels.length).concat(Array(Math.max(0, data.labels.length - this.chartColors.length)).fill('#adb5bd')),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    renderChartEffortByStatus(data) {
        const ctx = document.getElementById('chartEffortByStatus');
        if (!ctx || !data.labels || data.labels.length === 0) return;

        this.charts['effortByStatus'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Effort',
                    data: data.values,
                    backgroundColor: this.chartColors.slice(0, data.labels.length).concat(Array(Math.max(0, data.labels.length - this.chartColors.length)).fill('#adb5bd')),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }

    renderChartTaskCountByStatus(data) {
        const ctx = document.getElementById('chartTaskCountByStatus');
        if (!ctx || !data.labels) return;

        this.charts['taskCountByStatus'] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: this.chartColors.slice(0, data.labels.length).concat(Array(Math.max(0, data.labels.length - this.chartColors.length)).fill('#adb5bd')),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    renderTagAggregateGantt(data) {
        if (!data || !data.tags || data.tags.length === 0 || !data.minDate || !data.maxDate) {
            return '<div class="p-3 text-center text-muted small">No aggregate tag data available in current date range.</div>';
        }

        const minDate = new Date(data.minDate);
        minDate.setDate(1); // Start at beginning of month

        const maxDate = new Date(data.maxDate);
        maxDate.setMonth(maxDate.getMonth() + 1, 0); // End at end of month

        const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
        if (totalDays <= 0) return '';

        // Generate Month Headers
        const months = [];
        let currentMonth = new Date(minDate);
        while (currentMonth <= maxDate) {
            const year = currentMonth.getFullYear();
            const monthStr = currentMonth.toLocaleString('default', { month: 'short' });

            // Calculate width percentage for this month
            const daysInMonth = new Date(year, currentMonth.getMonth() + 1, 0).getDate();
            const widthPercent = (daysInMonth / totalDays) * 100;

            months.push({ label: `${monthStr} ${year.toString().slice(-2)}`, width: widthPercent });

            currentMonth.setMonth(currentMonth.getMonth() + 1, 1);
        }

        let headerHtml = `<div class="d-flex border-bottom pb-1 mb-2">
            <div style="width: 150px; flex-shrink: 0;" class="fw-bold text-muted small px-2">Tag</div>
            <div class="d-flex flex-grow-1 position-relative" style="min-width: 400px;">`;

        months.forEach(m => {
            headerHtml += `<div class="text-muted small text-center border-start border-light" style="width: ${m.width}%;">${this.escapeHtml(m.label)}</div>`;
        });
        headerHtml += `</div></div>`;

        let rowsHtml = '';
        data.tags.forEach(agg => {
            const startOffsetDays = Math.max(0, Math.ceil((agg.minStartDate - minDate) / (1000 * 60 * 60 * 24)));
            const durationDays = Math.max(1, Math.ceil((agg.maxEndDate - agg.minStartDate) / (1000 * 60 * 60 * 24)));

            const leftPercent = (startOffsetDays / totalDays) * 100;
            const widthPercent = (durationDays / totalDays) * 100;

            const inProgressPct = agg.statusPercentages['In progress'] || 0;
            const completedPct = agg.statusPercentages['Completed'] || 0;

            const pctText = `${inProgressPct.toFixed(0)}% In progress, ${completedPct.toFixed(0)}% Completed`;

            const startDateStr = `${agg.minStartDate.getFullYear()}-${String(agg.minStartDate.getMonth()+1).padStart(2,'0')}-${String(agg.minStartDate.getDate()).padStart(2,'0')}`;
            const endDateStr = `${agg.maxEndDate.getFullYear()}-${String(agg.maxEndDate.getMonth()+1).padStart(2,'0')}-${String(agg.maxEndDate.getDate()).padStart(2,'0')}`;
            const tooltipStr = `Tag: ${this.escapeHtml(agg.tag)}\nStart: ${startDateStr}\nEnd: ${endDateStr}\nTasks: ${agg.totalTasks}\n${pctText}`;

            const showText = this.planner.getShowTagAggregateText();
            const textToRender = (showText && widthPercent > 10) ? this.escapeHtml(pctText) : '';

            rowsHtml += `
                <div class="d-flex align-items-center mb-2 py-1 hover-bg-light rounded">
                    <div style="width: 150px; flex-shrink: 0;" class="small fw-medium text-truncate px-2" title="${this.escapeHtml(agg.tag)}">
                        ${this.escapeHtml(agg.tag)}
                    </div>
                    <div class="d-flex flex-grow-1 position-relative" style="min-width: 400px; height: 24px; background-color: #f8f9fa; border-radius: 4px;">
                        <!-- Task Aggregate Bar -->
                        <div class="position-absolute h-100 d-flex flex-column justify-content-center"
                             style="left: ${leftPercent}%; width: ${widthPercent}%; min-width: 4px; z-index: 2;"
                             title="${this.escapeHtml(tooltipStr)}">
                            <div class="w-100 d-flex align-items-center justify-content-center shadow-sm text-white small fw-bold"
                                 style="height: 16px; border-radius: 3px; background-color: #4da3ff; font-size: 0.65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px;">
                                ${textToRender}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        // Today Marker
        let todayHtml = '';
        const today = new Date();
        today.setHours(0,0,0,0);
        if (today >= minDate && today <= maxDate) {
            const todayOffsetDays = Math.max(0, Math.ceil((today - minDate) / (1000 * 60 * 60 * 24)));
            const todayPercent = (todayOffsetDays / totalDays) * 100;
            todayHtml = `
                <div class="position-absolute top-0 bottom-0 border-start border-danger z-3"
                     style="left: ${todayPercent}%; width: 1px; pointer-events: none;"
                     title="Today">
                     <div class="position-absolute bg-danger text-white small px-1 rounded shadow-sm" style="top: -18px; left: -14px; font-size: 0.6rem; white-space: nowrap;">Today</div>
                </div>
            `;
        }

        // Major Markers
        let majorMarkersHtml = '';
        if (this.planner.getShowMarkerMajor()) {
            const currentPlan = this.planner.getCurrentPlan();
            if (currentPlan && currentPlan.markers) {
                const majorMarkers = currentPlan.markers.filter(m => m.type === 'vertical' && m.visible && m.importance === 'major');

                majorMarkers.forEach(marker => {
                    const parts = marker.date.split('-');
                    if (parts.length === 3) {
                        const mDate = new Date(parts[0], parts[1] - 1, parts[2]);
                        if (mDate >= minDate && mDate <= maxDate) {
                            const offsetDays = Math.max(0, Math.ceil((mDate - minDate) / (1000 * 60 * 60 * 24)));
                            const percent = (offsetDays / totalDays) * 100;
                            const color = marker.color || '#ffc107'; // fallback color
                            const label = this.escapeHtml(marker.label);

                            majorMarkersHtml += `
                                <div class="position-absolute top-0 bottom-0 border-start z-3"
                                     style="left: ${percent}%; width: 1px; pointer-events: none; border-color: ${color} !important; border-left-style: dashed !important;"
                                     title="${label}">
                                     <div class="position-absolute text-white small px-1 rounded shadow-sm" style="background-color: ${color}; top: -18px; left: -14px; font-size: 0.6rem; white-space: nowrap;">${label}</div>
                                </div>
                            `;
                        }
                    }
                });
            }
        }

        return `
            <div id="tagAggregateGanttWrapper" class="tag-aggregate-gantt w-100 overflow-auto position-relative py-2 bg-white">
                ${headerHtml}
                <div class="position-relative mt-3" style="min-height: 50px;">
                    <!-- Background Grid Lines Container -->
                    <div class="position-absolute top-0 bottom-0 d-flex opacity-25" style="left: 150px; right: 0; min-width: 400px; pointer-events: none; z-index: 1;">
                        ${months.map(m => `<div class="border-start border-secondary h-100" style="width: ${m.width}%;"></div>`).join('')}
                    </div>

                    <!-- Rows -->
                    <div class="position-relative" style="z-index: 2;">
                        ${rowsHtml}
                    </div>

                    <!-- Markers Overlay Container -->
                    <div class="position-absolute top-0 bottom-0" style="left: 150px; right: 0; min-width: 400px; pointer-events: none; z-index: 3;">
                        ${majorMarkersHtml}
                        ${todayHtml}
                    </div>
                </div>

            </div>
        `;
    }

    renderChartEffortByType(data) {
        const ctx = document.getElementById('chartEffortByType');
        if (!ctx || !data.labels) return;

        // Use distinct colors for Design/Dev/Test
        const typeColors = ['#fcc419', '#339af0', '#ff6b6b'];

        this.charts['effortByType'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: typeColors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 11 } }
                    }
                },
                cutout: '60%'
            }
        });
    }

    renderChartTagEffortOverTime(data) {
        const ctx = document.getElementById('chartTagEffortOverTime');
        if (!ctx || !data.periods || data.periods.length === 0) return;

        // Apply colors to datasets
        data.datasets.forEach((ds, idx) => {
            ds.backgroundColor = this.chartColors[idx % this.chartColors.length];
        });

        this.charts['tagEffortOverTime'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.periods,
                datasets: data.datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 12, font: { size: 11 } }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }

    escapeHtml(unsafe) {
        if (unsafe == null) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}