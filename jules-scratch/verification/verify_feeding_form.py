from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000/feeding", timeout=120000)

    # Wait for the button to be visible
    left_breast_button = page.get_by_role("button", name="Left Breast")
    expect(left_breast_button).to_be_visible(timeout=120000)

    # Start a feeding session
    left_breast_button.click()

    # Click "Enter Time Manually"
    page.get_by_role("button", name="Enter Time Manually").click()

    # Wait for the dialog to appear
    expect(page.get_by_text("Enter Feeding Time Manually")).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)