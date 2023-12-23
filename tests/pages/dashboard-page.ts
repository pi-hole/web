import { Page } from "@playwright/test";
import { AdminPage } from "./admin-page";
import { Locator } from "playwright";

export class DashboardPage extends AdminPage {
  readonly getQueriesOverTime: Locator;
  readonly getQueryTypesPie: Locator;
  readonly getDomainsOnAdlistStat: Locator;

  constructor(page: Page) {
    super(page);
    this.getQueriesOverTime = this.page.locator("#queries-over-time");
    this.getQueryTypesPie = this.page.locator("#query-types-pie");
    this.getDomainsOnAdlistStat = this.page.locator("#domains_being_blocked");
  }

  async goto() {
    await this.page.goto("/admin/index.php");
  }

  public screenshot() {
    return super.screenshot([
      this.getQueriesOverTime,
      this.getDomainsOnAdlistStat,
    ]);
  }
}
