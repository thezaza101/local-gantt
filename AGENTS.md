# Agent Instructions & Feature Checklist

This document serves as a guide for AI agents working on this project. When developing or adding a new feature, you must complete the following checklist to ensure the project remains consistent, tested, and well-documented.

## Feature Checklist

Whenever you add or modify a feature, ensure the following steps are addressed:

1. **Update Documentation (`docs/`)**
   - Update `docs/features.md` to describe the new functionality, its data model, and user interactions.
   - If the architecture or data model changes, update `docs/architecture_component_breakdown.md` and `docs/requirements.md` if applicable.

2. **Update the Help Modal (`index.html`)**
   - Locate the `#helpModal` in `index.html`.
   - Add or update the corresponding glossary and help text so that end-users understand how to use the new feature.

3. **Update Vanilla JS Unit Tests (`unit_tests/`)**
   - Write or update unit tests in the `unit_tests/appjs/` directory for any new internal JavaScript logic (e.g., `planner.js`, `storage.js`, `ui.js`, `tracker.js`, etc.).
   - If creating a new test file, ensure it is added to the `TEST_FILES` array in `unit_tests/main.js`.
   - Update `unit_tests/test_registry.js` to track coverage. Set `tested: true` for the respective module and map the newly covered functions to `true`.
   - *Note:* The project uses a custom, zero-dependency unit testing framework. Do not introduce external libraries for frontend unit tests.

4. **Update Playwright E2E Tests (`tests/`)**
   - Add or update Playwright workflow tests in the `tests/` directory (e.g., `tests/workflows/`) for UI and end-to-end user interactions.
   - After creating or updating tests, you **must** update the test coverage registry in `tests/registry/workflow_registry.py` (e.g., setting `"tested": True` and mapping the `"test_file"` to your new test file).

5. **Run the Test Suite**
   - Run Python Playwright tests directly via `python3 -m pytest tests/`. (Ensure dependencies are installed via `pip install -r requirements-test.txt` first).
   - Ensure you do not leave any temporary logs (`server.log`, `__pycache__`) or build artifacts (`single.html`) in the working tree.

## Coding Conventions & Guidelines

* **Zero-Dependency Philosophy:** The frontend browser code must remain standalone. Do not add `package.json` or try to install npm modules.
* **ID Formatting:** When generating new IDs for entities, use a prefix letter (e.g., 'T' for teams, 'P' for personnel, 'R' for Risks, 'I' for Issues) followed by a 5-digit number (e.g., `T00001`).
* **Timestamps:** Timestamps in the data model (like `lastUpdated` and `lastChecked`) should use the `YYYY-MM-DD HH:mm:ss` format. This formatting is centrally managed via `getNowTimestamp()` in `planner.js`.
* **UI/Visibility:** For full-screen overlay panels (like Analytics and Tracker), manage default visibility using inline `style="display: none;"` rather than Bootstrap's `d-none` class. This prevents visual layout bugs caused by conflicts with custom CSS.
* **Test Isolation:** When writing custom vanilla JS unit tests, dynamically create, append, and clean up mock DOM elements within each test. Explicitly mock or clear global dependencies (e.g. `window.PlannerState`) and `localStorage` between tests to ensure strict test isolation. Use `try...finally` blocks to guarantee cleanup.
