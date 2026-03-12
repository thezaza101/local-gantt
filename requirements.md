# Browser-Based Work Planning & Capacity Tool

## Consolidated Phased Implementation Plan

---

# 1. System Overview

The tool is a **portable planning system** combining:

* Gantt planning
* work item tracking
* tagging
* effort modelling
* capacity planning
* scenario comparison

The application runs entirely in the browser and stores plans in **JSON files**.

---

# Core Capabilities

## Planning

* date-based Gantt chart
* draggable tasks
* multiple tasks per row
* timeline markers
* customizable task colours

## Work Management

* task duplication
* task deletion
* tag filtering
* external ticket linking

## Capacity Planning

* capacity defined between date ranges
* capacity granularity (monthly/weekly)
* demand calculation from effort
* configurable demand reduction %

## Analytics

* capacity vs demand graph
* effort by tag
* effort by type

## Scenario Management

* multiple plans within one file
* plan switching
* plan duplication

## Output

* JSON import/export
* print-friendly view

---

# 2. System Architecture

### Technology Stack

Frontend:

* HTML
* Vanilla JavaScript
* Bootstrap

No frameworks, no backend.

---

### Suggested File Structure

```
index.html
app.js
planner.js
gantt.js
capacity.js
analytics.js
storage.js
ui.js
styles.css
```

---

# 3. Core Data Model

All application data lives in a **single JSON file**.

---

# Root File Structure

```json
{
  "meta": {
    "fileVersion": 1
  },
  "settings": {
    "baseLink": "https://jira.company.com/browse/"
  },
  "plans": []
}
```

---

# Plan Model

Each plan represents a **scenario**.

```json
{
  "id": "planA",
  "name": "Baseline Plan",
  "timeline": {
    "startDate": "2026-01-01",
    "endDate": "2026-06-30"
  },
  "markers": [],
  "capacity": {
    "granularity": "month",
    "entries": []
  },
  "demandAdjustmentPercent": 20,
  "tasks": []
}
```

---

# Task Model

```json
{
  "id": "TASK-101",
  "title": "Authentication",
  "description": "Implement login system",
  "startDate": "2026-01-10",
  "endDate": "2026-01-25",
  "row": 1,
  "fillColor": "#4da3ff",
  "borderColor": "#1c6ed5",
  "tags": ["backend", "security"],
  "effort": {
    "design": 3,
    "dev": 8,
    "test": 4
  }
}
```

Total effort:

```
design + dev + test
```

---

# Marker Model

Markers represent milestones.

```json
{
  "date": "2026-03-15",
  "label": "Beta Release",
  "color": "#ff4d4d"
}
```

Displayed as **vertical lines across the chart**.

---

# Capacity Model

Capacity ranges define available effort.

```json
{
  "startDate": "2026-01-01",
  "endDate": "2026-03-31",
  "capacity": 40
}
```

Example meaning:

```
Jan: 40
Feb: 40
Mar: 40
```

---

# Capacity Granularity

Stored as:

```
month
week
quarter
```

Determines graph grouping.

---

# 4. Effort and Demand Calculation

---

# Task Effort

```
TotalEffort = design + dev + test
```

---

# Effort Distribution

Effort is spread across the task duration.

```
effortPerDay = totalEffort / durationDays
```

---

# Demand Adjustment

Demand is reduced using configurable percentage.

Formula:

```
Demand = TotalEffort × (1 - adjustmentPercent)
```

Example:

```
TotalEffort = 100
Adjustment = 20%

Demand = 80
```

---

# Period Aggregation

Effort is grouped based on **capacity granularity**.

Example (monthly):

```
Jan demand
Feb demand
Mar demand
```

---

# Capacity Expansion

Capacity ranges expand into periods.

Example:

```
Jan–Mar = 40
```

becomes

```
Jan 40
Feb 40
Mar 40
```

---

# Final Demand vs Capacity Table

| Period | Capacity | Demand |
| ------ | -------- | ------ |
| Jan    | 40       | 22     |
| Feb    | 40       | 31     |
| Mar    | 40       | 18     |

---

# 5. User Interface Layout

Using **Bootstrap grid system**.

---

# Layout

```
Navbar
--------------------------------------

Plan Selector + Toolbar

--------------------------------------

Tag Filters

--------------------------------------

Gantt Chart

--------------------------------------

Capacity vs Demand Graph

--------------------------------------

Analytics Panel
```

---

# 6. Gantt Chart Behaviour

---

# Task Block Appearance

Each block shows only:

```
TASK-101
Authentication
```

Styled using:

```
background-color = fillColor
border-color = borderColor
```

---

# Task Controls

Inside block:

```
⧉ duplicate
🗑 delete
```

---

# Dragging Behaviour

Tasks support:

| Action          | Result                |
| --------------- | --------------------- |
| Drag left/right | change start/end date |
| Drag up/down    | change row            |
| Resize edges    | change duration       |

Multiple tasks may exist on the same row.

---

# Row Calculation

Row determined by vertical position.

```
row = floor(mouseY / rowHeight)
```

---

# 7. External Ticket Links

Double-clicking a task opens external system.

Example:

```
baseLink + taskID
```

Example result:

```
https://jira.company.com/browse/TASK-101
```

---

# 8. Tag System

Tasks may contain tags.

Example:

```
backend
frontend
security
data
```

---

# Tag Filters

Toolbar buttons:

```
[Backend] [Frontend] [Data]
```

Modes:

```
show only
highlight
multi-select
```

---

# 9. Timeline Markers

Markers appear as **vertical lines across the chart**.

Example:

```
|----|----|----|
     │
     │ Beta Release
     │
```

Markers include:

```
date
label
colour
```

---

# 10. Capacity Entry Interface

Capacity entered as ranges.

Table example:

| Start | End    | Capacity |
| ----- | ------ | -------- |
| Jan 1 | Mar 31 | 40       |
| Apr 1 | Jun 30 | 32       |

Buttons:

```
Add Range
Delete Range
```

---

# 11. Capacity vs Demand Graph

Graph located at bottom.

Displays:

```
capacity vs demand over time
```

---

# Graph Axes

X-axis:

```
periods (month/week)
```

Y-axis:

```
effort units
```

---

# Graph Style

Capacity:

```
solid bars
```

Demand:

```
line or alternate bars
```

---

# Overcapacity Highlighting

When:

```
demand > capacity
```

Period shown in red.

---

# 12. Multiple Plan Management

Plans allow **scenario modelling**.

---

# Plan Selector

Dropdown in toolbar.

```
Plan: [Baseline ▼]
```

---

# Plan Actions

```
New Plan
Duplicate Plan
Delete Plan
Rename Plan
```

---

# Plan Switching

Switching plans:

1. save current state
2. load selected plan
3. redraw UI

---

# 13. Save / Load Plans

---

# Export

```
Export JSON
```

Downloads:

```
planning-file.json
```

---

# Import

```
Import JSON
```

Loads full file including all plans.

---

# 14. Print View

Print mode removes editing UI.

Uses:

```
@media print
```

Print shows:

```
timeline
tasks
markers
legend
capacity graph
```

Suggested page layout:

```
A4 landscape
```

---

# 15. Implementation Phases

---

# Phase 1 — Application Shell

Implement:

* Bootstrap layout
* file data model
* plan loading
* basic UI skeleton

---

# Phase 2 — Plan Management

Implement:

* plan selector
* create/duplicate/delete plans
* plan switching

---

# Phase 3 — Date-Based Timeline

Implement:

* start/end timeline
* date grid rendering
* marker rendering

---

# Phase 4 — Task Management

Implement:

* create/edit tasks
* task modal
* task rendering

---

# Phase 5 — Drag and Resize System

Implement:

* horizontal dragging
* vertical row dragging
* resize edges

---

# Phase 6 — Task Controls

Implement:

* duplicate
* delete
* external link double-click

---

# Phase 7 — Tag System

Implement:

* tag entry
* tag filters
* highlight mode

---

# Phase 8 — Capacity Planning

Implement:

* capacity range entry
* granularity setting
* capacity expansion logic

---

# Phase 9 — Demand Calculation Engine

Implement:

* effort distribution
* demand adjustment factor
* period aggregation

---

# Phase 10 — Capacity vs Demand Graph

Implement:

* canvas graph rendering
* overcapacity highlighting

---

# Phase 11 — Save / Load

Implement:

* JSON export
* JSON import
* validation

---

# Phase 12 — Print View

Implement:

* print CSS
* print button
* clean layout

---

