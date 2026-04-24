/* Core Data Model */

class Planner {
    constructor() {
        this.file = {
            meta: {
                fileVersion: 1,
                history: []
            },
            settings: {
                baseLink: "https://jira.company.com/browse/",
                fillLegends: [
                    {
                        id: 'default_fill',
                        label: 'Default Fill',
                        color: '#4da3ff',
                        tag: 'fill-default'
                    }
                ],
                borderLegends: [
                    {
                        id: 'default_border',
                        label: 'Default Border',
                        color: '#1c6ed5',
                        tag: 'border-default'
                    }
                ]
            },
            plans: []
        };
        this.currentPlanIndex = -1;

        // Tag filter state
        this.filterState = {
            selectedTags: [],
            matchMode: 'any', // 'any' or 'all'
            visualMode: 'show', // 'show' or 'highlight'
            searchText: ''
        };

        // UI View State (Not saved to file)
        this.zoomLevel = 'daily'; // 'daily', 'weekly', 'fortnight', 'monthly'
        this.showDependencies = false;
        this.showEffortPerDay = false;
        this.selectedTaskIds = []; // Array of selected task IDs
        this.showTagAggregateText = true; // Tag Aggregates text visibility
        this.colorCapacityDemandByStatus = false;

        // Marker Visibility State
        this.showMarkerMajor = true;
        this.showMarkerMinor = true;
        this.showMarkerNote = true;

        // Task Status Definitions
        this.statusColors = {
            'Not started': '#808080',
            'Refined': '#ADD8E6',
            'Committed': '#800080',
            'In progress': '#0000FF',
            'On hold': '#FF0000',
            'Blocked': '#FF0000',
            'Completed': '#008000',
            'Removed': '#000000',
            'Stretch': '#FFA500'
        };
    }

    getStatusColors() {
        return this.statusColors;
    }

    getZoomLevel() {
        return this.zoomLevel;
    }

    setZoomLevel(level) {
        this.zoomLevel = level;
    }

    getSelectedTaskIds() {
        return this.selectedTaskIds;
    }

    setSelectedTaskIds(ids) {
        this.selectedTaskIds = ids || [];
    }

    toggleTaskSelection(taskId) {
        const index = this.selectedTaskIds.indexOf(taskId);
        if (index > -1) {
            this.selectedTaskIds.splice(index, 1);
        } else {
            this.selectedTaskIds.push(taskId);
        }
    }

    clearTaskSelection() {
        this.selectedTaskIds = [];
    }

    isTaskSelected(taskId) {
        return this.selectedTaskIds.includes(taskId);
    }

    getFilterState() {
        return this.filterState;
    }

    setFilterState(newState) {
        this.filterState = { ...this.filterState, ...newState };
    }

    getShowDependencies() {
        return this.showDependencies;
    }

    setShowDependencies(show) {
        this.showDependencies = show;
    }

    getShowTagAggregateText() {
        return this.showTagAggregateText;
    }

    setShowTagAggregateText(show) {
        this.showTagAggregateText = show;
    }

    getColorCapacityDemandByStatus() {
        return this.colorCapacityDemandByStatus;
    }

    setColorCapacityDemandByStatus(colorByStatus) {
        this.colorCapacityDemandByStatus = colorByStatus;
    }

    getShowEffortPerDay() {
        return this.showEffortPerDay;
    }

    setShowEffortPerDay(show) {
        this.showEffortPerDay = show;
    }

    getShowMarkerMajor() {
        return this.showMarkerMajor;
    }

    setShowMarkerMajor(show) {
        this.showMarkerMajor = show;
    }

    getShowMarkerMinor() {
        return this.showMarkerMinor;
    }

    setShowMarkerMinor(show) {
        this.showMarkerMinor = show;
    }

    getShowMarkerNote() {
        return this.showMarkerNote;
    }

    setShowMarkerNote(show) {
        this.showMarkerNote = show;
    }

    getCurrentPlan() {
        if (this.currentPlanIndex >= 0 && this.currentPlanIndex < this.file.plans.length) {
            const plan = this.file.plans[this.currentPlanIndex];

            // Ensure Today marker is up to date dynamically
            if (plan && plan.markers) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                const todayStr = `${yyyy}-${mm}-${dd}`;

                const todayMarkerIndex = plan.markers.findIndex(m => m.id === 'marker_today');
                if (todayMarkerIndex !== -1) {
                    plan.markers[todayMarkerIndex].date = todayStr;
                } else {
                    plan.markers.unshift({
                        id: 'marker_today',
                        type: 'vertical',
                        label: 'Today',
                        color: '#28a745',
                        importance: 'note',
                        repeats: true,
                        visible: true,
                        date: todayStr
                    });
                }
            }
            return plan;
        }
        return null;
    }

    setCurrentPlanIndex(index) {
        if (index >= 0 && index < this.file.plans.length) {
            this.currentPlanIndex = index;
            return true;
        }
        return false;
    }

    markTask(taskId) {
        const task = this.getTaskById(taskId);
        if (task) {
            task.isMarked = true;
            return true;
        }
        return false;
    }

    unmarkTask(taskId) {
        const task = this.getTaskById(taskId);
        if (task) {
            task.isMarked = false;
            return true;
        }
        return false;
    }

    toggleTaskMark(taskId) {
        const task = this.getTaskById(taskId);
        if (task) {
            task.isMarked = !task.isMarked;
            return true;
        }
        return false;
    }

    markAllActiveTasks(activeTaskIds) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks) return false;

        let changed = false;
        plan.tasks.forEach(task => {
            if (activeTaskIds.includes(task.id) && !task.isMarked) {
                task.isMarked = true;
                changed = true;
            }
        });
        return changed;
    }

    unmarkAllTasks() {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks) return false;

        let changed = false;
        plan.tasks.forEach(task => {
            if (task.isMarked) {
                task.isMarked = false;
                changed = true;
            }
        });
        return changed;
    }

    addTagsToMarkedTasks(tagsArray) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks || !tagsArray || tagsArray.length === 0) return false;

        let changed = false;
        plan.tasks.forEach(task => {
            if (task.isMarked) {
                let currentTags = Array.isArray(task.tags) ? [...task.tags] : [];
                let added = false;
                tagsArray.forEach(tag => {
                    if (!currentTags.includes(tag)) {
                        currentTags.push(tag);
                        added = true;
                    }
                });
                if (added) {
                    task.tags = currentTags;
                    changed = true;
                }
            }
        });
        return changed;
    }

    removeTagsFromMarkedTasks(tagsArray) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks || !tagsArray || tagsArray.length === 0) return false;

        let changed = false;
        plan.tasks.forEach(task => {
            if (task.isMarked && Array.isArray(task.tags)) {
                let currentTags = task.tags;
                const initialLength = currentTags.length;
                currentTags = currentTags.filter(t => !tagsArray.includes(t));
                if (currentTags.length !== initialLength) {
                    task.tags = currentTags;
                    changed = true;
                }
            }
        });
        return changed;
    }

    setStatusOfMarkedTasks(status) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks) return false;

        let changed = false;
        plan.tasks.forEach(task => {
            if (task.isMarked && task.status !== status) {
                task.status = status;
                changed = true;
            }
        });
        return changed;
    }

    setExcludeFromAnalyticsOfMarkedTasks(exclude) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks) return false;

        let changed = false;
        plan.tasks.forEach(task => {
            if (task.isMarked) {
                if (task.excludeFromAnalytics !== exclude) {
                    task.excludeFromAnalytics = exclude;
                    changed = true;
                }
            }
        });
        return changed;
    }

    convertMarksToSelection() {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks) return false;

        const markedTaskIds = plan.tasks.filter(t => t.isMarked).map(t => t.id);
        this.setSelectedTaskIds(markedTaskIds);
        return true;
    }

    generateId() {
        return 'plan_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    }

    addPlan(name) {
        if (!name) return false;

        const today = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(today.getMonth() + 6);

        const formatDate = (date) => {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const newPlan = {
            id: this.generateId(),
            name: name,
            timeline: {
                startDate: formatDate(today),
                endDate: formatDate(sixMonthsFromNow)
            },
            markers: [{
                id: 'marker_today',
                type: 'vertical',
                label: 'Today',
                color: '#28a745',
                importance: 'note',
                repeats: true,
                visible: true,
                date: formatDate(today)
            }],
            capacity: {
                granularity: "month",
                entries: []
            },
            demandAdjustmentPercent: 20,
            capacityAdjustmentPercent: 100,
            tasks: []
        };

        this.file.plans.push(newPlan);
        this.currentPlanIndex = this.file.plans.length - 1;
        return true;
    }

    deletePlan() {
        if (this.currentPlanIndex >= 0 && this.currentPlanIndex < this.file.plans.length) {
            this.file.plans.splice(this.currentPlanIndex, 1);
            if (this.file.plans.length > 0) {
                // If the deleted plan was the last one, focus the new last one
                if (this.currentPlanIndex >= this.file.plans.length) {
                    this.currentPlanIndex = this.file.plans.length - 1;
                }
            } else {
                this.currentPlanIndex = -1;
            }
            return true;
        }
        return false;
    }

    updatePlanDetails(newName, newStartDate, newEndDate) {
        if (!newName || !newName.trim() || !newStartDate || !newEndDate) return false;
        const plan = this.getCurrentPlan();
        if (plan) {
            plan.name = newName.trim();
            if (plan.timeline) {
                plan.timeline.startDate = newStartDate;
                plan.timeline.endDate = newEndDate;
            }
            return true;
        }
        return false;
    }

    addMarker(markerData) {
        const plan = this.getCurrentPlan();
        if (!plan) return false;

        if (!plan.markers) {
            plan.markers = [];
        }

        const newMarker = {
            id: markerData.id || ('marker_' + Math.random().toString(36).substring(2, 9)),
            type: markerData.type || 'vertical',
            label: markerData.label || 'Marker',
            color: markerData.color || '#ff4d4d',
            importance: markerData.importance || 'minor', // 'major', 'minor', 'note'
            repeats: markerData.repeats !== undefined ? markerData.repeats : true,
            visible: markerData.visible !== undefined ? markerData.visible : true
        };

        if (newMarker.type === 'vertical') {
            newMarker.date = markerData.date || plan.timeline.startDate;
        } else if (newMarker.type === 'horizontal') {
            newMarker.row = parseInt(markerData.row, 10) || 1;
        }

        plan.markers.push(newMarker);

        // Optional: sort vertical markers by date for consistency
        plan.markers.sort((a, b) => {
            if (a.type === 'vertical' && b.type === 'vertical') {
                return new Date(a.date) - new Date(b.date);
            }
            return 0; // Don't strictly sort horizontal vs vertical here
        });
        return true;
    }

    updateMarker(markerId, markerData) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.markers) return false;

        const markerIndex = plan.markers.findIndex(m => m.id === markerId);
        if (markerIndex !== -1) {
            const updatedMarker = { ...plan.markers[markerIndex], ...markerData };

            // Cleanup fields based on type
            if (updatedMarker.type === 'vertical') {
                delete updatedMarker.row;
            } else if (updatedMarker.type === 'horizontal') {
                delete updatedMarker.date;
            }

            plan.markers[markerIndex] = updatedMarker;

            plan.markers.sort((a, b) => {
                if (a.type === 'vertical' && b.type === 'vertical') {
                    return new Date(a.date) - new Date(b.date);
                }
                return 0;
            });
            return true;
        }
        return false;
    }

    deleteMarker(markerId) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.markers) return false;

        const markerIndex = plan.markers.findIndex(m => m.id === markerId);
        if (markerIndex !== -1) {
            plan.markers.splice(markerIndex, 1);
            return true;
        }
        return false;
    }

    addTask(task) {
        const plan = this.getCurrentPlan();
        if (!plan) return false;

        if (!plan.tasks) {
            plan.tasks = [];
        }

        // Check for duplicate ID within the plan
        if (plan.tasks.some(t => t.id === task.id)) {
            return false;
        }

        plan.tasks.push(task);
        return true;
    }

    updateSettings(newSettings) {
        if (!this.file.settings) {
            this.file.settings = {};
        }
        if (newSettings.baseLink !== undefined) {
            this.file.settings.baseLink = newSettings.baseLink;
        }
        return true;
    }

    updatePlanSettings(updatedPlanData) {
        const plan = this.getCurrentPlan();
        if (!plan) return false;

        if (updatedPlanData.capacity) plan.capacity = updatedPlanData.capacity;
        if (updatedPlanData.demandAdjustmentPercent !== undefined) plan.demandAdjustmentPercent = updatedPlanData.demandAdjustmentPercent;
        if (updatedPlanData.capacityAdjustmentPercent !== undefined) plan.capacityAdjustmentPercent = updatedPlanData.capacityAdjustmentPercent;

        return true;
    }

    updateTask(taskId, updatedTask) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks) return false;

        const taskIndex = plan.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            // Check if the new ID (if changed) conflicts with another task
            if (taskId !== updatedTask.id && plan.tasks.some(t => t.id === updatedTask.id)) {
                return false;
            }
            plan.tasks[taskIndex] = updatedTask;
            return true;
        }
        return false;
    }

    getTaskById(taskId) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks) return null;
        return plan.tasks.find(t => t.id === taskId) || null;
    }

    deleteTask(taskId) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks) return false;

        const taskIndex = plan.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            plan.tasks.splice(taskIndex, 1);
            return true;
        }
        return false;
    }

    syncTaskToPlan(taskId, targetPlanIndex) {
        const currentPlan = this.getCurrentPlan();
        if (!currentPlan || !currentPlan.tasks) return false;

        const taskToSync = currentPlan.tasks.find(t => t.id === taskId);
        if (!taskToSync) return false;

        if (targetPlanIndex < 0 || targetPlanIndex >= this.file.plans.length || targetPlanIndex === this.currentPlanIndex) {
            return false; // Invalid or same plan
        }

        const targetPlan = this.file.plans[targetPlanIndex];
        if (!targetPlan.tasks) {
            targetPlan.tasks = [];
        }

        // Deep copy the task to avoid reference issues
        const clonedTask = JSON.parse(JSON.stringify(taskToSync));

        const existingTaskIndex = targetPlan.tasks.findIndex(t => t.id === taskId);
        if (existingTaskIndex !== -1) {
            // Update existing
            targetPlan.tasks[existingTaskIndex] = clonedTask;
        } else {
            // Add new
            targetPlan.tasks.push(clonedTask);
        }

        return true;
    }

    syncTaskToAllPlans(taskId) {
        const currentPlan = this.getCurrentPlan();
        if (!currentPlan || !currentPlan.tasks) return false;

        const taskToSync = currentPlan.tasks.find(t => t.id === taskId);
        if (!taskToSync) return false;

        let syncCount = 0;

        this.file.plans.forEach((plan, index) => {
            if (index !== this.currentPlanIndex) {
                if (this.syncTaskToPlan(taskId, index)) {
                    syncCount++;
                }
            }
        });

        return syncCount > 0;
    }

    duplicateTask(taskId) {
        const plan = this.getCurrentPlan();
        if (!plan || !plan.tasks) return false;

        const taskToDuplicate = plan.tasks.find(t => t.id === taskId);
        if (!taskToDuplicate) return false;

        // Clone the task (deep copy)
        const clonedTask = JSON.parse(JSON.stringify(taskToDuplicate));

        // Let's generate a TBD ID. We might have multiple TBDs, so we'll append a random suffix to make it unique within the plan
        const generateTaskId = () => 'TBD-' + Math.floor(1000 + Math.random() * 9000);
        let newId = 'TBD';

        // Ensure the ID is unique
        while (plan.tasks.some(t => t.id === newId)) {
             newId = generateTaskId();
        }

        clonedTask.id = newId;
        clonedTask.title = taskToDuplicate.title + " (Copy)";

        plan.tasks.push(clonedTask);
        return true;
    }

    insertRowBefore(targetRowIndex) {
        const plan = this.getCurrentPlan();
        if (!plan) return false;

        let hasChanges = false;

        // Shift tasks
        if (plan.tasks && plan.tasks.length > 0) {
            plan.tasks.forEach(task => {
                const currentRow = (task.row !== undefined && task.row > 0) ? task.row : 1;
                if (currentRow >= targetRowIndex) {
                    task.row = currentRow + 1;
                    hasChanges = true;
                }
            });
        }

        // Shift horizontal markers
        if (plan.markers && plan.markers.length > 0) {
            plan.markers.forEach(marker => {
                if (marker.type === 'horizontal') {
                    const currentRow = (marker.row !== undefined && marker.row > 0) ? marker.row : 1;
                    if (currentRow >= targetRowIndex) {
                        marker.row = currentRow + 1;
                        hasChanges = true;
                    }
                }
            });
        }

        return hasChanges;
    }

    duplicatePlan() {
        const currentPlan = this.getCurrentPlan();
        if (!currentPlan) return false;

        // Clone the plan (deep copy to avoid reference issues)
        const clonedPlan = JSON.parse(JSON.stringify(currentPlan));
        clonedPlan.id = this.generateId();

        // Generate unique name
        const baseName = currentPlan.name.replace(/ \(Copy( \d+)?\)$/, '');
        let newName = baseName + " (Copy)";
        let copyIndex = 2;

        const nameExists = (name) => this.file.plans.some(p => p.name === name);

        while (nameExists(newName)) {
            newName = `${baseName} (Copy ${copyIndex})`;
            copyIndex++;
        }

        clonedPlan.name = newName;

        this.file.plans.push(clonedPlan);
        this.currentPlanIndex = this.file.plans.length - 1;
        return true;
    }

    appendPlan(planData) {
        if (!planData) return false;

        const clonedPlan = JSON.parse(JSON.stringify(planData));
        clonedPlan.id = this.generateId();

        const baseName = (clonedPlan.name || "Imported Plan").replace(/ \(Imported( \d+)?\)$/, '');
        let newName = baseName;
        let copyIndex = 2;

        const nameExists = (name) => this.file.plans.some(p => p.name === name);

        if (nameExists(newName)) {
            newName = `${baseName} (Imported)`;
        }

        while (nameExists(newName)) {
            newName = `${baseName} (Imported ${copyIndex})`;
            copyIndex++;
        }

        clonedPlan.name = newName;
        this.file.plans.push(clonedPlan);
        this.currentPlanIndex = this.file.plans.length - 1;
        return true;
    }

    calculatePlanDiff(importedPlan) {
        const currentPlan = this.getCurrentPlan();
        if (!currentPlan || !importedPlan) return null;

        const diff = {
            tasks: { new: [], modified: [], deleted: [] },
            markers: { new: [], modified: [], deleted: [] },
            capacity: { different: false }
        };

        // Tasks Diff
        const currentTasks = currentPlan.tasks || [];
        const importedTasks = importedPlan.tasks || [];
        const currentTasksMap = new Map(currentTasks.map(t => [t.id, t]));
        const importedTasksMap = new Map(importedTasks.map(t => [t.id, t]));

        importedTasks.forEach(impTask => {
            const currTask = currentTasksMap.get(impTask.id);
            if (!currTask) {
                diff.tasks.new.push(impTask);
            } else {
                if (JSON.stringify(currTask) !== JSON.stringify(impTask)) {
                    diff.tasks.modified.push({ current: currTask, imported: impTask });
                }
            }
        });

        currentTasks.forEach(currTask => {
            if (!importedTasksMap.has(currTask.id)) {
                diff.tasks.deleted.push(currTask);
            }
        });

        // Markers Diff
        const currentMarkers = (currentPlan.markers || []).filter(m => m.id !== 'marker_today');
        const importedMarkers = (importedPlan.markers || []).filter(m => m.id !== 'marker_today');
        const currentMarkersMap = new Map(currentMarkers.map(m => [m.id, m]));
        const importedMarkersMap = new Map(importedMarkers.map(m => [m.id, m]));

        importedMarkers.forEach(impMarker => {
            const currMarker = currentMarkersMap.get(impMarker.id);
            if (!currMarker) {
                diff.markers.new.push(impMarker);
            } else {
                if (JSON.stringify(currMarker) !== JSON.stringify(impMarker)) {
                    diff.markers.modified.push({ current: currMarker, imported: impMarker });
                }
            }
        });

        currentMarkers.forEach(currMarker => {
            if (!importedMarkersMap.has(currMarker.id)) {
                diff.markers.deleted.push(currMarker);
            }
        });

        // Capacity Diff
        const currentCapacityStr = JSON.stringify({
            capacity: currentPlan.capacity,
            demandAdjustmentPercent: currentPlan.demandAdjustmentPercent,
            capacityAdjustmentPercent: currentPlan.capacityAdjustmentPercent
        });
        const importedCapacityStr = JSON.stringify({
            capacity: importedPlan.capacity,
            demandAdjustmentPercent: importedPlan.demandAdjustmentPercent,
            capacityAdjustmentPercent: importedPlan.capacityAdjustmentPercent
        });

        if (currentCapacityStr !== importedCapacityStr) {
            diff.capacity.different = true;
        }

        return diff;
    }

    applyPlanMerge(diffSelection, importedPlan) {
        const currentPlan = this.getCurrentPlan();
        if (!currentPlan || !importedPlan) return false;

        // Apply Capacity
        if (diffSelection.capacity) {
            currentPlan.capacity = JSON.parse(JSON.stringify(importedPlan.capacity || {}));
            currentPlan.demandAdjustmentPercent = importedPlan.demandAdjustmentPercent;
            currentPlan.capacityAdjustmentPercent = importedPlan.capacityAdjustmentPercent;
        }

        // Apply Tasks
        if (!currentPlan.tasks) currentPlan.tasks = [];
        const taskMap = new Map(currentPlan.tasks.map((t, idx) => [t.id, idx]));

        diffSelection.tasks.new.forEach(taskId => {
            const taskToMerge = importedPlan.tasks.find(t => t.id === taskId);
            if (taskToMerge) currentPlan.tasks.push(JSON.parse(JSON.stringify(taskToMerge)));
        });

        diffSelection.tasks.modified.forEach(taskId => {
            const idx = taskMap.get(taskId);
            const taskToMerge = importedPlan.tasks.find(t => t.id === taskId);
            if (idx !== undefined && taskToMerge) {
                currentPlan.tasks[idx] = JSON.parse(JSON.stringify(taskToMerge));
            }
        });

        diffSelection.tasks.deleted.forEach(taskId => {
            currentPlan.tasks = currentPlan.tasks.filter(t => t.id !== taskId);
        });

        // Apply Markers
        if (!currentPlan.markers) currentPlan.markers = [];
        const markerMap = new Map(currentPlan.markers.map((m, idx) => [m.id, idx]));

        diffSelection.markers.new.forEach(markerId => {
            const markerToMerge = importedPlan.markers.find(m => m.id === markerId);
            if (markerToMerge) currentPlan.markers.push(JSON.parse(JSON.stringify(markerToMerge)));
        });

        diffSelection.markers.modified.forEach(markerId => {
            const idx = markerMap.get(markerId);
            const markerToMerge = importedPlan.markers.find(m => m.id === markerId);
            if (idx !== undefined && markerToMerge) {
                currentPlan.markers[idx] = JSON.parse(JSON.stringify(markerToMerge));
            }
        });

        diffSelection.markers.deleted.forEach(markerId => {
            currentPlan.markers = currentPlan.markers.filter(m => m.id !== markerId || m.id === 'marker_today');
        });

        return true;
    }

    loadState(newState) {
        if (newState && newState.meta && newState.plans) {
            this.file = newState;

            // Ensure Today marker exists on all plans
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;

            this.file.plans.forEach(plan => {
                if (!plan.markers) {
                    plan.markers = [];
                }

                const todayMarkerIndex = plan.markers.findIndex(m => m.id === 'marker_today');

                const todayMarker = {
                    id: 'marker_today',
                    type: 'vertical',
                    label: 'Today',
                    color: '#28a745',
                    importance: 'note',
                    repeats: true,
                    visible: true,
                    date: todayStr
                };

                if (todayMarkerIndex === -1) {
                    // Add as the first marker
                    plan.markers.unshift(todayMarker);
                } else {
                    // Update the existing today marker's date
                    plan.markers[todayMarkerIndex].date = todayStr;
                }
            });

            if (this.file.plans.length > 0) {
                this.currentPlanIndex = 0;
            } else {
                this.currentPlanIndex = -1;
            }
            console.log("Planner State successfully updated:", this.file);
            return true;
        }
        console.error("Invalid state provided to loadState.");
        return false;
    }

    getFillLegends() {
        if (!this.file.settings) this.file.settings = {};
        if (!this.file.settings.fillLegends) {
            this.file.settings.fillLegends = [
                {
                    id: 'default_fill',
                    label: 'Default Fill',
                    color: '#4da3ff',
                    tag: 'fill-default'
                }
            ];
        }
        return this.file.settings.fillLegends;
    }

    getBorderLegends() {
        if (!this.file.settings) this.file.settings = {};
        if (!this.file.settings.borderLegends) {
            this.file.settings.borderLegends = [
                {
                    id: 'default_border',
                    label: 'Default Border',
                    color: '#1c6ed5',
                    tag: 'border-default'
                }
            ];
        }
        return this.file.settings.borderLegends;
    }

    getState() {
        if (!this.file.meta) {
            this.file.meta = {};
        }
        if (window.APP_VERSION) {
            this.file.meta.appVersion = window.APP_VERSION;
        }
        return this.file;
    }

    getHistory() {
        if (!this.file.meta.history) {
            this.file.meta.history = [];
        }
        return this.file.meta.history;
    }

    addHistoryLog(comment) {
        if (!this.file.meta.history) {
            this.file.meta.history = [];
        }

        const timestamp = new Date().toISOString();
        this.file.meta.history.push({
            timestamp: timestamp,
            comment: comment
        });
    }
}