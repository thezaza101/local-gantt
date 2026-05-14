class Tracker {
    constructor(planner) {
        this.planner = planner;
        this.selectedItems = new Set();
        this.sortState = {};
        this.filterState = {};
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
        const table = document.getElementById(tableId);
        if (!table) return;
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        if (!thead || !tbody) return;

        const settings = this.planner.getTrackerSettings();
        const truncateLength = settings.truncateLength || 50;
        const columns = (settings.columns[type] || []).filter(c => c.visible);

        // Build header
        thead.innerHTML = '';
        const trHead = document.createElement('tr');
        trHead.innerHTML = '<th style="width: 30px;"></th>';

        if (!this.sortState[type]) this.sortState[type] = { column: 'id', direction: 'asc' };
        if (!this.filterState[type]) this.filterState[type] = {};

        columns.forEach(col => {
            const th = document.createElement('th');
            let sortIndicator = '';
            if (this.sortState[type].column === col.id) {
                sortIndicator = this.sortState[type].direction === 'asc' ? ' ↑' : ' ↓';
            }
            th.innerHTML = `
                <div class="d-flex flex-column">
                    <span class="cursor-pointer tracker-sort-header" data-type="${type}" data-col="${this.escapeHtml(col.id)}">${this.escapeHtml(col.label)}${sortIndicator}</span>
                    <input type="text" class="form-control form-control-sm mt-1 tracker-filter-input" data-type="${type}" data-col="${this.escapeHtml(col.id)}" placeholder="Filter..." value="${this.escapeHtml(this.filterState[type][col.id] || '')}">
                </div>
            `;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        // Apply filtering
        let filteredItems = items.filter(item => {
            return columns.every(col => {
                const filterVal = (this.filterState[type][col.id] || '').toLowerCase();
                if (!filterVal) return true;
                const cellVal = this.getCellValue(item, col.id, type).toLowerCase();
                return cellVal.includes(filterVal);
            });
        });

        // Apply sorting
        filteredItems.sort((a, b) => {
            const col = this.sortState[type].column;
            const dir = this.sortState[type].direction === 'asc' ? 1 : -1;
            const valA = this.getCellValue(a, col, type);
            const valB = this.getCellValue(b, col, type);
            return valA.localeCompare(valB, undefined, {numeric: true}) * dir;
        });

        // Build body
        tbody.innerHTML = '';

        if (filteredItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${columns.length + 1}" class="text-center text-muted">No ${type} found matching filters.</td></tr>`;
        } else {
            filteredItems.forEach(item => {
                const tr = document.createElement('tr');
                const isChecked = this.selectedItems.has(item.id) ? 'checked' : '';
                let cellsHTML = `<td><input class="form-check-input tracker-item-checkbox" type="checkbox" value="${this.escapeHtml(item.id)}" data-type="${type}" ${isChecked}></td>`;

                columns.forEach(col => {
                    let rawVal = this.getCellValue(item, col.id, type);

                    // Truncate text heavy columns
                    if (['description', 'triggerIndicators', 'workaround', 'businessImpact', 'options', 'recommendation', 'outcome', 'impact'].includes(col.id)) {
                        if (rawVal.length > truncateLength) {
                            rawVal = rawVal.substring(0, truncateLength) + '...';
                        }
                    }

                    if (col.id === 'scope') {
                        cellsHTML += `<td>${item.planId ? '<span class="badge bg-secondary">Plan Scope</span>' : '<span class="badge bg-info">Global Scope</span>'}</td>`;
                    } else {
                        cellsHTML += `<td>${this.escapeHtml(rawVal)}</td>`;
                    }
                });

                tr.innerHTML = cellsHTML;
                tr.classList.add('cursor-pointer');
                tr.style.cursor = 'pointer';

                tr.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('tracker-item-checkbox')) {
                        this.openEditModal(type, item.id);
                    }
                });

                tbody.appendChild(tr);
            });
        }

        // Add event listeners for checkboxes
        tbody.querySelectorAll('.tracker-item-checkbox').forEach(cb => {
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

        // Add event listeners for sorting and filtering
        thead.querySelectorAll('.tracker-sort-header').forEach(sh => {
            sh.addEventListener('click', (e) => {
                const t = e.target.getAttribute('data-type');
                const col = e.target.getAttribute('data-col');
                if (this.sortState[t].column === col) {
                    this.sortState[t].direction = this.sortState[t].direction === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortState[t] = { column: col, direction: 'asc' };
                }
                this.render();
            });
        });

        thead.querySelectorAll('.tracker-filter-input').forEach(fi => {
            fi.addEventListener('input', (e) => {
                const t = e.target.getAttribute('data-type');
                const col = e.target.getAttribute('data-col');
                this.filterState[t][col] = e.target.value;
                this.render();

                // Refocus the input after render
                setTimeout(() => {
                    const input = document.querySelector(`input.tracker-filter-input[data-type="${t}"][data-col="${col}"]`);
                    if (input) {
                        input.focus();
                        // Move cursor to end
                        const val = input.value;
                        input.value = '';
                        input.value = val;
                    }
                }, 0);
            });
        });
    }

    getCellValue(item, colId, type) {
        if (colId === 'scope') return item.planId ? 'Plan' : 'Global';
        if (colId === 'owningTeamFromTask') {
            const owningTeamObj = (this.planner.getTeams ? this.planner.getTeams() : []).find(t => t.id === item.owningTeam);
            const owningTeamStr = owningTeamObj ? owningTeamObj.name : (item.owningTeam || '');
            let fromTaskStr = '';
            if (item.fromTasks && item.fromTasks.length > 0) fromTaskStr = item.fromTasks[0] + (item.fromTasks.length > 1 ? '*' : '');

            if (owningTeamStr && fromTaskStr) return owningTeamStr + ' / ' + fromTaskStr;
            if (owningTeamStr) return owningTeamStr;
            if (fromTaskStr) return fromTaskStr;
            return '';
        }
        if (colId === 'affectedTeamsToTask') {
            const affectedTeamsStr = item.affectedTeams || '';
            const toTaskStr = item.toTask || '';
            if (affectedTeamsStr && toTaskStr) return affectedTeamsStr + ' / ' + toTaskStr;
            if (affectedTeamsStr) return affectedTeamsStr;
            if (toTaskStr) return toTaskStr;
            return '';
        }
        if (colId === 'dueDate' && type === 'risks') return item.dueDate || '';
        if (colId === 'requiredDate' && type === 'dependencies') return item.requiredDate || '';
        if (colId === 'targetDate' && type === 'issues') return item.targetDate || '';

        return item[colId] || '';
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

        const deleteBtn = document.getElementById('deleteTrackerItemBtn');

        if (id) {
            if (deleteBtn) deleteBtn.classList.remove('d-none');
            const item = this.planner.getEntityById(type, id);
            if (item) {
                document.getElementById('trackerItemId').value = item.id;
                document.getElementById('trackerItemId').readOnly = false;
                document.getElementById('trackerItemTitle').value = item.title || '';
                document.getElementById('trackerItemDescription').value = item.description || '';
                document.getElementById('trackerItemFollowUpDate').value = item.followUpDate || '';
                document.getElementById('trackerItemNotes').value = item.notes || '';

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
            if (deleteBtn) deleteBtn.classList.add('d-none');
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

    deleteItem() {
        const type = document.getElementById('trackerItemType').value;
        const originalId = document.getElementById('trackerOriginalId').value;
        if (!type || !originalId) return;

        if (confirm(`Are you sure you want to delete ${originalId}?`)) {
            this.planner.deleteEntity(type, originalId);
            this.render();
            if (window.UIController) { window.UIController.updateUI(); }
            const modalEl = document.getElementById('trackerEditModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        }
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
                <div class="col-md-4 mb-2 d-flex align-items-end"><div class="form-check mb-2"><input class="form-check-input" type="checkbox" id="depShowOnGantt"><label class="form-check-label">Visible on Gantt</label></div></div>
                <div class="col-md-4 mb-2">
                    <label class="form-label">Arrow Color</label>
                    <select class="form-select" id="depArrowColor">
                        <option value="">Default (Task Color)</option>
                        <option value="#ff4d4d">Red</option>
                        <option value="#4da3ff">Blue</option>
                        <option value="#00cc66">Green</option>
                        <option value="#ffb84d">Orange</option>
                        <option value="#b366ff">Purple</option>
                        <option value="#ff66b3">Pink</option>
                        <option value="#66e0ff">Cyan</option>
                        <option value="#d9d9d9">Gray</option>
                        <option value="#ffcc00">Yellow</option>
                        <option value="#000000">Black</option>
                    </select>
                </div>
                <div class="col-md-4 mb-2"><label class="form-label">Arrow Text</label><input type="text" class="form-control" id="depArrowText"></div>

                <div class="col-md-6 mb-2">
                    <label class="form-label">Owning Team</label>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false" id="depOwningTeamBtn">Select Team</button>
                        <ul class="dropdown-menu w-100 p-2 shadow-sm" style="max-height: 250px; overflow-y: auto;" id="depOwningTeamDropdown">
                            <li><input type="text" class="form-control form-control-sm mb-2" id="depOwningTeamSearch" placeholder="Search teams..."></li>
                            <div id="depOwningTeamList"></div>
                        </ul>
                    </div>
                    <input type="hidden" id="depOwningTeam">
                </div>

                <div class="col-md-6 mb-2">
                    <label class="form-label">Affected Teams</label>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false" id="depAffectedTeamsBtn">Select Teams</button>
                        <ul class="dropdown-menu w-100 p-2 shadow-sm" style="max-height: 250px; overflow-y: auto;" id="depAffectedTeamsDropdown">
                            <li><input type="text" class="form-control form-control-sm mb-2" id="depAffectedTeamsSearch" placeholder="Search teams..."></li>
                            <div id="depAffectedTeamsList"></div>
                        </ul>
                    </div>
                </div>

                <div class="col-md-6 mb-2">
                    <label class="form-label">From Task(s)</label>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start text-truncate" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false" id="depFromTasksBtn">Select Tasks</button>
                        <ul class="dropdown-menu w-100 p-2 shadow-sm" style="max-height: 250px; overflow-y: auto;" id="depFromTasksDropdown">
                            <li><input type="text" class="form-control form-control-sm mb-2" id="depFromTasksSearch" placeholder="Search tasks..."></li>
                            <div id="depFromTasksList"></div>
                        </ul>
                    </div>
                </div>

                <div class="col-md-6 mb-2">
                    <label class="form-label">To Task</label>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start text-truncate" type="button" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false" id="depToTaskBtn">Select Task</button>
                        <ul class="dropdown-menu w-100 p-2 shadow-sm" style="max-height: 250px; overflow-y: auto;" id="depToTaskDropdown">
                            <li><input type="text" class="form-control form-control-sm mb-2" id="depToTaskSearch" placeholder="Search task..."></li>
                            <div id="depToTaskList"></div>
                        </ul>
                    </div>
                    <input type="hidden" id="depToTask">
                </div>

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
            document.getElementById('depShowOnGantt').checked = item.showOnGantt || false;
            document.getElementById('depArrowColor').value = item.arrowColor || '';
            document.getElementById('depArrowText').value = item.arrowText || '';
            document.getElementById('depOwningTeam').value = item.owningTeam || '';

            // Set text for single selects
            const owningTeamObj = (this.planner.getTeams ? this.planner.getTeams() : []).find(t => t.id === item.owningTeam);
            document.getElementById('depOwningTeamBtn').textContent = owningTeamObj ? owningTeamObj.name : (item.owningTeam || 'Select Team');

            document.getElementById('depToTask').value = item.toTask || '';
            const toTaskObj = (this.planner.getCurrentPlan()?.tasks || []).find(t => t.id === item.toTask);
            document.getElementById('depToTaskBtn').textContent = toTaskObj ? `[${toTaskObj.id}] ${toTaskObj.title}` : (item.toTask || 'Select Task');

            // Set checkboxes for multi selects
            const affectedTeams = (item.affectedTeams || '').split(',').map(s => s.trim()).filter(s => s);
            document.querySelectorAll('.dep-affected-team-checkbox').forEach(cb => {
                cb.checked = affectedTeams.includes(cb.value);
            });
            const updateMultiBtnText = (selector, btnId, defText) => {
                const btn = document.getElementById(btnId);
                const checked = document.querySelectorAll(`${selector}:checked`);
                if (checked.length === 0) btn.textContent = defText;
                else if (checked.length === 1) btn.textContent = checked[0].parentElement.textContent.trim();
                else btn.textContent = `${checked.length} Selected`;
            };
            updateMultiBtnText('.dep-affected-team-checkbox', 'depAffectedTeamsBtn', 'Select Teams');

            document.querySelectorAll('.dep-from-task-checkbox').forEach(cb => {
                cb.checked = (item.fromTasks || []).includes(cb.value);
            });
            updateMultiBtnText('.dep-from-task-checkbox', 'depFromTasksBtn', 'Select Tasks');

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

        // Populate dependency specific dropdowns if they exist in the DOM
        const depOwningTeamList = document.getElementById('depOwningTeamList');
        const depAffectedTeamsList = document.getElementById('depAffectedTeamsList');
        const depFromTasksList = document.getElementById('depFromTasksList');
        const depToTaskList = document.getElementById('depToTaskList');

        if (depOwningTeamList) {
            depOwningTeamList.innerHTML = '';
            if (teams.length > 0) {
                teams.forEach(t => {
                    const li = document.createElement('li');
                    li.innerHTML = `<button class="dropdown-item dep-owning-team-item" type="button" data-id="${this.escapeHtml(t.id)}">${this.escapeHtml(t.name)}</button>`;
                    depOwningTeamList.appendChild(li);
                });
            } else {
                depOwningTeamList.innerHTML = '<li><span class="dropdown-item-text text-muted small">No teams configured</span></li>';
            }
        }

        if (depAffectedTeamsList) {
            depAffectedTeamsList.innerHTML = '';
            if (teams.length > 0) {
                teams.forEach(t => {
                    const li = document.createElement('li');
                    li.innerHTML = `<label class="dropdown-item"><input class="form-check-input me-2 dep-affected-team-checkbox" type="checkbox" value="${this.escapeHtml(t.id)}">${this.escapeHtml(t.name)}</label>`;
                    depAffectedTeamsList.appendChild(li);
                });
            } else {
                depAffectedTeamsList.innerHTML = '<li><span class="dropdown-item-text text-muted small">No teams configured</span></li>';
            }
        }

        if (depFromTasksList) {
            depFromTasksList.innerHTML = '';
            if (plan && plan.tasks && plan.tasks.length > 0) {
                plan.tasks.forEach(t => {
                    const li = document.createElement('li');
                    li.innerHTML = `<label class="dropdown-item"><input class="form-check-input me-2 dep-from-task-checkbox" type="checkbox" value="${this.escapeHtml(t.id)}">[${this.escapeHtml(t.id)}] ${this.escapeHtml(t.title)}</label>`;
                    depFromTasksList.appendChild(li);
                });
            } else {
                depFromTasksList.innerHTML = '<li><span class="dropdown-item-text text-muted small">No tasks in plan</span></li>';
            }
        }

        if (depToTaskList) {
            depToTaskList.innerHTML = '';
            if (plan && plan.tasks && plan.tasks.length > 0) {
                plan.tasks.forEach(t => {
                    const li = document.createElement('li');
                    li.innerHTML = `<button class="dropdown-item dep-to-task-item" type="button" data-id="${this.escapeHtml(t.id)}">[${this.escapeHtml(t.id)}] ${this.escapeHtml(t.title)}</button>`;
                    depToTaskList.appendChild(li);
                });
            } else {
                depToTaskList.innerHTML = '<li><span class="dropdown-item-text text-muted small">No tasks in plan</span></li>';
            }
        }

        this.bindDependencyDropdownSearchEvents();
    }

    bindDependencyDropdownSearchEvents() {
        const bindSearch = (searchInputId, listId, isCheckbox) => {
            const searchInput = document.getElementById(searchInputId);
            const listContainer = document.getElementById(listId);
            if (!searchInput || !listContainer) return;

            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const items = listContainer.querySelectorAll('li');
                items.forEach(li => {
                    const text = li.textContent.toLowerCase();
                    li.style.display = text.includes(term) ? '' : 'none';
                });
            });
        };

        bindSearch('depOwningTeamSearch', 'depOwningTeamList', false);
        bindSearch('depAffectedTeamsSearch', 'depAffectedTeamsList', true);
        bindSearch('depFromTasksSearch', 'depFromTasksList', true);
        bindSearch('depToTaskSearch', 'depToTaskList', false);

        // Bind single select item clicks
        document.querySelectorAll('.dep-owning-team-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const name = e.target.textContent;
                document.getElementById('depOwningTeam').value = id;
                document.getElementById('depOwningTeamBtn').textContent = name;
                // Close dropdown
                const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('depOwningTeamBtn'));
                if (dropdown) dropdown.hide();
            });
        });

        document.querySelectorAll('.dep-to-task-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const name = e.target.textContent;
                document.getElementById('depToTask').value = id;
                document.getElementById('depToTaskBtn').textContent = name;
                // Close dropdown
                const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('depToTaskBtn'));
                if (dropdown) dropdown.hide();
            });
        });

        // Update multi-select button texts
        const updateMultiSelectText = (checkboxSelector, btnId, defaultText) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            const checked = document.querySelectorAll(`${checkboxSelector}:checked`);
            if (checked.length === 0) {
                btn.textContent = defaultText;
            } else if (checked.length === 1) {
                btn.textContent = checked[0].parentElement.textContent.trim();
            } else {
                btn.textContent = `${checked.length} Selected`;
            }
        };

        document.querySelectorAll('.dep-affected-team-checkbox').forEach(cb => {
            cb.addEventListener('change', () => updateMultiSelectText('.dep-affected-team-checkbox', 'depAffectedTeamsBtn', 'Select Teams'));
        });

        document.querySelectorAll('.dep-from-task-checkbox').forEach(cb => {
            cb.addEventListener('change', () => updateMultiSelectText('.dep-from-task-checkbox', 'depFromTasksBtn', 'Select Tasks'));
        });
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
        const followUpDate = document.getElementById('trackerItemFollowUpDate').value || null;
        const notes = document.getElementById('trackerItemNotes').value || '';

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
            lastUpdated: nowStr,
            followUpDate,
            notes
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
            itemData.showOnGantt = document.getElementById('depShowOnGantt').checked;
            itemData.arrowColor = document.getElementById('depArrowColor').value;
            itemData.arrowText = document.getElementById('depArrowText').value.trim();
            itemData.owningTeam = document.getElementById('depOwningTeam').value;
            itemData.affectedTeams = Array.from(document.querySelectorAll('.dep-affected-team-checkbox:checked')).map(cb => cb.value).join(', ');
            itemData.fromTasks = Array.from(document.querySelectorAll('.dep-from-task-checkbox:checked')).map(cb => cb.value);
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

    processImportedCsv(csvText, planIdScope) {
        const parsedData = this.parseCsv(csvText);
        if (parsedData.length === 0) return { success: 0, skipped: [] };

        let successCount = 0;
        let skippedTypes = new Set();

        const typeMapping = {
            'risk': 'risks',
            'risks': 'risks',
            'issue': 'issues',
            'issues': 'issues',
            'dependency': 'dependencies',
            'dependencies': 'dependencies',
            'assumption': 'assumptions',
            'assumptions': 'assumptions',
            'decision': 'decisions',
            'decisions': 'decisions'
        };

        const prefixes = { risks: 'R', issues: 'I', dependencies: 'D', assumptions: 'A', decisions: 'C' };

        const nowStr = this.planner.getNowTimestamp();

        parsedData.forEach(row => {
            const rawType = (row.type || '').trim().toLowerCase();
            const type = typeMapping[rawType];

            if (!type) {
                if (rawType) skippedTypes.add(rawType);
                return;
            }

            let id = (row.id || '').trim();
            let title = (row.title || '').trim();
            const description = (row.description || '').trim();

            if (!title) {
                title = 'Imported Item';
            }

            if (id) {
                const existing = this.planner.getEntityById(type, id);
                if (existing) {
                    const originalId = id;
                    id = this.planner.generateEntityId(prefixes[type]);
                    title = `[original id ${originalId}] ${title}`;
                }
            } else {
                id = this.planner.generateEntityId(prefixes[type]);
            }

            title = title + ' [Imported]';

            const itemData = {
                id: id,
                title: title,
                description: description,
                planId: planIdScope || null,
                tags: ['Imported'],
                lastUpdated: nowStr,
                lastChecked: nowStr
            };

            if (this.planner.addEntity(type, itemData)) {
                successCount++;
            }
        });

        this.render();
        if (window.UIController) { window.UIController.updateUI(); }

        return {
            success: successCount,
            skipped: Array.from(skippedTypes)
        };
    }

    parseCsv(csvText) {
        if (!csvText) return [];

        const lines = [];
        let currentLine = [];
        let currentCell = '';
        let insideQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    // Escaped quote
                    currentCell += '"';
                    i++;
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                currentLine.push(currentCell);
                currentCell = '';
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }
                currentLine.push(currentCell);
                lines.push(currentLine);
                currentLine = [];
                currentCell = '';
            } else {
                currentCell += char;
            }
        }

        if (currentCell !== '' || currentLine.length > 0) {
            currentLine.push(currentCell);
            lines.push(currentLine);
        }

        if (lines.length === 0) return [];

        const headers = lines[0].map(h => h.trim().toLowerCase());
        const result = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.length === 0 || (line.length === 1 && line[0].trim() === '')) continue;

            const rowObj = {};
            for (let j = 0; j < headers.length; j++) {
                if (headers[j]) {
                    rowObj[headers[j]] = line[j] ? line[j].trim() : '';
                }
            }
            result.push(rowObj);
        }

        return result;
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
