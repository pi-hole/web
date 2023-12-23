import { Page } from "@playwright/test";
import { AdminPage } from "./admin-page";
import { Locator } from "playwright";

export class AdlistsPage extends AdminPage {
  readonly getAdlistsList: Locator;
  readonly getAddGroupForm: Locator;

  constructor(page: Page) {
    super(page);
    this.getAdlistsList = this.page.locator("#adlists-list");
    this.getAddGroupForm = this.page.locator("#add-group");
  }

  async goto() {
    await this.page.goto("/admin/groups-adlists.php");
  }
}
