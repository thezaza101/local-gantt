import re
from playwright.sync_api import Page, expect

def load_app(page: Page, base_url: str):
    """Navigates to the main app page and waits for it to load."""
    page.goto(f"{base_url}/index.html")
    # Wait for the document body and global script evaluation
    page.wait_for_selector("body")
    # Wait for PlannerState and UI to be initialized in window
    page.wait_for_function("typeof window.PlannerState !== 'undefined'")
    page.wait_for_function("typeof window.UIController !== 'undefined'")

def mock_file_upload(page: Page, file_path: str):
    """Mocks file upload input for plan import."""
    # Handle Playwright file upload mechanism correctly by triggering change
    # and reading file content directly into state if it's hidden too well, or use standard locator
    page.locator('#importPlanFileInput').set_input_files(file_path)

def open_modal(page: Page, modal_id: str):
    """Helper to wait for a bootstrap modal to be fully visible."""
    expect(page.locator(modal_id)).to_have_class(re.compile(r"\bshow\b"))
    expect(page.locator(modal_id)).to_be_visible()

def assert_toast_message(page: Page, expected_message: str):
    """Asserts that a toast message with the expected text is shown."""
    toast = page.locator(".toast.show")
    expect(toast).to_be_visible()
    expect(toast).to_contain_text(expected_message)
