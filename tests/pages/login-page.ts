import { FullConfig, Page } from "@playwright/test";
import { AdminPage } from "./admin-page";
import { Locator } from "playwright";
import { DashboardPage } from "./dashboard-page";

export class LoginPage extends AdminPage {
  public static readonly STORAGE_STATE_FILE = "storageState.json";
  readonly config: FullConfig;
  readonly getPasswordInput: Locator;
  readonly getLoginButton: Locator;

  constructor(page: Page, config: FullConfig) {
    super(page);
    this.config = config;
    this.getPasswordInput = page.getByPlaceholder("Password");
    this.getLoginButton = page.getByText("Log in");
  }

  async goto() {
    await this.page.goto(
      `${this.config.projects[0].use.baseURL}/admin/login.php`
    );
  }

  async login() {
    await this.getPasswordInput.fill("admin");
    await this.getLoginButton.click();
    return new DashboardPage(this.page);
  }
  isLoggedIn() {
    return this.page.getByText("Total queries over last 24 hours").isVisible();
  }

  async saveAuthSession() {
    await this.page
      .context()
      .storageState({ path: LoginPage.STORAGE_STATE_FILE });
  }
}
