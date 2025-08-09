# LIFF Survey Project

LINE Front-end Framework (LIFF) を利用したアンケートシステムです。フロントエンドとバックエンドを同一リポジトリで管理するモノリポ構成になっています。

## プロジェクト構成

```
liff-survey-project/
├── frontend/                    # フロントエンド (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/         # Reactコンポーネント
│   │   ├── hooks/              # カスタムフック
│   │   ├── types/              # TypeScript型定義
│   │   ├── utils/              # ユーティリティ関数
│   │   ├── services/           # API通信サービス
│   │   ├── App.tsx             # メインアプリコンポーネント
│   │   ├── main.tsx            # エントリーポイント
│   │   └── index.css           # グローバルスタイル
│   ├── public/                 # 静的ファイル
│   ├── tests/e2e/              # Playwright E2Eテスト
│   ├── package.json            # フロントエンド依存関係
│   ├── tsconfig.json           # TypeScript設定
│   ├── playwright.config.ts    # Playwright設定
│   ├── vite.config.ts          # Vite設定
│   ├── .env.development        # 開発環境変数
│   ├── .env.production         # 本番環境変数
│   └── .env.example            # 環境変数サンプル
├── functions/                   # Firebase Functions (Node.js)
│   ├── index.js                # Cloud Functions エントリーポイント
│   └── package.json            # Functions依存関係
├── dist/                       # ビルド成果物（Firebase Hosting用）
│   ├── assets/
│   └── index.html
├── backend/                     # 参考用・移行前実装
│   ├── main.py                 # FastAPIメインアプリケーション（参考用）
│   ├── simple_functions.py     # Flask移行実装（参考用）
│   ├── requirements.txt        # Python依存関係
│   └── requirements-functions.txt # Cloud Functions用依存関係
├── firebase.json               # Firebase設定
├── firestore.rules             # Firestore セキュリティルール
├── firestore.indexes.json      # Firestore インデックス設定
├── README.md                   # このファイル
└── .gitignore                  # Git除外設定
```

## 技術スタック

### フロントエンド
- **React 18**: UIライブラリ
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール
- **TailwindCSS**: ユーティリティファーストCSS
- **Vitest**: ユニットテストフレームワーク
- **Playwright**: E2Eテストフレームワーク
- **LIFF SDK**: LINE Front-end Framework
- **Firebase Hosting**: ホスティングプラットフォーム

### バックエンド
- **FastAPI**: 高性能Python Webフレームワーク
- **Pydantic**: データバリデーション
- **Google Cloud Firestore**: NoSQLデータベース
- **Google Cloud Run**: サーバーレスコンテナプラットフォーム
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
cd ../backend

# 仮想環境を作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係をインストール
pip install -r requirements.txt
```

### 4. Firebase設定

```bash
cd ../frontend

# Firebase CLIをインストール
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# Firebaseプロジェクトを初期化
firebase init hosting

# .firebasercでプロジェクトIDを設定
```

### 5. Google Cloud設定

```bash
# Google Cloud CLIをインストール
# https://cloud.google.com/sdk/docs/install

# ログイン
gcloud auth login

# プロジェクトを設定
gcloud config set project YOUR_PROJECT_ID

# Firestore APIを有効化
gcloud services enable firestore.googleapis.com
```

### 6. LINE LIFF設定

1. [LINE Developers Console](https://developers.line.biz/) でLIFFアプリを作成
2. エンドポイントURLを設定（Firebase Hosting URL）
3. LIFF IDを `.env` ファイルに設定

## 開発

### フロントエンド開発サーバー

```bash
cd frontend

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
# http://localhost:3000 で起動
```

### バックエンド開発サーバー

```bash
cd backend
source venv/bin/activate
python main.py
# http://localhost:8000 で起動
```

### テスト実行

```bash
cd frontend

# ユニットテスト
npm run test

# ユニットテスト（ウォッチモード）
npm run test

# ユニットテスト（カバレッジ付き）
npm run test:coverage

# E2Eテスト
npm run test:e2e

# E2Eテスト（UIモード）
npm run test:e2e:ui
```

### 同時開発

```bash
# ターミナル1: フロントエンド
cd frontend && npm run dev

# ターミナル2: バックエンド  
cd backend && python main.py
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

### バックエンドデプロイ (Google Cloud Run)

```bash
cd backend

# Dockerイメージをビルド
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/liff-survey-api

# Cloud Runにデプロイ
gcloud run deploy liff-survey-api \
  --image gcr.io/YOUR_PROJECT_ID/liff-survey-api \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080
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
- 📱 LIFFアプリとしてLINE内で動作
- ⚡ React + TypeScriptによる型安全な開発
- 📝 多様な質問形式（選択肢、評価、自由記述）
- ✅ リアルタイムバリデーション
- 🎨 レスポンシブデザイン
- 🔄 オフライン対応（ローカルストレージバックアップ）

### バックエンド
- 🚀 FastAPIによる高性能API
- 💾 Firestoreでのデータ永続化
- 📊 リアルタイム統計計算
- 🛡️ Pydanticによるデータバリデーション
- 📝 自動API仕様書生成（/docs）
- 🔍 構造化ログ出力

## 環境変数

### フロントエンド (.env)
```
VITE_LIFF_ID=your-liff-id
VITE_API_BASE_URL=https://your-cloud-run-url
```

### バックエンド
```
PORT=8080
GOOGLE_CLOUD_PROJECT=your-project-id
```

## モニタリング

### フロントエンド
- Firebase Hosting コンソール
- ブラウザ開発者ツール

### バックエンド  
```bash
# Cloud Run ログ
gcloud logs read --service=liff-survey-api

# Firestore モニタリング
# https://console.cloud.google.com/firestore
```

## セキュリティ

- CORS設定によるオリジン制限
- Pydanticによる入力値検証
- Firebase Security Rulesでのデータアクセス制御
- Cloud Run IAMによるアクセス制御

## トラブルシューティング

### よくある問題

1. **LIFF初期化エラー**
   - LIFF IDが正しく設定されているか確認
   - HTTPSでアクセスしているか確認

2. **API接続エラー**
   - Cloud RunのURLが正しいか確認
   - CORSエラーの場合は、バックエンドのCORS設定を確認

3. **ビルドエラー**
   - 依存関係が正しくインストールされているか確認
   - Node.js/Python のバージョンを確認

## ライセンス

MIT License
