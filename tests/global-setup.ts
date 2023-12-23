import { chromium, expect, FullConfig } from "@playwright/test";
import { LoginPage } from "./pages/login-page";

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const loginPage = new LoginPage(await browser.newPage(), config);
  await loginPage.goto();
  const dashboardPage = await loginPage.login();
  await expect(dashboardPage.getQueriesOverTime).toBeVisible();
  await loginPage.saveAuthSession();
  await browser.close();
}

export default globalSetup;
