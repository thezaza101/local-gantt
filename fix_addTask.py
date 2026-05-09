import re

with open('planner.js', 'r') as f:
    content = f.read()

# Make sure tracker arrays exist on new tasks in `addTask`
task_push = """        const nowStr = this.getNowTimestamp();
        task.lastUpdated = nowStr;
        task.lastChecked = nowStr;

        plan.tasks.push(task);"""

task_push_repl = """        const nowStr = this.getNowTimestamp();
        task.lastUpdated = nowStr;
        task.lastChecked = nowStr;

        if (!task.risks) task.risks = [];
        if (!task.issues) task.issues = [];
        if (!task.dependencies_proper) task.dependencies_proper = [];
        if (!task.assumptions) task.assumptions = [];
        if (!task.decisions) task.decisions = [];

        plan.tasks.push(task);"""

content = content.replace(task_push, task_push_repl)

with open('planner.js', 'w') as f:
    f.write(content)
