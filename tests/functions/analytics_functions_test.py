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

def test_calculate_tag_aggregates(page: Page, base_url: str):
    """Verifies that calculateTagAggregates properly aggregates dates and preserves full plan duration."""
    load_app(page, base_url)
    inject_mock_state(page)

    test_data = {
        "tasks": [
            # A task completely outside the filtered tasks to define overall boundaries
            {"id": "T1", "startDate": "2024-01-01", "endDate": "2024-01-10", "tags": ["other"], "status": "Completed"},
            # Tasks within the filter that only span a subset of time
            {"id": "T2", "startDate": "2024-01-15", "endDate": "2024-01-20", "tags": ["frontend"], "status": "In progress"},
            {"id": "T3", "startDate": "2024-01-18", "endDate": "2024-01-25", "tags": ["frontend", "backend"], "status": "Not started"}
        ]
    }

    # We pretend the user has filtered only for "frontend" tags.
    filtered_tasks = [t for t in test_data["tasks"] if "frontend" in t["tags"]]

    result = page.evaluate("""([plan, filtered]) => {
        // Mock a filter state so it doesn't crash when checking this.filterState
        window.AnalyticsEngine.filterState = {};
        return window.AnalyticsEngine.calculateTagAggregates(plan, filtered);
    }""", [test_data, filtered_tasks])

    # Check overall dates encompass ALL valid tasks (T1, T2, T3) -> 2024-01-01 to 2024-01-25
    min_date = result.get("minDate")
    max_date = result.get("maxDate")

    assert min_date is not None, "minDate should not be null"
    assert "2024-01-01" in str(min_date)
    assert max_date is not None, "maxDate should not be null"
    assert "2024-01-25" in str(max_date)

    # Check tags aggregation
    tags = result.get("tags", [])

    assert len(tags) == 2  # frontend, backend (from the filtered tasks)

    frontend_tag = next(t for t in tags if t["tag"] == "frontend")
    assert frontend_tag["totalTasks"] == 2
    assert "2024-01-15" in str(frontend_tag["minStartDate"])
    assert "2024-01-25" in str(frontend_tag["maxEndDate"])
