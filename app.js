/* Application Bootstrap */

document.addEventListener('DOMContentLoaded', () => {
    console.log("Application starting...");
    initApp();
});

function initApp() {
    console.log("Initializing components...");
    // Initialize state
    window.PlannerState = new Planner();

    // Initialize UI
    window.UIController = new UI();

    console.log("App ready.");
}