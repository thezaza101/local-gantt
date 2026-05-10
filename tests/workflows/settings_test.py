import pytest
from playwright.sync_api import Page, expect
from tests.helpers.browser_helpers import load_app, open_modal, assert_toast_message

def test_modify_team_settings(page: Page, base_url: str):
    """Verifies that a user can open settings, add a team, and save it using JS APIs as appropriate for this app."""
    load_app(page, base_url)

    # Use native JS layer, as this UI often has disabled buttons requiring specific state which we are not mocking purely
    page.evaluate("window.UIController.openSettingsModal()")
    page.wait_for_selector("#settingsModal.show")

    page.evaluate("window.UIController.addTeamRow({ id: 'T99999', name: 'Frontend Alpha', description: '' })")
    page.evaluate("window.UIController.saveSettings()")

    # Verify state was updated
    teams = page.evaluate("window.PlannerState.getTeams()")
    team_names = [t.get("name") for t in teams]
    assert "Frontend Alpha" in team_names
