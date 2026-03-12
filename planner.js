/* Core Data Model */

class Planner {
    constructor() {
        this.file = {
            meta: {
                fileVersion: 1
            },
            settings: {
                baseLink: "https://jira.company.com/browse/"
            },
            plans: []
        };
        this.currentPlanIndex = -1;

        // Tag filter state
        this.filterState = {
            selectedTags: [],
            matchMode: 'any', // 'any' or 'all'
            visualMode: 'show' // 'show' or 'highlight'
        };
    }

    getFilterState() {
        return this.filterState;
    }

    setFilterState(newState) {
        this.filterState = { ...this.filterState, ...newState };
    }

    getCurrentPlan() {
        if (this.currentPlanIndex >= 0 && this.currentPlanIndex < this.file.plans.length) {
            return this.file.plans[this.currentPlanIndex];
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
            markers: [],
            capacity: {
                granularity: "month",
                entries: []
            },
            demandAdjustmentPercent: 20,
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

    renamePlan(newName) {
        if (!newName || !newName.trim()) return false;
        const plan = this.getCurrentPlan();
        if (plan) {
            plan.name = newName.trim();
            return true;
        }
        return false;
    }

    addMarker(dateStr, label, color = '#ff4d4d') {
        const plan = this.getCurrentPlan();
        if (!plan) return false;

        if (!plan.markers) {
            plan.markers = [];
        }

        plan.markers.push({
            date: dateStr,
            label: label,
            color: color
        });

        // Sort markers by date to keep them organized
        plan.markers.sort((a, b) => new Date(a.date) - new Date(b.date));
        return true;
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

        // Also we should regenerate IDs for tasks so they don't clash?
        // Let's regenerate task IDs
        const generateTaskId = () => 'TASK-' + Math.floor(1000 + Math.random() * 9000);
        clonedPlan.tasks.forEach(task => {
            task.id = generateTaskId();
        });

        this.file.plans.push(clonedPlan);
        this.currentPlanIndex = this.file.plans.length - 1;
        return true;
    }

    loadState(newState) {
        if (newState && newState.meta && newState.plans) {
            this.file = newState;
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

    getState() {
        return this.file;
    }
}