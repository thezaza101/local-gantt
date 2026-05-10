import pytest
from playwright.sync_api import Page, expect
from tests.helpers.browser_helpers import load_app

def test_planner_get_now_timestamp(page: Page, base_url: str):
    """Verifies the getNowTimestamp function format in the browser context."""
    load_app(page, base_url)

    # Execute the function in the browser
    timestamp = page.evaluate("window.PlannerState.getNowTimestamp()")

    # Expected format: YYYY-MM-DD HH:mm:ss
    import re
    assert re.match(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$", timestamp)

def test_planner_generate_entity_id(page: Page, base_url: str):
    """Verifies ID generation rules according to the coding conventions."""
    load_app(page, base_url)

    # Prefix R should yield RXXXXX
    new_id = page.evaluate("window.PlannerState.generateEntityId('R', window.PlannerState.getRisks())")

    assert new_id.startswith("R")
    assert len(new_id) == 6  # Prefix + 5 digits
    assert new_id[1:].isdigit()
