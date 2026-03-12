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

        // Add Task Button
        const addTaskBtn = document.getElementById("addTaskBtn");
        if (addTaskBtn) {
            addTaskBtn.addEventListener("click", () => {
                const currentPlan = this.planner.getCurrentPlan();
                if (!currentPlan) return;
                this.openTaskModal();
            });
        }

        // Save Task Button
        const saveTaskBtn = document.getElementById("saveTaskBtn");
        if (saveTaskBtn) {
            saveTaskBtn.addEventListener("click", () => {
                this.saveTask();
            });
        }
    }

    saveTask() {
        const id = document.getElementById('taskId').value.trim();
        const title = document.getElementById('taskTitle').value.trim();
        const startDate = document.getElementById('taskStartDate').value;
        const endDate = document.getElementById('taskEndDate').value;

        if (!id || !title || !startDate || !endDate) {
            alert("Please fill in all required fields (ID, Title, Start Date, End Date).");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            alert("Start date cannot be after end date.");
            return;
        }

        const taskData = {
            id: id,
            title: title,
            description: document.getElementById('taskDescription').value,
            startDate: startDate,
            endDate: endDate,
            row: parseInt(document.getElementById('taskRow').value, 10) || 1,
            fillColor: document.getElementById('taskFillColor').value,
            borderColor: document.getElementById('taskBorderColor').value,
            tags: document.getElementById('taskTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            effort: {
                design: parseFloat(document.getElementById('taskEffortDesign').value) || 0,
                dev: parseFloat(document.getElementById('taskEffortDev').value) || 0,
                test: parseFloat(document.getElementById('taskEffortTest').value) || 0
            }
        };

        const originalTaskId = document.getElementById('originalTaskId').value;
        let success = false;

        if (originalTaskId) {
            success = this.planner.updateTask(originalTaskId, taskData);
            if (!success) alert("Failed to update task. Task ID might be a duplicate.");
        } else {
            success = this.planner.addTask(taskData);
            if (!success) alert("Failed to add task. Task ID must be unique within the plan.");
        }

        if (success) {
            const taskModalEl = document.getElementById('taskModal');
            const taskModal = bootstrap.Modal.getInstance(taskModalEl);
            if (taskModal) {
                taskModal.hide();
            }
            this.updateUI();
        }
    }

    openTaskModal(taskId = null) {
        // We will implement modal logic in the next step
        console.log("Opening task modal for task ID:", taskId);
        const taskModal = new bootstrap.Modal(document.getElementById('taskModal'));

        const form = document.getElementById('taskForm');
        form.reset();

        if (taskId) {
            const task = this.planner.getTaskById(taskId);
            if (task) {
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskId').readOnly = true; // or not, but editing ID requires care
                document.getElementById('originalTaskId').value = task.id;

                document.getElementById('taskTitle').value = task.title || '';
                document.getElementById('taskDescription').value = task.description || '';
                document.getElementById('taskStartDate').value = task.startDate || '';
                document.getElementById('taskEndDate').value = task.endDate || '';
                document.getElementById('taskRow').value = task.row !== undefined ? task.row : 1;
                document.getElementById('taskFillColor').value = task.fillColor || '#4da3ff';
                document.getElementById('taskBorderColor').value = task.borderColor || '#1c6ed5';
                document.getElementById('taskTags').value = (task.tags || []).join(', ');

                document.getElementById('taskEffortDesign').value = task.effort ? task.effort.design || 0 : 0;
                document.getElementById('taskEffortDev').value = task.effort ? task.effort.dev || 0 : 0;
                document.getElementById('taskEffortTest').value = task.effort ? task.effort.test || 0 : 0;
            }
        } else {
            document.getElementById('taskId').value = '';
            document.getElementById('taskId').readOnly = false;
            document.getElementById('originalTaskId').value = '';

            document.getElementById('taskFillColor').value = '#4da3ff';
            document.getElementById('taskBorderColor').value = '#1c6ed5';
        }

        taskModal.show();
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
        const addTaskBtn = document.getElementById("addTaskBtn");
        const renamePlanBtn = document.getElementById("renamePlanBtn");
        const duplicatePlanBtn = document.getElementById("duplicatePlanBtn");
        const deletePlanBtn = document.getElementById("deletePlanBtn");
        const addMarkerBtn = document.getElementById("addMarkerBtn");

        if (addTaskBtn) addTaskBtn.disabled = !hasPlans;
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