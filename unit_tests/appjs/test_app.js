describe('Application Bootstrap (app.js)', () => {

    // Helper to mock DOM elements
    function createMockElement(id, textContent = '') {
        const el = document.createElement('div');
        el.id = id;
        el.textContent = textContent;
        document.body.appendChild(el);
        return el;
    }

    // Helper to cleanup mocked DOM elements
    function cleanupMockElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
        }
    }

    // Mock global engine classes
    class MockPlanner {
        loadState() {}
    }
    class MockGantt {}
    class MockCapacity {}
    class MockAnalytics {}
    class MockTracker {}
    class MockGraph { init() {} }
    class MockRaida {}
    class MockUI { updateUI() {} }

    // Mock Storage
    const MockStorage = {
        fetchLatestPlan: async () => null
    };

    let originalAlert;
    let alertMessages;
    let originalStorage;
    let originalAPP_VERSION;

    // Store original globals
    let originalPlanner, originalGantt, originalCapacity, originalAnalytics;
    let originalTracker, originalGraph, originalRaida, originalUI;
    let originalGetElementById;

    function setupMocks() {
        alertMessages = [];
        originalAlert = window.alert;
        window.alert = (msg) => alertMessages.push(msg);

        originalStorage = window.Storage;
        window.Storage = MockStorage;

        originalAPP_VERSION = window.APP_VERSION;

        originalPlanner = window.Planner;
        originalGantt = window.Gantt;
        originalCapacity = window.Capacity;
        originalAnalytics = window.Analytics;
        originalTracker = window.Tracker;
        originalGraph = window.GraphEngine;
        originalRaida = window.Raida;
        originalUI = window.UI;

        window.Planner = MockPlanner;
        window.Gantt = MockGantt;
        window.Capacity = MockCapacity;
        window.Analytics = MockAnalytics;
        window.Tracker = MockTracker;
        window.GraphEngine = new MockGraph();
        window.Raida = MockRaida;
        window.UI = MockUI;

        originalGetElementById = document.getElementById;
    }

    function teardownMocks() {
        window.alert = originalAlert;
        window.Storage = originalStorage;
        window.APP_VERSION = originalAPP_VERSION;

        window.Planner = originalPlanner;
        window.Gantt = originalGantt;
        window.Capacity = originalCapacity;
        window.Analytics = originalAnalytics;
        window.Tracker = originalTracker;
        window.GraphEngine = originalGraph;
        window.Raida = originalRaida;
        window.UI = originalUI;

        if (originalGetElementById) {
            document.getElementById = originalGetElementById;
        }

        // Also clean up any instances that initApp might have created on window
        delete window.PlannerState;
        delete window.GanttEngine;
        delete window.CapacityEngine;
        delete window.AnalyticsEngine;
        delete window.TrackerEngine;
        delete window.RaidaEngine;
        delete window.UIController;
        delete window.isShareableMode;
    }

    test('checkFileVersionWarning shows alert if file version is newer', () => {
        setupMocks();
        window.APP_VERSION = "78";

        const data = { meta: { appVersion: "79" } };
        window.checkFileVersionWarning(data);

        assertEqual(alertMessages.length, 1);
        assertTrue(alertMessages[0].includes("newer version of the editor"));

        teardownMocks();
    });

    test('checkFileVersionWarning handles multi-part versions', () => {
        setupMocks();
        window.APP_VERSION = "1.0.0";

        const data = { meta: { appVersion: "1.0.1" } };
        window.checkFileVersionWarning(data);

        assertEqual(alertMessages.length, 1);
        assertTrue(alertMessages[0].includes("newer version"));

        teardownMocks();
    });

    test('checkFileVersionWarning does not show alert if file version is older or equal', () => {
        setupMocks();

        window.APP_VERSION = "78";
        window.checkFileVersionWarning({ meta: { appVersion: "77" } });
        assertEqual(alertMessages.length, 0);

        window.checkFileVersionWarning({ meta: { appVersion: "78" } });
        assertEqual(alertMessages.length, 0);

        teardownMocks();
    });

    test('initApp loads embedded state if present', async () => {
        setupMocks();

        const embeddedData = { meta: { appVersion: "78" }, plans: [] };
        const mockEl = createMockElement('embedded-state', JSON.stringify(embeddedData));

        // Save initial state and reset
        const originalIsShareableMode = window.isShareableMode;
        window.isShareableMode = false;

        // Mock document.getElementById to ensure initApp finds our dynamically created element
        const safeGetElementById = originalGetElementById || document.getElementById;
        document.getElementById = function(id) {
            if (id === 'embedded-state') {
                return mockEl;
            }
            return safeGetElementById.call(document, id);
        };

        // Call window.initApp directly since it is globally bound by test orchestrator
        await window.initApp();

        assertTrue(window.isShareableMode === true, 'window.isShareableMode should be true');
        assertTrue(document.body.classList.contains('shareable-mode'));
        assertTrue(window.PlannerState instanceof MockPlanner);

        // Restore
        document.getElementById = safeGetElementById;
        window.isShareableMode = originalIsShareableMode;
        cleanupMockElement('embedded-state');
        document.body.classList.remove('shareable-mode');
        teardownMocks();
    });

    test('initApp updates version display if element exists', async () => {
        setupMocks();

        const mockEl = createMockElement('appVersionDisplay');

        // Re-mock document.getElementById safely
        const safeGetElementById = originalGetElementById || document.getElementById;
        document.getElementById = function(id) {
            if (id === 'appVersionDisplay') {
                return mockEl;
            }
            // Add check for embedded state to avoid null errors when evaluating
            if (id === 'embedded-state') {
                return null;
            }
            return safeGetElementById.call(document, id);
        };

        await window.initApp();

        assertTrue(mockEl.textContent.includes('Version'));

        document.getElementById = safeGetElementById;
        cleanupMockElement('appVersionDisplay');
        teardownMocks();
    });
});