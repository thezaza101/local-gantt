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
