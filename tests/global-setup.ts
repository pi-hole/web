import {chromium, expect, FullConfig} from '@playwright/test';

async function globalSetup(config: FullConfig) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(`${config.projects[0].use.baseURL}/admin/login.php`);
    await page.getByPlaceholder('Password').fill('admin');
    await page.getByText('Log in').click();
    await expect(page.getByText('Total queries over last 24 hours')).toBeVisible();
    // Save signed-in state to 'storageState.json'.
    await page.context().storageState({ path: 'storageState.json' });
    await browser.close();
}

export default globalSetup;
