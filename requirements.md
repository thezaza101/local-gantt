Below is a \*\*structured phased implementation plan\*\* that builds your tool incrementally while keeping it \*\*browser-only, dependency-light, and usable early\*\*. The goal is that \*\*every phase results in a working tool\*\*, not just partial components.



The only external library allowed is \*\*Bootstrap\*\* for layout and styling.



---



\# Phased Implementation Plan



Browser-Only Work Planning Tool



\## Technology Stack



\*\*Frontend\*\*



\* HTML

\* Vanilla JavaScript

\* Bootstrap (for layout/components)



\*\*Data\*\*



\* JSON file save/load

\* Local in-memory state



\*\*Architecture\*\*



```text

index.html

app.js

planner.js

gantt.js

analytics.js

storage.js

style.css

```



No backend, no build system required.



---



\# Phase 1 — Core Skeleton \& Data Model



\## Objective



Create a working shell that can \*\*create, display, save, and load tasks\*\*.



\## Features



\### Basic UI Layout



Using Bootstrap grid.



Layout:



```

Navbar

----------------------------------



Toolbar (filters / actions)



----------------------------------



Timeline Area (Gantt)



----------------------------------



Analytics Panel

```



---



\### Data Model



Define the internal structure.



```json

{

&nbsp; "meta": {

&nbsp;   "name": "Project Plan",

&nbsp;   "version": 1

&nbsp; },

&nbsp; "settings": {

&nbsp;   "baseLink": ""

&nbsp; },

&nbsp; "timelines": \[],

&nbsp; "tasks": \[]

}

```



---



\### Task Structure



```json

{

&nbsp; "id": "TASK-101",

&nbsp; "title": "Authentication",

&nbsp; "description": "",

&nbsp; "effort": {

&nbsp;   "design": 0,

&nbsp;   "dev": 0,

&nbsp;   "test": 0

&nbsp; },

&nbsp; "tags": \[],

&nbsp; "timeline": {

&nbsp;   "start": 0,

&nbsp;   "end": 1

&nbsp; }

}

```



---



\### Task Creation



Button:



```

Add Task

```



Opens Bootstrap modal:



Fields



\* ID

\* Title

\* Description

\* Design effort

\* Dev effort

\* Test effort

\* Tags



---



\### Basic Gantt Rendering



Render simple blocks.



Block content:



```

TASK-101

Authentication

```



Blocks are positioned with CSS.



Example:



```

position: absolute

left = start

width = duration

```



---



\### Save / Load



\#### Export



Download JSON using:



```

Blob + download link

```



Button:



```

Export Plan

```



---



\#### Import



Upload JSON file.



Button:



```

Import Plan

```



---



\# Phase 2 — Timeline System



\## Objective



Support \*\*custom timelines and snapping increments\*\*.



---



\## Features



\### Timeline Definition



User can define:



\* name

\* labels

\* increment



Example:



```

Sprint Timeline

Increment: 0.5

Labels:

S1 S2 S3 S4

```



---



\### Timeline Rendering



Grid generated dynamically.



Example:



```

| S1 | S2 | S3 | S4 |

```



Each cell width fixed.



---



\### Snap Logic



Tasks snap to increments.



```

snap = round(value / increment) \* increment

```



Example increments:



```

0.5

1

0.25

```



---



\### Timeline Switching



User can switch views:



```

Sprint View

Month View

```



---



\# Phase 3 — Drag \& Resize Gantt Blocks



\## Objective



Make tasks \*\*interactive and draggable\*\*.



---



\## Features



\### Dragging Tasks



Mouse interaction.



```

mousedown → begin drag

mousemove → update position

mouseup → snap to increment

```



---



\### Resizing Tasks



Right edge draggable.



Updates:



```

timeline.end

```



---



\### Vertical Layout



Tasks stacked automatically.



Algorithm:



```

detect overlap

push to next row

```



---



\### Hover Tooltip



Shows full task info.



Example:



```

TASK-101

Authentication



Design: 2

Dev: 5

Test: 3

Tags: backend

```



Bootstrap tooltip used.



---



\# Phase 4 — Task Actions



\## Objective



Add block actions for editing, duplication, and deletion.



---



\## Block Buttons



Displayed inside each task.



```

⧉ Duplicate

🗑 Delete

```



Bootstrap icons optional.



---



\### Duplicate



Creates new task.



Rules:



```

copy title

copy effort

copy tags

copy duration

generate new ID

```



User prompted to change ID.



---



\### Delete



Confirmation dialog.



```

Delete TASK-101?

```



---



\### Edit Task



Clicking block opens modal.



Allows editing:



\* title

\* description

\* effort

\* tags



---



\# Phase 5 — External Link Integration



\## Objective



Enable quick navigation to external systems.



---



\### Base Link Setting



Example:



```

https://jira.company.com/browse/

```



Stored in:



```

settings.baseLink

```



---



\### Double Click Behaviour



Double-clicking block opens:



```

baseLink + taskID

```



Example:



```

https://jira.company.com/browse/TASK-101

```



Uses:



```

window.open(url)

```



---



\# Phase 6 — Tag System



\## Objective



Allow categorisation and filtering.



---



\### Tag Creation



Tags stored in task:



```

tags: \["backend","security"]

```



UI:



```

tag input with autocomplete

```



---



\### Tag Colours



Each tag assigned colour.



Example:



```

backend = blue

frontend = green

data = purple

```



Small coloured stripe shown on block.



---



\### Tag Filters



Toolbar:



```

\[Backend] \[Frontend] \[Data]

```



Modes:



```

show only

highlight

multi-select

```



---



\# Phase 7 — Effort Analytics



\## Objective



Add analytics based on tags and effort.



---



\## Effort Calculation



Total effort:



```

design + dev + test

```



---



\### Effort by Tag



Example output:



```

Backend      42

Frontend     18

Security      9

```



---



\### Effort by Type



```

Design   14

Dev      53

Test     27

```



---



\### Effort by Timeline Period



Example:



```

Sprint 1   15

Sprint 2   20

Sprint 3   12

```



---



\### Analytics UI



Bootstrap cards.



Example:



```

--------------------------------

Effort by Tag

--------------------------------



Backend   █████████

Frontend  █████

Data      ███

```



---



\# Phase 8 — Capacity Planning Timeline



\## Objective



Support second timeline for \*\*capacity planning\*\*.



---



\### Capacity Model



Example:



```

Jan 40

Feb 35

Mar 30

```



Stored as:



```

capacity\[timeline]\[period]

```



---



\### Effort vs Capacity



Example:



```

Sprint 1  18 / 20

Sprint 2  23 / 15 ⚠

Sprint 3  10 / 25

```



---



\### Visual Indicators



Colour states:



```

green = under capacity

yellow = near capacity

red = over capacity

```



---



\# Phase 9 — UX Improvements



\## Objective



Polish usability.



---



\### Keyboard Shortcuts



Examples:



```

N = new task

Del = delete task

D = duplicate task

```



---



\### Zoom Levels



Timeline zoom:



```

Week

Sprint

Month

```



---



\### Task Search



Search by:



```

ID

Title

Tag

```



---



\# Phase 10 — Advanced Planning Features (Optional)



\## Effort Heatmap



Background shading showing workload intensity.



---



\## Dependency Lines



Tasks can depend on other tasks.



```

TASK-101 → TASK-105

```



Draw arrow. (make it show/hideable)



---



\## Scenario Planning



Multiple plans inside file.



```

Plan A

Plan B

Plan C

```



---



