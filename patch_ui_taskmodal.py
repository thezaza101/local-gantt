import re

with open('ui.js', 'r') as f:
    content = f.read()

task_modal_populate = """        if (taskId) {
            const task = this.planner.getTaskById(taskId);
            if (task) {
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskId').readOnly = false; // allow editing ID
                document.getElementById('originalTaskId').value = task.id;"""

task_modal_populate_repl = """        // Setup Tracker Checkboxes
        const populateTrackerCheckboxes = (type, containerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            const items = this.planner[`get${type.charAt(0).toUpperCase() + type.slice(1)}`]();
            if (items.length === 0) {
                container.innerHTML = `<span class="text-muted small">No ${type} available</span>`;
                return;
            }
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'form-check';
                div.innerHTML = `
                    <input class="form-check-input task-tracker-assoc-checkbox" type="checkbox" value="${this.escapeHtml(item.id)}" data-type="${type}" id="ttcb_${type}_${item.id}">
                    <label class="form-check-label text-truncate d-block" for="ttcb_${type}_${item.id}" title="${this.escapeHtml(item.title)}">
                        [${this.escapeHtml(item.id)}] ${this.escapeHtml(item.title)}
                    </label>
                `;
                container.appendChild(div);
            });
        };

        populateTrackerCheckboxes('risks', 'taskRisksList');
        populateTrackerCheckboxes('issues', 'taskIssuesList');
        populateTrackerCheckboxes('dependencies', 'taskDepsList');
        populateTrackerCheckboxes('assumptions', 'taskAssumpsList');
        populateTrackerCheckboxes('decisions', 'taskDecsList');

        if (taskId) {
            const task = this.planner.getTaskById(taskId);
            if (task) {
                document.getElementById('taskId').value = task.id;
                document.getElementById('taskId').readOnly = false; // allow editing ID
                document.getElementById('originalTaskId').value = task.id;"""

content = content.replace(task_modal_populate, task_modal_populate_repl)


task_modal_hydrate = """                document.getElementById('taskExcludeFromAnalytics').checked = task.excludeFromAnalytics === true;

                document.getElementById('taskLastUpdatedDisplay').textContent = task.lastUpdated ? 'Last Updated: ' + task.lastUpdated : 'Last Updated: -';
                document.getElementById('taskLastCheckedDisplay').textContent = task.lastChecked ? 'Last Checked: ' + task.lastChecked : 'Last Checked: -';
            }
        } else {"""

task_modal_hydrate_repl = """                document.getElementById('taskExcludeFromAnalytics').checked = task.excludeFromAnalytics === true;

                const checkAssocs = (type, list) => {
                    if (!list) return;
                    list.forEach(id => {
                        const cb = document.getElementById(`ttcb_${type}_${id}`);
                        if (cb) cb.checked = true;
                    });
                };
                checkAssocs('risks', task.risks);
                checkAssocs('issues', task.issues);
                checkAssocs('dependencies', task.dependencies_proper);
                checkAssocs('assumptions', task.assumptions);
                checkAssocs('decisions', task.decisions);

                document.getElementById('taskLastUpdatedDisplay').textContent = task.lastUpdated ? 'Last Updated: ' + task.lastUpdated : 'Last Updated: -';
                document.getElementById('taskLastCheckedDisplay').textContent = task.lastChecked ? 'Last Checked: ' + task.lastChecked : 'Last Checked: -';
            }
        } else {"""

content = content.replace(task_modal_hydrate, task_modal_hydrate_repl)


task_modal_save = """            effort: {
                design: parseFloat(document.getElementById('taskEffortDesign').value) || 0,
                dev: parseFloat(document.getElementById('taskEffortDev').value) || 0,
                test: parseFloat(document.getElementById('taskEffortTest').value) || 0
            },
            excludeFromAnalytics: document.getElementById('taskExcludeFromAnalytics').checked
        };"""

task_modal_save_repl = """            effort: {
                design: parseFloat(document.getElementById('taskEffortDesign').value) || 0,
                dev: parseFloat(document.getElementById('taskEffortDev').value) || 0,
                test: parseFloat(document.getElementById('taskEffortTest').value) || 0
            },
            excludeFromAnalytics: document.getElementById('taskExcludeFromAnalytics').checked
        };

        const getAssocs = (type) => Array.from(document.querySelectorAll(`.task-tracker-assoc-checkbox[data-type="${type}"]:checked`)).map(cb => cb.value);
        taskData.risks = getAssocs('risks');
        taskData.issues = getAssocs('issues');
        taskData.dependencies_proper = getAssocs('dependencies');
        taskData.assumptions = getAssocs('assumptions');
        taskData.decisions = getAssocs('decisions');

        // We also need to update the tracker items to have this task in their associatedTasks array
        const syncTaskToTrackers = (type, currentTaskIds) => {
            const items = this.planner[`get${type.charAt(0).toUpperCase() + type.slice(1)}`]();
            items.forEach(item => {
                let assocs = item.associatedTasks || [];
                let modified = false;

                // If it was checked in the modal, but wasn't in the item's assocs, add it
                if (currentTaskIds.includes(item.id) && !assocs.includes(id)) {
                    assocs.push(id);
                    modified = true;
                }
                // If it was NOT checked in the modal, but WAS in the item's assocs, remove it
                else if (!currentTaskIds.includes(item.id) && assocs.includes(id)) {
                    assocs = assocs.filter(tId => tId !== id);
                    modified = true;
                }

                if (modified) {
                    item.associatedTasks = assocs;
                    this.planner.updateEntity(type, item.id, item);
                }
            });
        };

        syncTaskToTrackers('risks', taskData.risks);
        syncTaskToTrackers('issues', taskData.issues);
        syncTaskToTrackers('dependencies', taskData.dependencies_proper);
        syncTaskToTrackers('assumptions', taskData.assumptions);
        syncTaskToTrackers('decisions', taskData.decisions);
"""

content = content.replace(task_modal_save, task_modal_save_repl)


with open('ui.js', 'w') as f:
    f.write(content)
