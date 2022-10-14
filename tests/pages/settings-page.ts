import { Page } from "@playwright/test";
import { AdminPage } from "./admin-page";
import { Locator } from "playwright";

export class SettingsPage extends AdminPage {
  readonly getSettingsNavTabs: Locator;
  readonly getActiveSettingsNavTabItem: Locator;
  readonly getSettingsSystemNav: Locator;
  readonly getSettingsApiWebNav: Locator;
  readonly getSystemInformation: Locator;
  readonly getRadioDefaultAutoTheme: Locator;
  readonly getRadioDefaultDarkTheme: Locator;
  readonly getSaveThemeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.getSettingsNavTabs = this.page.locator(".content ul.nav-tabs");
    this.getActiveSettingsNavTabItem =
      this.getSettingsNavTabs.locator("li.active");
    this.getSettingsSystemNav = this.getSettingsNavTabs
      .locator("li")
      .filter({ hasText: "System" });
    this.getSettingsApiWebNav = this.getSettingsNavTabs
      .locator("li")
      .filter({ hasText: "API / Web interface" });
    this.getSystemInformation = this.page.locator("#sysadmin");
    this.getRadioDefaultAutoTheme = this.page.locator("#webtheme_default-auto");
    this.getRadioDefaultDarkTheme = this.page.locator("#webtheme_default-dark");
    this.getSaveThemeButton = this.page
      .locator("form")
      .filter({ hasText: "Web interface settings" })
      .locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto("/admin/settings.php");
  }

  public screenshot() {
    return super.screenshot([this.getSystemInformation.locator("table")]);
  }
}
