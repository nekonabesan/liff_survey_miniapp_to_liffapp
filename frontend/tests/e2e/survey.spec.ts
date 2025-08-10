import { test, expect } from '@playwright/test';
import { getCurrentEnvironment, logEnvironmentInfo } from './config/environments';

// 現在の環境設定を取得
const testEnv = getCurrentEnvironment();

test.describe('LIFF Survey App', () => {
  test.beforeAll(async () => {
    // テスト開始前に環境情報を表示
    logEnvironmentInfo();
  });
  
  test.beforeEach(async ({ page }) => {
    // LIFF SDKをモック（IDToken対応）
    await page.addInitScript(() => {
      window.liff = {
        init: () => Promise.resolve(),
        isLoggedIn: () => true, // 開発環境では常にログイン状態
        login: () => {},
        logout: () => {},
        getProfile: () => Promise.resolve({
          userId: 'U_mock_user_123',
          displayName: 'Mock Development User',
          pictureUrl: 'https://via.placeholder.com/150',
          statusMessage: 'Development mode user'
        }),
        getAccessToken: () => Promise.resolve('mock_access_token_12345'),
        getIDToken: () => Promise.resolve('mock_id_token_67890'),
        isInClient: () => false,
        closeWindow: () => {},
        sendMessages: () => Promise.resolve(),
      };
    });

    await page.goto('/');
  });

  test('should display survey form', async ({ page }) => {
    // ローディングが完了するまで待機（実際のDOM構造に合わせて修正）
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // ヘッダーが表示されることを確認
    await expect(page.locator('h1')).toContainText('アンケート調査');
    
    // メインコンテナが表示されることを確認
    await expect(page.locator('.container')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.waitForSelector('#root');
    
    // 必須項目を入力せずに送信ボタンをクリック
    await page.click('button[type="submit"]');
    
    // ブラウザの標準バリデーションが働くことを期待
    // または、カスタムエラーメッセージが表示されることを確認
    const ageSelect = page.locator('select[name="age"]');
    await expect(ageSelect).toHaveAttribute('required');
  });

  test('should submit survey with valid data', async ({ page }) => {
    await page.waitForSelector('#root');
    
    // フォームに入力（実際のフォーム構造に合わせて修正）
    await page.selectOption('select[name="age"]', '20-29');
    await page.selectOption('select[name="gender"]', 'male');
    await page.selectOption('select[name="frequency"]', 'weekly');
    await page.selectOption('select[name="satisfaction"]', '4');
    await page.fill('textarea[name="feedback"]', 'とても良いサービスです');
    
    // IDToken認証APIモックを設定
    await page.route('**/user/status', async route => {
      const request = route.request();
      const authHeader = request.headers()['authorization'];
      
      if (authHeader === 'Bearer mock_id_token_67890') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              userId: 'U_mock_user_123',
              hasResponse: false,
              responseCount: 0
            }
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: '認証が必要です'
          })
        });
      }
    });
    
    // アンケート送信APIモックを設定
    await page.route('**/survey/submit', async route => {
      const request = route.request();
      const authHeader = request.headers()['authorization'];
      
      if (authHeader === 'Bearer mock_id_token_67890') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'アンケート回答を保存しました',
            data: { id: 'test-id' }
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: '認証が必要です'
          })
        });
      }
    });
    
    // 送信ボタンをクリック
    await page.click('button[type="submit"]');
    
    // 成功ページが表示されることを確認（実際のDOM構造に合わせて修正）
    await expect(page.locator('h2')).toContainText('ありがとうございました', { timeout: 10000 });
    await expect(page.locator('.text-green-500')).toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    await page.waitForSelector('#root');
    
    // フォームに入力（実際のフォーム構造に合わせて修正）
    await page.selectOption('select[name="age"]', '20-29');
    await page.selectOption('select[name="gender"]', 'male');
    await page.selectOption('select[name="frequency"]', 'weekly');
    await page.selectOption('select[name="satisfaction"]', '4');
    
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
    await page.click('button[type="submit"]');
    
    // エラーメッセージが表示されることを確認
    // (実装に応じて調整が必要)
    await page.waitForTimeout(2000);
    
    // フォームが残っていることを確認
    await expect(page.locator('form')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // モバイル画面サイズに設定
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('#root');
    
    // レスポンシブレイアウトが適用されることを確認
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});
