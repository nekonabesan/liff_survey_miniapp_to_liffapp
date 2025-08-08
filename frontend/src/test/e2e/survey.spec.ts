import { test, expect } from '@playwright/test';

test.describe('LIFF Survey App', () => {
  test.beforeEach(async ({ page }) => {
    // LIFF SDKをモック
    await page.addInitScript(() => {
      window.liff = {
        init: () => Promise.resolve(),
        isLoggedIn: () => false,
        login: () => {},
        logout: () => {},
        getProfile: () => Promise.resolve({
          userId: 'test-user-id',
          displayName: 'Test User',
          pictureUrl: 'https://example.com/avatar.jpg'
        }),
        isInClient: () => false,
        closeWindow: () => {},
        sendMessages: () => Promise.resolve(),
      };
    });

    await page.goto('/');
  });

  test('should display survey form', async ({ page }) => {
    // ローディングが完了するまで待機
    await page.waitForSelector('.app', { timeout: 5000 });
    
    // ヘッダーが表示されることを確認
    await expect(page.locator('h1')).toContainText('アンケート調査');
    
    // フォームが表示されることを確認
    await expect(page.locator('.survey-form')).toBeVisible();
    
    // 質問が表示されることを確認
    await expect(page.locator('.question-group')).toHaveCount(5);
  });

  test('should validate required fields', async ({ page }) => {
    await page.waitForSelector('.app');
    
    // 必須項目を入力せずに送信ボタンをクリック
    await page.click('.submit-button');
    
    // ブラウザの標準バリデーションが働くことを期待
    // または、カスタムエラーメッセージが表示されることを確認
    const ageSelect = page.locator('select[name="age"]');
    await expect(ageSelect).toHaveAttribute('required');
  });

  test('should submit survey with valid data', async ({ page }) => {
    await page.waitForSelector('.app');
    
    // フォームに入力
    await page.selectOption('select[name="age"]', '20-29');
    await page.check('input[name="gender"][value="male"]');
    await page.check('input[name="frequency"][value="weekly"]');
    await page.check('input[name="satisfaction"][value="4"]');
    await page.fill('textarea[name="feedback"]', 'とても良いサービスです');
    
    // APIモックを設定
    await page.route('**/survey/submit', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'アンケート回答を保存しました',
          data: { id: 'test-id' }
        })
      });
    });
    
    // 送信ボタンをクリック
    await page.click('.submit-button');
    
    // 成功ページが表示されることを確認
    await expect(page.locator('.thank-you')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2')).toContainText('ありがとうございました');
  });

  test('should handle API error gracefully', async ({ page }) => {
    await page.waitForSelector('.app');
    
    // フォームに入力
    await page.selectOption('select[name="age"]', '20-29');
    await page.check('input[name="gender"][value="male"]');
    await page.check('input[name="frequency"][value="weekly"]');
    await page.check('input[name="satisfaction"][value="4"]');
    
    // APIエラーをモック
    await page.route('**/survey/submit', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'サーバーエラーが発生しました'
        })
      });
    });
    
    // 送信ボタンをクリック
    await page.click('.submit-button');
    
    // エラーメッセージが表示されることを確認
    // (実装に応じて調整が必要)
    await page.waitForTimeout(2000);
    
    // フォームが残っていることを確認
    await expect(page.locator('.survey-form')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // モバイル画面サイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('.app');
    
    // レスポンシブレイアウトが適用されることを確認
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.survey-form')).toBeVisible();
  });
});
