import pytest
from playwright.sync_api import Page
from tests.helpers.browser_helpers import load_app
from tests.helpers.mock_helpers import inject_mock_state

def test_calculate_effort_by_tag(page: Page, base_url: str):
    """Verifies that calculateEffortByTag properly aggregates tag effort."""
    load_app(page, base_url)
    inject_mock_state(page)

    # We mock a small dataset directly to test the calculation logic
    test_data = {
        "tasks": [
            {"id": "T1", "effort": {"design": 5, "dev": 10, "test": 5}, "tags": ["frontend"]},
            {"id": "T2", "effort": {"design": 0, "dev": 5, "test": 5}, "tags": ["frontend", "backend"]},
            {"id": "T3", "effort": {"design": 2, "dev": 2, "test": 2}, "tags": ["backend", "database"]}
        ]
    }

    result = page.evaluate("""(data) => {
        return window.AnalyticsEngine.calculateEffortByTag(data, data.tasks);
    }""", test_data)

    # Expected output:
    # frontend: 20 (T1) + 10 (T2) = 30
    # backend: 10 (T2) + 6 (T3) = 16
    # database: 6 (T3)

    assert "labels" in result
    assert "values" in result

    # Check that labels and values match the expected order (sorted descending by value)
    assert result["labels"] == ["frontend", "backend", "database"]
    assert result["values"] == [30, 16, 6]


def test_calculate_task_count_by_status(page: Page, base_url: str):
    """Verifies that calculateTaskCountByStatus aggregates task count correctly."""
    load_app(page, base_url)
    inject_mock_state(page)

    test_data = {
        "tasks": [
            {"id": "T1", "status": "in-progress"},
            {"id": "T2", "status": "in-progress"},
            {"id": "T3", "status": "completed"},
            {"id": "T4", "status": "not-started"}
        ]
    }

    result = page.evaluate("""(data) => {
        return window.AnalyticsEngine.calculateTaskCountByStatus(data, data.tasks);
    }""", test_data)

    assert "labels" in result
    assert "values" in result

    # Assuming statuses might be sorted or kept in natural order depending on logic,
    # let's just check the key/value pairs. Analytics groups counts by status name.
    # We will build a map from the result to easily assert.
    result_map = dict(zip(result["labels"], result["values"]))

    assert result_map.get("in-progress") == 2
    assert result_map.get("completed") == 1
    assert result_map.get("not-started") == 1
