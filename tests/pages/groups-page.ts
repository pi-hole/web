import { Page } from "@playwright/test";
import { AdminPage } from "./admin-page";
import { Locator } from "playwright";

export class GroupsPage extends AdminPage {
  readonly getGroupsList: Locator;
  readonly getAddGroupForm: Locator;

  constructor(page: Page) {
    super(page);
    this.getGroupsList = this.page.locator("#groups-list");
    this.getAddGroupForm = this.page.locator("#add-group");
  }

  async goto() {
    await this.page.goto("/admin/groups.php");
  }
}
