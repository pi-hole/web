import { test, expect } from "../admin-pages";

test.describe("Settings", async () => {
  test("loads page", async ({ settingsPage }) => {
    await expect(settingsPage.getActiveNavItem).toContainText("Settings");
    await expect(settingsPage.getActiveSettingsNavTabItem).toContainText(
      "System"
    );
    await expect(settingsPage.getSystemInformation).toBeVisible();
    await expect(await settingsPage.screenshot()).toMatchSnapshot();
  });

  test("API / Web interface tab", async ({ settingsPage }) => {
    await expect(settingsPage.getActiveSettingsNavTabItem).toContainText(
      "System"
    );
    await settingsPage.getSettingsApiWebNav.click();
    await expect(settingsPage.getActiveSettingsNavTabItem).toContainText(
      "API / Web interface"
    );
    await expect(await settingsPage.getRadioDefaultAutoTheme).toBeVisible();
    await expect(await settingsPage.getRadioDefaultAutoTheme).toBeChecked();
    await expect(await settingsPage.getBody).toHaveClass(/default-auto/);
    await expect(await settingsPage.screenshot()).toMatchSnapshot();
  });
});
