# High-Level System Architecture

```
                +---------------------------+
                |        index.html         |
                |   (Bootstrap UI Layout)   |
                +-------------+-------------+
                              |
                              v
                    +------------------+
                    |      app.js      |
                    | Application Init |
                    +---------+--------+
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
+----------------+   +----------------+   +----------------+
|  PlannerState  |   |  StorageLayer  |   |  UI Controller |
|  (data model)  |   | JSON import/export| |  event wiring |
+--------+-------+   +--------+-------+   +--------+-------+
         |                    |                    |
         |                    |                    |
         v                    v                    v
+--------+------+   +---------+---------+  +----------------+
| Gantt Engine  |   | Capacity Engine   |  | Analytics Engine|
| Task layout   |   | Demand calculation|  | Effort summaries|
| Drag logic    |   | Capacity expansion|  | Tag filtering   |
+--------+------+   +---------+---------+  +----------------+
         |
         v
+-----------------------------+
|      Render Layer           |
|  Gantt chart                |
|  Markers                    |
|  Task blocks                |
|  Graph                      |
+-----------------------------+
```

---

# Component Responsibilities

## 1. Application Bootstrap

File:

```
app.js
```

Responsibilities:

* initialize application
* load default file
* attach event listeners
* trigger first render

Example responsibilities:

```
initApp()
loadPlanFile()
renderCurrentPlan()
```

---

# 2. Planner State (Core Data Model)

File:

```
planner.js
```

This module holds the **entire in-memory state**.

Structure:

```
plannerState
 ├─ file
 │   ├─ meta
 │   ├─ settings
 │   └─ plans[]
 │
 └─ currentPlanIndex
```

Functions:

```
getCurrentPlan()
setCurrentPlan()
addTask()
deleteTask()
duplicateTask()
addMarker()
addCapacityRange()
```

This becomes the **single source of truth**.

---

# 3. Storage Layer

File:

```
storage.js
```

Handles:

```
import JSON
export JSON
file validation
```

Functions:

```
exportPlanFile()
importPlanFile()
validateFile()
```

Export uses:

```
Blob + download
```

---

# 4. UI Controller

File:

```
ui.js
```

Connects **user interactions to state updates**.

Handles:

```
buttons
modals
dropdowns
plan switching
filters
```

Examples:

```
onAddTaskClick()
onDuplicateTaskClick()
onDeleteTaskClick()
onPlanChange()
```

---

# 5. Gantt Engine

File:

```
gantt.js
```

Responsible for:

```
task positioning
dragging logic
row placement
date calculations
marker rendering
```

---

## Task Position Calculation

Inputs:

```
timeline start
timeline end
task start
task end
row
```

Output:

```
left position
width
top position
```

---

## Drag Engine

Tracks:

```
mousedown
mousemove
mouseup
```

Handles:

```
horizontal drag (dates)
vertical drag (rows)
resize edges
```

---

# 6. Capacity Engine

File:

```
capacity.js
```

Responsible for:

```
capacity expansion
effort distribution
demand calculation
period grouping
```

---

## Demand Calculation Flow

```
tasks
   ↓
calculate effort/day
   ↓
assign effort to dates
   ↓
group by period
   ↓
apply demand reduction
```

---

## Capacity Expansion

Example input:

```
Jan–Mar = 40
```

Expanded:

```
Jan 40
Feb 40
Mar 40
```

---

# 7. Analytics Engine

File:

```
analytics.js
```

Calculates:

```
effort by tag
effort by type
demand by period
capacity vs demand
```

Outputs structured data used by graphs.

---

# 8. Render Layer 

### Responsibilities:

1. **Gantt Chart Rendering**

   * Draw timeline grid (days/weeks/months depending on zoom)
   * Render rows
   * Draw markers as vertical lines
   * Render tasks as **colored blocks** showing:

     ```
     TASK-ID
     Title
     ```
   * Draw task control buttons inside block: duplicate (⧉), delete (🗑)

2. **Drag & Drop Visualization**

   * Update block position live while dragging
   * Highlight valid row positions
   * Snap to nearest date / row

3. **Capacity vs Demand Graph**

   * X-axis: periods (based on plan granularity)
   * Y-axis: effort units
   * Capacity: solid bars
   * Demand: line or shaded bars
   * Highlight over-capacity periods in red

4. **Print View**

   * Remove editing UI elements: buttons, modals, filters
   * Only show:

     ```
     timeline grid
     tasks
     markers
     capacity graph
     legend
     ```
   * Use `@media print` CSS
   * Scale timeline and graph to fit page width

---

# 9. Event Handling & User Interactions

### Major Interactions

| Interaction           | Component                     | Effect                                        |
| --------------------- | ----------------------------- | --------------------------------------------- |
| Add Task              | UI Controller → Planner State | Opens modal → add task → re-render Gantt      |
| Edit Task             | UI Controller → Planner State | Opens modal → update task → re-render         |
| Drag Task             | Gantt Engine                  | Update dates/row in Planner State → re-render |
| Duplicate/Delete Task | Task Block                    | Update Planner State → re-render              |
| Switch Plan           | Plan Selector                 | Load plan from Planner State → re-render      |
| Add Marker            | UI Controller                 | Add to Planner State → re-render              |
| Add Capacity Range    | Capacity Engine               | Update Planner State → re-render graph        |
| Update Demand %       | Capacity Engine               | Recalculate → re-render graph                 |
| Filter by Tag         | Analytics Engine              | Hide/highlight tasks → re-render              |
| Double Click Task     | UI Controller                 | Open `baseLink + taskID`                      |

---

# 10. Rendering Pipeline (Full Flow)

1. **Get Current Plan** from Planner State
2. **Render Timeline** (grid, markers)
3. **Render Rows** (tasks per row)
4. **Render Task Blocks**
5. **Render Capacity vs Demand Graph**
6. **Apply Filters / Highlights**
7. **Attach Event Listeners** to:

   * drag
   * double-click
   * buttons inside task blocks
8. **Listen for Updates** in Planner State → re-run pipeline

> This ensures the UI is always **in sync** with the data model.

---

# 11. JSON File Format Summary

```json
{
  "meta": {"fileVersion": 1},
  "settings": {
    "baseLink": "https://jira.company.com/browse/"
  },
  "plans": [
    {
      "id": "planA",
      "name": "Baseline Plan",
      "timeline": {"startDate": "2026-01-01", "endDate": "2026-06-30"},
      "markers": [
        {"date": "2026-03-15", "label": "Beta Release", "color": "#ff4d4d"}
      ],
      "capacity": {
        "granularity": "month",
        "entries": [
          {"startDate": "2026-01-01", "endDate": "2026-03-31", "capacity": 40},
          {"startDate": "2026-04-01", "endDate": "2026-06-30", "capacity": 32}
        ]
      },
      "demandAdjustmentPercent": 20,
      "tasks": [
        {
          "id": "TASK-101",
          "title": "Authentication",
          "description": "Login system",
          "startDate": "2026-01-10",
          "endDate": "2026-01-25",
          "row": 1,
          "fillColor": "#4da3ff",
          "borderColor": "#1c6ed5",
          "tags": ["backend", "security"],
          "effort": {"design": 3, "dev": 8, "test": 4}
        }
      ]
    }
  ]
}
```


# ✅ Key Advantages of This Architecture

* **Single source of truth:** Planner State
* **Fully offline:** everything in browser
* **Modular:** separate engines for Gantt, Capacity, Analytics
* **Scalable:** multiple plans per file, multiple tasks per row
* **Extensible:** you could later add more analytics, timeline zooms, or export formats

