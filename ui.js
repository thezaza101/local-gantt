--- a/ui.js
+++ b/ui.js
@@ -1050,6 +1050,17 @@
                 }
             });
         }
+
+        const bulkSetPersonnelBtn = document.getElementById('bulkSetPersonnelBtn');
+        if (bulkSetPersonnelBtn) {
+            bulkSetPersonnelBtn.addEventListener('click', () => {
+                const personnelCheckboxes = document.querySelectorAll('.bulk-personnel-checkbox:checked');
+                const personnel = Array.from(personnelCheckboxes).map(cb => cb.value);
+                if (this.planner.setPersonnelOfMarkedTasks(personnel)) {
+                    this.updateUI();
+                }
+            });
+        }

         const bulkSetExcludeBtn = document.getElementById('bulkSetExcludeBtn');
         const bulkExcludeSelect = document.getElementById('bulkExcludeSelect');
@@ -1518,28 +1529,221 @@
         const settingsModal = bootstrap.Modal.getOrCreateInstance(settingsModalEl);
         const baseLinkInput = document.getElementById('settingsBaseLink');

-        const settingsTeamsInput = document.getElementById('settingsTeams');
-
         const settings = this.planner.getState().settings || {};
         baseLinkInput.value = settings.baseLink || '';
-        if (settingsTeamsInput) {
-            settingsTeamsInput.value = (settings.teams || []).join(', ');
-        }
+
+        this.renderSettingsTeams();
+        this.renderSettingsPersonnel();

         settingsModal.show();
     }

-    saveSettings() {
-        const baseLink = document.getElementById('settingsBaseLink').value.trim();
+    renderSettingsTeams() {
+        const tbody = document.getElementById('settingsTeamsList');
+        if (!tbody) return;
+        const teams = this.planner.getTeams() || [];
+        tbody.innerHTML = '';
+        teams.forEach(team => {
+            const tr = document.createElement('tr');
+            tr.innerHTML = `
+                <td>${this.escapeHtml(team.name || '')}</td>
+                <td>${this.escapeHtml(team.description || '')}</td>
+                <td>
+                    <button class="btn btn-sm btn-outline-secondary edit-team-btn" data-id="${this.escapeHtml(team.id)}">Edit</button>
+                    <button class="btn btn-sm btn-outline-danger delete-team-btn" data-id="${this.escapeHtml(team.id)}">Del</button>
+                </td>
+            `;
+            tbody.appendChild(tr);
+        });

-        const settingsTeamsInput = document.getElementById('settingsTeams');
-        let teams = [];
-        if (settingsTeamsInput) {
-            teams = settingsTeamsInput.value.split(',').map(t => t.trim()).filter(t => t);
+        tbody.querySelectorAll('.edit-team-btn').forEach(btn => {
+            btn.addEventListener('click', (e) => this.openEditTeamModal(e.target.dataset.id));
+        });
+        tbody.querySelectorAll('.delete-team-btn').forEach(btn => {
+            btn.addEventListener('click', (e) => this.deleteTeam(e.target.dataset.id));
+        });
+    }
+
+    renderSettingsPersonnel() {
+        const tbody = document.getElementById('settingsPersonnelList');
+        if (!tbody) return;
+        const personnel = this.planner.getPersonnel() || [];
+        tbody.innerHTML = '';
+        personnel.forEach(person => {
+            const tr = document.createElement('tr');
+            const teamNames = (person.teams || []).map(tid => {
+                const t = this.planner.getTeamById(tid);
+                return t ? t.name : tid;
+            }).join(', ');
+
+            tr.innerHTML = `
+                <td>${this.escapeHtml(person.name || '')}</td>
+                <td>${this.escapeHtml(person.role || '')}</td>
+                <td>${this.escapeHtml(teamNames)}</td>
+                <td>
+                    <button class="btn btn-sm btn-outline-secondary edit-personnel-btn" data-id="${this.escapeHtml(person.id)}">Edit</button>
+                    <button class="btn btn-sm btn-outline-danger delete-personnel-btn" data-id="${this.escapeHtml(person.id)}">Del</button>
+                </td>
+            `;
+            tbody.appendChild(tr);
+        });
+
+        tbody.querySelectorAll('.edit-personnel-btn').forEach(btn => {
+            btn.addEventListener('click', (e) => this.openEditPersonnelModal(e.target.dataset.id));
+        });
+        tbody.querySelectorAll('.delete-personnel-btn').forEach(btn => {
+            btn.addEventListener('click', (e) => this.deletePersonnel(e.target.dataset.id));
+        });
+    }
+
+    openEditTeamModal(teamId = null) {
+        const modalEl = document.getElementById('editTeamModal');
+        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
+        document.getElementById('editTeamForm').reset();
+
+        if (teamId) {
+            const team = this.planner.getTeamById(teamId);
+            if (team) {
+                document.getElementById('editTeamId').value = team.id;
+                document.getElementById('editTeamName').value = team.name || '';
+                document.getElementById('editTeamDescription').value = team.description || '';
+            }
+        } else {
+            document.getElementById('editTeamId').value = '';
         }
+        modal.show();
+    }

-        this.planner.updateSettings({ baseLink, teams });
+    saveTeam() {
+        const idInput = document.getElementById('editTeamId').value;
+        const name = document.getElementById('editTeamName').value.trim();
+        const description = document.getElementById('editTeamDescription').value.trim();
+
+        if (!name) return alert('Name is required');
+
+        let teams = this.planner.getTeams() || [];
+        if (idInput) {
+            const team = teams.find(t => t.id === idInput);
+            if (team) {
+                team.name = name;
+                team.description = description;
+            }
+        } else {
+            teams.push({
+                id: 'team-' + Date.now(),
+                name,
+                description
+            });
+        }
+
+        this.planner.updateSettings({ teams });
+        this.renderSettingsTeams();
         this.populateTeamSelects();
+
+        const modal = bootstrap.Modal.getInstance(document.getElementById('editTeamModal'));
+        if (modal) modal.hide();
+        this.updateUI();
+    }
+
+    deleteTeam(teamId) {
+        if (!confirm('Are you sure you want to delete this team?')) return;
+        let teams = this.planner.getTeams() || [];
+        teams = teams.filter(t => t.id !== teamId);
+        this.planner.updateSettings({ teams });
+        this.renderSettingsTeams();
+        this.populateTeamSelects();
+        this.updateUI();
+    }
+
+    openEditPersonnelModal(personnelId = null) {
+        const modalEl = document.getElementById('editPersonnelModal');
+        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
+        document.getElementById('editPersonnelForm').reset();
+
+        const teamsContainer = document.getElementById('editPersonnelTeamsContainer');
+        const allTeams = this.planner.getTeams() || [];
+        teamsContainer.innerHTML = '';
+
+        let selectedTeams = [];
+
+        if (personnelId) {
+            const person = this.planner.getPersonnelById(personnelId);
+            if (person) {
+                document.getElementById('editPersonnelId').value = person.id;
+                document.getElementById('editPersonnelName').value = person.name || '';
+                document.getElementById('editPersonnelRole').value = person.role || '';
+                document.getElementById('editPersonnelNotes').value = person.notes || '';
+                selectedTeams = person.teams || [];
+            }
+        } else {
+            document.getElementById('editPersonnelId').value = '';
+        }
+
+        allTeams.forEach(team => {
+            const isChecked = selectedTeams.includes(team.id) ? 'checked' : '';
+            teamsContainer.innerHTML += `
+                <div class="form-check">
+                    <input class="form-check-input personnel-team-checkbox" type="checkbox" value="${this.escapeHtml(team.id)}" id="pt-cb-${this.escapeHtml(team.id)}" ${isChecked}>
+                    <label class="form-check-label" for="pt-cb-${this.escapeHtml(team.id)}">
+                        ${this.escapeHtml(team.name)}
+                    </label>
+                </div>
+            `;
+        });
+
+        modal.show();
+    }
+
+    savePersonnel() {
+        const idInput = document.getElementById('editPersonnelId').value;
+        const name = document.getElementById('editPersonnelName').value.trim();
+        const role = document.getElementById('editPersonnelRole').value.trim();
+        const notes = document.getElementById('editPersonnelNotes').value.trim();
+
+        if (!name) return alert('Name is required');
+
+        const selectedTeams = Array.from(document.querySelectorAll('.personnel-team-checkbox:checked')).map(cb => cb.value);
+
+        let personnel = this.planner.getPersonnel() || [];
+        if (idInput) {
+            const person = personnel.find(p => p.id === idInput);
+            if (person) {
+                person.name = name;
+                person.role = role;
+                person.notes = notes;
+                person.teams = selectedTeams;
+            }
+        } else {
+            personnel.push({
+                id: 'p-' + Date.now(),
+                name,
+                role,
+                notes,
+                teams: selectedTeams
+            });
+        }
+
+        this.planner.updateSettings({ personnel });
+        this.renderSettingsPersonnel();
+
+        const modal = bootstrap.Modal.getInstance(document.getElementById('editPersonnelModal'));
+        if (modal) modal.hide();
+        this.updateUI();
+    }
+
+    deletePersonnel(personnelId) {
+        if (!confirm('Are you sure you want to delete this person?')) return;
+        let personnel = this.planner.getPersonnel() || [];
+        personnel = personnel.filter(p => p.id !== personnelId);
+        this.planner.updateSettings({ personnel });
+        this.renderSettingsPersonnel();
+        this.updateUI();
+    }
+
+    saveSettings() {
+        const baseLink = document.getElementById('settingsBaseLink').value.trim();
+
+        this.planner.updateSettings({ baseLink });

         const settingsModalEl = document.getElementById('settingsModal');
         const settingsModal = bootstrap.Modal.getInstance(settingsModalEl);
@@ -1883,6 +2087,12 @@

         // Ensure tags are unique
         const uniqueTags = [...new Set(existingTags)];
+
+        const taskTeamSelect = document.getElementById('taskTeam');
+        const team = taskTeamSelect ? taskTeamSelect.value : '';
+
+        const personnelCheckboxes = document.querySelectorAll('.task-personnel-checkbox:checked');
+        const personnel = Array.from(personnelCheckboxes).map(cb => cb.value);

         const taskData = {
             id: id,
@@ -1896,6 +2106,8 @@
             fillColor: selectedFillLegend ? selectedFillLegend.color : '#4da3ff',
             borderColor: selectedBorderLegend ? selectedBorderLegend.color : '#1c6ed5',
             status: taskStatus || null,
+            team: team,
+            personnel: personnel,
             tags: uniqueTags,
             dependencies: dependencies,
             effort: {
@@ -2069,6 +2281,31 @@
         if (!hasGroupTags) {
             taskGroupedTagsDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted small">No tag groups configured</span></li>';
         }
+
+        // Populate Personnel dropdown
+        const taskPersonnelDropdown = document.getElementById('taskPersonnelDropdown');
+        if (taskPersonnelDropdown) {
+            taskPersonnelDropdown.innerHTML = '';
+            const allPersonnel = this.planner.getPersonnel() || [];
+            if (allPersonnel.length === 0) {
+                taskPersonnelDropdown.innerHTML = '<li><span class="dropdown-item-text text-muted small">No personnel configured</span></li>';
+            } else {
+                allPersonnel.forEach(p => {
+                    const li = document.createElement('li');
+                    li.innerHTML = `
+                        <div class="dropdown-item d-flex align-items-center py-1">
+                            <div class="form-check m-0 w-100">
+                                <input class="form-check-input task-personnel-checkbox" type="checkbox" id="modalPersonnel_${this.escapeHtml(p.id)}" value="${this.escapeHtml(p.id)}">
+                                <label class="form-check-label small w-100" for="modalPersonnel_${this.escapeHtml(p.id)}" style="cursor: pointer;">
+                                    ${this.escapeHtml(p.name)} ${p.role ? `<span class="text-muted">(${this.escapeHtml(p.role)})</span>` : ''}
+                                </label>
+                            </div>
+                        </div>
+                    `;
+                    taskPersonnelDropdown.appendChild(li);
+                });
+            }
+        }

         // Populate Marker dropdowns
         const currentPlan = this.planner.getCurrentPlan();
@@ -2203,6 +2440,17 @@
                 } else {
                     taskBorderLegendSelect.value = 'default_border';
                 }
+
+                // Setup Team and Personnel selections
+                const taskTeamSelect = document.getElementById('taskTeam');
+                if (taskTeamSelect) {
+                    taskTeamSelect.value = task.team || '';
+                }
+
+                const personnelCheckboxes = document.querySelectorAll('.task-personnel-checkbox');
+                personnelCheckboxes.forEach(cb => {
+                    cb.checked = (task.personnel || []).includes(cb.value);
+                });

                 document.getElementById('taskEffortDesign').value = task.effort ? task.effort.design || 0 : 0;
                 document.getElementById('taskEffortDev').value = task.effort ? task.effort.dev || 0 : 0;
@@ -3126,8 +3374,8 @@
             const currentFilter = this.planner.getFilterState().team || '';
             teamFilterSelect.innerHTML = '<option value="">All Teams</option>';
             teams.forEach(t => {
-                const selected = t === currentFilter ? 'selected' : '';
-                teamFilterSelect.innerHTML += `<option value="${this.escapeHtml(t)}" ${selected}>${this.escapeHtml(t)}</option>`;
+                const selected = t.id === currentFilter ? 'selected' : '';
+                teamFilterSelect.innerHTML += `<option value="${this.escapeHtml(t.id)}" ${selected}>${this.escapeHtml(t.name)}</option>`;
             });
         }

@@ -3136,8 +3384,8 @@
             const currentVal = taskTeamSelect.value;
             taskTeamSelect.innerHTML = '<option value="">Unassigned</option>';
             teams.forEach(t => {
-                const selected = t === currentVal ? 'selected' : '';
-                taskTeamSelect.innerHTML += `<option value="${this.escapeHtml(t)}" ${selected}>${this.escapeHtml(t)}</option>`;
+                const selected = t.id === currentVal ? 'selected' : '';
+                taskTeamSelect.innerHTML += `<option value="${this.escapeHtml(t.id)}" ${selected}>${this.escapeHtml(t.name)}</option>`;
             });
         }

@@ -3145,7 +3393,7 @@
         if (bulkTeamSelect) {
             bulkTeamSelect.innerHTML = '<option value="">Unassigned</option>';
             teams.forEach(t => {
-                bulkTeamSelect.innerHTML += `<option value="${this.escapeHtml(t)}">${this.escapeHtml(t)}</option>`;
+                bulkTeamSelect.innerHTML += `<option value="${this.escapeHtml(t.id)}">${this.escapeHtml(t.name)}</option>`;
             });
         }
     }
