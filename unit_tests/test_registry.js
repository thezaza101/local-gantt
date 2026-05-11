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
        notes: "Basic tests added for instantiation and adding tasks. Needs edge cases.",
        functions: {
            "Planner constructor": true,
            "addPlan": true,
            "addTask": true,
            "getTaskById": true,
            "calculateTotalEffort": true,
            "deleteTask": false,
            "moveTaskToRow": false,
            "saveTask": false,
            "calculatePlanDiff": false,
            "applyPlanMerge": false
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
    "app.js": {
        tested: true,
        notes: "Added tests for checkFileVersionWarning and initApp. DOM and global engine classes were mocked dynamically.",
        functions: {
            "initApp": true,
            "checkFileVersionWarning": true
        }
    },
    "ui.js": {
        tested: false,
        notes: "Currently 0% coverage. Should test purely logical helper methods first.",
        functions: {
            "escapeHtml": false,
            "updateTheme": false,
            "renderTagFilters": false,
            "exportLegendImage": false
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
    }
};

// If loaded in a browser context for reporting purposes, attach to window.
if (typeof window !== 'undefined') {
    window.TEST_REGISTRY = TEST_REGISTRY;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = TEST_REGISTRY;
}
