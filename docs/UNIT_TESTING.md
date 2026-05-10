# Unit Testing

This project includes a lightweight, custom, and dependency-free vanilla JavaScript unit testing framework. This allows us to write and execute tests directly in the browser without relying on external packages, keeping with the project's zero-dependency philosophy.

## Architecture

The testing framework consists of the following components:

1. **`unit_test.html`**: The browser-based test runner UI. This page loads the application files, loads the test framework, and displays the execution results.
2. **`/unit_tests/main.js`**: The test orchestrator. It defines the testing API (`describe`, `test`, `assertEqual`, etc.) and handles running the tests and updating the UI.
3. **`/unit_tests/appjs/*.js`**: The actual test files. Each file typically corresponds to an application `.js` file and contains the test suites and cases.
4. **`/unit_tests/test_registry.js`**: A manual tracker used to record our test coverage progress across the codebase.

## Folder Structure

```text
/
├── unit_test.html          # Test UI
└── unit_tests/
    ├── main.js             # Test runner and API
    ├── test_registry.js    # Coverage tracking
    └── appjs/              # Test suites
        ├── test_planner.js
        ├── test_storage.js
        └── test_utils.js
```

## How the Test Runner Works

1. You open `unit_test.html` in your browser.
2. The HTML file includes all the core application scripts (`planner.js`, `storage.js`, etc.) using standard `<script>` tags, making them available globally.
3. It then loads `/unit_tests/main.js`.
4. `main.js` sequentially loads the test files defined in its `TEST_FILES` array.
5. As test files are evaluated, they call `describe` and `test` to register test cases.
6. The orchestrator executes each test, catching errors and recording passes/fails.
7. The results are dynamically rendered to the DOM in `unit_test.html`.

## How to Run Tests

1. Start a local web server in the project root directory. For example:
   ```bash
   python3 -m http.server 8000
   ```
2. Navigate your browser to `http://localhost:8000/unit_test.html`.
3. The tests will automatically execute and display the results on the page.

## How to Add New Tests

1. **Create a Test File:** Create a new file in `/unit_tests/appjs/`, naming it according to the file you are testing (e.g., `test_ui.js`).
2. **Register the File:** Open `/unit_tests/main.js` and add the path to your new file into the `TEST_FILES` array.
   ```javascript
   const TEST_FILES = [
       'unit_tests/appjs/test_utils.js',
       'unit_tests/appjs/test_planner.js',
       'unit_tests/appjs/test_storage.js',
       'unit_tests/appjs/test_ui.js' // Your new file
   ];
   ```
3. **Write Tests:** Use the provided API to write your tests.

### Example Test File

```javascript
describe('UI Helpers (ui.js)', () => {

    test('escapeHtml correctly sanitizes input', () => {
        const input = '<script>alert("xss")</script>';
        const result = escapeHtml(input);

        assertEqual(result, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('updateTheme correctly sets attributes', () => {
        // Example of a test
        assertTrue(true);
    });

    test.skip('Skipped test example', () => {
        // Use test.skip to ignore tests temporarily
    });

    test('Async tests are supported', async () => {
        const data = await someAsyncFunction();
        assertEqual(data.status, 'ok');
    });

});
```

### Available API Methods

* `describe(name, fn)`: Groups related tests together.
* `test(name, fn)`: Defines a test case. Can be `async`.
* `test.skip(name, fn)`: Skips the execution of a test case.
* `assertEqual(actual, expected)`
* `assertDeepEqual(actual, expected)`
* `assertTrue(value)`
* `assertFalse(value)`
* `assertThrows(fn)`

## How to Register Tested Functions

We manually track coverage in `unit_tests/test_registry.js`.

Whenever you add a new test or test a new file:
1. Open `unit_tests/test_registry.js`.
2. Find the object for the file you modified, or add a new key if it doesn't exist.
3. Update `tested: true`.
4. Add the function names you wrote tests for under the `functions` object and set them to `true`.
5. Add any notes, such as pending edge cases.

Example:
```javascript
"ui.js": {
    tested: true,
    notes: "Added tests for escapeHtml. Need to test DOM interactions next.",
    functions: {
        "escapeHtml": true,
        "updateTheme": false
    }
}
```

## Naming Conventions

* Test files should be named `test_<filename>.js` (e.g., `test_planner.js` for `planner.js`).
* `describe` blocks should mention the component or file being tested.
* `test` case names should clearly state the expected behavior (e.g., `'escapeHtml correctly sanitizes input'`).

## Future Improvements

* Add a CLI runner using Node.js to execute tests in the terminal without a browser.
* Implement a mock module to handle DOM elements and local storage in tests.
* Automatically parse the `test_registry.js` and display coverage data on `unit_test.html`.
