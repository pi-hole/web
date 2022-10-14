import {Page} from "@playwright/test";
import {Locator} from "playwright";

export abstract class AdminPage {
    protected readonly page;
    readonly getActiveNavItem: Locator;

    protected constructor(page: Page) {
        this.page = page;
        this.getActiveNavItem = this.page.locator('ul.sidebar-menu li.active');
    }
}
