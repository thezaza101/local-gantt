import re

with open('ui.js', 'r') as f:
    content = f.read()

# Fix the bug found in code review where the tasks save function was using `id` instead of `item.id`
# and properly handle the single source of truth (syncTaskToTrackers)
task_modal_save_bug = """        // We also need to update the tracker items to have this task in their associatedTasks array
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
        };"""

task_modal_save_fix = """        // We also need to update the tracker items to have this task in their associatedTasks array
        const syncTaskToTrackers = (type, selectedItemIds) => {
            const items = this.planner[`get${type.charAt(0).toUpperCase() + type.slice(1)}`]();
            items.forEach(item => {
                let assocs = item.associatedTasks || [];
                let modified = false;

                const wasChecked = selectedItemIds.includes(item.id);
                const hasTaskAssoc = assocs.includes(id);

                // If it was checked in the modal, but wasn't in the item's assocs, add it
                if (wasChecked && !hasTaskAssoc) {
                    assocs.push(id);
                    modified = true;
                }
                // If it was NOT checked in the modal, but WAS in the item's assocs, remove it
                else if (!wasChecked && hasTaskAssoc) {
                    assocs = assocs.filter(tId => tId !== id);
                    modified = true;
                }

                if (modified) {
                    item.associatedTasks = assocs;
                    this.planner.updateEntity(type, item.id, item);
                }
            });
        };"""

content = content.replace(task_modal_save_bug, task_modal_save_fix)

with open('ui.js', 'w') as f:
    f.write(content)
