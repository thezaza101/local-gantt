import re

with open('planner.js', 'r') as f:
    content = f.read()

# No explicit data model changes needed here for Scope or bi-directional sync,
# as we can just add `planId` and `associatedTasks` fields directly to the JSON objects in tracker.js and ui.js.
# But let's verify if we need anything else. We'll leave planner.js untouched since it just stores the arrays.

# We will remove the task array initializations we added in fix_addTask.py to avoid confusion,
# but it's harmless to leave them. Let's just remove them so the relationship is definitively on the tracker items.

task_push = """        const nowStr = this.getNowTimestamp();
        task.lastUpdated = nowStr;
        task.lastChecked = nowStr;

        if (!task.risks) task.risks = [];
        if (!task.issues) task.issues = [];
        if (!task.dependencies_proper) task.dependencies_proper = [];
        if (!task.assumptions) task.assumptions = [];
        if (!task.decisions) task.decisions = [];

        plan.tasks.push(task);"""

task_push_repl = """        const nowStr = this.getNowTimestamp();
        task.lastUpdated = nowStr;
        task.lastChecked = nowStr;

        plan.tasks.push(task);"""

content = content.replace(task_push, task_push_repl)

with open('planner.js', 'w') as f:
    f.write(content)
