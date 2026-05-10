# Playwright Functional Testing

This project uses **Python Playwright** with `pytest` to perform functional, E2E, and browser-based unit testing. This framework is designed for gradual adoption, allowing us to build test coverage module-by-module.

## Architecture

- **`tests/workflows/`**: End-to-end user flows (e.g., adding plans, navigating dashboard).
- **`tests/functions/`**: Tests that validate internal JavaScript logic (`planner.js`, `ui.js`) by evaluating them inside the browser context using `page.evaluate()`.
- **`tests/helpers/`**: Reusable modules for mocking state, UI interaction, and test data.
- **`tests/registry/`**: JSON/Python mappings tracking which files, functions, and workflows are currently covered by tests.
- **`tests/generated/`**: Contains auto-generated `TODO` stubs for untested JavaScript functions.

## Setup & Running Tests

1. Install dependencies:
   ```bash
   pip install -r requirements-test.txt
   playwright install chromium firefox
   ```

2. Run tests headlessly:
   ```bash
   pytest
   ```

3. Run with browser visible (headed mode) and slow down execution:
   ```bash
   pytest --headed --slowmo 500
   ```

4. View test reports:
   A comprehensive report is generated automatically at `report.html`. Traces and screenshots are saved automatically on failure.

## Generating Test Stubs

As new code is added, you can automatically generate test stubs for untested functions. The generator script scans JS files against the `function_registry.py` to identify missing tests.

```bash
python scripts/generate_tests.py
```
This will output placeholder test methods in `tests/generated/TODO_generated_tests.py`.

## Best Practices

- **Mocking State:** Use `inject_mock_state(page)` from `tests.helpers.mock_helpers` to skip UI setup steps (like clicking "Import") and directly seed the application state for targeted testing.
- **Isolation:** Tests should not bleed state. The `clean_local_storage` fixture in `conftest.py` ensures `localStorage` is wiped after every test.
- **Locators:** Use user-facing attributes where possible or specific `#ids`.
- **Waiting:** Prefer Playwright's auto-waiting locators over hardcoded `time.sleep()`. Use `page.wait_for_load_state("networkidle")` when navigating.

## Future Roadmap
- Setup CI/CD integration for Playwright via GitHub Actions.
- Enhance the parser in `generate_tests.py` using a real AST parser rather than Regex for JS function discovery.
