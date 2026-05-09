import re

with open('ui.js', 'r') as f:
    content = f.read()

events_start = """    bindEvents() {
        const analyticsContainer = document.getElementById("analyticsContainer");
        const openAnalyticsBtn = document.getElementById("openAnalyticsBtn");
        const closeAnalyticsBtn = document.getElementById("closeAnalyticsBtn");"""

events_repl = """    bindEvents() {
        const analyticsContainer = document.getElementById("analyticsContainer");
        const openAnalyticsBtn = document.getElementById("openAnalyticsBtn");
        const closeAnalyticsBtn = document.getElementById("closeAnalyticsBtn");

        const trackerContainer = document.getElementById("trackerContainer");
        const openTrackerBtn = document.getElementById("openTrackerBtn");
        const closeTrackerBtn = document.getElementById("closeTrackerBtn");

        if (openTrackerBtn && trackerContainer) {
            openTrackerBtn.addEventListener("click", () => {
                trackerContainer.classList.remove("d-none");
                if (window.TrackerEngine) { window.TrackerEngine.render(); }
            });
        }

        if (closeTrackerBtn && trackerContainer) {
            closeTrackerBtn.addEventListener("click", () => {
                trackerContainer.classList.add("d-none");
            });
        }

        // Tracker modal events
        const saveTrackerItemBtn = document.getElementById("saveTrackerItemBtn");
        if (saveTrackerItemBtn) {
            saveTrackerItemBtn.addEventListener("click", () => {
                if (window.TrackerEngine) window.TrackerEngine.saveItem();
            });
        }

        const trackerUpdateLastCheckedBtn = document.getElementById("trackerUpdateLastCheckedBtn");
        if (trackerUpdateLastCheckedBtn) {
            trackerUpdateLastCheckedBtn.addEventListener("click", () => {
                if (window.TrackerEngine) window.TrackerEngine.updateLastChecked();
            });
        }

        const createProperDepsBtn = document.getElementById("createProperDepsBtn");
        if (createProperDepsBtn) {
            createProperDepsBtn.addEventListener("click", () => {
                if (window.TrackerEngine) window.TrackerEngine.autoCreateProperDependencies();
            });
        }

        ['risks', 'issues', 'dependencies', 'assumptions', 'decisions'].forEach(type => {
            const addBtn = document.getElementById(`add${type.charAt(0).toUpperCase() + type.slice(1, -1)}Btn`) || document.getElementById(`add${type.charAt(0).toUpperCase() + type.slice(1)}Btn`);
            if (addBtn) {
                addBtn.addEventListener('click', () => {
                    if (window.TrackerEngine) window.TrackerEngine.openEditModal(type);
                });
            }
        });

        // Search in task modal for tracker tabs
        document.querySelectorAll('.task-tracker-search').forEach(input => {
            input.addEventListener('input', (e) => {
                const targetId = e.target.getAttribute('data-target');
                const filterText = e.target.value.toLowerCase();
                const container = document.getElementById(targetId);
                if (container) {
                    container.querySelectorAll('.form-check').forEach(div => {
                        const label = div.querySelector('label').textContent.toLowerCase();
                        div.style.display = label.includes(filterText) ? '' : 'none';
                    });
                }
            });
        });

        // Base link button
        const trackerBaseLinkBtn = document.getElementById('trackerBaseLinkBtn');
        if (trackerBaseLinkBtn) {
            trackerBaseLinkBtn.addEventListener('click', () => {
                const id = document.getElementById('trackerItemId').value.trim();
                const settings = this.planner.getState().settings || {};
                const baseLink = settings.baseLink || '';
                if (id && baseLink) {
                    window.open(baseLink + id, '_blank');
                } else if (!baseLink) {
                    alert('Base Link is not configured in Global Settings.');
                }
            });
        }"""

content = content.replace(events_start, events_repl)

with open('ui.js', 'w') as f:
    f.write(content)
