/* Application Bootstrap */

const APP_VERSION = "78";
const APP_DATE = "2026-04-29";
window.APP_VERSION = APP_VERSION;

window.checkFileVersionWarning = function(data) {
    if (data && data.meta && data.meta.appVersion) {
        const fileVersionStr = String(data.meta.appVersion);
        const currentVersionStr = String(window.APP_VERSION);

        const parseVersion = (v) => v.split('.').map(num => parseInt(num, 10) || 0);

        const fileParts = parseVersion(fileVersionStr);
        const currentParts = parseVersion(currentVersionStr);

        const maxLength = Math.max(fileParts.length, currentParts.length);

        let isNewer = false;
        for (let i = 0; i < maxLength; i++) {
            const filePart = fileParts[i] || 0;
            const currentPart = currentParts[i] || 0;
            if (filePart > currentPart) {
                isNewer = true;
                break;
            } else if (filePart < currentPart) {
                break;
            }
        }

        if (isNewer) {
            alert(`Warning: This file was edited using a newer version of the editor (v${data.meta.appVersion}). It may not display correctly on this version (v${window.APP_VERSION}).`);
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Application starting...");

    // Apply saved theme preference early
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        const darkModeToggleBtn = document.getElementById("darkModeToggleBtn");
        if (darkModeToggleBtn) {
            darkModeToggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }

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
        window.checkFileVersionWarning(loadedState);
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