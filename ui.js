/* UI Controller */

class UI {
    constructor() {
        this.planner = window.PlannerState;

        // Setup initial UI components
        this.bindEvents();
    }

    bindEvents() {
        // Import JSON
        const importBtn = document.getElementById("importBtn");
        const fileInput = document.getElementById("fileInput");

        if (importBtn && fileInput) {
            importBtn.addEventListener("click", () => {
                fileInput.click();
            });

            fileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (file) {
                    Storage.importPlanFile(file, (error, data) => {
                        if (error) {
                            console.error("Error importing file:", error);
                            alert("Failed to import file. See console for details.");
                        } else {
                            if (this.planner.loadState(data)) {
                                console.log("File imported successfully!");
                                alert("File imported successfully!");
                                // Here we would normally trigger a re-render of the Gantt chart
                                // and other components in a later phase.
                                this.updateUI();
                            }
                        }
                    });
                }
                // Clear the input so the same file can be selected again
                fileInput.value = "";
            });
        }

        // Export JSON
        const exportBtn = document.getElementById("exportBtn");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => {
                const state = this.planner.getState();
                Storage.exportPlanFile(state);
                console.log("File exported.");
            });
        }

        // Plan Actions
        const newPlanBtn = document.getElementById("newPlanBtn");
        if (newPlanBtn) {
            newPlanBtn.addEventListener("click", () => {
                const name = prompt("Enter new plan name:");
                if (name && name.trim() !== "") {
                    this.planner.addPlan(name.trim());
                    this.updateUI();
                }
            });
        }

        const renamePlanBtn = document.getElementById("renamePlanBtn");
        if (renamePlanBtn) {
            renamePlanBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (currentPlan) {
                    const newName = prompt("Enter new name for the plan:", currentPlan.name);
                    if (newName && newName.trim() !== "") {
                        this.planner.renamePlan(newName.trim());
                        this.updateUI();
                    }
                }
            });
        }

        const duplicatePlanBtn = document.getElementById("duplicatePlanBtn");
        if (duplicatePlanBtn) {
            duplicatePlanBtn.addEventListener("click", () => {
                if (this.planner.duplicatePlan()) {
                    this.updateUI();
                }
            });
        }

        const deletePlanBtn = document.getElementById("deletePlanBtn");
        if (deletePlanBtn) {
            deletePlanBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (currentPlan && confirm(`Are you sure you want to delete plan "${currentPlan.name}"?`)) {
                    if (this.planner.deletePlan()) {
                        this.updateUI();
                    }
                }
            });
        }

        // Plan Selector
        const planSelector = document.getElementById("planSelector");
        if (planSelector) {
            planSelector.addEventListener("change", (e) => {
                const newIndex = parseInt(e.target.value, 10);
                if (!isNaN(newIndex)) {
                    this.planner.setCurrentPlanIndex(newIndex);
                    this.updateUI();
                }
            });
        }

        // Add Marker Button (For testing phase 3)
        const addMarkerBtn = document.getElementById("addMarkerBtn");
        if (addMarkerBtn) {
            addMarkerBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (!currentPlan) return;

                const label = prompt("Enter marker label:");
                if (!label) return;

                const dateStr = prompt("Enter marker date (YYYY-MM-DD):", currentPlan.timeline.startDate);
                if (!dateStr || isNaN(new Date(dateStr).getTime())) {
                    alert("Invalid date");
                    return;
                }

                if (this.planner.addMarker(dateStr, label)) {
                    this.updateUI();
                }
            });
        }
    }

    updateUI() {
        const planSelector = document.getElementById("planSelector");
        const plans = this.planner.getState().plans || [];

        if (planSelector) {
            planSelector.innerHTML = "";

            if (plans.length === 0) {
                const option = document.createElement("option");
                option.value = "";
                option.disabled = true;
                option.selected = true;
                option.textContent = "No plans available";
                planSelector.appendChild(option);
            } else {
                plans.forEach((plan, index) => {
                    const option = document.createElement("option");
                    option.value = index;
                    option.textContent = plan.name || "Unnamed Plan";
                    if (index === this.planner.currentPlanIndex) {
                        option.selected = true;
                    }
                    planSelector.appendChild(option);
                });
            }
        }

        const hasPlans = plans.length > 0;
        const renamePlanBtn = document.getElementById("renamePlanBtn");
        const duplicatePlanBtn = document.getElementById("duplicatePlanBtn");
        const deletePlanBtn = document.getElementById("deletePlanBtn");
        const addMarkerBtn = document.getElementById("addMarkerBtn");

        if (renamePlanBtn) renamePlanBtn.disabled = !hasPlans;
        if (duplicatePlanBtn) duplicatePlanBtn.disabled = !hasPlans;
        if (deletePlanBtn) deletePlanBtn.disabled = !hasPlans;
        if (addMarkerBtn) addMarkerBtn.disabled = !hasPlans;

        // Trigger Gantt re-render if it exists
        if (window.GanttEngine) {
            window.GanttEngine.render(this.planner.getCurrentPlan());
        }
    }
}