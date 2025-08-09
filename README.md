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
│   │   ├── App.tsx             # メインアプリコンポーネント
│   │   ├── main.tsx            # エントリーポイント
│   │   └── index.css           # グローバルスタイル
│   ├── public/                 # 静的ファイル
│   ├── package.json            # フロントエンド依存関係
│   ├── tsconfig.json           # TypeScript設定
│   ├── vite.config.ts          # Vite設定
│   ├── firebase.json           # Firebase Hosting設定
│   ├── .firebaserc             # Firebase プロジェクト設定
│   └── .env.example            # 環境変数サンプル
├── backend/                     # バックエンド (FastAPI)
│   ├── main.py                 # FastAPIメインアプリケーション
│   ├── requirements.txt        # Python依存関係
│   ├── Dockerfile              # Docker設定
│   └── .dockerignore           # Docker除外設定
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

## Firebase Hosting デプロイとLINE Developers連携

### 1. Firebase プロジェクト作成とセットアップ

#### 必要なツール
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Google Cloud Console](https://console.cloud.google.com/)
- [LINE Developers Console](https://developers.line.biz/console/)

#### Firebaseプロジェクト作成
```bash
cd frontend

# Firebase CLIでログイン
npx firebase login

# 利用可能なプロジェクト一覧を確認
npx firebase projects:list

# 新しいFirebaseプロジェクトを作成
npx firebase projects:create liff-survey-app-20250809-282a6 --display-name "LIFF Survey App 2025"

# 作成されたプロジェクトを使用
npx firebase use liff-survey-app-20250809-282a6
```

#### プロジェクト設定ファイルの更新
```bash
# .firebasercファイルの確認
cat .firebaserc

# firebase.jsonファイルの確認  
cat firebase.json
```

### 2. Firebase Hosting デプロイ

#### ビルドとデプロイ
```bash
cd frontend

# プロジェクトをビルド
npm run build

# Firebase Hostingにデプロイ
npx firebase deploy --only hosting
```

#### デプロイ成功後の確認事項
- **Hosting URL**: `https://liff-survey-app-20250809-282a6.web.app`
- **Firebase Console**: `https://console.firebase.google.com/project/liff-survey-app-20250809-282a6/overview`

### 3. LINE Developers Console での設定

#### 3.1 新しいチャネル作成
1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. 「新しいチャネルを作成」をクリック
3. チャネルタイプ：**Messaging API** を選択
4. 基本情報を入力：
   - チャネル名: `LIFF Survey App`
   - チャネル説明: `アンケートシステム`
   - 大業種・小業種: 適切なカテゴリを選択

#### 3.2 LIFF アプリの追加
1. 作成したチャネルの管理画面にアクセス
2. 「LIFF」タブをクリック
3. 「追加」ボタンをクリック
4. LIFF アプリ情報を入力：
   - **LIFFアプリ名**: `Survey App`
   - **サイズ**: `Full`
   - **エンドポイントURL**: `https://liff-survey-app-20250809-282a6.web.app`
   - **Scope**: `profile openid` (デフォルト)
   - **ボットリンク機能**: `On` (推奨)
   - **BLE feature**: `Off` (通常は不要)

#### 3.3 LIFF ID の取得
1. 作成されたLIFFアプリの詳細画面で **LIFF ID** をコピー
2. 形式例: `1234567890-abcdefgh`

### 4. 環境変数設定と再デプロイ

#### 環境変数ファイル作成
```bash
cd frontend

# 本番用環境変数ファイルを作成
echo "VITE_LIFF_ID=YOUR_ACTUAL_LIFF_ID_HERE" > .env.production

# 例：取得したLIFF IDで設定
echo "VITE_LIFF_ID=1234567890-abcdefgh" > .env.production
```

#### LIFF ID設定後の再デプロイ
```bash
# 環境変数を含めて再ビルド
npm run build

# 再デプロイ
npx firebase deploy --only hosting
```

### 5. 動作確認

#### テスト方法
1. **ブラウザでの確認**
   - URL: `https://liff-survey-app-20250809-282a6.web.app`
   - LIFF SDKエラーが表示されるが正常（LINE外のため）

2. **LINEアプリでの確認**
   - LIFF URLを開く: `line://app/YOUR_LIFF_ID`
   - 又は LINE Developers Console の「Endpoint URL」からアクセス

3. **友だち追加での確認**
   - LINE Bot の QR コードをスキャン
   - リッチメニューにLIFFアプリのリンクを設定

### トラブルシューティング

#### よくあるエラーと解決方法

**1. `Error: Failed to create project because there is already a project with ID`**
```bash
# 解決方法：ユニークなプロジェクトIDを使用
npx firebase projects:create liff-survey-app-$(date +%Y%m%d%H%M) --display-name "LIFF Survey App"
```

**2. `Request had HTTP Error: 404, Requested entity was not found`**
```bash
# 解決方法：Firebase Consoleで手動でプロジェクト作成
# https://console.firebase.google.com/ でプロジェクト作成後
npx firebase use your-project-id
```

**3. `Error: Failed to add Firebase to Google Cloud Platform project`**
```bash
# 解決方法：Firebase Consoleでの手動設定
# 1. https://console.firebase.google.com/ にアクセス
# 2. 「プロジェクトを追加」→「既存のGoogle Cloudプロジェクトを選択」
# 3. Hostingを有効化
```

**4. `Permission denied` エラー**
```bash
# 解決方法：Firebase再ログイン
npx firebase logout
npx firebase login
```

**5. LIFF初期化エラー `LIFF IDが設定されていません`**
```bash
# 解決方法：環境変数の確認
cat .env.production
# VITE_LIFF_ID=your-actual-liff-id が設定されているか確認

# 再ビルド・再デプロイ
npm run build
npx firebase deploy --only hosting
```

#### デバッグ用コマンド
```bash
# Firebase設定確認
npx firebase projects:list
cat .firebaserc
cat firebase.json

# ビルド内容確認
ls -la dist/

# ログ確認
cat firebase-debug.log

# 環境変数確認（ビルド時）
npm run build -- --mode production
```

#### 外部リンク
- **Firebase Console**: https://console.firebase.google.com/
- **LINE Developers Console**: https://developers.line.biz/console/
- **Firebase CLI Documentation**: https://firebase.google.com/docs/cli
- **LIFF Documentation**: https://developers.line.biz/ja/docs/liff/overview/
- **Google Cloud Console**: https://console.cloud.google.com/

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
