import { test, expect } from "../admin-pages";

test.describe("Adlists", async () => {
  test("loads page", async ({ adlistsPage }) => {
    await expect(adlistsPage.getActiveNavItem).toContainText("Adlists");
    await expect(adlistsPage.getAdlistsList).toBeVisible();
    await expect(adlistsPage.getAddGroupForm).toBeVisible();
    await expect(adlistsPage.getAdlistsList).toHaveText(/StevenBlack/);
    await expect(await adlistsPage.screenshot()).toMatchSnapshot();
  });
});
