from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:3000/teething")

    page.get_by_role("button", name="Add Entry").click()
    page.get_by_label("Name").fill("Upper Right Central Incisor")
    page.get_by_role("button", name="Save").click()

    page.screenshot(path="jules-scratch/verification/teething-page.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)