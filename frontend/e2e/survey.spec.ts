import { test, expect } from '@playwright/test';

test.describe('LIFF Survey App', () => {
  test.beforeEach(async ({ page }) => {
    // LIFF SDKをモック
    await page.addInitScript(() => {
      window.liff = {
        init: () => Promise.resolve(),
        isLoggedIn: () => true,
        isInClient: () => true,
        getProfile: () => Promise.resolve({
          displayName: 'テストユーザー',
          userId: 'test-user-id',
          pictureUrl: 'https://example.com/avatar.jpg'
        }),
        closeWindow: () => {},
        sendMessages: () => Promise.resolve()
      };
    });

    await page.goto('http://localhost:3000');
  });

  test('should display loading screen initially', async ({ page }) => {
    await expect(page.locator('text=Loading...')).toBeVisible();
  });

  test('should display survey form after loading', async ({ page }) => {
    await page.waitForSelector('.survey-form', { timeout: 5000 });
    await expect(page.locator('.survey-form')).toBeVisible();
  });

  test('should fill and submit survey', async ({ page }) => {
    await page.waitForSelector('.survey-form', { timeout: 5000 });
    
    // 満足度を選択
    await page.click('input[name="satisfaction"][value="5"]');
    
    // 推薦の選択
    await page.click('input[name="recommend"][value="はい"]');
    
    // 機能の選択
    await page.check('input[value="使いやすさ"]');
    await page.check('input[value="デザイン"]');
    
    // フィードバック入力
    await page.fill('textarea', 'とても良いサービスです！');
    
    // 送信
    await page.click('button[type="submit"]');
    
    // 完了画面の表示を確認
    await expect(page.locator('text=ありがとうございました！')).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    await page.waitForSelector('.survey-form', { timeout: 5000 });
    
    // 必須項目を入力せずに送信
    await page.click('button[type="submit"]');
    
    // エラーメッセージの表示を確認
    await expect(page.locator('text=この項目は必須です')).toBeVisible();
  });
});
