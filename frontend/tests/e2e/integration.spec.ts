import { test, expect } from '@playwright/test';

const API_BASE_URL = 'https://asia-northeast1-liff-survey-app-20250809-282a6.cloudfunctions.net/api';
const FRONTEND_URL = 'https://liff-survey-app-20250809-282a6.web.app';

test.describe('LIFF Survey API Integration Tests', () => {
  
  test('API Health Check', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('OK');
    expect(data.data.firestore_available).toBe(true);
    expect(data.message).toContain('LIFF Survey API is running');
  });

  test('Survey Submission - Valid Data', async ({ request }) => {
    const testData = {
      age: '25',
      gender: 'male',
      frequency: 'daily',
      satisfaction: '5',
      feedback: 'Playwright test feedback',
      userId: `playwright-test-${Date.now()}`,
      displayName: 'Playwright Test User'
    };

    const response = await request.post(`${API_BASE_URL}/survey/submit`, {
      data: testData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('アンケート回答を保存しました');
    expect(data.data.id).toBeTruthy();
  });

  test('Survey Submission - Invalid Data', async ({ request }) => {
    const invalidData = {
      age: '25',
      gender: 'invalid_gender', // 無効な性別
      frequency: 'daily',
      satisfaction: '5'
    };

    const response = await request.post(`${API_BASE_URL}/survey/submit`, {
      data: invalidData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid gender value');
  });

  test('Survey Submission - Missing Required Fields', async ({ request }) => {
    const incompleteData = {
      age: '25',
      // gender is missing
      frequency: 'daily',
      satisfaction: '5'
    };

    const response = await request.post(`${API_BASE_URL}/survey/submit`, {
      data: incompleteData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain("Required field 'gender' is missing");
  });

  test('User Status Check - New User', async ({ request }) => {
    const newUserId = `new-user-${Date.now()}`;
    const userData = {
      userId: newUserId,
      displayName: 'New Test User'
    };

    const response = await request.post(`${API_BASE_URL}/user/status`, {
      data: userData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.userId).toBe(newUserId);
    expect(data.data.hasResponse).toBe(false);
    expect(data.data.responseCount).toBe(0);
  });

  test('User Status Check - Existing User', async ({ request }) => {
    const userId = `existing-user-${Date.now()}`;
    
    // まずアンケートを送信
    const surveyData = {
      age: '30',
      gender: 'female',
      frequency: 'weekly',
      satisfaction: '4',
      feedback: 'Existing user test',
      userId: userId,
      displayName: 'Existing Test User'
    };

    await request.post(`${API_BASE_URL}/survey/submit`, {
      data: surveyData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 少し待機してからユーザー状態をチェック
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statusResponse = await request.post(`${API_BASE_URL}/user/status`, {
      data: {
        userId: userId,
        displayName: 'Existing Test User'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(statusResponse.ok()).toBeTruthy();
    
    const statusData = await statusResponse.json();
    expect(statusData.success).toBe(true);
    expect(statusData.data.userId).toBe(userId);
    expect(statusData.data.hasResponse).toBe(true);
    expect(statusData.data.responseCount).toBeGreaterThan(0);
    expect(statusData.data.lastResponseId).toBeTruthy();
  });

  test('Latest Response Retrieval', async ({ request }) => {
    const userId = `response-test-${Date.now()}`;
    
    // アンケートを送信
    const surveyData = {
      age: '35',
      gender: 'other',
      frequency: 'monthly',
      satisfaction: '3',
      feedback: 'Latest response test',
      userId: userId,
      displayName: 'Response Test User'
    };

    await request.post(`${API_BASE_URL}/survey/submit`, {
      data: surveyData,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 少し待機してから最新回答を取得
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await request.get(`${API_BASE_URL}/user/${userId}/latest-response`);

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.userId).toBe(userId);
    expect(data.data.age).toBe('35');
    expect(data.data.gender).toBe('other');
    expect(data.data.frequency).toBe('monthly');
    expect(data.data.satisfaction).toBe('3');
    expect(data.data.feedback).toBe('Latest response test');
  });

  test('Latest Response - Non-existent User', async ({ request }) => {
    const nonExistentUserId = `non-existent-${Date.now()}`;
    
    const response = await request.get(`${API_BASE_URL}/user/${nonExistentUserId}/latest-response`);

    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toContain('回答が見つかりませんでした');
  });

  test('User Status Check - Missing User ID', async ({ request }) => {
    const response = await request.post(`${API_BASE_URL}/user/status`, {
      data: {
        displayName: 'Test User'
        // userId is missing
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('userId is required');
  });

  test('Invalid Endpoint', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/invalid-endpoint`);

    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Endpoint');
  });
});

test.describe('LIFF Survey Frontend Tests', () => {
  
  test('Frontend loads successfully', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // ページタイトルを確認
    await expect(page).toHaveTitle(/LIFF Survey/);
    
    // メインコンテンツが表示されることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('Survey form elements are present', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // 年齢選択があることを確認
    await expect(page.locator('select[name="age"], input[name="age"]')).toBeVisible();
    
    // 性別選択があることを確認  
    await expect(page.locator('input[name="gender"], select[name="gender"]')).toBeVisible();
    
    // 頻度選択があることを確認
    await expect(page.locator('input[name="frequency"], select[name="frequency"]')).toBeVisible();
    
    // 満足度選択があることを確認
    await expect(page.locator('input[name="satisfaction"], select[name="satisfaction"]')).toBeVisible();
  });

  test('LIFF SDK error handling (outside LINE)', async ({ page }) => {
    await page.goto(FRONTEND_URL);
    
    // LINE外でのアクセス時のエラーメッセージまたは代替表示を確認
    // 実装に応じて適切なセレクターに変更
    const errorElement = page.locator('[data-testid="liff-error"], .error-message, .liff-unavailable');
    
    // エラーメッセージが表示されるか、正常に代替画面が表示されることを確認
    await expect(errorElement.or(page.locator('form'))).toBeVisible();
  });

  test('API connection test from frontend', async ({ page }) => {
    // ページをモニタリングしてネットワークリクエストを確認
    let apiRequestMade = false;
    
    page.on('request', request => {
      if (request.url().includes(API_BASE_URL)) {
        apiRequestMade = true;
      }
    });
    
    await page.goto(FRONTEND_URL);
    
    // ページが読み込まれた後、しばらく待機してAPIリクエストを確認
    await page.waitForTimeout(3000);
    
    // フロントエンドがAPIにリクエストを送信している場合の確認
    // 実装に応じて調整が必要
    console.log('API request made:', apiRequestMade);
  });
});
