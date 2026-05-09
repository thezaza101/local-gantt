import re

with open('tracker.js', 'r') as f:
    content = f.read()

# Make sure tracker tables include checkboxes and Scope
render_table = """            let cellsHTML = `<td>${this.escapeHtml(item.id)}</td><td>${this.escapeHtml(item.title)}</td>`;"""
render_table_repl = """            const isChecked = this.selectedItems.has(item.id) ? 'checked' : '';
            let cellsHTML = `
                <td><input class="form-check-input tracker-item-checkbox" type="checkbox" value="${this.escapeHtml(item.id)}" data-type="${type}" ${isChecked}></td>
                <td>${this.escapeHtml(item.id)}</td>
                <td>
                    ${this.escapeHtml(item.title)}
                    ${item.planId ? `<span class="badge bg-secondary ms-1">Plan Scope</span>` : `<span class="badge bg-info ms-1">Global Scope</span>`}
                </td>
            `;"""
content = content.replace(render_table, render_table_repl)


constructor = """    constructor(planner) {
        this.planner = planner;
    }"""
constructor_repl = """    constructor(planner) {
        this.planner = planner;
        this.selectedItems = new Set();
        this.bindEvents();
    }"""
content = content.replace(constructor, constructor_repl)


bind_events = """    bindEvents() {
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
"""
content = content.replace("    render() {\n", bind_events)


checkbox_listeners = """        // Add event listeners for edit and delete buttons"""
checkbox_listeners_repl = """        // Add event listeners for checkboxes
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

        // Add event listeners for edit and delete buttons"""
content = content.replace(checkbox_listeners, checkbox_listeners_repl)

# Update Modal Open
open_modal = """        // Populate Teams, Personnel, Tasks dropdowns"""
open_modal_repl = """        // Populate Scope Dropdown
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

        // Populate Teams, Personnel, Tasks dropdowns"""
content = content.replace(open_modal, open_modal_repl)

# Hydrate Scope
hydrate_scope = """                const tagsToDisplay = (item.tags || []).filter(t => !item.status || t.toLowerCase() !== item.status.toLowerCase());"""
hydrate_scope_repl = """                const scopeSelect = document.getElementById('trackerItemScope');
                if (scopeSelect) scopeSelect.value = item.planId || '';

                const tagsToDisplay = (item.tags || []).filter(t => !item.status || t.toLowerCase() !== item.status.toLowerCase());"""
content = content.replace(hydrate_scope, hydrate_scope_repl)


# Save Scope
save_scope = """        const title = document.getElementById('trackerItemTitle').value.trim();

        if (!id || !title) {"""
save_scope_repl = """        const title = document.getElementById('trackerItemTitle').value.trim();
        const planId = document.getElementById('trackerItemScope') ? document.getElementById('trackerItemScope').value : '';

        if (!id || !title) {"""
content = content.replace(save_scope, save_scope_repl)


save_scope2 = """        let itemData = {
            id, title, description, tags: uniqueTags, status,
            associatedTeams, associatedPersonnel, associatedTasks,
            lastUpdated: nowStr
        };"""
save_scope_repl2 = """        let itemData = {
            id, title, description, tags: uniqueTags, status,
            associatedTeams, associatedPersonnel, associatedTasks,
            planId: planId || null,
            lastUpdated: nowStr
        };"""
content = content.replace(save_scope2, save_scope_repl2)


with open('tracker.js', 'w') as f:
    f.write(content)
