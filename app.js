/* Application Bootstrap */

const APP_VERSION = "1.0.0";
const APP_DATE = "2023-10-27";

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Application starting...");
    await initApp();
});

async function initApp() {
    console.log("Initializing components...");
    // Initialize state
    window.PlannerState = new Planner();

    // Check for embedded state (Shareable HTML mode)
    const embeddedStateEl = document.getElementById('embedded-state');
    let loadedState = null;

    if (embeddedStateEl) {
        try {
            console.log("Found embedded state, loading as shareable mode...");
            loadedState = JSON.parse(embeddedStateEl.textContent);
            window.isShareableMode = true;
            document.body.classList.add('shareable-mode');
        } catch (e) {
            console.error("Failed to parse embedded state:", e);
        }
    }

    if (!loadedState) {
        // Try to load latest.json
        console.log("Attempting to load latest.json...");
        loadedState = await Storage.fetchLatestPlan();
    }

    if (loadedState) {
        console.log("Successfully loaded state.");
        window.PlannerState.loadState(loadedState);
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

    // Set App Version
    const versionDisplay = document.getElementById('appVersionDisplay');
    if (versionDisplay) {
        versionDisplay.textContent = `Version ${APP_VERSION} (${APP_DATE})`;
    }

    // Prevent accidental navigation/closing
    window.addEventListener('beforeunload', (event) => {
        event.preventDefault();
        event.returnValue = '';
    });

    console.log("App ready.");
}