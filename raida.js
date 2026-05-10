class Raida {
    constructor(planner) {
        this.planner = planner;
    }

    render() {
        const container = document.getElementById('raidaContent');
        if (!container) return;

        const scopeSelect = document.getElementById('raidaScopeFilter');
        const scope = scopeSelect ? scopeSelect.value : 'all';

        const settings = this.planner.getState().settings || {};
        const overdueDays = parseInt(settings.raidaOverdueDays) || 14;
        const staleDays = parseInt(settings.raidaStaleDays) || 7;

        const now = new Date();
        const overdueDateThreshold = new Date(now.getTime() + overdueDays * 24 * 60 * 60 * 1000);
        const staleDateThreshold = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);

        // Fetch data
        const plan = this.planner.getCurrentPlan();
        const currentPlanId = plan ? plan.id : null;

        let risks = this.planner.getRisks();
        let issues = this.planner.getIssues();
        let deps = this.planner.getDependencies();
        let assump = this.planner.getAssumptions();
        let decisions = this.planner.getDecisions();

        let tasks = [];
        if (scope === 'plan' && plan) {
            const filterByPlan = (item) => item.planId === currentPlanId;
            risks = risks.filter(filterByPlan);
            issues = issues.filter(filterByPlan);
            deps = deps.filter(filterByPlan);
            assump = assump.filter(filterByPlan);
            decisions = decisions.filter(filterByPlan);
            tasks = plan.tasks || [];
        } else if (scope === 'all') {
            const allPlans = this.planner.getState().plans || [];
            allPlans.forEach(p => {
                if (p.tasks) {
                    tasks = tasks.concat(p.tasks);
                }
            });
        }

        // 1. Overdue & upcoming deadlines
        // Items where the due date, required-by date, review/expiry date, or decision deadline is overdue or falling within the next N days
        const upcomingItems = [];

        const checkDate = (item, dateField, type) => {
            if (item[dateField] && item.status !== 'Closed' && item.status !== 'Resolved' && item.status !== 'Mitigated' && item.status !== 'Completed') {
                const d = new Date(item[dateField]);
                if (d <= overdueDateThreshold) {
                    upcomingItems.push({ item, type, date: d, dateStr: item[dateField] });
                }
            }
        };

        risks.forEach(r => checkDate(r, 'dueDate', 'risks'));
        issues.forEach(i => checkDate(i, 'targetDate', 'issues'));
        deps.forEach(d => checkDate(d, 'requiredDate', 'dependencies'));
        assump.forEach(a => checkDate(a, 'expiryDate', 'assumptions'));
        decisions.forEach(d => checkDate(d, 'deadline', 'decisions'));

        upcomingItems.sort((a, b) => {
            const typeCmp = a.type.localeCompare(b.type);
            if (typeCmp !== 0) return typeCmp;
            return a.date - b.date;
        });

        // 2. Not checked recently (RAIDA items)
        const staleItems = [];
        const checkStale = (item, type) => {
            if (item.status === 'Closed' || item.status === 'Resolved' || item.status === 'Mitigated' || item.status === 'Completed') return;
            if (item.lastChecked) {
                const d = new Date(item.lastChecked);
                if (d <= staleDateThreshold) {
                    staleItems.push({ item, type, lastChecked: d });
                }
            } else {
                staleItems.push({ item, type, lastChecked: new Date(0) });
            }
        };

        risks.forEach(r => checkStale(r, 'risks'));
        issues.forEach(i => checkStale(i, 'issues'));
        deps.forEach(d => checkStale(d, 'dependencies'));
        assump.forEach(a => checkStale(a, 'assumptions'));
        decisions.forEach(d => checkStale(d, 'decisions'));
        staleItems.sort((a, b) => a.lastChecked - b.lastChecked);

        // 3. High severity / critical items open
        const criticalItems = [];
        risks.forEach(r => {
            if (r.status !== 'Closed' && r.status !== 'Mitigated' && r.probability === 'High' && r.severity === 'Critical') criticalItems.push({item: r, type: 'risks', desc: 'Probability High + Impact Critical'});
        });
        issues.forEach(i => {
            if (i.status !== 'Closed' && i.status !== 'Resolved' && i.severity === 'Critical') criticalItems.push({item: i, type: 'issues', desc: 'Severity Critical'});
        });
        assump.forEach(a => {
            if (a.status !== 'Closed' && a.impact === 'Critical') criticalItems.push({item: a, type: 'assumptions', desc: 'Impact if wrong: Critical'});
        });
        deps.forEach(d => {
            if (d.status === 'Blocked') criticalItems.push({item: d, type: 'dependencies', desc: 'Status Blocked'});
        });
        decisions.forEach(d => {
            if (d.status === 'Pending' && d.deadline) {
                const dDate = new Date(d.deadline);
                if (dDate < now) criticalItems.push({item: d, type: 'decisions', desc: 'Pending past deadline'});
            }
        });

        // 4. Items with no owner
        const ownerlessItems = [];
        risks.forEach(r => { if (r.status !== 'Closed' && !r.owner) ownerlessItems.push({item: r, type: 'risks'}); });
        issues.forEach(i => { if (i.status !== 'Closed' && !i.escalationOwner) ownerlessItems.push({item: i, type: 'issues'}); });
        assump.forEach(a => { if (a.status !== 'Closed' && !a.owner) ownerlessItems.push({item: a, type: 'assumptions'}); });
        deps.forEach(d => { if (d.status !== 'Completed' && !d.owningTeam) ownerlessItems.push({item: d, type: 'dependencies'}); });
        decisions.forEach(d => { if (d.status !== 'Made' && !d.owner) ownerlessItems.push({item: d, type: 'decisions'}); });

        // 5. Items with no associated tasks
        const orphanedItems = [];
        const checkOrphaned = (item, type) => {
            if (item.status === 'Closed' || item.status === 'Resolved' || item.status === 'Mitigated' || item.status === 'Completed') return;
            if (!item.associatedTasks || item.associatedTasks.length === 0) {
                orphanedItems.push({item, type});
            }
        };
        risks.forEach(r => checkOrphaned(r, 'risks'));
        issues.forEach(i => checkOrphaned(i, 'issues'));
        deps.forEach(d => checkOrphaned(d, 'dependencies'));
        assump.forEach(a => checkOrphaned(a, 'assumptions'));
        decisions.forEach(d => checkOrphaned(d, 'decisions'));

        // 6. Recently auto-created dependencies
        const autoDeps = deps.filter(d => d.description === 'Auto-created from task dependency' && d.status === 'Active');

        // 7. Tasks that have not been checked recently
        const staleTasks = [];
        tasks.forEach(t => {
            // Check status of task based on color or tags? The prompt says "Tasks that have not been checked recently".
            // Typically we ignore completed/removed tasks. Let's assume completed are out.
            // But planner.js handles status colors.
            // Let's just check lastChecked.
            if (t.lastChecked) {
                const d = new Date(t.lastChecked);
                if (d <= staleDateThreshold) {
                    staleTasks.push({ item: t, lastChecked: d });
                }
            } else {
                staleTasks.push({ item: t, lastChecked: new Date(0) });
            }
        });
        staleTasks.sort((a, b) => a.lastChecked - b.lastChecked);

        // 8. Decisions blocking progress
        const blockingDecisions = [];
        decisions.forEach(d => {
            if (d.status === 'Pending' || d.status === 'Deferred') {
                if (d.associatedTasks && d.associatedTasks.length > 0) {
                    // Check if any associated task is In Progress or Not Started
                    const hasBlockingTask = d.associatedTasks.some(taskId => {
                        const task = tasks.find(t => t.id === taskId);
                        if (!task) return false;
                        // Not Started or In progress
                        // Color mapping check:
                        const taskColor = task.fillColor;
                        const colors = this.planner.getStatusColors();
                        const notStartedColor = colors['Not started'];
                        const inProgressColor = colors['In progress'];

                        return (taskColor === notStartedColor || taskColor === inProgressColor);
                    });

                    if (hasBlockingTask) {
                        blockingDecisions.push({item: d, type: 'decisions'});
                    }
                }
            }
        });

        // Generate HTML
        let html = '';

        const createSection = (title, items, renderItem) => {
            const count = items.length;
            const badgeClass = count > 0 ? 'bg-danger' : 'bg-secondary';
            const collapseId = `raida-collapse-${title.replace(/[^a-zA-Z0-9]/g, '')}`;

            html += `
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center cursor-pointer" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${count > 0}" style="cursor: pointer;">
                        <h6 class="mb-0 fw-bold">${title}</h6>
                        <span class="badge ${badgeClass}">${count}</span>
                    </div>
                    <div id="${collapseId}" class="collapse ${count > 0 ? 'show' : ''}">
                        <div class="card-body p-0">
                            ${count > 0 ? `<ul class="list-group list-group-flush">${items.map(renderItem).join('')}</ul>` : `<div class="p-3 text-muted small">No items to display.</div>`}
                        </div>
                    </div>
                </div>
            `;
        };

        const escapeHtml = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        const getTitle = (item) => {
            if (item.title) return escapeHtml(item.title);
            if (item.id) return `Item ${escapeHtml(item.id)}`;
            return 'Untitled Item';
        };

        const renderTrackerItem = (data) => {
            const {item, type, desc, dateStr} = data;
            let extra = '';
            if (desc) extra = `<span class="badge bg-warning text-dark ms-2">${escapeHtml(desc)}</span>`;
            if (dateStr) extra += ` <small class="text-danger ms-2">${escapeHtml(dateStr)}</small>`;
            return `
                <li class="list-group-item list-group-item-action cursor-pointer d-flex justify-content-between align-items-center" onclick="if(window.TrackerEngine) window.TrackerEngine.openEditModal('${type}', '${item.id}')" style="cursor: pointer;">
                    <div>
                        <strong>[${escapeHtml(item.id)}]</strong> ${getTitle(item)}
                        ${extra}
                    </div>
                    <span class="badge bg-light text-dark border">${type.toUpperCase()}</span>
                </li>
            `;
        };

        createSection('Overdue & upcoming deadlines', upcomingItems, renderTrackerItem);

        createSection('Not checked recently (RAIDA)', staleItems, (data) => {
            const dateStr = data.lastChecked.getTime() === 0 ? 'Never' : data.lastChecked.toISOString().split('T')[0];
            return renderTrackerItem({...data, desc: `Last checked: ${dateStr}`});
        });

        createSection('High severity / critical items open', criticalItems, renderTrackerItem);

        createSection('Items with no owner', ownerlessItems, renderTrackerItem);

        createSection('Items with no associated tasks', orphanedItems, renderTrackerItem);

        createSection('Recently auto-created dependencies', autoDeps, (item) => renderTrackerItem({item, type: 'dependencies'}));

        createSection('Tasks not checked recently', staleTasks, (data) => {
            const t = data.item;
            const dateStr = data.lastChecked.getTime() === 0 ? 'Never' : data.lastChecked.toISOString().split('T')[0];
            return `
                <li class="list-group-item list-group-item-action cursor-pointer d-flex justify-content-between align-items-center" onclick="if(window.UIController) window.UIController.openTaskModal('${t.id}')" style="cursor: pointer;">
                    <div>
                        <strong>[${escapeHtml(t.id)}]</strong> ${getTitle(t)}
                        <span class="badge bg-warning text-dark ms-2">Last checked: ${dateStr}</span>
                    </div>
                    <span class="badge bg-light text-dark border">TASK</span>
                </li>
            `;
        });

        createSection('Decisions blocking progress', blockingDecisions, renderTrackerItem);

        container.innerHTML = html;
    }
}
