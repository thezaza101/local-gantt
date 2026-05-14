from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('http://localhost:8000/unit_test.html')
    page.wait_for_selector('#test-summary', state='visible')

    failed_tests = page.query_selector_all('.test-fail')
    for test in failed_tests:
        print(test.inner_text())

    print("ALL TEXT")
    print(page.locator('#test-results').inner_text())

    browser.close()
