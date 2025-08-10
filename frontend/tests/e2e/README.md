# E2Eテスト環境設定ガイド

## 概要

LIFF Survey ProjectのE2Eテストは複数環境で実行可能：

- **ローカル開発環境**: Dockerコンテナで起動したサーバーを対象
- **Firebase本番環境**: Firebase上にデプロイされたアプリケーションを対象

## テスト範囲

- **API統合テスト**: バックエンドAPIとの通信確認
- **UIコンポーネントテスト**: Reactコンポーネントの動作確認
- **フォーム機能テスト**: アンケートフォームの送信・バリデーション
- **レスポンシブテスト**: モバイル対応の確認

## 環境の切り替え

```bash
# ローカル開発環境
TEST_ENV=local npm run test:e2e:local

# Firebase本番環境
TEST_ENV=production npm run test:e2e:production
```

## 利用可能なコマンド

### ローカル開発環境
```bash
# Chrmoiumのみでテスト実行
npm run test:e2e:local

# UI付きテスト実行
npm run test:e2e:local:ui

# 直接実行
TEST_ENV=local npx playwright test --project=chromium-local
```

### Firebase本番環境
```bash
# 全ブラウザでテスト実行
npm run test:e2e:production

# UI付きテスト実行
npm run test:e2e:production:ui

# 直接実行
TEST_ENV=production npx playwright test
```

## 環境設定

| 環境 | フロントエンドURL | API URL | タイムアウト | リトライ | ブラウザ |
|------|------------------|---------|-------------|----------|----------|
| ローカル | `http://127.0.0.1:3000` | `http://localhost:8001` | 30秒 | 0回 | Chromium |
| 本番 | `https://liff-survey-app-*.web.app` | `https://asia-northeast1-*.cloudfunctions.net/api` | 45秒 | 2回 | 全ブラウザ |

## トラブルシューティング

### ローカル環境
```bash
# Dockerコンテナ状態確認
docker ps

# サービス動作確認
curl http://localhost:3000
curl http://localhost:8001/health

# ログ確認
make logs
```

### 本番環境
- Firebase Hostingのデプロイ状況を確認
- Cloud Functionsの動作状況を確認
- ネットワーク接続を確認
