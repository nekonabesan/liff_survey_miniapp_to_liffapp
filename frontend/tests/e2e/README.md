# E2Eテスト環境設定ガイド

## 概要

LIFF Survey ProjectのE2Eテストは、以下の2つの環境で実行することができます：

- **ローカル開発環境**: Dockerコンテナで起動したサーバーを対象
- **Firebase本番環境**: Firebase上にデプロイされたアプリケーションを対象

## テスト範囲

### フロントエンドE2Eテスト
- **API統合テスト**: バックエンドAPIとの通信確認
- **UIコンポーネントテスト**: Reactコンポーネントの動作確認
- **フォーム機能テスト**: アンケートフォームの送信・バリデーション
- **レスポンシブテスト**: モバイル対応の確認

### バックエンド連携
- **ローカル環境**: `http://localhost:8001` のPython FastAPIサーバー
- **本番環境**: Firebase Functions上のAPIエンドポイント
- **レスポンス差異対応**: Pydantic vs 標準JSONレスポンス

## 環境の切り替え

環境は `TEST_ENV` 環境変数で制御されます：

```bash
# ローカル開発環境でテスト実行
TEST_ENV=local npm run test:e2e:local

# Firebase本番環境でテスト実行  
TEST_ENV=production npm run test:e2e:production
```

## 利用可能なコマンド

### ローカル開発環境

```bash
# ローカル環境でChrmoiumのみでテスト実行
npm run test:e2e:local

# ローカル環境でUI付きテスト実行
npm run test:e2e:local:ui

# 直接実行する場合
TEST_ENV=local npx playwright test --project=chromium-local
```

### Firebase本番環境

```bash
# 本番環境で全ブラウザでテスト実行
npm run test:e2e:production

# 本番環境でUI付きテスト実行
npm run test:e2e:production:ui

# 直接実行する場合
TEST_ENV=production npx playwright test
```

## 環境設定の詳細

### ローカル開発環境 (local)

- **フロントエンドURL**: `http://127.0.0.1:3000`
- **APIベースURL**: `http://localhost:8001`
- **タイムアウト**: 30秒
- **リトライ回数**: 0回
- **対象ブラウザ**: Chromium のみ
- **前提条件**: Dockerコンテナが起動済み

### Firebase本番環境 (production)

- **フロントエンドURL**: `https://liff-survey-app-20250809-282a6.web.app`
- **APIベースURL**: `https://asia-northeast1-liff-survey-app-20250809-282a6.cloudfunctions.net/api`
- **タイムアウト**: 45秒
- **リトライ回数**: 2回
- **対象ブラウザ**: 全ブラウザ（Chromium, Firefox, Webkit, Mobile Chrome, Mobile Safari）
- **前提条件**: Firebase上にアプリケーションがデプロイ済み

## 実行例

### 1. ローカル開発環境でのテスト

```bash
# Dockerコンテナを起動
docker-compose up -d

# E2Eテストを実行
npm run test:e2e:local
```

### 2. Firebase本番環境でのテスト

```bash
# 本番環境のE2Eテストを実行
npm run test:e2e:production
```

## 設定ファイル

- `tests/e2e/config/environments.ts`: 環境設定の定義
- `playwright.config.ts`: Playwright の設定（環境に応じて動的に変更）

## トラブルシューティング

### ローカル環境でテストが失敗する場合

1. Dockerコンテナが起動していることを確認
   ```bash
   docker ps
   ```

2. フロントエンドとバックエンドが正常に動作していることを確認
   ```bash
   curl http://localhost:3000
   curl http://localhost:8001/health
   ```

### 本番環境でテストが失敗する場合

1. Firebase上のアプリケーションが正常に動作していることを確認
2. ネットワーク環境やファイアウォール設定を確認
3. APIエンドポイントが正常にレスポンスを返すことを確認

## 環境設定の変更

新しい環境を追加する場合は、`tests/e2e/config/environments.ts` にエントリを追加してください：

```typescript
export const environments: Record<string, TestEnvironment> = {
  // 既存の環境設定...
  staging: {
    name: 'staging',
    frontendUrl: 'https://staging-app.web.app',
    apiBaseUrl: 'https://staging-api.cloudfunctions.net/api',
    timeout: 40000,
    retries: 1,
    description: 'ステージング環境'
  }
};
```
