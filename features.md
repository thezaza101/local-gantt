# Features

## Teams
The Teams feature allows assigning tasks to specific teams and filtering both analytics and capacity by those teams.

### Global Settings
The list of available teams and personnel is configured globally in the Settings Modal (accessed via the ⚙️ icon) using different tabs.
Teams are stored in the plan settings under `settings.teams` as an array of objects `{ id, name, description }`.
Personnel are stored under `settings.personnel` as an array of objects `{ id, name, role, notes, teams: [] }`.

### Task Assignment
Each task can be assigned to a single team and multiple key personnel via the Task Edit Modal. Bulk assignment is also possible via the Bulk Operations modal. The assigned team is stored in the `team` property (referencing the team `id`) and personnel in the `personnel` property (an array of personnel `id`s) of a task object.

### Filtering and Analytics
- **Task List/Gantt Chart:** A new global filter allows filtering the visible tasks by a specific team.
- **Analytics Dashboard:** The Analytics view includes a global team filter (`#analyticsTeamFilter`) to filter the data used to calculate metrics and render charts.
- **Capacity Engine:** The Capacity feature has been updated to optionally assign capacity periods to specific teams. This allows visualizing team-specific capacity vs. demand in the Analytics dashboard.

### Data Model
- `settings.teams`: Array of team objects `{ id, name, description }`.
- `settings.personnel`: Array of personnel objects `{ id, name, role, notes, teams }`.
- `task.team`: String representing the team `id` assigned to a task.
- `task.personnel`: Array of strings representing the personnel `id`s assigned to a task.
- `capacity.team`: String representing the team `id` assigned to a capacity entry.

## Tracker (Risks, Issues, Dependencies, Assumptions, Decisions)
The Tracker provides a centralized view for managing program-level and plan-level Risks, Issues, Dependencies, Assumptions, and Decisions (RIDAD).

### Global vs Plan Scope
Tracker entities exist independently of tasks and are stored globally in the JSON data model (`file.risks`, `file.issues`, etc.). Each entity uses a `planId` field to define its scope. A `planId` of `null` or `""` means the item is global across all plans.

### Task Associations
To maintain a single source of truth and prevent bi-directional synchronization bugs, task relationships are stored exclusively on the tracker entity using an `associatedTasks` array of task IDs. When a task is saved in the UI, the system dynamically queries and updates the relevant tracker entities to align with the selections made in the task modal.

### Bulk Operations & Dependencies
The Tracker view includes bulk operation controls for deleting or modifying the status of multiple entities simultaneously. A specialized "Auto-Create Proper Dependencies" tool scans all tasks within the current plan and automatically provisions fully structured Dependency entities from simple task-level dependency links, marking them as removed if the task link is subsequently deleted.
