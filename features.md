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

## Toolbar Help & Glossary
The application provides a comprehensive toolbar with various functionalities grouped as follows:

### File & Data Management
- **📂 Import JSON:** Import a saved planner state from a JSON file.
- **💾 Export JSON:** Download the entire planner state as a JSON file.
- **🕒 Version History:** View the history of export messages.
- **⚙️ Settings:** Open the global application settings.
- **📅 Plan Actions:** A dropdown menu to manage your plans (New, Edit, Duplicate, Delete, Import, Export, Capacity).
- **⬇️ Export Options:** Export the current Gantt chart as a high-resolution Image or export tasks as a CSV. Ability to share HTML is experimental.

### Tasks & Elements
- **➕ Add Task:** Create a new task in the current plan.
- **🗃️ Bulk Operations:** Select multiple tasks via checkboxes to apply tags, set statuses, or exclude them in bulk.
- **➕/🗑️ Manage Rows:** Hover over a row number in the chart to insert empty rows above or delete empty rows.
- **📍 Manage Markers:** Add, edit, or delete timeline markers.
- **📋 Task List:** View all tasks in a searchable list format.
- **🎨 Legends:** Customize task fill and border colors and map them to tags.
- **🏷️ Tag Groups:** Create and manage groups of tags to quickly apply multiple tags to tasks, or use them in Bulk Operations.

### View & Filters
- **👥 Filter Team:** Select a specific team to filter tasks on the chart.
- **🏷️ Filter Tags:** Select specific tags to show or highlight in the chart.
- **∪ / ∩ (Match Any/All):** Determine if a task needs to match Any or All of the selected tags to be shown.
- **👁️ / 🔦 (Show/Highlight):** Choose whether non-matching tasks should be completely hidden (Show) or just faded out (Highlight).
- **🔗 Dependencies:** Toggle the display of dependency lines between tasks.

### Timeline Controls
- **D, W, F, M (Zoom):** Adjust the timeline scale to Daily, Weekly, Fortnightly, or Monthly views.
- **⏱️ Effort/Day:** Toggle the display of calculated daily effort values within the timeline grid.
- **🚩 ⛳ 📝 (Markers):** Toggle the visibility of Major, Minor, and Note markers respectively.
- **📊 Analytics:** Open the full-screen Analytics dashboard.
- **📺 Presenter Mode:** Hide the toolbar for a cleaner, presentation-ready view.
## Tracker (Risks, Issues, Dependencies, Assumptions, Decisions)
The Tracker provides a centralized view for managing program-level and plan-level Risks, Issues, Dependencies, Assumptions, and Decisions (RIDAD).

### Global vs Plan Scope
Tracker entities exist independently of tasks and are stored globally in the JSON data model (`file.risks`, `file.issues`, etc.). Each entity uses a `planId` field to define its scope. A `planId` of `null` or `""` means the item is global across all plans.

### Task Associations
To maintain a single source of truth and prevent bi-directional synchronization bugs, task relationships are stored exclusively on the tracker entity using an `associatedTasks` array of task IDs. When a task is saved in the UI, the system dynamically queries and updates the relevant tracker entities to align with the selections made in the task modal.

### Bulk Operations & Dependencies
The Tracker view includes bulk operation controls for deleting or modifying the status of multiple entities simultaneously. A specialized "Auto-Create Proper Dependencies" tool scans all tasks within the current plan and automatically provisions fully structured Dependency entities from simple task-level dependency links, marking them as removed if the task link is subsequently deleted.

Additionally, Tracker Dependency entities can be visualized directly on the Gantt chart by enabling the "Visible on Gantt" checkbox. When enabled, custom arrows will be drawn connecting the "From Task(s)" to the "To Task". You can further customize these arrows by selecting a specific color and adding text to annotate the relationship.
## Graph View
The Graph View provides an interactive, visual representation of dependencies and relationships between Tasks, Risks, Issues, Dependencies, Assumptions, and Decisions (RIDAD).

### Usage
- The view can be launched by clicking the "View Graph" button inside the edit modal of any Task or Tracker item.
- The item from which the view is launched acts as the "root" (n=0) at the center of the graph.
- The depth of traversal (`n`) is fully configurable via an input in the modal header, updating the visualization dynamically as the depth changes.

### Rendering Engine
The application uses a custom, lightweight, force-directed graph physics engine drawn on an HTML5 `<canvas>`, removing the need for heavy third-party packages.
- Connected nodes attract each other, while all nodes repel each other, naturally distributing elements in the view.
- Nodes are color-coded based on their entity type (e.g., Task, Risk, Issue).
- Users can click and drag the canvas to pan, scroll to zoom, or drag individual nodes to arrange them manually.
- A "Download Image" button allows users to export the current graph visualization as a high-resolution PNG image.
## RAIDA Summary
The RAIDA view provides a summary dashboard for Risks, Issues, Dependencies, Assumptions, and Decisions (RAIDA) items, as well as tasks, that need attention.
It highlights:
- Overdue & upcoming deadlines
- Items not checked recently (stale)
- High severity/critical items open
- Items with no owner
- Items with no associated tasks
- Recently auto-created dependencies
- Decisions blocking progress

It respects the Global/Plan scope filter and is configurable through the Global Settings.
