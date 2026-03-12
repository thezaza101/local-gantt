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

        // Tag Filter Events
        const tagFiltersContainer = document.getElementById('tagFiltersContainer');
        if (tagFiltersContainer) {
            tagFiltersContainer.addEventListener('change', (e) => {
                if (e.target.matches('.tag-checkbox')) {
                    this.updateTagFiltersState();
                } else if (e.target.matches('.tag-match-mode-radio') || e.target.matches('.tag-visual-mode-radio')) {
                    this.updateTagFiltersState();
                }
            });

            tagFiltersContainer.addEventListener('click', (e) => {
                if (e.target.id === 'selectAllTagsBtn') {
                    const checkboxes = tagFiltersContainer.querySelectorAll('.tag-checkbox');
                    checkboxes.forEach(cb => cb.checked = true);
                    this.updateTagFiltersState();
                } else if (e.target.id === 'unselectAllTagsBtn') {
                    const checkboxes = tagFiltersContainer.querySelectorAll('.tag-checkbox');
                    checkboxes.forEach(cb => cb.checked = false);
                    this.updateTagFiltersState();
                }
            });
        }
    }

    updateTagFiltersState() {
        const container = document.getElementById('tagFiltersContainer');
        if (!container) return;

        const selectedTags = Array.from(container.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.value);

        let matchMode = 'any';
        const matchModeEl = container.querySelector('.tag-match-mode-radio:checked');
        if (matchModeEl) matchMode = matchModeEl.value;

        let visualMode = 'show';
        const visualModeEl = container.querySelector('.tag-visual-mode-radio:checked');
        if (visualModeEl) visualMode = visualModeEl.value;

        this.planner.setFilterState({
            selectedTags,
            matchMode,
            visualMode
        });

        if (window.GanttEngine) {
            window.GanttEngine.render(this.planner.getCurrentPlan());
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
                document.getElementById('taskId').readOnly = false; // allow editing ID
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

        this.renderTagFilters();

        // Trigger Gantt re-render if it exists
        if (window.GanttEngine) {
            window.GanttEngine.render(this.planner.getCurrentPlan());
        }
    }

    renderTagFilters() {
        const container = document.getElementById('tagFiltersContainer');
        if (!container || !window.AnalyticsEngine) return;

        const uniqueTags = window.AnalyticsEngine.getUniqueTags();
        const filterState = this.planner.getFilterState();

        if (uniqueTags.length === 0) {
            container.innerHTML = '<span class="text-muted small">No tags in current plan</span>';
            return;
        }

        let html = `
            <div class="d-flex align-items-center me-3">
                <span class="fw-bold text-muted small me-2">Tags:</span>
                <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2 me-1" id="selectAllTagsBtn" style="font-size: 0.75rem;">All</button>
                <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2" id="unselectAllTagsBtn" style="font-size: 0.75rem;">None</button>
            </div>
            <div class="d-flex flex-wrap gap-2 me-3">
        `;

        // Prune phantom tags from filterState if they don't exist in the current plan
        const validSelectedTags = filterState.selectedTags.filter(t => uniqueTags.includes(t));
        if (validSelectedTags.length !== filterState.selectedTags.length) {
            this.planner.setFilterState({ selectedTags: validSelectedTags });
            // Re-fetch state after update
            filterState.selectedTags = validSelectedTags;
        }

        const escapeHtml = (str) => {
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        };

        uniqueTags.forEach(tag => {
            const isChecked = filterState.selectedTags.includes(tag) ? 'checked' : '';
            const safeTagAttr = tag.replace(/"/g, '&quot;');
            const safeTagText = escapeHtml(tag);
            html += `
                <div class="form-check form-check-inline m-0 d-flex align-items-center">
                    <input class="form-check-input tag-checkbox me-1" type="checkbox" id="tagFilter_${safeTagAttr}" value="${safeTagAttr}" ${isChecked}>
                    <label class="form-check-label small" for="tagFilter_${safeTagAttr}">${safeTagText}</label>
                </div>
            `;
        });

        html += `
            </div>
            <div class="d-flex align-items-center border-start ps-3 gap-3">
                <div class="d-flex align-items-center gap-1">
                    <span class="text-muted small">Match:</span>
                    <div class="form-check form-check-inline m-0">
                        <input class="form-check-input tag-match-mode-radio" type="radio" name="tagMatchMode" id="matchModeAny" value="any" ${filterState.matchMode === 'any' ? 'checked' : ''}>
                        <label class="form-check-label small" for="matchModeAny">Any (OR)</label>
                    </div>
                    <div class="form-check form-check-inline m-0">
                        <input class="form-check-input tag-match-mode-radio" type="radio" name="tagMatchMode" id="matchModeAll" value="all" ${filterState.matchMode === 'all' ? 'checked' : ''}>
                        <label class="form-check-label small" for="matchModeAll">All (AND)</label>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1 border-start ps-3">
                    <span class="text-muted small">View:</span>
                    <div class="form-check form-check-inline m-0">
                        <input class="form-check-input tag-visual-mode-radio" type="radio" name="tagVisualMode" id="visualModeShow" value="show" ${filterState.visualMode === 'show' ? 'checked' : ''}>
                        <label class="form-check-label small" for="visualModeShow">Show Only</label>
                    </div>
                    <div class="form-check form-check-inline m-0">
                        <input class="form-check-input tag-visual-mode-radio" type="radio" name="tagVisualMode" id="visualModeHighlight" value="highlight" ${filterState.visualMode === 'highlight' ? 'checked' : ''}>
                        <label class="form-check-label small" for="visualModeHighlight">Highlight</label>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }
}