# Features

## Teams
The Teams feature allows assigning tasks to specific teams and filtering both analytics and capacity by those teams.

### Global Settings
The list of available teams is configured globally in the Settings Modal (accessed via the ⚙️ icon). It's stored in the plan settings under `settings.teams` as an array of objects (with id, name, description). Teams can be added, edited, and removed through the Teams tab in the Settings Modal.

### Task Assignment
Each task can be assigned to a team via the Task Edit Modal. Bulk assignment is also possible via the Bulk Operations modal. The assigned team is stored in the `team` property of a task object as a team ID.

### Filtering and Analytics
- **Task List/Gantt Chart:** A new global filter allows filtering the visible tasks by a specific team.
- **Analytics Dashboard:** The Analytics view includes a global team filter (`#analyticsTeamFilter`) to filter the data used to calculate metrics and render charts.
- **Capacity Engine:** The Capacity feature has been updated to optionally assign capacity periods to specific teams. This allows visualizing team-specific capacity vs. demand in the Analytics dashboard.

### Data Model
- `settings.teams`: Array of objects (`{ id, name, description }`).
- `task.team`: String representing the team ID assigned to a task.
- `capacity.team`: String representing the team ID assigned to a capacity entry.

## Personnel
The Personnel feature allows defining key individuals and assigning them to tasks and teams.

### Global Settings
The list of available personnel is configured globally in the Settings Modal in the Personnel tab. It's stored under `settings.personnel` as an array of objects. Personnel can be assigned an ID, name, role, notes, and associated with one or more teams.

### Task Assignment
Each task can be assigned multiple personnel via the Task Edit Modal. Bulk assignment is also possible via the Bulk Operations modal. The assigned personnel are stored in the `personnel` property of a task object as an array of personnel IDs.

### Data Model
- `settings.personnel`: Array of objects (`{ id, name, role, notes, teams: [teamId, ...] }`).
- `task.personnel`: Array of strings representing the personnel IDs assigned to a task.
