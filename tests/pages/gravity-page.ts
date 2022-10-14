import { Page } from "@playwright/test";
import { AdminPage } from "./admin-page";
import { Locator } from "playwright";

export class GravityPage extends AdminPage {
  readonly getUpdateGravityButton: Locator;

  constructor(page: Page) {
    super(page);
    this.getUpdateGravityButton = this.page.locator("#gravityBtn");
  }

  async goto() {
    await this.page.goto("/admin/gravity.php");
  }
}
