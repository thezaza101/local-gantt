# Browser-Based Work Planning & Capacity Tool

A fully portable, offline, browser-only application for work planning, capacity modelling, and scenario comparison.

This tool provides a complete project management and capacity tracking solution that runs entirely in your web browser. There is no backend, no database, and no cloud syncing required. All data is managed locally and can be imported or exported as a single JSON file, ensuring absolute data privacy and portability.

## Features

### Completely Local & Offline
* **No Server Required:** Runs entirely from local files.
* **No Database:** All application data lives in a single JSON file.
* **Privacy First:** Your project plans and capacity data never leave your machine.
* **Portable:** Share your plans by simply sending the JSON file to colleagues.

### Comprehensive Planning
* **Interactive Gantt Chart:** Drag and drop tasks to adjust dates, resize to change durations, and easily move tasks between rows.
* **Multiple Tasks Per Row:** Organize your timeline efficiently by placing concurrent or sequential tasks on the same row.
* **Timeline Markers:** Add visual milestones and deadlines directly to the timeline.
* **Customizable Styling:** Customize task colors to visually categorize work.

### Work Management
* **Task Controls:** Quickly duplicate or delete tasks directly from the timeline.
* **Tagging System:** Assign tags (e.g., frontend, backend, security) to tasks and use filters to highlight or show specific work streams.
* **External Integrations:** Double-click a task to automatically open its corresponding ticket in external systems (e.g., Jira, Azure DevOps) based on configurable base links.

### Capacity Planning & Analytics
* **Capacity Definition:** Define available capacity over specific date ranges and granularities (monthly, weekly, quarterly).
* **Demand Calculation:** Automatically calculate project demand based on task effort (e.g., design, dev, test) and distribute it across the task duration.
* **Scenario Modelling:** Create, duplicate, and compare multiple project plans (scenarios) within a single file to see how different timelines affect capacity.
* **Visual Analytics:** View a dynamic "Capacity vs. Demand" graph that highlights over-capacity periods in red, helping you balance your team's workload.

### Output & Sharing
* **JSON Import/Export:** Seamlessly save your progress or load existing plans.
* **Print-Friendly View:** Generate clean, presentation-ready print views (A4 landscape) that automatically hide editing controls.

## Usage

Since the application is entirely client-side, getting started is extremely simple.

### Option 1: Direct File Access (Easiest)
1. Clone or download this repository to your local machine.
2. Open the `index.html` file directly in your preferred web browser.
3. Start planning! You can load the provided `sample-plan.json` to see how the tool works.

### Option 2: Local Web Server (Recommended for Development)
If you experience issues with modern browser security policies restricting local file access (CORS), you can run a simple local web server:

1. Open a terminal or command prompt.
2. Navigate to the directory containing the downloaded files.
3. Run a basic HTTP server. For example, using Python:
   ```bash
   python3 -m http.server 8000
   ```
4. Open your web browser and navigate to `http://localhost:8000`.

## Architecture
The application is built using vanilla HTML, CSS, and JavaScript. It uses Bootstrap for layout and styling, and Chart.js for rendering the capacity vs. demand graphs. All external libraries are downloaded and hosted locally within the repository to ensure true offline capability.

For a deeper dive into the component responsibilities and data model, see the `architecture_component_breakdown.md` and `requirements.md` files included in the repository.

## License
This project is licensed under the MIT License.
