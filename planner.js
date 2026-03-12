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