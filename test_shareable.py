from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Open local index.html
    page.goto("http://localhost:8000/index.html")

    page.wait_for_timeout(1000)

    # 3. Handle confirm and alert for Shareable view
    def handle_share_dialogs(dialog):
        dialog.accept()

    page.on("dialog", handle_share_dialogs)

    # Click Export dropdown and then Shareable HTML
    page.click("#exportDropdownBtn")
    page.click("#exportHtmlBtn")
    page.wait_for_timeout(1000)

    # 4. Verify the DOM updates
    assert page.evaluate("() => document.getElementById('embedded-state') !== null")
    assert "shareable-mode" in page.locator("body").get_attribute("class")

    # Check element visibility
    assert not page.locator("#addTaskBtn").is_visible()
    assert page.locator("#tagFiltersIconsContainer").is_visible()
    assert page.locator("#zoomDaily").is_visible()

    print("Verification passed!")
    browser.close()
