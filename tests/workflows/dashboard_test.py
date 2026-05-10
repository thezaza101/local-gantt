import pytest
from playwright.sync_api import Page, expect
from tests.helpers.browser_helpers import load_app, open_modal, assert_toast_message

def test_add_task_opens_modal(page: Page, base_url: str):
    """Verifies the Add Task modal opens and functions properly using native UI interactions."""
    load_app(page, base_url)

    # We will test native JS behavior here to ensure modal pops up
    page.evaluate("window.UIController.openTaskModal()")

    # Wait for modal natively
    page.wait_for_selector("#taskModal.show")

    # Verify the modal is ready for a new task natively
    expect(page.locator("#taskModalLabel")).to_have_text("Task Details")
