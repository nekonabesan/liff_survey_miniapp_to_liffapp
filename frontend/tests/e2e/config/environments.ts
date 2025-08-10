/**
 * E2Eテスト環境設定
 * 
 * 環境変数 TEST_ENV で環境を切り替え可能
 * - local: ローカル開発環境（Dockerコンテナ）
 * - production: Firebase本番環境
 */

export interface TestEnvironment {
  name: string;
  frontendUrl: string;
  apiBaseUrl: string;
  timeout: number;
  retries: number;
  description: string;
}

export const environments: Record<string, TestEnvironment> = {
  local: {
    name: 'local',
    frontendUrl: 'http://localhost:3000',
    apiBaseUrl: 'http://localhost:8001',
    timeout: 30000,
    retries: 0,
    description: 'ローカル開発環境'
  },
  production: {
    name: 'production',
    frontendUrl: 'https://liff-survey-app-20250809-282a6.web.app',
    apiBaseUrl: 'https://asia-northeast1-liff-survey-app-20250809-282a6.cloudfunctions.net/api',
    timeout: 45000,
    retries: 2,
    description: 'Firebase本番環境'
  }
};

// 環境変数から現在の環境を取得（デフォルトはlocal）
export const getCurrentEnvironment = (): TestEnvironment => {
  const envName = process.env.TEST_ENV || 'local';
  const environment = environments[envName];
  
  if (!environment) {
    throw new Error(`Invalid TEST_ENV: ${envName}. Available environments: ${Object.keys(environments).join(', ')}`);
  }
  
  console.log(`🌍 Running E2E tests on: ${environment.description}`);
  console.log(`📍 Frontend URL: ${environment.frontendUrl}`);
  console.log(`🔗 API Base URL: ${environment.apiBaseUrl}`);
  
  return environment;
};

// テスト実行前に環境情報を表示
export const logEnvironmentInfo = () => {
  const env = getCurrentEnvironment();
  console.log('\n=== E2E Test Environment ===');
  console.log(`Environment: ${env.name}`);
  console.log(`Description: ${env.description}`);
  console.log(`Frontend URL: ${env.frontendUrl}`);
  console.log(`API Base URL: ${env.apiBaseUrl}`);
  console.log(`Timeout: ${env.timeout}ms`);
  console.log(`Retries: ${env.retries}`);
  console.log('============================\n');
};
