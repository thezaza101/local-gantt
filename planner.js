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