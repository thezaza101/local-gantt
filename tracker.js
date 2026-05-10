class Tracker {
    constructor(planner) {
        this.planner = planner;
        this.selectedItems = new Set();
        this.bindEvents();
    }

    bindEvents() {
        // Bulk operations
        const selectAllCheckbox = document.getElementById('trackerSelectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.tracker-item-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                    if (e.target.checked) this.selectedItems.add(cb.value);
                    else this.selectedItems.delete(cb.value);
                });
                this.updateSelectionCount();
            });
        }

        const bulkDeleteBtn = document.getElementById('trackerBulkDeleteBtn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                if (this.selectedItems.size === 0) return;
                if (confirm(`Are you sure you want to delete ${this.selectedItems.size} items?`)) {
                    this.selectedItems.forEach(id => {
                        ['risks', 'issues', 'dependencies', 'assumptions', 'decisions'].forEach(type => {
                            this.planner.deleteEntity(type, id);
                        });
                    });
                    this.selectedItems.clear();
                    this.render();
                    if (window.UIController) window.UIController.updateUI();
                }
            });
        }

        // Tab changes should reset selection and update bulk status dropdown
        const trackerTabs = document.getElementById('trackerTabs');
        if (trackerTabs) {
            trackerTabs.addEventListener('shown.bs.tab', (e) => {
                this.selectedItems.clear();
                const selectAllCheckbox = document.getElementById('trackerSelectAllCheckbox');
                if (selectAllCheckbox) selectAllCheckbox.checked = false;
                this.updateSelectionCount();
                this.updateBulkStatusDropdown(e.target.getAttribute('aria-controls'));
            });
        }
    }

    updateSelectionCount() {
        const countSpan = document.getElementById('trackerSelectionCount');
        if (countSpan) countSpan.textContent = `${this.selectedItems.size} selected`;
    }

    updateBulkStatusDropdown(tabId) {
        const dropdown = document.getElementById('trackerBulkStatusDropdown');
        if (!dropdown) return;
        dropdown.innerHTML = '<li><h6 class="dropdown-header">Update Status</h6></li><li><hr class="dropdown-divider"></li>';

        let statuses = [];
        if (tabId === 'tracker-risks') statuses = ['Open', 'Mitigated', 'Accepted', 'Closed'];
        else if (tabId === 'tracker-issues') statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
        else if (tabId === 'tracker-dependencies') statuses = ['Active', 'At Risk', 'Blocked', 'Completed', 'Removed'];
        else if (tabId === 'tracker-assumptions') statuses = ['Active', 'Validated', 'Invalidated', 'Under Review'];
        else if (tabId === 'tracker-decisions') statuses = ['Pending', 'In Progress', 'Made', 'Deferred'];

        statuses.forEach(status => {
            const li = document.createElement('li');
            li.innerHTML = `<button class="dropdown-item" type="button" data-status="${status}">${status}</button>`;
            li.querySelector('button').addEventListener('click', () => this.bulkUpdateStatus(status));
            dropdown.appendChild(li);
        });
    }

    bulkUpdateStatus(status) {
        if (this.selectedItems.size === 0) return;
        let count = 0;
        this.selectedItems.forEach(id => {
            ['risks', 'issues', 'dependencies', 'assumptions', 'decisions'].forEach(type => {
                const item = this.planner.getEntityById(type, id);
                if (item) {
                    item.status = status;
                    if (!item.tags) item.tags = [];
                    // Remove old statuses
                    const possibleStatuses = ['Open', 'Mitigated', 'Accepted', 'Closed', 'In Progress', 'Resolved', 'Active', 'At Risk', 'Blocked', 'Completed', 'Removed', 'Validated', 'Invalidated', 'Under Review', 'Pending', 'Made', 'Deferred'];
                    item.tags = item.tags.filter(t => !possibleStatuses.includes(t));
                    item.tags.push(status);
                    item.lastUpdated = this.planner.getNowTimestamp();
                    this.planner.updateEntity(type, id, item);
                    count++;
                }
            });
        });
        this.selectedItems.clear();
        this.render();
        if (window.UIController) window.UIController.updateUI();
        alert(`Updated status to "${status}" for ${count} items.`);
    }

    render() {
        const file = this.planner.file || {};
        this.renderTable('risks', file.risks || [], 'risksTable');
        this.renderTable('issues', file.issues || [], 'issuesTable');
        this.renderTable('dependencies', file.dependencies || [], 'dependenciesTable');
        this.renderTable('assumptions', file.assumptions || [], 'assumptionsTable');
        this.renderTable('decisions', file.decisions || [], 'decisionsTable');
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    renderTable(type, items, tableId) {
        const tableBody = document.querySelector(`#${tableId} tbody`);
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (items.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">No ${type} found.</td></tr>`;
            return;
        }

        items.forEach(item => {
            const tr = document.createElement('tr');

            const isChecked = this.selectedItems.has(item.id) ? 'checked' : '';
            let cellsHTML = `
                <td><input class="form-check-input tracker-item-checkbox" type="checkbox" value="${this.escapeHtml(item.id)}" data-type="${type}" ${isChecked}></td>
                <td>${this.escapeHtml(item.id)}</td>
                <td>
                    ${this.escapeHtml(item.title)}
                    ${item.planId ? `<span class="badge bg-secondary ms-1">Plan Scope</span>` : `<span class="badge bg-info ms-1">Global Scope</span>`}
                </td>
            `;

            if (type === 'risks') {
                cellsHTML += `
                    <td>${this.escapeHtml(item.probability || '')}</td>
                    <td>${this.escapeHtml(item.severity || '')}</td>
                    <td>${this.escapeHtml(item.status || '')}</td>
                    <td>${this.escapeHtml(item.owner || '')}</td>
                `;
            } else if (type === 'issues') {
                cellsHTML += `
                    <td>${this.escapeHtml(item.severity || '')}</td>
                    <td>${this.escapeHtml(item.status || '')}</td>
                    <td>${this.escapeHtml(item.escalationOwner || '')}</td>
                `;
            } else if (type === 'dependencies') {
                const fromTasksStr = (item.fromTasks || []).join(', ');
                cellsHTML += `
                    <td>${this.escapeHtml(item.status || '')}</td>
                    <td>${this.escapeHtml(fromTasksStr)}</td>
                    <td>${this.escapeHtml(item.toTask || '')}</td>
                `;
            } else if (type === 'assumptions') {
                cellsHTML += `
                    <td>${this.escapeHtml(item.status || '')}</td>
                    <td>${this.escapeHtml(item.impact || '')}</td>
                    <td>${this.escapeHtml(item.expiryDate || '')}</td>
                `;
            } else if (type === 'decisions') {
                cellsHTML += `
                    <td>${this.escapeHtml(item.status || '')}</td>
                    <td>${this.escapeHtml(item.owner || '')}</td>
                    <td>${this.escapeHtml(item.deadline || '')}</td>
                `;
            }

            cellsHTML += `
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-tracker-btn" data-type="${type}" data-id="${item.id}">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-tracker-btn" data-type="${type}" data-id="${item.id}">Delete</button>
                </td>
            `;

            tr.innerHTML = cellsHTML;
            tableBody.appendChild(tr);
        });

        // Add event listeners for checkboxes
        tableBody.querySelectorAll('.tracker-item-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) this.selectedItems.add(e.target.value);
                else this.selectedItems.delete(e.target.value);
                this.updateSelectionCount();

                const selectAllCheckbox = document.getElementById('trackerSelectAllCheckbox');
                if (selectAllCheckbox) {
                    const allCbs = document.querySelectorAll('.tracker-item-checkbox');
                    const allChecked = Array.from(allCbs).every(c => c.checked);
                    selectAllCheckbox.checked = allChecked && allCbs.length > 0;
                }
            });
        });

        // Add event listeners for edit and delete buttons
        tableBody.querySelectorAll('.edit-tracker-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-type');
                const id = e.target.getAttribute('data-id');
                this.openEditModal(type, id);
            });
        });

        tableBody.querySelectorAll('.delete-tracker-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-type');
                const id = e.target.getAttribute('data-id');
                if (confirm(`Are you sure you want to delete ${id}?`)) {
                    this.planner.deleteEntity(type, id);
                    this.render();
                    if (window.UIController) { window.UIController.updateUI(); }
                }
            });
        });
    }

    openEditModal(type, id = null) {
        const modalEl = document.getElementById('trackerEditModal');
        if (!modalEl) return;
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

        document.getElementById('trackerEditForm').reset();
        document.getElementById('trackerItemType').value = type;
        document.getElementById('trackerOriginalId').value = id || '';

        // Generate dynamic fields HTML
        const dynamicFieldsContainer = document.getElementById('trackerDynamicFields');
        dynamicFieldsContainer.innerHTML = this.getDynamicFieldsHTML(type);

        // Populate Scope Dropdown
        const scopeSelect = document.getElementById('trackerItemScope');
        if (scopeSelect) {
            scopeSelect.innerHTML = '<option value="">Global (All Plans)</option>';
            const plans = this.planner.getState().plans || [];
            plans.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `Plan: ${p.name}`;
                scopeSelect.appendChild(option);
            });
        }

        // Populate Teams, Personnel, Tasks dropdowns
        this.populateAssociationDropdowns();
        this.populateGroupedTagsDropdown();

        if (id) {
            const item = this.planner.getEntityById(type, id);
            if (item) {
                document.getElementById('trackerItemId').value = item.id;
                document.getElementById('trackerItemId').readOnly = false;
                document.getElementById('trackerItemTitle').value = item.title || '';
                document.getElementById('trackerItemDescription').value = item.description || '';

                const scopeSelect = document.getElementById('trackerItemScope');
                if (scopeSelect) scopeSelect.value = item.planId || '';

                const tagsToDisplay = (item.tags || []).filter(t => !item.status || t.toLowerCase() !== item.status.toLowerCase());
                document.getElementById('trackerItemTags').value = tagsToDisplay.join(', ');

                this.setDynamicFieldsValues(type, item);
                this.setAssociationDropdownValues(item);

                document.getElementById('trackerLastUpdatedDisplay').textContent = item.lastUpdated ? 'Last Updated: ' + item.lastUpdated : 'Last Updated: -';
                document.getElementById('trackerLastCheckedDisplay').textContent = item.lastChecked ? 'Last Checked: ' + item.lastChecked : 'Last Checked: -';
            }
        } else {
            // Generate a new ID based on type
            const prefixes = { risks: 'R', issues: 'I', dependencies: 'D', assumptions: 'A', decisions: 'C' };
            const newId = this.planner.generateEntityId(prefixes[type] || 'E');
            document.getElementById('trackerItemId').value = newId;
            document.getElementById('trackerItemId').readOnly = false;

            document.getElementById('trackerLastUpdatedDisplay').textContent = 'Last Updated: -';
            document.getElementById('trackerLastCheckedDisplay').textContent = 'Last Checked: -';
        }

        modal.show();
    }

    getDynamicFieldsHTML(type) {
        let html = '';
        if (type === 'risks') {
            html = `
                <div class="col-md-4 mb-2"><label class="form-label">Probability</label><select class="form-select" id="riskProbability"><option value="">None</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
                <div class="col-md-4 mb-2"><label class="form-label">Severity</label><select class="form-select" id="riskSeverity"><option value="">None</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
                <div class="col-md-4 mb-2"><label class="form-label">Status</label><select class="form-select" id="trackerStatus"><option value="">None</option><option value="Open">Open</option><option value="Mitigated">Mitigated</option><option value="Accepted">Accepted</option><option value="Closed">Closed</option></select></div>
                <div class="col-md-6 mb-2"><label class="form-label">Mitigation Plan</label><textarea class="form-control" id="riskMitigationPlan" rows="2"></textarea></div>
                <div class="col-md-6 mb-2"><label class="form-label">Trigger Indicators</label><textarea class="form-control" id="riskTriggerIndicators" rows="2"></textarea></div>
                <div class="col-md-6 mb-2"><label class="form-label">Risk Owner</label><input type="text" class="form-control" id="riskOwner"></div>
                <div class="col-md-6 mb-2"><label class="form-label">Due Date for Mitigation</label><input type="date" class="form-control" id="riskDueDate"></div>
            `;
        } else if (type === 'issues') {
            html = `
                <div class="col-md-4 mb-2"><label class="form-label">Severity</label><select class="form-select" id="issueSeverity"><option value="">None</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
                <div class="col-md-4 mb-2"><label class="form-label">Status</label><select class="form-select" id="trackerStatus"><option value="">None</option><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option></select></div>
                <div class="col-md-4 mb-2"><label class="form-label">Target Resolution Date</label><input type="date" class="form-control" id="issueTargetDate"></div>
                <div class="col-md-6 mb-2"><label class="form-label">Business Impact</label><textarea class="form-control" id="issueBusinessImpact" rows="2"></textarea></div>
                <div class="col-md-6 mb-2"><label class="form-label">Workaround</label><textarea class="form-control" id="issueWorkaround" rows="2"></textarea></div>
                <div class="col-md-12 mb-2"><label class="form-label">Escalation Owner</label><input type="text" class="form-control" id="issueEscalationOwner"></div>
            `;
        } else if (type === 'dependencies') {
            html = `
                <div class="col-md-4 mb-2"><label class="form-label">Status</label><select class="form-select" id="trackerStatus"><option value="">None</option><option value="Active">Active</option><option value="At Risk">At Risk</option><option value="Blocked">Blocked</option><option value="Completed">Completed</option><option value="Removed">Removed</option></select></div>
                <div class="col-md-4 mb-2"><label class="form-label">Required-by Date</label><input type="date" class="form-control" id="depRequiredDate"></div>
                <div class="col-md-4 mb-2 d-flex align-items-end"><div class="form-check mb-2"><input class="form-check-input" type="checkbox" id="depCriticalPath"><label class="form-check-label">Critical Path</label></div></div>
                <div class="col-md-6 mb-2"><label class="form-label">Owning Team</label><input type="text" class="form-control" id="depOwningTeam"></div>
                <div class="col-md-6 mb-2"><label class="form-label">Affected Teams</label><input type="text" class="form-control" id="depAffectedTeams"></div>
                <div class="col-md-6 mb-2"><label class="form-label">From Task(s) (comma-separated)</label><input type="text" class="form-control" id="depFromTasks"></div>
                <div class="col-md-6 mb-2"><label class="form-label">To Task</label><input type="text" class="form-control" id="depToTask"></div>
                <div class="col-md-12 mb-2"><label class="form-label">Impact if Delayed</label><textarea class="form-control" id="depImpact" rows="2"></textarea></div>
            `;
        } else if (type === 'assumptions') {
            html = `
                <div class="col-md-4 mb-2"><label class="form-label">Status</label><select class="form-select" id="trackerStatus"><option value="">None</option><option value="Active">Active</option><option value="Validated">Validated</option><option value="Invalidated">Invalidated</option><option value="Under Review">Under Review</option></select></div>
                <div class="col-md-4 mb-2"><label class="form-label">Impact if Wrong</label><select class="form-select" id="assumpImpact"><option value="">None</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option></select></div>
                <div class="col-md-4 mb-2"><label class="form-label">Review / Expiry Date</label><input type="date" class="form-control" id="assumpExpiryDate"></div>
                <div class="col-md-12 mb-2"><label class="form-label">Validation Method / Evidence</label><textarea class="form-control" id="assumpValidation" rows="2"></textarea></div>
            `;
        } else if (type === 'decisions') {
            html = `
                <div class="col-md-4 mb-2"><label class="form-label">Status</label><select class="form-select" id="trackerStatus"><option value="">None</option><option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Made">Made</option><option value="Deferred">Deferred</option></select></div>
                <div class="col-md-4 mb-2"><label class="form-label">Decision Owner</label><input type="text" class="form-control" id="decOwner"></div>
                <div class="col-md-4 mb-2"><label class="form-label">Deadline</label><input type="date" class="form-control" id="decDeadline"></div>
                <div class="col-md-6 mb-2"><label class="form-label">Options</label><textarea class="form-control" id="decOptions" rows="2"></textarea></div>
                <div class="col-md-6 mb-2"><label class="form-label">Recommendation</label><textarea class="form-control" id="decRecommendation" rows="2"></textarea></div>
                <div class="col-md-6 mb-2"><label class="form-label">Outcome</label><textarea class="form-control" id="decOutcome" rows="2"></textarea></div>
                <div class="col-md-6 mb-2"><label class="form-label">Impact of Delay</label><textarea class="form-control" id="decImpact" rows="2"></textarea></div>
            `;
        }
        return html;
    }

    setDynamicFieldsValues(type, item) {
        if (type === 'risks') {
            document.getElementById('riskProbability').value = item.probability || '';
            document.getElementById('riskSeverity').value = item.severity || '';
            document.getElementById('trackerStatus').value = item.status || '';
            document.getElementById('riskMitigationPlan').value = item.mitigationPlan || '';
            document.getElementById('riskTriggerIndicators').value = item.triggerIndicators || '';
            document.getElementById('riskOwner').value = item.owner || '';
            document.getElementById('riskDueDate').value = item.dueDate || '';
        } else if (type === 'issues') {
            document.getElementById('issueSeverity').value = item.severity || '';
            document.getElementById('trackerStatus').value = item.status || '';
            document.getElementById('issueTargetDate').value = item.targetDate || '';
            document.getElementById('issueBusinessImpact').value = item.businessImpact || '';
            document.getElementById('issueWorkaround').value = item.workaround || '';
            document.getElementById('issueEscalationOwner').value = item.escalationOwner || '';
        } else if (type === 'dependencies') {
            document.getElementById('trackerStatus').value = item.status || '';
            document.getElementById('depRequiredDate').value = item.requiredDate || '';
            document.getElementById('depCriticalPath').checked = item.criticalPath || false;
            document.getElementById('depOwningTeam').value = item.owningTeam || '';
            document.getElementById('depAffectedTeams').value = item.affectedTeams || '';
            document.getElementById('depFromTasks').value = (item.fromTasks || []).join(', ');
            document.getElementById('depToTask').value = item.toTask || '';
            document.getElementById('depImpact').value = item.impact || '';
        } else if (type === 'assumptions') {
            document.getElementById('trackerStatus').value = item.status || '';
            document.getElementById('assumpImpact').value = item.impact || '';
            document.getElementById('assumpExpiryDate').value = item.expiryDate || '';
            document.getElementById('assumpValidation').value = item.validationMethod || '';
        } else if (type === 'decisions') {
            document.getElementById('trackerStatus').value = item.status || '';
            document.getElementById('decOwner').value = item.owner || '';
            document.getElementById('decDeadline').value = item.deadline || '';
            document.getElementById('decOptions').value = item.options || '';
            document.getElementById('decRecommendation').value = item.recommendation || '';
            document.getElementById('decOutcome').value = item.outcome || '';
            document.getElementById('decImpact').value = item.impact || '';
        }
    }

    populateAssociationDropdowns() {
        const teamsDropdown = document.getElementById('trackerItemTeamsDropdown');
        const personnelDropdown = document.getElementById('trackerItemPersonnelDropdown');
        const tasksDropdown = document.getElementById('trackerItemTasksDropdown');

        teamsDropdown.innerHTML = '';
        personnelDropdown.innerHTML = '';
        tasksDropdown.innerHTML = '';

        const teams = this.planner.getTeams ? this.planner.getTeams() : [];
        if (teams.length > 0) {
            teams.forEach(t => {
                const li = document.createElement('li');
                li.innerHTML = `<label class="dropdown-item"><input class="form-check-input me-2 tracker-team-checkbox" type="checkbox" value="${this.escapeHtml(t.id)}">${this.escapeHtml(t.name)}</label>`;
                teamsDropdown.appendChild(li);
            });
        } else {
            teamsDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted small">No teams configured</span></li>';
        }

        const personnel = this.planner.getPersonnel ? this.planner.getPersonnel() : [];
        if (personnel.length > 0) {
            personnel.forEach(p => {
                const li = document.createElement('li');
                li.innerHTML = `<label class="dropdown-item"><input class="form-check-input me-2 tracker-personnel-checkbox" type="checkbox" value="${this.escapeHtml(p.id)}">${this.escapeHtml(p.name)}</label>`;
                personnelDropdown.appendChild(li);
            });
        } else {
            personnelDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted small">No personnel configured</span></li>';
        }

        const plan = this.planner.getCurrentPlan();
        if (plan && plan.tasks && plan.tasks.length > 0) {
            plan.tasks.forEach(t => {
                const li = document.createElement('li');
                li.innerHTML = `<label class="dropdown-item"><input class="form-check-input me-2 tracker-task-checkbox" type="checkbox" value="${this.escapeHtml(t.id)}">[${this.escapeHtml(t.id)}] ${this.escapeHtml(t.title)}</label>`;
                tasksDropdown.appendChild(li);
            });
        } else {
            tasksDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted small">No tasks in current plan</span></li>';
        }
    }

    populateGroupedTagsDropdown() {
        const dropdown = document.getElementById('trackerItemGroupedTagsDropdown');
        dropdown.innerHTML = '';
        const tagGroups = this.planner.getState().settings.tagGroups || [];
        if (tagGroups.length > 0) {
            tagGroups.forEach(g => {
                const liHeader = document.createElement('li');
                liHeader.innerHTML = `<h6 class="dropdown-header text-primary">${this.escapeHtml(g.label)}</h6>`;
                dropdown.appendChild(liHeader);
                if (g.tags) {
                    g.tags.forEach(t => {
                        const li = document.createElement('li');
                        li.innerHTML = `
                            <label class="dropdown-item d-flex align-items-center">
                                <input class="form-check-input me-2 tracker-grouped-tag-checkbox" type="checkbox" value="${this.escapeHtml(t.tag)}">
                                <span class="badge text-dark border me-2" style="background-color: ${t.color || '#e9ecef'};">${this.escapeHtml(t.tag)}</span>
                                <small class="text-muted text-truncate" style="max-width: 150px;" title="${this.escapeHtml(t.description)}">${this.escapeHtml(t.description)}</small>
                            </label>
                        `;
                        dropdown.appendChild(li);
                    });
                }
            });
        } else {
            dropdown.innerHTML = '<li><span class="dropdown-item-text text-muted small">No tag groups configured</span></li>';
        }
    }

    setAssociationDropdownValues(item) {
        const teamCheckboxes = document.querySelectorAll('.tracker-team-checkbox');
        teamCheckboxes.forEach(cb => { cb.checked = (item.associatedTeams || []).includes(cb.value); });

        const personnelCheckboxes = document.querySelectorAll('.tracker-personnel-checkbox');
        personnelCheckboxes.forEach(cb => { cb.checked = (item.associatedPersonnel || []).includes(cb.value); });

        const taskCheckboxes = document.querySelectorAll('.tracker-task-checkbox');
        taskCheckboxes.forEach(cb => { cb.checked = (item.associatedTasks || []).includes(cb.value); });

        const groupedCheckboxes = document.querySelectorAll('.tracker-grouped-tag-checkbox');
        groupedCheckboxes.forEach(cb => { cb.checked = (item.tags || []).includes(cb.value); });
    }

    saveItem() {
        const type = document.getElementById('trackerItemType').value;
        const originalId = document.getElementById('trackerOriginalId').value;
        const id = document.getElementById('trackerItemId').value.trim();
        const title = document.getElementById('trackerItemTitle').value.trim();
        const planId = document.getElementById('trackerItemScope') ? document.getElementById('trackerItemScope').value : '';

        if (!id || !title) {
            alert("ID and Title are required.");
            return;
        }

        const description = document.getElementById('trackerItemDescription').value.trim();

        let tags = document.getElementById('trackerItemTags').value.split(',').map(t => t.trim()).filter(t => t);
        const statusField = document.getElementById('trackerStatus');
        const status = statusField ? statusField.value : '';
        if (status) { tags.push(status); }

        const groupedCheckboxes = document.querySelectorAll('.tracker-grouped-tag-checkbox:checked');
        groupedCheckboxes.forEach(cb => { if (!tags.includes(cb.value)) tags.push(cb.value); });
        const uniqueTags = [...new Set(tags)];

        const associatedTeams = Array.from(document.querySelectorAll('.tracker-team-checkbox:checked')).map(cb => cb.value);
        const associatedPersonnel = Array.from(document.querySelectorAll('.tracker-personnel-checkbox:checked')).map(cb => cb.value);
        const associatedTasks = Array.from(document.querySelectorAll('.tracker-task-checkbox:checked')).map(cb => cb.value);

        const nowStr = this.planner.getNowTimestamp();

        let itemData = {
            id, title, description, tags: uniqueTags, status,
            associatedTeams, associatedPersonnel, associatedTasks,
            planId: planId || null,
            lastUpdated: nowStr
        };

        if (type === 'risks') {
            itemData.probability = document.getElementById('riskProbability').value;
            itemData.severity = document.getElementById('riskSeverity').value;
            itemData.mitigationPlan = document.getElementById('riskMitigationPlan').value;
            itemData.triggerIndicators = document.getElementById('riskTriggerIndicators').value;
            itemData.owner = document.getElementById('riskOwner').value;
            itemData.dueDate = document.getElementById('riskDueDate').value;
        } else if (type === 'issues') {
            itemData.severity = document.getElementById('issueSeverity').value;
            itemData.targetDate = document.getElementById('issueTargetDate').value;
            itemData.businessImpact = document.getElementById('issueBusinessImpact').value;
            itemData.workaround = document.getElementById('issueWorkaround').value;
            itemData.escalationOwner = document.getElementById('issueEscalationOwner').value;
        } else if (type === 'dependencies') {
            itemData.requiredDate = document.getElementById('depRequiredDate').value;
            itemData.criticalPath = document.getElementById('depCriticalPath').checked;
            itemData.owningTeam = document.getElementById('depOwningTeam').value;
            itemData.affectedTeams = document.getElementById('depAffectedTeams').value;
            itemData.fromTasks = document.getElementById('depFromTasks').value.split(',').map(t => t.trim()).filter(t => t);
            itemData.toTask = document.getElementById('depToTask').value.trim();
            itemData.impact = document.getElementById('depImpact').value;
        } else if (type === 'assumptions') {
            itemData.impact = document.getElementById('assumpImpact').value;
            itemData.expiryDate = document.getElementById('assumpExpiryDate').value;
            itemData.validationMethod = document.getElementById('assumpValidation').value;
        } else if (type === 'decisions') {
            itemData.owner = document.getElementById('decOwner').value;
            itemData.deadline = document.getElementById('decDeadline').value;
            itemData.options = document.getElementById('decOptions').value;
            itemData.recommendation = document.getElementById('decRecommendation').value;
            itemData.outcome = document.getElementById('decOutcome').value;
            itemData.impact = document.getElementById('decImpact').value;
        }

        if (originalId) {
            const existing = this.planner.getEntityById(type, originalId);
            if (existing) {
                itemData.lastChecked = existing.lastChecked;
            }
            if (originalId !== id) {
                // Ensure no conflict
                if (this.planner.getEntityById(type, id)) {
                    alert("ID already exists.");
                    return;
                }
                this.planner.deleteEntity(type, originalId);
                this.planner.addEntity(type, itemData);
            } else {
                this.planner.updateEntity(type, id, itemData);
            }
        } else {
            if (this.planner.getEntityById(type, id)) {
                alert("ID already exists.");
                return;
            }
            itemData.lastChecked = nowStr;
            this.planner.addEntity(type, itemData);
        }

        const modalEl = document.getElementById('trackerEditModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) { modal.hide(); }

        this.render();
        if (window.UIController) { window.UIController.updateUI(); }
    }

    updateLastChecked() {
        const type = document.getElementById('trackerItemType').value;
        const originalId = document.getElementById('trackerOriginalId').value;
        if (originalId) {
            const item = this.planner.getEntityById(type, originalId);
            if (item) {
                item.lastChecked = this.planner.getNowTimestamp();
                this.planner.updateEntity(type, originalId, item);
                document.getElementById('trackerLastCheckedDisplay').textContent = 'Last Checked: ' + item.lastChecked;
                this.render();
                if (window.UIController) { window.UIController.updateUI(); }
            }
        }
    }

    autoCreateProperDependencies() {
        const plan = this.planner.getCurrentPlan();
        if (!plan || !plan.tasks) return;

        const allDeps = this.planner.getDependencies();
        let changed = false;

        plan.tasks.forEach(task => {
            if (task.dependencies && task.dependencies.length > 0) {
                task.dependencies.forEach(depId => {
                    // Look for existing proper dependency linking depId -> task.id
                    let existing = allDeps.find(d => (d.fromTasks || []).includes(depId) && d.toTask === task.id);
                    if (!existing) {
                        const newDep = {
                            id: this.planner.generateEntityId('D'),
                            title: `Dependency: ${depId} -> ${task.id}`,
                            description: 'Auto-created from task dependency',
                            tags: ['Active'],
                            status: 'Active',
                            fromTasks: [depId],
                            toTask: task.id,
                            associatedTasks: [depId, task.id],
                            lastUpdated: this.planner.getNowTimestamp(),
                            lastChecked: this.planner.getNowTimestamp()
                        };
                        this.planner.addEntity('dependencies', newDep);
                        changed = true;
                    } else if (existing.status === 'Removed') {
                        existing.status = 'Active';
                        if (!existing.tags) existing.tags = [];
                        if (existing.tags.includes('Removed')) {
                            existing.tags = existing.tags.filter(t => t !== 'Removed');
                        }
                        existing.tags.push('Active');
                        existing.lastUpdated = this.planner.getNowTimestamp();
                        this.planner.updateEntity('dependencies', existing.id, existing);
                        changed = true;
                    }
                });
            }
        });

        // Now find any removed dependencies (where proper dep exists, but task no longer has it)
        allDeps.forEach(dep => {
            if (dep.toTask) {
                const toTaskObj = plan.tasks.find(t => t.id === dep.toTask);
                if (toTaskObj) {
                    const fromTasks = dep.fromTasks || [];
                    fromTasks.forEach(ft => {
                        if (!toTaskObj.dependencies || !toTaskObj.dependencies.includes(ft)) {
                            // Dep was removed from the task
                            if (dep.status !== 'Removed') {
                                dep.status = 'Removed';
                                if (!dep.tags) dep.tags = [];
                                dep.tags = dep.tags.filter(t => t !== dep.status && !['Active', 'At Risk', 'Blocked', 'Completed'].includes(t));
                                dep.tags.push('Removed');
                                dep.lastUpdated = this.planner.getNowTimestamp();
                                this.planner.updateEntity('dependencies', dep.id, dep);
                                changed = true;
                            }
                        }
                    });
                }
            }
        });

        if (changed) {
            this.render();
            if (window.UIController) { window.UIController.updateUI(); }
            alert('Proper dependencies updated successfully.');
        } else {
            alert('No changes needed. All proper dependencies are up to date.');
        }
    }
}
