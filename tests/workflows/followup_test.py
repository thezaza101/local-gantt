import pytest
from playwright.sync_api import Page, expect
from tests.helpers.browser_helpers import load_app

def test_followup_dashboard_workflow(page: Page, base_url: str):
    """Verifies that items with follow-up dates appear in the RAIDA dashboard."""
    load_app(page, base_url)

    # Add a risk with a follow-up date for today
    page.locator("#openTrackerBtn").click()
    tracker_container = page.locator("#trackerContainer")
    expect(tracker_container).to_be_visible()

    page.locator("#addRiskBtn").click()
    tracker_modal = page.locator("#trackerEditModal")
    expect(tracker_modal).to_be_visible()

    page.locator("#trackerItemTitle").fill("Risk for Follow-up")

    # Get today's date in YYYY-MM-DD
    today = page.evaluate("new Date().toISOString().split('T')[0]")
    page.locator("#trackerItemFollowUpDate").fill(today)
    page.locator("#trackerItemNotes").fill("Follow up notes testing")

    page.locator("#saveTrackerItemBtn").click()
    expect(tracker_modal).not_to_be_visible()

    # Close tracker and open RAIDA
    page.locator("#openTrackerBtn").click() # toggles it off
    page.locator("#openRaidaBtn").click()

    raida_container = page.locator("#raidaContainer")
    expect(raida_container).to_be_visible()

    # Check that "Follow up reminders" section exists and has the risk
    follow_up_section = raida_container.locator("h6", has_text="Follow up reminders").locator("..") # card-header

    # Wait for the collapse to populate. We know the badge should > 0
    expect(follow_up_section.locator(".badge.bg-danger")).to_be_visible()

    # The actual list is the next sibling of the card-header
    list_container = follow_up_section.locator("~ .collapse")

    # We should see the item in the list
    expect(list_container.locator("li", has_text="Risk for Follow-up")).to_be_visible()
    expect(list_container.locator("li", has_text="Follow up notes testing")).to_be_visible()
