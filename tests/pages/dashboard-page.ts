import {Page} from "@playwright/test";
import {AdminPage} from "./admin-page";
import {Locator} from "playwright";

export class DashboardPage extends AdminPage {
    readonly getQueriesOverTime: Locator;
    readonly getQueryTypesPie: Locator;

    constructor(page: Page) {
        super(page);
        this.getQueriesOverTime = this.page.locator('#queries-over-time');
        this.getQueryTypesPie = this.page.locator('#query-types-pie');
    }

    async goto() {
        await this.page.goto('/admin/index.php');
    }
}
