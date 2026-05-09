import re

with open('features.md', 'r') as f:
    content = f.read()

features = """
## Tracker (Risks, Issues, Dependencies, Assumptions, Decisions)
The Tracker provides a centralized view for managing program-level and plan-level Risks, Issues, Dependencies, Assumptions, and Decisions (RIDAD).

### Global vs Plan Scope
Tracker entities exist independently of tasks and are stored globally in the JSON data model (`file.risks`, `file.issues`, etc.). Each entity uses a `planId` field to define its scope. A `planId` of `null` or `""` means the item is global across all plans.

### Task Associations
To maintain a single source of truth and prevent bi-directional synchronization bugs, task relationships are stored exclusively on the tracker entity using an `associatedTasks` array of task IDs. When a task is saved in the UI, the system dynamically queries and updates the relevant tracker entities to align with the selections made in the task modal.

### Bulk Operations & Dependencies
The Tracker view includes bulk operation controls for deleting or modifying the status of multiple entities simultaneously. A specialized "Auto-Create Proper Dependencies" tool scans all tasks within the current plan and automatically provisions fully structured Dependency entities from simple task-level dependency links, marking them as removed if the task link is subsequently deleted.

"""

content = content + features

with open('features.md', 'w') as f:
    f.write(content)
