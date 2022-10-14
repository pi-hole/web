import { Page } from "@playwright/test";
import { Locator } from "playwright";

export abstract class AdminPage {
  protected readonly page;
  readonly getActiveNavItem: Locator;
  readonly getChildActiveNavItem: Locator;
  readonly getDomainsOnAdlistStat: Locator;
  readonly getBody: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.getActiveNavItem = this.page.locator("ul.sidebar-menu > li.active");
    this.getChildActiveNavItem = this.page.locator(
      "ul.treeview-menu > li.active"
    );
    this.getBody = this.page.locator("body");
  }

  public screenshot(mask: Locator[] = []) {
    return this.page.locator("section.content").screenshot({
      mask: mask,
      fullPage: true,
      animations: "disabled",
    });
  }
}
