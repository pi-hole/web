import { test, expect } from "../admin-pages";

test.describe("Gravity", async () => {
  test("loads page", async ({ gravityPage }) => {
    await expect(gravityPage.getActiveNavItem).toContainText("Tools");
    await expect(gravityPage.getChildActiveNavItem).toContainText(
      "Update Gravity"
    );
    await expect(gravityPage.getUpdateGravityButton).toBeVisible();
    await expect(await gravityPage.screenshot()).toMatchSnapshot();
  });
});
