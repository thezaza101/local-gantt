/**
 * Test Registry
 *
 * This file tracks the current testing coverage of the application.
 * Developers should update this registry whenever adding new tests.
 *
 * HOW TO UPDATE:
 * 1. Find the file you are testing in the `files` object below.
 * 2. If the file is not there, add it.
 * 3. Update `tested: true` if the file has at least some coverage.
 * 4. List the functions/classes inside the file, and set to `true` if covered, `false` otherwise.
 * 5. Add any notes about missing edge cases or TODOs.
 */

const TEST_REGISTRY = {
    "planner.js": {
        tested: true,
        notes: "Basic tests added for instantiation and adding tasks. Added coverage for core row and plan manipulation.",
        functions: {
            "Planner constructor": true,
            "addPlan": true,
            "addTask": true,
            "getTaskById": true,
            "calculateTotalEffort": true,
            "deleteTask": true,
            "moveTaskToRow": false,
            "saveTask": false,
            "updateTask": true,
            "duplicateTask": true,
            "insertRowBefore": true,
            "deleteRow": true,
            "addEntity": true,
            "getEntityById": true,
            "updateEntity": true,
            "deleteEntity": true,
            "calculatePlanDiff": true,
            "applyPlanMerge": true,
            "setLastCheckedOfMarkedTasks": true
        }
    },
    "storage.js": {
        tested: true,
        notes: "validateFile is covered. File operations require mocking to test fully.",
        functions: {
            "validateFile": true,
            "exportPlanFile": false,
            "exportSinglePlanFile": false,
            "importPlanFile": false
        }
    },
        "graph.js": {
        tested: true,
        notes: "Added tests for initialization and data traversal (init, open, getEntity, getConnectedIds, buildGraph). Visual rendering and physics (draw, updatePhysics) remain untested as they require extensive canvas mocking.",
        functions: {
            "init": true,
            "open": true,
            "getEntity": true,
            "getConnectedIds": true,
            "buildGraph": true,
            "startSimulation": false,
            "stopSimulation": false,
            "tick": false,
            "updatePhysics": false,
            "draw": false,
            "drawNode": false,
            "setupCanvasInteractions": false,
            "downloadImage": false
        }
    },
    "app.js": {
        tested: true,
        notes: "Added tests for checkFileVersionWarning and initApp. DOM and global engine classes were mocked dynamically.",
        functions: {
            "initApp": true,
            "checkFileVersionWarning": true
        }
    },
    "ui.js": {
        tested: true,
        notes: "Added tests for escapeHtml, exportLegendImage, and renderTagFilters. Note: updateTheme is no longer present in ui.js.",
        functions: {
            "escapeHtml": true,
            "updateTheme": false,
            "renderTagFilters": true,
            "exportLegendImage": true
        }
    },
    "utils (misc)": {
        tested: true,
        notes: "General examples for string manipulation and date comparison added.",
        functions: {}
    },
    "gantt.js": {
        tested: true,
        notes: "DOM interactions were mocked dynamically.",
        functions: {
            "Gantt constructor": true,
            "getSafeDate": true,
            "render": true,
            "generateTasksHtml": true,
            "getMixedColor": true,
            "generateDependencyArrows": true,
            "bindTaskEvents": true,
            "repeatString": true,
            "generateGridLines": true,
            "bindBackgroundEvents": true,
            "bindRowEvents": true,
            "escapeHtml": true
        }
    },
    "raida.js": {
        tested: true,
        notes: "Raida constructor and render function are tested. DOM interactions and planner were mocked.",
        functions: {
            "Raida constructor": true,
            "render": true
        }
    },
    "tracker.js": {
        tested: true,
        notes: "DOM and planner interactions mocked to test Tracker functionality.",
        functions: {
            "Tracker constructor": true,
            "escapeHtml": true,
            "getCellValue": true,
            "parseCsv": true,
            "processImportedCsv": true,
            "renderTable": true,
            "openEditModal": true,
            "saveItem": true,
            "deleteItem": true,
            "updateLastChecked": true,
            "autoCreateProperDependencies": true
        }
    }
};

// If loaded in a browser context for reporting purposes, attach to window.
if (typeof window !== 'undefined') {
    window.TEST_REGISTRY = TEST_REGISTRY;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TEST_REGISTRY;
}
