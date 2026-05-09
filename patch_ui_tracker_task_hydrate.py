import re

with open('ui.js', 'r') as f:
    content = f.read()

# Fix the bug where task.risks etc were being checked (they were removed from data model, so we must check tracker entities directly)
task_modal_hydrate_bug = """                const checkAssocs = (type, list) => {
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
                checkAssocs('decisions', task.decisions);"""

task_modal_hydrate_fix = """                const checkAssocsFromTracker = (type) => {
                    const items = this.planner[`get${type.charAt(0).toUpperCase() + type.slice(1)}`]();
                    items.forEach(item => {
                        if (item.associatedTasks && item.associatedTasks.includes(task.id)) {
                            const cb = document.getElementById(`ttcb_${type}_${item.id}`);
                            if (cb) cb.checked = true;
                        }
                    });
                };
                checkAssocsFromTracker('risks');
                checkAssocsFromTracker('issues');
                checkAssocsFromTracker('dependencies');
                checkAssocsFromTracker('assumptions');
                checkAssocsFromTracker('decisions');"""

content = content.replace(task_modal_hydrate_bug, task_modal_hydrate_fix)

with open('ui.js', 'w') as f:
    f.write(content)
