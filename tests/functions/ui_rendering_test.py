import pytest
from playwright.sync_api import Page, expect
from tests.helpers.browser_helpers import load_app
from tests.helpers.mock_helpers import inject_mock_state
import json

def test_render_task_list_table(page: Page, base_url: str):
    """Verifies that renderTaskListTable correctly updates #taskListTableBody."""
    load_app(page, base_url)
    inject_mock_state(page)

    # By default, SAMPLE_PLAN has one task 'T1'
    # Evaluate UIController to render task list
    page.evaluate("window.UIController.renderTaskListTable('')")

    # Check that T1 is rendered
    tbody = page.locator("#taskListTableBody")
    expect(tbody).to_contain_text("T1")
    expect(tbody).to_contain_text("Sample Task")

    # Test filtering functionality
    page.evaluate("window.UIController.renderTaskListTable('nomatch')")
    expect(tbody).to_contain_text("No tasks found.")

def test_render_marker_table(page: Page, base_url: str):
    """Verifies that renderMarkerTable correctly updates #markerTableBody."""
    load_app(page, base_url)

    # Inject state with a marker
    custom_state = {
        "meta": {"fileVersion": 1, "history": []},
        "settings": {"teams": [], "personnel": [], "tagGroups": []},
        "plans": [{
            "id": "Plan-1", "name": "Plan", "isActive": True,
            "startDate": "2024-01-01", "endDate": "2024-01-31",
            "tasks": [],
            "markers": [{"id": "m1", "label": "Release", "type": "vertical", "date": "2024-01-15", "color": "#ff0000", "importance": "major", "visible": True}]
        }]
    }
    inject_mock_state(page, json.dumps(custom_state))

    page.evaluate("window.UIController.renderMarkerTable()")

    tbody = page.locator("#markerTableBody")
    expect(tbody).to_contain_text("Release")
    expect(tbody).to_contain_text("2024-01-15")

def test_render_history(page: Page, base_url: str):
    """Verifies that renderHistory correctly updates #historyListContainer."""
    load_app(page, base_url)

    # Inject state with history
    custom_state = {
        "meta": {"fileVersion": 1, "history": [{"timestamp": "2024-01-01T12:00:00Z", "comment": "Initial version"}]},
        "settings": {"teams": [], "personnel": [], "tagGroups": []},
        "plans": [{"id": "Plan-1", "name": "Plan", "isActive": True, "tasks": [], "markers": []}]
    }
    inject_mock_state(page, json.dumps(custom_state))

    page.evaluate("window.UIController.renderHistory()")

    container = page.locator("#historyListContainer")
    expect(container).to_contain_text("Initial version")

def test_render_tag_filters(page: Page, base_url: str):
    """Verifies that renderTagFilters correctly populates #tagFiltersContainer."""
    load_app(page, base_url)

    custom_state = {
        "meta": {"fileVersion": 1, "history": []},
        "settings": {"teams": [{"id": "T001", "name": "Team Alpha"}], "personnel": [], "tagGroups": []},
        "plans": [{
            "id": "Plan-1", "name": "Plan", "isActive": True,
            "tasks": [
                {"id": "T1", "tags": ["frontend"]},
                {"id": "T2", "tags": ["backend"]}
            ],
            "markers": []
        }]
    }
    inject_mock_state(page, json.dumps(custom_state))

    # Call renderTagFilters
    page.evaluate("window.UIController.renderTagFilters()")

    container = page.locator("#tagFiltersContainer")
    # Should show frontend and backend as labels
    expect(container).to_contain_text("frontend")
    expect(container).to_contain_text("backend")
    # Should show Team Alpha
    expect(container).to_contain_text("Team Alpha")
