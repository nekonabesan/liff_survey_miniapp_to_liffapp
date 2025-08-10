/**
 * LIFF SDK サービス
 * 本番環境では実際のLIFF SDKを使用し、開発環境ではモックデータを返す
 */

import type { LiffProfile } from '@/types';

// 環境判定
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export interface LiffService {
  getAccessToken(): Promise<string | null>;
  getIDToken(): Promise<string | null>;
  getProfile(): Promise<LiffProfile | null>;
  isLoggedIn(): boolean;
  ready(): Promise<void>;
}

// 本番環境用のLIFF実装
class ProductionLiffService implements LiffService {
  async getAccessToken(): Promise<string | null> {
    try {
      if (!window.liff?.isLoggedIn()) {
        return null;
      }
      return await window.liff.getAccessToken();
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  async getIDToken(): Promise<string | null> {
    try {
      if (!window.liff?.isLoggedIn()) {
        return null;
      }
      return await window.liff.getIDToken();
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  }

  async getProfile(): Promise<LiffProfile | null> {
    try {
      if (!window.liff?.isLoggedIn()) {
        return null;
      }
      const profile = await window.liff.getProfile();
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
      };
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return window.liff?.isLoggedIn() ?? false;
  }

  async ready(): Promise<void> {
    if (!window.liff) {
      throw new Error('LIFF SDK is not loaded');
    }
    return window.liff.ready;
  }
}

// 開発環境用のモック実装
class DevelopmentLiffService implements LiffService {
  private mockProfile: LiffProfile = {
    userId: 'dev_user_12345',
    displayName: 'テストユーザー',
    pictureUrl: 'https://via.placeholder.com/150',
    statusMessage: '開発環境テスト中',
  };

  async getAccessToken(): Promise<string | null> {
    // 開発環境では固定のモックトークンを返す
    return 'mock_access_token_dev_12345';
  }

  async getIDToken(): Promise<string | null> {
    // 開発環境では固定のモックIDトークンを返す
    return 'mock_id_token_dev_67890';
  }

  async getProfile(): Promise<LiffProfile | null> {
    // 開発環境では固定のモックプロフィールを返す
    return this.mockProfile;
  }

  isLoggedIn(): boolean {
    // 開発環境では常にログイン状態とする
    return true;
  }

  async ready(): Promise<void> {
    // 開発環境では即座に準備完了とする
    return Promise.resolve();
  }

  // 開発環境でのテスト用メソッド
  setMockProfile(profile: Partial<LiffProfile>) {
    this.mockProfile = { ...this.mockProfile, ...profile };
  }
}

// 環境に応じてサービスインスタンスを作成
export const liffService: LiffService = isDevelopment 
  ? new DevelopmentLiffService()
  : new ProductionLiffService();

// 開発環境用のヘルパー関数
export const setMockProfile = (profile: Partial<LiffProfile>) => {
  if (isDevelopment && liffService instanceof DevelopmentLiffService) {
    liffService.setMockProfile(profile);
  }
};
