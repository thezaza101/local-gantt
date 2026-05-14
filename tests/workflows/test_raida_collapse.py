import pytest
import re
from playwright.sync_api import Page, expect

def test_raida_collapse_expand_workflow(page: Page):
    page.goto("http://localhost:8000/index.html")

    page.wait_for_function('typeof window.PlannerState !== "undefined"')
    page.wait_for_function('typeof window.UIController !== "undefined"')

    # Evaluate js to add task to populate RAIDA
    page.evaluate('''() => {
        window.PlannerState.addPlan('Test Plan');
        window.PlannerState.addTask({
            id: 'T-100',
            title: 'Task 1',
            endDate: '2020-01-01',
            status: 'In progress'
        });
    }''')

    # Open RAIDA
    page.click("#openRaidaBtn")

    # Wait for RAIDA to render
    page.wait_for_selector("#raidaContent .card")

    # Click Expand/Collapse All button
    collapse_btn = page.locator("#toggleRaidaCollapseBtn")
    expect(collapse_btn).to_be_visible()

    # Initial state should have "Collapse All" as text because it expands by default when > 0 items
    expect(collapse_btn).to_have_text("↕ Collapse All")

    # Click to collapse
    collapse_btn.click()
    expect(collapse_btn).to_have_text("↕ Expand All")

    # Check if cards are collapsed (not having 'show' class)
    # The first card should be the overdue tasks one
    first_collapse = page.locator("#raidaContent .collapse").first
    expect(first_collapse).not_to_have_class(re.compile(r'\bshow\b'))

    # Click to expand again
    collapse_btn.click()
    expect(collapse_btn).to_have_text("↕ Collapse All")
    expect(first_collapse).to_have_class(re.compile(r'\bshow\b'))
