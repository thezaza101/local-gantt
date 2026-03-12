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
    }

    updateUI() {
        // Update placeholders
        const currentPlanDisplay = document.getElementById("currentPlanDisplay");
        const plan = this.planner.getCurrentPlan();

        if (currentPlanDisplay && plan) {
            currentPlanDisplay.textContent = plan.name || "Unnamed Plan";
        }
    }
}