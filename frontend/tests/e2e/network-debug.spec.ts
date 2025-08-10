import { test, expect } from '@playwright/test';
import { getCurrentEnvironment, logEnvironmentInfo } from './config/environments';

// 現在の環境設定を取得
const testEnv = getCurrentEnvironment();
const FRONTEND_URL = testEnv.frontendUrl;

test.describe('Network Error Investigation', () => {
  
  test.beforeAll(async () => {
    // テスト開始前に環境情報を表示
    logEnvironmentInfo();
  });

  test('Detailed network analysis - Monitor all requests', async ({ page }) => {
    const networkLogs: Array<{
      url: string;
      method: string;
      status?: number;
      error?: string;
      timing: number;
    }> = [];

    const requestStartTimes = new Map<string, number>();

    // すべてのネットワークリクエストを監視
    page.on('request', request => {
      const startTime = Date.now();
      requestStartTimes.set(request.url(), startTime);
      
      console.log(`🚀 Request: ${request.method()} ${request.url()}`);
      
      networkLogs.push({
        url: request.url(),
        method: request.method(),
        timing: startTime
      });
    });

    // レスポンスを監視
    page.on('response', response => {
      const startTime = requestStartTimes.get(response.url()) || 0;
      const timing = Date.now() - startTime;
      
      console.log(`✅ Response: ${response.status()} ${response.url()} (${timing}ms)`);
      
      // ログを更新
      const logEntry = networkLogs.find(log => log.url === response.url());
      if (logEntry) {
        logEntry.status = response.status();
        logEntry.timing = timing;
      }
    });

    // リクエストエラーを監視
    page.on('requestfailed', request => {
      const startTime = requestStartTimes.get(request.url()) || 0;
      const timing = Date.now() - startTime;
      const failure = request.failure();
      
      console.log(`❌ Request Failed: ${request.url()} - ${failure?.errorText} (${timing}ms)`);
      
      // ログを更新
      const logEntry = networkLogs.find(log => log.url === request.url());
      if (logEntry) {
        logEntry.error = failure?.errorText || 'Unknown error';
        logEntry.timing = timing;
      }
    });

    // コンソールエラーを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🔴 Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        console.log(`🟡 Console Warning: ${msg.text()}`);
      } else if (msg.text().includes('Network') || msg.text().includes('fetch') || msg.text().includes('API')) {
        console.log(`📝 Console: ${msg.text()}`);
      }
    });

    // Unhandled Promise Rejectionを監視
    page.on('pageerror', error => {
      console.log(`💥 Page Error: ${error.message}`);
    });

    console.log(`🌐 Navigating to: ${FRONTEND_URL}`);
    
    // ページに移動
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });

    // ページが完全に読み込まれるまで少し待機
    await page.waitForTimeout(3000);

    // DOM要素の確認
    const rootElement = await page.locator('#root').isVisible();
    console.log(`🏠 Root element visible: ${rootElement}`);

    if (rootElement) {
      // フォーム要素の存在確認
      const ageSelect = await page.locator('select[name="age"]').isVisible();
      const genderSelect = await page.locator('select[name="gender"]').isVisible();
      const submitButton = await page.locator('button[type="submit"]').isVisible();
      
      console.log(`📋 Form elements - Age: ${ageSelect}, Gender: ${genderSelect}, Submit: ${submitButton}`);
      
      if (ageSelect && genderSelect && submitButton) {
        console.log('📝 Attempting form submission to trigger API call...');
        
        // フォームに値を入力
        await page.selectOption('select[name="age"]', '20-29');
        await page.selectOption('select[name="gender"]', 'male');
        await page.selectOption('select[name="frequency"]', 'weekly');
        await page.selectOption('select[name="satisfaction"]', '4');
        
        // APIリクエストを監視しながら送信
        console.log('🔄 Submitting form...');
        await page.click('button[type="submit"]');
        
        // レスポンスを待機
        await page.waitForTimeout(5000);
      }
    }

    // ネットワークログのサマリーを出力
    console.log('\n📊 === Network Analysis Summary ===');
    networkLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.method} ${log.url}`);
      if (log.status) {
        console.log(`   Status: ${log.status} (${log.timing}ms)`);
      }
      if (log.error) {
        console.log(`   ❌ Error: ${log.error} (${log.timing}ms)`);
      }
    });

    // API関連のリクエストのみをフィルタリング
    const apiRequests = networkLogs.filter(log => 
      log.url.includes('localhost:8001') || 
      log.url.includes('localhost:8001') ||
      log.url.includes('/api/') ||
      log.url.includes('/survey/') ||
      log.url.includes('/user/') ||
      log.url.includes('/health')
    );

    console.log('\n🔗 === API Requests Only ===');
    if (apiRequests.length === 0) {
      console.log('⚠️  No API requests detected!');
    } else {
      apiRequests.forEach((log, index) => {
        console.log(`${index + 1}. ${log.method} ${log.url}`);
        if (log.status) {
          console.log(`   ✅ Status: ${log.status} (${log.timing}ms)`);
        }
        if (log.error) {
          console.log(`   ❌ Error: ${log.error} (${log.timing}ms)`);
        }
      });
    }

    // エラーがあったリクエストのサマリー
    const failedRequests = networkLogs.filter(log => log.error);
    if (failedRequests.length > 0) {
      console.log('\n💀 === Failed Requests ===');
      failedRequests.forEach((log, index) => {
        console.log(`${index + 1}. ${log.method} ${log.url}`);
        console.log(`   ❌ Error: ${log.error} (${log.timing}ms)`);
      });
    }

    // テストの成功条件: ページが読み込まれること
    expect(rootElement).toBe(true);
  });

  test('API Endpoint Connectivity Test', async ({ page }) => {
    console.log('\n🔍 === Manual API Connectivity Test ===');

    // 直接APIエンドポイントにアクセスしてみる
    try {
      const healthResponse = await page.request.get(`${testEnv.apiBaseUrl}/health`);
      console.log(`Health Check Status: ${healthResponse.status()}`);
      
      if (healthResponse.ok()) {
        const healthData = await healthResponse.json();
        console.log(`Health Data:`, healthData);
      } else {
        console.log(`Health Check Failed: ${healthResponse.statusText()}`);
      }
    } catch (error) {
      console.log(`Health Check Error:`, error);
    }

    // ダミーのアンケート送信テスト
    try {
      const testData = {
        age: '25',
        gender: 'male',
        frequency: 'daily',
        satisfaction: '5',
        feedback: 'Test feedback',
        userId: 'test-user-network-debug',
        displayName: 'Network Debug User'
      };

      console.log('🧪 Testing survey submission...');
      const surveyResponse = await page.request.post(`${testEnv.apiBaseUrl}/survey/submit`, {
        data: testData,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`Survey Submission Status: ${surveyResponse.status()}`);
      
      if (surveyResponse.ok()) {
        const surveyData = await surveyResponse.json();
        console.log(`Survey Response:`, surveyData);
      } else {
        console.log(`Survey Submission Failed: ${surveyResponse.statusText()}`);
      }
    } catch (error) {
      console.log(`Survey Submission Error:`, error);
    }
  });
});
