from playwright.sync_api import sync_playwright
import time
import os

def test_tracker_import_csv():
    # Create a temporary CSV file
    csv_content = """id,title,type,description
R101,A New Risk,risk,Risk description
I101,A New Issue,issue,Issue description
,New Assumption,assumption,
"""
    with open("test_import.csv", "w") as f:
        f.write(csv_content)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8000")

        # Open the tracker panel
        page.click("#openTrackerBtn")
        page.wait_for_selector("#trackerContainer", state="visible")

        # The hidden input change listener is triggered natively
        # We don't need to click the button in Playwright because setting input files directly triggers change event

        # Dismiss the expected alert before it appears
        page.once("dialog", lambda dialog: dialog.accept())

        # Set the input files
        page.locator('#trackerImportCsvFileInput').set_input_files('test_import.csv')

        # Wait for the modal to be visible
        page.wait_for_selector("#trackerImportCsvModal", state="visible")

        # Check if file name updated
        file_name = page.locator("#trackerImportCsvFileName").inner_text()
        assert file_name == "test_import.csv", f"Expected file name to be test_import.csv, got {file_name}"

        # Click import
        page.click("#confirmTrackerImportCsvBtn")

        # Wait for modal to hide
        page.wait_for_selector("#trackerImportCsvModal", state="hidden")

        # Verify risks
        page.click("#risks-tab")
        page.wait_for_selector("#risksTable tbody tr")
        risks_text = page.locator("#risksTable tbody").inner_text()
        assert "A New Risk [Imported]" in risks_text, "Risk not found in table"

        # Verify issues
        page.click("#issues-tab")
        page.wait_for_selector("#issuesTable tbody tr")
        issues_text = page.locator("#issuesTable tbody").inner_text()
        assert "A New Issue [Imported]" in issues_text, "Issue not found in table"

        # Verify assumptions
        page.click("#assumptions-tab")
        page.wait_for_selector("#assumptionsTable tbody tr")
        assumptions_text = page.locator("#assumptionsTable tbody").inner_text()
        assert "New Assumption [Imported]" in assumptions_text, "Assumption not found in table"

        print("E2E Test: tracker CSV import functionality verified.")
        browser.close()

    # Clean up
    if os.path.exists("test_import.csv"):
        os.remove("test_import.csv")

if __name__ == "__main__":
    test_tracker_import_csv()
