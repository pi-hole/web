import { test, expect } from "../admin-pages";

test.describe("Dashboard", async () => {
  test("loads page", async ({ dashboardPage }) => {
    await expect(dashboardPage.getActiveNavItem).toContainText("Dashboard");
    await expect(dashboardPage.getQueriesOverTime).toBeVisible();
    await expect(dashboardPage.getQueryTypesPie).toBeVisible();
    await expect(await dashboardPage.screenshot()).toMatchSnapshot();
  });
});
