import pytest
from playwright.sync_api import Page, expect
from tests.helpers.browser_helpers import load_app

def test_escape_html(page: Page, base_url: str):
    """Verifies that the UI escapeHtml function properly sanitizes inputs."""
    load_app(page, base_url)

    malicious_string = '<script>alert("xss")</script>'
    escaped_string = page.evaluate(f"window.UIController.escapeHtml('{malicious_string}')")

    assert "<" not in escaped_string
    assert ">" not in escaped_string
    assert "&lt;script&gt;" in escaped_string
