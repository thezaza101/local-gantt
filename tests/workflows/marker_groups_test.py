import pytest
from playwright.sync_api import Page, expect

def test_marker_groups_workflow(page: Page, base_url: str):
    page.goto(base_url)

    # Wait for app to initialize
    page.wait_for_function('typeof window.PlannerState !== "undefined"')
    page.wait_for_function('typeof window.UIController !== "undefined"')

    # Need to inject at least one plan to open marker management
    page.evaluate('''() => {
        window.PlannerState.addPlan('Test Plan');
        window.UIController.updateUI();
    }''')

    # Open Marker Management Modal
    page.evaluate('window.UIController.openMarkerManagementModal()')

    # Check tabs are rendered (Default exists)
    expect(page.locator("#markerGroupTabs")).to_contain_text("Default Plan Markers")
    expect(page.locator("#markerGroupTabs")).to_contain_text("+ Add Group")

    # Click Add Group
    page.once("dialog", lambda dialog: dialog.accept("My Custom Group"))
    page.locator("button:has-text('+ Add Group')").click()

    # Check new group is active
    expect(page.locator("#markerGroupTabs .active")).to_contain_text("My Custom Group")

    # Settings should be visible for custom group
    expect(page.locator("#markerGroupSettings")).to_be_visible()

    # Create a marker in this group
    page.locator("#addNewMarkerBtn").click()
    page.locator("#markerLabel").fill("Group Marker 1")
    page.locator("#saveMarkerBtn").click()

    # Check marker is in table
    expect(page.locator("#markerTableBody")).to_contain_text("Group Marker 1")

    # Change back to default
    page.locator("button:has-text('Default Plan Markers')").click()

    # Marker should not be in table
    expect(page.locator("#markerTableBody")).not_to_contain_text("Group Marker 1")

    # Check if delete works
    page.locator("button:has-text('My Custom Group')").click()
    page.once("dialog", lambda dialog: dialog.accept())
    page.locator("#deleteMarkerGroupBtn").click()

    # Should revert to default tab
    expect(page.locator("#markerGroupTabs .active")).to_contain_text("Default Plan Markers")
    expect(page.locator("#markerGroupTabs")).not_to_contain_text("My Custom Group")
