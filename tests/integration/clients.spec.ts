import { test, expect } from "../admin-pages";

test.describe("Clients", async () => {
  test("loads page", async ({ clientsPage }) => {
    await expect(clientsPage.getActiveNavItem).toContainText("Clients");
    await expect(clientsPage.getClientsList).toBeVisible();
    await expect(clientsPage.getAddClientForm).toBeVisible();
    await expect(await clientsPage.screenshot()).toMatchSnapshot();
  });
});
