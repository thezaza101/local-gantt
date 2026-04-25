from playwright.sync_api import sync_playwright
import time

def test_help_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Wait for app to initialize
        page.wait_for_selector("#helpBtn")

        # Click the help button
        page.click("#helpBtn")

        # Wait for modal to be visible
        page.wait_for_selector("#helpModal .modal-body", state="visible")

        # Get modal text content
        modal_text = page.locator("#helpModal .modal-body").inner_text()

        # Assertions
        assert "🗃️ Bulk Operations:" in modal_text, "Bulk Operations help text is missing"
        assert "➕/🗑️ Manage Rows:" in modal_text, "Manage Rows help text is missing"
        assert "Create and manage groups of tags to quickly apply multiple tags to tasks, or use them in Bulk Operations." in modal_text, "Tag Groups updated text is missing"

        print("All help text updates verified successfully in the DOM.")

        browser.close()

if __name__ == "__main__":
    test_help_modal()
