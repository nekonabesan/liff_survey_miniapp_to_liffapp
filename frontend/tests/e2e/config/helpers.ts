/**
 * E2Eテスト用ヘルパー関数
 */

import { getCurrentEnvironment } from './environments';

/**
 * 環境に応じた期待値を取得
 */
export class TestHelpers {
  private static env = getCurrentEnvironment();

  /**
   * バリデーションエラーの期待HTTPステータスコードを取得
   * ローカル環境では422、本番環境では400を返す
   */
  static getValidationErrorStatusCode(): number {
    return this.env.name === 'local' ? 422 : 400;
  }

  /**
   * 不正なエンドポイントアクセス時の期待HTTPステータスコードを取得
   */
  static getNotFoundStatusCode(): number {
    return this.env.name === 'local' ? 404 : 404;
  }

  /**
   * APIエラーレスポンスの構造が環境によって異なる場合の期待値を取得
   */
  static getErrorResponseStructure() {
    if (this.env.name === 'local') {
      return {
        hasSuccessField: true,
        hasErrorField: true,
        hasMessageField: true
      };
    } else {
      return {
        hasSuccessField: true,
        hasErrorField: true,
        hasMessageField: true
      };
    }
  }

  /**
   * 環境固有のタイムアウト設定を取得
   */
  static getTimeoutForOperation(operation: 'api' | 'ui' | 'network'): number {
    const baseTimeouts = {
      api: this.env.name === 'local' ? 5000 : 10000,
      ui: this.env.name === 'local' ? 3000 : 8000,
      network: this.env.name === 'local' ? 2000 : 15000
    };
    
    return baseTimeouts[operation];
  }

  /**
   * 環境に応じたAPI URL を取得
   */
  static getApiUrl(endpoint: string = ''): string {
    return `${this.env.apiBaseUrl}${endpoint}`;
  }

  /**
   * 環境に応じたフロントエンド URL を取得
   */
  static getFrontendUrl(path: string = ''): string {
    return `${this.env.frontendUrl}${path}`;
  }

  /**
   * 環境が本番環境かどうかを判定
   */
  static isProduction(): boolean {
    return this.env.name === 'production';
  }

  /**
   * 環境がローカル環境かどうかを判定
   */
  static isLocal(): boolean {
    return this.env.name === 'local';
  }

  /**
   * テスト用のダミーデータを環境に応じて生成
   */
  static generateTestUserId(): string {
    const prefix = this.env.name === 'local' ? 'local_test_' : 'prod_test_';
    return `${prefix}${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * 環境情報をコンソールに出力
   */
  static logEnvironmentInfo(): void {
    console.log(`\n🌍 Test Environment: ${this.env.description}`);
    console.log(`📍 Frontend: ${this.env.frontendUrl}`);
    console.log(`🔗 API: ${this.env.apiBaseUrl}\n`);
  }
}
