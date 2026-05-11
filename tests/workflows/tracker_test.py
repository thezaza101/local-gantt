import re
import pytest
from playwright.sync_api import Page, expect
from tests.helpers.browser_helpers import load_app

def test_tracker_crud_workflow(page: Page, base_url: str):
    """Verifies adding, editing, and deleting a Risk in the Tracker view."""
    # 1. Load application
    load_app(page, base_url)

    # 2. Navigate to Tracker View
    page.locator("#openTrackerBtn").click()
    tracker_container = page.locator("#trackerContainer")
    expect(tracker_container).to_be_visible()

    # 3. Add Risk
    expect(page.locator("#risks-tab")).to_have_class(re.compile(r"\bactive\b"))
    page.locator("#addRiskBtn").click()

    tracker_modal = page.locator("#trackerEditModal")
    expect(tracker_modal).to_have_class(re.compile(r"\bshow\b"))
    expect(tracker_modal).to_be_visible()

    page.locator("#trackerItemTitle").fill("Test Risk Title")
    page.locator("#saveTrackerItemBtn").click()

    # Wait for modal to hide
    expect(tracker_modal).not_to_have_class(re.compile(r"\bshow\b"))

    # 4. Verify Addition
    risks_container = page.locator("#tracker-risks")
    added_row = risks_container.locator("tr", has_text="Test Risk Title")
    expect(added_row).to_be_visible()

    # 5. Edit Risk
    added_row.click()
    expect(tracker_modal).to_have_class(re.compile(r"\bshow\b"))
    expect(tracker_modal).to_be_visible()

    page.locator("#trackerItemTitle").fill("Updated Risk Title")
    page.locator("#saveTrackerItemBtn").click()

    # Wait for modal to hide
    expect(tracker_modal).not_to_have_class(re.compile(r"\bshow\b"))

    # Verify Edit
    edited_row = risks_container.locator("tr", has_text="Updated Risk Title")
    expect(edited_row).to_be_visible()
    expect(risks_container.locator("tr", has_text="Test Risk Title")).not_to_be_visible()

    # 6. Delete Risk
    edited_row.click()
    expect(tracker_modal).to_have_class(re.compile(r"\bshow\b"))
    expect(tracker_modal).to_be_visible()

    # Handle the native confirm dialog that pops up on delete
    page.once("dialog", lambda dialog: dialog.accept())
    page.locator("#deleteTrackerItemBtn").click()

    # Wait for modal to hide
    expect(tracker_modal).not_to_have_class(re.compile(r"\bshow\b"))

    # Verify Deletion
    expect(risks_container.locator("tr", has_text="Updated Risk Title")).not_to_be_visible()
