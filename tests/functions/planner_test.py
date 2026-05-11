import pytest
from playwright.sync_api import Page, expect
from tests.helpers.browser_helpers import load_app
from tests.helpers.mock_helpers import inject_mock_state
import json

def test_generate_entity_id(page: Page, base_url: str):
    """Verifies ID generation rules."""
    load_app(page, base_url)

    new_id = page.evaluate("window.PlannerState.generateEntityId('R')")

    assert new_id.startswith("R")
    assert len(new_id) == 6
    assert new_id[1:].isdigit()

def test_add_task(page: Page, base_url: str):
    """Verifies that a task can be added and checks constraints."""
    load_app(page, base_url)
    inject_mock_state(page)

    task_to_add = {
        "id": "T2",
        "title": "New Task",
        "startDate": "2024-01-05",
        "endDate": "2024-01-15",
        "status": "in-progress",
        "effort": 10,
        "row": 2,
        "tags": [],
        "dependencies": []
    }

    # Add task
    success = page.evaluate("(task) => window.PlannerState.addTask(task)", task_to_add)
    assert success is True

    # Verify task exists
    tasks = page.evaluate("window.PlannerState.getCurrentPlan().tasks")
    assert any(t["id"] == "T2" for t in tasks)

    # Attempt to add duplicate task ID
    duplicate_success = page.evaluate("(task) => window.PlannerState.addTask(task)", task_to_add)
    assert duplicate_success is False

def test_delete_task(page: Page, base_url: str):
    """Verifies that an existing task can be deleted."""
    load_app(page, base_url)
    inject_mock_state(page)

    # Delete task T1 (which exists in the sample mock state)
    success = page.evaluate("window.PlannerState.deleteTask('T1')")
    assert success is True

    # Verify task is deleted
    tasks = page.evaluate("window.PlannerState.getCurrentPlan().tasks")
    assert not any(t["id"] == "T1" for t in tasks)

    # Attempt to delete a non-existent task
    not_found_success = page.evaluate("window.PlannerState.deleteTask('NON_EXISTENT')")
    assert not_found_success is False

def test_apply_plan_merge(page: Page, base_url: str):
    """Verifies that applyPlanMerge merges new and modified tasks correctly."""
    load_app(page, base_url)
    inject_mock_state(page)

    diff_selection = {
        "capacity": False,
        "tasks": {
            "new": ["T2"],
            "modified": ["T1"],
            "deleted": []
        },
        "markers": {
            "new": [],
            "modified": [],
            "deleted": []
        }
    }
    imported_plan = {
        "id": "Plan-1",
        "name": "Imported Plan",
        "tasks": [
            {
                "id": "T1",
                "title": "Sample Task Modified",
                "startDate": "2024-01-01",
                "endDate": "2024-01-10",
                "status": "not-started",
                "effort": 999,  # This should be ignored
                "row": 1,
                "tags": ["frontend"],
                "dependencies": []
            },
            {
                "id": "T2",
                "title": "New Merged Task",
                "startDate": "2024-02-01",
                "endDate": "2024-02-05",
                "status": "not-started",
                "effort": 5,
                "row": 2,
                "tags": [],
                "dependencies": []
            }
        ]
    }

    ignored_fields = ["effort"]

    # Apply merge
    page.evaluate(
        "([diffSelection, importedPlan, ignoredFields]) => window.PlannerState.applyPlanMerge(diffSelection, importedPlan, ignoredFields)",
        [diff_selection, imported_plan, ignored_fields]
    )

    # Verify result
    tasks = page.evaluate("window.PlannerState.getCurrentPlan().tasks")

    t1 = next((t for t in tasks if t["id"] == "T1"), None)
    t2 = next((t for t in tasks if t["id"] == "T2"), None)

    assert t1 is not None
    assert t1["title"] == "Sample Task Modified"
    assert t1["effort"] == 5 # Original effort preserved because it's ignored in merge

    assert t2 is not None
    assert t2["title"] == "New Merged Task"
