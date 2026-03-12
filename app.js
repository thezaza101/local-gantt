/* Application Bootstrap */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Application starting...");
    initApp();
});

function initApp() {
    console.log("Initializing components...");
    // Initialize state
    window.PlannerState = new Planner();

    // Initialize Gantt Engine
    window.GanttEngine = new Gantt('gantt-chart-container');

    // Initialize Analytics
    window.AnalyticsEngine = new Analytics(window.PlannerState);

    // Initialize UI
    window.UIController = new UI();

    // Initial UI update
    window.UIController.updateUI();

    console.log("App ready.");
}