# LIFF Survey Project

LINE Front-end Framework (LIFF) を利用したアンケートシステムです。フロントエンドとバックエンドを同一リポジトリで管理するモノリポ構成になっています。

## プロジェクト構成

```
liff_survey_project/
├── frontend/                    # フロントエンド (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/         # Reactコンポーネント
│   │   ├── hooks/              # カスタムフック
│   │   ├── types/              # TypeScript型定義
│   │   ├── utils/              # ユーティリティ関数
│   │   ├── services/           # API通信サービス
│   │   ├── test/               # Vitestユニットテスト
│   │   ├── App.tsx             # メインアプリコンポーネント
│   │   └── main.tsx            # エントリーポイント
│   ├── tests/e2e/              # Playwright E2Eテスト
│   │   ├── config/            # テスト環境設定
│   │   ├── integration.spec.ts   # API統合テスト
│   │   ├── survey.spec.ts        # フロントエンドUIテスト
│   │   └── README.md             # E2Eテストドキュメント
│   ├── package.json            # フロントエンド依存関係
│   ├── firebase.json           # Firebase Hosting設定
│   ├── playwright.config.ts    # Playwright設定
│   ├── vite.config.ts          # Vite設定
│   ├── .env.development        # 開発環境変数
│   └── .env.production         # 本番環境変数
├── backend/                     # バックエンド API (Python FastAPI + Firebase Functions)
│   ├── tests/                  # バックエンドテスト
│   │   ├── unit/              # ユニットテスト
│   │   ├── integration/       # 統合テスト
│   │   ├── e2e/               # E2Eテスト
│   │   └── README.md          # テストガイド
│   ├── main.py                 # FastAPIメインアプリケーション（ローカル開発用）
│   ├── functions_main.py       # Firebase Functions実装
│   ├── requirements.txt        # Python依存関係
│   └── requirements-functions.txt # Cloud Functions用依存関係
├── docs/                       # プロジェクトドキュメント
├── firebase.json               # Firebase設定
├── firestore.rules             # Firestore セキュリティルール
├── firestore.indexes.json      # Firestore インデックス設定
├── docker-compose.yml          # Docker開発環境設定
├── Makefile                    # 開発・テスト・デプロイコマンド
└── README.md                   # このファイル
```

## 技術スタック

### フロントエンド
- **React 18**: UIライブラリ
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール
- **TailwindCSS**: ユーティリティファーストCSS
- **Vitest**: ユニットテストフレームワーク
- **Playwright**: E2Eテストフレームワーク（環境毎設定対応）
- **LIFF SDK**: LINE Front-end Framework
- **Firebase Hosting**: ホスティングプラットフォーム

### バックエンド
- **FastAPI**: 高性能Python Webフレームワーク（ローカル開発用）
- **Firebase Functions**: サーバーレス関数（本番環境）
- **Pydantic**: データバリデーション
- **Google Cloud Firestore**: NoSQLデータベース
- **Docker**: コンテナ化
- **Pytest**: テストフレームワーク

## セットアップ

### 前提条件

- Node.js 18以上
- Python 3.11以上
- Firebase CLI
- Google Cloud CLI
- LINE Developers アカウント

### 1. リポジトリのクローン

```bash
git clone https://github.com/nekonabesan/liff_survey_project.git
cd liff_survey_project
```

### 2. フロントエンドのセットアップ

```bash
cd frontend

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env
# .envファイルを編集してLIFF IDとAPI URLを設定
```

### 3. バックエンドのセットアップ

```bash
cd backend

# 仮想環境を作成・アクティベート
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係をインストール
pip install -r requirements.txt
```

### 4. Firebase設定

```bash
# Firebase CLIをインストール
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# プロジェクトIDを確認・設定
firebase use --add
```

### 5. Google Cloud設定

```bash
# Google Cloud CLIをインストール（Firebase Functionsで必要）
# https://cloud.google.com/sdk/docs/install

# ログイン
gcloud auth login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# 必要なAPIを有効化
gcloud services enable firestore.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
```

### 6. LINE LIFF設定

1. [LINE Developers Console](https://developers.line.biz/) でLIFFアプリを作成
2. エンドポイントURLを設定（Firebase Hosting URL）
3. LIFF IDを環境変数ファイルに設定

## 開発

### Docker開発環境（推奨）

**前提条件:**
- Docker Desktop がインストールされている
- Docker Compose が利用可能

#### 全サービス一括起動

```bash
# 初回ビルド
make build

# 開発環境起動
make up

# サービス確認
make logs

# 開発環境停止
make down
```

#### 個別サービス操作

```bash
# フロントエンド（React + Vite）
# http://localhost:3000
make logs-frontend

# バックエンド（Python FastAPI + Firebase Functions エミュレータ）
# Python API: http://localhost:8001
# Firebase Functions: http://localhost:8000
make logs-backend

# コンテナシェルアクセス
make shell-frontend
make shell-backend

# テスト実行
make test-unit      # Vitestユニットテスト
make test-e2e       # Playwright E2Eテスト（ローカル環境）
make test-e2e-prod  # Playwright E2Eテスト（本番環境）
```

#### 利用可能なMakeコマンド

```bash
make build          # 全コンテナビルド
make up             # 開発環境起動
make down           # 開発環境停止
make logs           # 全サービスログ表示
make logs-frontend  # フロントエンドログ
make logs-backend   # バックエンドログ
make shell-frontend # フロントエンドシェル
make shell-backend  # バックエンドシェル
make test-unit      # ユニットテスト
make test-e2e       # E2Eテスト（ローカル環境）
make test-e2e-prod  # E2Eテスト（本番環境）
make clean          # 停止＋イメージ削除
```

### ローカル開発（非Docker）

#### フロントエンド開発サーバー

```bash
cd frontend

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
# http://localhost:3000 で起動
```

#### バックエンド開発サーバー

```bash
cd backend
source venv/bin/activate

# ローカル開発用FastAPIサーバー
python main.py
# http://localhost:8000 で起動

# またはFirebase Functions エミュレータ
firebase emulators:start --only functions
# http://localhost:5001 で起動
```

### テスト実行

#### ユニットテスト

```bash
cd frontend

# ユニットテスト
npm run test

# ユニットテスト（ウォッチモード）
npm run test

# ユニットテスト（カバレッジ付き）
npm run test:coverage
```

#### E2Eテスト（End-to-End Testing）

E2Eテストは環境毎に設定を切り替えて実行できます。

**ローカル開発環境**（Dockerコンテナ上のサーバーを対象）：
```bash
# 前提: Dockerコンテナが起動済み
make up  # または docker-compose up -d

# ローカル環境E2Eテスト（Chromiumのみ）
npm run test:e2e:local

# ローカル環境E2Eテスト（UIモード）
npm run test:e2e:local:ui

# 環境変数による直接実行
TEST_ENV=local npx playwright test --project=chromium-local
```

**Firebase本番環境**（デプロイ済みアプリケーションを対象）：
```bash
# 本番環境E2Eテスト（全ブラウザ）
npm run test:e2e:production

# 本番環境E2Eテスト（UIモード）
npm run test:e2e:production:ui

# 環境変数による直接実行
TEST_ENV=production npx playwright test
```

**レガシーコマンド**（従来の実行方法）：
```bash
# デフォルト設定でのE2Eテスト
npm run test:e2e

# E2Eテスト（UIモード）
npm run test:e2e:ui
```

#### E2Eテスト環境設定

| 環境 | フロントエンドURL | APIURL | タイムアウト | リトライ | 対象ブラウザ |
|------|------------------|--------|-------------|----------|-------------|
| ローカル | `http://127.0.0.1:3000` | `http://localhost:8001` | 30秒 | 0回 | Chromium |
| 本番 | `https://liff-survey-app-*.web.app` | `https://asia-northeast1-*.cloudfunctions.net/api` | 45秒 | 2回 | 全ブラウザ |

#### テストカテゴリ

- **API統合テスト**: バックエンドAPIの動作確認
- **フロントエンド統合テスト**: UIとAPIの連携確認
- **フォーム動作テスト**: アンケートフォームの機能確認
- **レスポンシブテスト**: モバイル対応確認

#### トラブルシューティング

**ローカルE2Eテストが失敗する場合：**
```bash
# Dockerコンテナの状態確認
docker ps

# サービスの動作確認
curl http://localhost:3000
curl http://localhost:8001/health

# コンテナログ確認
make logs
```

**本番E2Eテストが失敗する場合：**
- Firebase Hostingのデプロイ状況を確認
- Cloud Functionsの動作状況を確認
- ネットワーク接続を確認

### 同時開発

```bash
# ターミナル1: フロントエンド
cd frontend && npm run dev

# ターミナル2: バックエンド  
cd backend && python main.py

# またはDockerを使用
make up
```

## デプロイ

### フロントエンドデプロイ (Firebase Hosting)

```bash
cd frontend

# ビルド
npm run build

# デプロイ
firebase deploy --only hosting
```

### バックエンドデプロイ (Firebase Functions)

```bash
# Firebase Functions をデプロイ
firebase deploy --only functions

# または Makefile を使用
make deploy-functions
```

## API エンドポイント

### POST /survey/submit
アンケート回答を保存

**リクエストボディ:**
```json
{
  "age": "20-29",
  "gender": "male", 
  "frequency": "weekly",
  "satisfaction": "4",
  "feedback": "とても良いサービスです",
  "userId": "line-user-id",
  "displayName": "ユーザー名"
}
```

### GET /survey/results
アンケート結果を取得（管理者用）

**クエリパラメータ:**
- `limit`: 取得件数 (デフォルト: 100)
- `offset`: オフセット (デフォルト: 0)

### GET /health
ヘルスチェック

## 機能

### フロントエンド
- LIFFアプリとしてLINE内で動作
- React + TypeScriptによる型安全な開発
- 多様な質問形式（選択肢、評価、自由記述）
- リアルタイムバリデーション
- レスポンシブデザイン
- オフライン対応（ローカルストレージバックアップ）
- 包括的E2Eテスト（ローカル・本番環境対応）

### バックエンド
- FastAPIによる高性能API
- Firestoreでのデータ永続化
- リアルタイム統計計算
- Pydanticによるデータバリデーション
- 自動API仕様書生成（/docs）
- 構造化ログ出力

## 環境変数

### フロントエンド (.env)
```
VITE_LIFF_ID=2007896892-VeJZPJEJ
VITE_API_BASE_URL=https://asia-northeast1-your-project-id.cloudfunctions.net/api
```

### バックエンド
```
# Firebase Functions で自動設定
GCLOUD_PROJECT=your-project-id
FUNCTION_REGION=asia-northeast1
```

## モニタリング

### フロントエンド
- Firebase Hosting コンソール
- ブラウザ開発者ツール

### バックエンド  
```bash
# Firebase Functions ログ
firebase functions:log

# Firebase コンソール
# https://console.firebase.google.com/project/your-project-id/functions

# Firestore モニタリング
# https://console.cloud.google.com/firestore
```

## セキュリティ

- CORS設定によるオリジン制限
- Pydanticによる入力値検証
- Firebase Security Rulesでのデータアクセス制御
- Firebase Functions IAMによるアクセス制御

## トラブルシューティング

### よくある問題

1. **LIFF初期化エラー**
   - LIFF IDが正しく設定されているか確認
   - HTTPSでアクセスしているか確認

2. **API接続エラー**
   - Firebase Functions のURLが正しいか確認
   - CORSエラーの場合は、バックエンドのCORS設定を確認

3. **ビルドエラー**
   - 依存関係が正しくインストールされているか確認
   - Node.js/Python のバージョンを確認

## Firebase Token作成
```
firebase login
```

コンソールに表示されたURLを押下

ブラウザ上でログイン認証

```
firebase login:ci
```

コンソール上にトークンが表示される

トークンをGithubリポジトリのSetting＞Actions secrets and variables＞actionsから登録