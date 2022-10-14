import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import { LoginPage } from "./pages/login-page";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

function generateProjects() {
  const projects = [];
  for (const name of ["Desktop Chrome", "Desktop Firefox", "iPhone 13 Pro"]) {
    for (const colorScheme of ["light", "dark"]) {
      projects.push({
        name: `${name}: ${colorScheme}`,
        use: {
          ...devices[name],
          colorScheme: colorScheme,
        },
      });
    }
  }
  return projects;
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: "./integration",
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  globalTimeout: 4 * (60 * 1000), // 4 minutes
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  workers: 3,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { open: "never", outputFolder: "results/playwright-report" }],
    ["list", { printSteps: true }],
  ],
  /* Global setup to preserve auth */
  globalSetup: require.resolve("./global-setup"),
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://dev-pihole",
    storageState: LoginPage.STORAGE_STATE_FILE,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: generateProjects(),

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: "results/test-results",

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};

export default config;
