/**
 * Lightweight JavaScript Unit Testing Framework
 *
 * This orchestrator provides a simple API for defining and running tests
 * in the browser, and renders the results to the DOM.
 */

// --- Framework State ---
const TestRunner = {
    suites: [],
    currentSuite: null,
    stats: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
    }
};

// --- Testing API ---

/**
 * Define a new test suite (usually corresponds to a file or module)
 */
function describe(name, fn) {
    const suite = {
        name,
        tests: [],
        passed: 0,
        failed: 0
    };
    TestRunner.suites.push(suite);
    TestRunner.currentSuite = suite;

    try {
        fn();
    } catch (e) {
        console.error(`Error in describe block '${name}':`, e);
    }

    TestRunner.currentSuite = null;
}

/**
 * Define a test case within a suite
 */
function test(name, fn) {
    if (!TestRunner.currentSuite) {
        // Create a default suite if test is called outside describe
        describe('Default Suite', () => test(name, fn));
        return;
    }

    TestRunner.currentSuite.tests.push({
        name,
        fn,
        status: 'pending',
        error: null
    });
}

/**
 * Skip a test
 */
test.skip = function(name, fn) {
    if (!TestRunner.currentSuite) return;
    TestRunner.currentSuite.tests.push({
        name,
        fn,
        status: 'skipped',
        error: null
    });
}

// --- Assertion API ---

function assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
        const msg = message ? `${message} - ` : '';
        throw new Error(`${msg}Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
    }
}

function assertDeepEqual(actual, expected, message = '') {
    const actStr = JSON.stringify(actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) {
        const msg = message ? `${message} - ` : '';
        throw new Error(`${msg}Expected ${expStr} but got ${actStr}`);
    }
}

function assertTrue(value, message = '') {
    if (value !== true) {
        const msg = message ? `${message} - ` : '';
        throw new Error(`${msg}Expected true but got ${value}`);
    }
}

function assertFalse(value, message = '') {
    if (value !== false) {
        const msg = message ? `${message} - ` : '';
        throw new Error(`${msg}Expected false but got ${value}`);
    }
}

function assertThrows(fn, message = '') {
    try {
        fn();
    } catch (e) {
        return; // Success, it threw
    }
    throw new Error(message || 'Expected function to throw an error, but it did not.');
}

// --- Execution & Rendering ---

async function runTests() {
    const resultsContainer = document.getElementById('test-results');
    resultsContainer.innerHTML = '';

    for (const suite of TestRunner.suites) {
        const suiteEl = document.createElement('div');
        suiteEl.className = 'test-suite';

        let suiteHtml = `
            <div class="suite-header">
                <span>${suite.name}</span>
                <span id="suite-status-${TestRunner.suites.indexOf(suite)}">Running...</span>
            </div>
            <div class="suite-body" id="suite-body-${TestRunner.suites.indexOf(suite)}"></div>
        `;
        suiteEl.innerHTML = suiteHtml;
        resultsContainer.appendChild(suiteEl);

        const bodyEl = document.getElementById(`suite-body-${TestRunner.suites.indexOf(suite)}`);

        for (const t of suite.tests) {
            TestRunner.stats.total++;

            if (t.status === 'skipped') {
                TestRunner.stats.skipped++;
                renderTestResult(bodyEl, t.name, 'SKIP', null);
                continue;
            }

            try {
                // Support async tests
                const result = t.fn();
                if (result instanceof Promise) {
                    await result;
                }
                t.status = 'passed';
                suite.passed++;
                TestRunner.stats.passed++;
                renderTestResult(bodyEl, t.name, 'PASS', null);
            } catch (e) {
                t.status = 'failed';
                t.error = e;
                suite.failed++;
                TestRunner.stats.failed++;
                renderTestResult(bodyEl, t.name, 'FAIL', e);
            }
        }

        // Update suite header status
        const statusEl = document.getElementById(`suite-status-${TestRunner.suites.indexOf(suite)}`);
        if (suite.failed > 0) {
            statusEl.innerHTML = `<span class="status-fail">✖ ${suite.failed} failed</span>, ${suite.passed} passed`;
        } else {
            statusEl.innerHTML = `<span class="status-pass">✔ All ${suite.passed} passed</span>`;
        }
    }

    updateSummary();
}

function renderTestResult(container, name, status, error) {
    const el = document.createElement('div');
    el.className = 'test-case';

    let statusClass = '';
    let statusIcon = '';

    if (status === 'PASS') {
        statusClass = 'status-pass';
        statusIcon = '✔';
    } else if (status === 'FAIL') {
        statusClass = 'status-fail';
        statusIcon = '✖';
    } else if (status === 'SKIP') {
        statusClass = 'status-skip';
        statusIcon = '—';
    }

    let html = `
        <div>
            <strong>${name}</strong>
            ${error ? `<div class="error-message">${error.stack || error.message || error}</div>` : ''}
        </div>
        <div class="${statusClass}">${statusIcon} ${status}</div>
    `;

    el.innerHTML = html;
    container.appendChild(el);
}

function updateSummary() {
    document.getElementById('test-summary').style.display = 'flex';
    document.getElementById('summary-total').textContent = TestRunner.stats.total;
    document.getElementById('summary-passed').textContent = TestRunner.stats.passed;
    document.getElementById('summary-failed').textContent = TestRunner.stats.failed;
    document.getElementById('summary-skipped').textContent = TestRunner.stats.skipped;
}

// --- Dynamic Loader ---

/**
 * Loads test scripts sequentially to maintain order and wait for completion
 */
async function loadTestFiles(files) {
    for (const file of files) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = file;
            script.onload = resolve;
            script.onerror = () => {
                console.error(`Failed to load test file: ${file}`);
                // Instead of failing the whole suite, record a mock failure
                describe(`Load Error: ${file}`, () => {
                    test('File loads successfully', () => {
                        throw new Error(`Script ${file} failed to load.`);
                    });
                });
                resolve(); // Continue with other files
            };
            document.body.appendChild(script);
        });
    }
}

// --- Initialization ---

// Define the list of test files here.
// In a pure browser environment without a backend, we cannot dynamically read directories.
const TEST_FILES = [
    'unit_tests/appjs/test_utils.js',
    'unit_tests/appjs/test_planner.js',
    'unit_tests/appjs/test_storage.js',
    'unit_tests/appjs/test_app.js',
    'unit_tests/appjs/test_graph.js'
];

window.onload = async () => {
    // 1. Load all test files
    await loadTestFiles(TEST_FILES);

    // 2. Run the tests
    await runTests();
};
