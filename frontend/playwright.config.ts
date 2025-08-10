import { defineConfig, devices } from '@playwright/test';
import { getCurrentEnvironment } from './tests/e2e/config/environments';

// 現在の環境設定を取得
const testEnv = getCurrentEnvironment();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? testEnv.retries : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Test timeout */
  timeout: testEnv.timeout,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: testEnv.frontendUrl,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* API testing configuration */
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
    
    /* Environment-specific configuration */
    storageState: testEnv.name === 'production' ? undefined : undefined, // 必要に応じて認証状態を設定
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-local',
      testIgnore: testEnv.name !== 'local' ? ['**/*'] : [],
      use: { 
        ...devices['Desktop Chrome'],
        // ローカル環境固有の設定
      },
    },
    {
      name: 'chromium-production',
      testIgnore: testEnv.name !== 'production' ? ['**/*'] : [],
      use: { 
        ...devices['Desktop Chrome'],
        // 本番環境固有の設定
      },
    },

    {
      name: 'firefox',
      testIgnore: testEnv.name === 'local' ? ['**/*'] : [], // ローカルではFirefoxをスキップ
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      testIgnore: testEnv.name === 'local' ? ['**/*'] : [], // ローカルではWebkitをスキップ
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports (production only) */
    {
      name: 'Mobile Chrome',
      testIgnore: testEnv.name === 'local' ? ['**/*'] : [],
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      testIgnore: testEnv.name === 'local' ? ['**/*'] : [],
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests (local environment only) */
  webServer: testEnv.name === 'local' ? undefined : undefined, // Dockerコンテナが管理するため無効化
});
