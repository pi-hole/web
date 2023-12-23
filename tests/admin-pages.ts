import { DashboardPage } from "./pages/dashboard-page";
import { test as base } from "@playwright/test";
import { GroupsPage } from "./pages/groups-page";
import { ClientsPage } from "./pages/clients-page";
import { SettingsPage } from "./pages/settings-page";
import { AdlistsPage } from "./pages/adlists-page";
import { GravityPage } from "./pages/gravity-page";

type AdminFixtures = {
  dashboardPage: DashboardPage;
  groupsPage: GroupsPage;
  clientsPage: ClientsPage;
  settingsPage: SettingsPage;
  adlistsPage: AdlistsPage;
  gravityPage: GravityPage;
};

export const test = base.extend<AdminFixtures>({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await use(dashboardPage);
  },

  groupsPage: async ({ page }, use) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.goto();
    await use(groupsPage);
  },

  clientsPage: async ({ page }, use) => {
    const clientsPage = new ClientsPage(page);
    await clientsPage.goto();
    await use(clientsPage);
  },

  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await use(settingsPage);
  },

  adlistsPage: async ({ page }, use) => {
    const adlistsPage = new AdlistsPage(page);
    await adlistsPage.goto();
    await use(adlistsPage);
  },

  gravityPage: async ({ page }, use) => {
    const gravityPage = new GravityPage(page);
    await gravityPage.goto();
    await use(gravityPage);
  },
});

export { expect } from "@playwright/test";
