from playwright.sync_api import Page
from .test_data import get_sample_plan_json
import json

def inject_mock_state(page: Page, state_json: str = None):
    """
    Injects a mock application state into the browser context.
    If no state_json is provided, a default valid state is injected.
    """
    data = state_json if state_json else get_sample_plan_json()
    # Assuming the app has a `window.PlannerState.loadState` or similar,
    # but the easiest way to mock state without UI interaction is to seed localStorage if supported
    # or evaluate the JS directly.
    # Since PlannerState is global:
    page.evaluate(f"window.PlannerState.loadState({data})")

def set_local_storage(page: Page, key: str, value: str):
    """Sets a value in the browser's localStorage."""
    page.evaluate(f"window.localStorage.setItem('{key}', '{value}')")
