/* Application Bootstrap */

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Application starting...");
    await initApp();
});

async function initApp() {
    console.log("Initializing components...");
    // Initialize state
    window.PlannerState = new Planner();

    // Try to load latest.json
    console.log("Attempting to load latest.json...");
    const latestPlanData = await Storage.fetchLatestPlan();
    if (latestPlanData) {
        console.log("Successfully loaded latest.json.");
        window.PlannerState.loadState(latestPlanData);
    } else {
        console.log("Could not load latest.json. Starting with default state.");
    }

    // Initialize Gantt Engine
    window.GanttEngine = new Gantt('gantt-chart-container');

    // Initialize Capacity Engine
    window.CapacityEngine = new Capacity();

    // Initialize Analytics
    window.AnalyticsEngine = new Analytics(window.PlannerState);

    // Initialize Graph Engine is removed, rendering logic moved to Analytics

    // Initialize UI
    window.UIController = new UI();

    // Initial UI update
    window.UIController.updateUI();

    // Prevent accidental navigation/closing
    window.addEventListener('beforeunload', (event) => {
        event.preventDefault();
        event.returnValue = '';
    });

    console.log("App ready.");
}