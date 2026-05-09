import re

with open('ui.js', 'r') as f:
    content = f.read()

task_modal_save_data = """        const getAssocs = (type) => Array.from(document.querySelectorAll(`.task-tracker-assoc-checkbox[data-type="${type}"]:checked`)).map(cb => cb.value);
        taskData.risks = getAssocs('risks');
        taskData.issues = getAssocs('issues');
        taskData.dependencies_proper = getAssocs('dependencies');
        taskData.assumptions = getAssocs('assumptions');
        taskData.decisions = getAssocs('decisions');"""

task_modal_save_data_repl = """        const getAssocs = (type) => Array.from(document.querySelectorAll(`.task-tracker-assoc-checkbox[data-type="${type}"]:checked`)).map(cb => cb.value);
        const selectedRisks = getAssocs('risks');
        const selectedIssues = getAssocs('issues');
        const selectedDeps = getAssocs('dependencies');
        const selectedAssumps = getAssocs('assumptions');
        const selectedDecs = getAssocs('decisions');"""

content = content.replace(task_modal_save_data, task_modal_save_data_repl)

task_modal_save_sync = """        syncTaskToTrackers('risks', taskData.risks);
        syncTaskToTrackers('issues', taskData.issues);
        syncTaskToTrackers('dependencies', taskData.dependencies_proper);
        syncTaskToTrackers('assumptions', taskData.assumptions);
        syncTaskToTrackers('decisions', taskData.decisions);"""

task_modal_save_sync_repl = """        syncTaskToTrackers('risks', selectedRisks);
        syncTaskToTrackers('issues', selectedIssues);
        syncTaskToTrackers('dependencies', selectedDeps);
        syncTaskToTrackers('assumptions', selectedAssumps);
        syncTaskToTrackers('decisions', selectedDecs);"""

content = content.replace(task_modal_save_sync, task_modal_save_sync_repl)


with open('ui.js', 'w') as f:
    f.write(content)
