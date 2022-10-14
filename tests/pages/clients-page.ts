import { Page } from "@playwright/test";
import { AdminPage } from "./admin-page";
import { Locator } from "playwright";

export class ClientsPage extends AdminPage {
  readonly getClientsList: Locator;
  readonly getAddClientForm: Locator;

  constructor(page: Page) {
    super(page);
    this.getClientsList = this.page.locator("#clients-list");
    this.getAddClientForm = this.page.locator("#add-client");
  }

  async goto() {
    await this.page.goto("/admin/groups-clients.php");
  }
}
