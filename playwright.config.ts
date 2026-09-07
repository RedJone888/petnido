import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  // Next dev compiles routes on first navigation, including in CI.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  outputDir: "test-results",
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3107",
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev -- --turbopack --hostname 127.0.0.1 --port 3107",
    url: "http://127.0.0.1:3107",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      FEATURE_VERTICAL_SLICE: "true",
      FEATURE_PROFILE_E2E: "true",
      FEATURE_PUBLISHING_V2: "true",
      FEATURE_PUBLIC_MARKETPLACE_V2: "true",
      FEATURE_CONVERSATIONS_V2: "true",
      FEATURE_BOARDING_CAPACITY: "true",
      VALIDATION_DATABASE_URL: "file:./validation.e2e.db",
      VALIDATION_TEST_TOKEN: "petnido-local-e2e-token",
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_PUBLIC_MAPTILER_KEY: "e2e-map-style-stub",
      RUST_LOG: "debug",
    },
  },
});
