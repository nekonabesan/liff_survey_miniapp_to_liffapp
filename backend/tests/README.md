# Backend API テストガイド

## テスト構造

整理されたテスト構造により、効率的かつ体系的なテストを実施できます。

```
tests/
├── __init__.py
├── config.py              # テスト設定・共通データ
├── conftest.py            # pytest設定・フィクスチャ
├── unit/                  # ユニットテスト（高速・単体機能）
│   ├── test_health.py          # Health エンドポイント
│   ├── test_survey_submit.py   # Survey Submit エンドポイント
│   ├── test_survey_results.py  # Survey Results エンドポイント
│   └── test_liff_features.py   # LIFF特有機能
├── integration/           # 統合テスト（中速・複数コンポーネント）
│   └── test_api_flow.py        # API間の連携フロー
└── e2e/                  # E2Eテスト（低速・全体フロー）
    └── test_api_e2e.py         # 実HTTP通信での全体テスト
```

## テストカテゴリ

### Unit Tests (`tests/unit/`)
- **特徴**: 高速、単体機能のテスト
- **対象**: 個別エンドポイントの機能
- **実行時間**: < 1秒
- **モック**: Firestoreなど外部依存をモック

### Integration Tests (`tests/integration/`)
- **特徴**: 中速、複数コンポーネント間のテスト
- **対象**: API間の連携、データフロー
- **実行時間**: 1-5秒
- **モック**: 一部外部依存をモック

### E2E Tests (`tests/e2e/`)
- **特徴**: 低速、実環境に近いテスト
- **対象**: ユーザージャーニー全体
- **実行時間**: 5-30秒
- **モック**: 最小限

### フロントエンド連携テスト
バックエンドAPIテストに加えて、フロントエンド側でもPlaywrightによるE2Eテストを実施：
- **ローカル環境**: `http://localhost:8001` のPython FastAPIサーバーを対象
- **本番環境**: Firebase Functions上のAPIを対象
- **フロントエンド**: ReactアプリからのAPI呼び出しテスト

## 実行方法

### 全テスト実行
```bash
# Docker Compose経由（推奨）
make test-backend

# 直接実行
cd backend
python -m pytest
```

### カテゴリ別実行
```bash
# ユニットテストのみ
python -m pytest tests/unit/ -m unit

# 統合テストのみ
python -m pytest tests/integration/ -m integration

# E2Eテストのみ
python -m pytest tests/e2e/ -m e2e
```

### エンドポイント別実行
```bash
# Health エンドポイント
python -m pytest tests/unit/test_health.py

# Survey Submit エンドポイント
python -m pytest tests/unit/test_survey_submit.py

# Survey Results エンドポイント
python -m pytest tests/unit/test_survey_results.py
```

### 詳細オプション
```bash
# 詳細出力
python -m pytest -v

# 失敗時の詳細情報
python -m pytest --tb=long

# 特定のテストケース
python -m pytest tests/unit/test_health.py::TestHealthEndpoint::test_health_check_success

# 並列実行（pytest-xdist使用時）
python -m pytest -n auto
```

## テストデータ

### サンプルデータ
`tests/config.py` で定義された標準的なテストデータ:
- `SAMPLE_SURVEY_DATA`: 正常なアンケートデータ
- `INVALID_SURVEY_DATA`: バリデーションエラー用データ
- `MULTIPLE_TEST_DATA`: 複数件テスト用データ

### テスト環境変数
- `TEST_BASE_URL`: APIベースURL（デフォルト: http://localhost:8000）
- `FIRESTORE_EMULATOR_HOST`: Firestoreエミュレータホスト（デフォルト: localhost:8080）
- `PROJECT_ID`: FirestoreプロジェクトID（デフォルト: demo-project）

## カバレッジ目標

### 主要エンドポイント
- **Health (`/health`)**: 基本機能、レスポンス形式、パフォーマンス
- **Survey Submit (`/survey/submit`)**: 正常送信、バリデーション、エラーハンドリング
- **Survey Results (`/survey/results`)**: データ取得、ページネーション、統計情報

### LIFF特有機能
- LINE User ID形式のバリデーション
- 日本語テキストの適切な処理
- オプションフィールドの処理

### ビジネスロジック
- 満足度スコア（1-5）のバリデーション
- 年齢グループの選択肢制限
- 利用頻度の選択肢制限
- 性別の選択肢制限

## CI/CD統合

### GitHub Actions例
```yaml
name: Backend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Unit Tests
        run: make test-backend
      - name: Run Integration Tests
        run: cd backend && python -m pytest tests/integration/ -v
      - name: Run E2E Tests (main branch only)
        if: github.ref == 'refs/heads/main'
        run: cd backend && python -m pytest tests/e2e/ -v
```

## トラブルシューティング

### よくある問題

1. **Import エラー**
   ```bash
   # パスの問題を解決
   export PYTHONPATH=/app:$PYTHONPATH
   ```

2. **Firestore接続エラー**
   ```bash
   # エミュレータの起動確認
   make logs
   # または
   docker ps | grep firestore
   ```

3. **テストデータの競合**
   ```bash
   # 一意なIDを使用
   test_data["userId"] = f"test-{int(time.time())}"
   ```

### デバッグ手順
1. 単体テストから段階的に実行
2. ログ出力の確認
3. モックの設定確認
4. 環境変数の確認

## 保守・拡張

### 新しいエンドポイント追加時
1. `tests/unit/` に対応するテストファイル作成
2. `tests/integration/` で他エンドポイントとの連携テスト追加
3. `tests/e2e/` でユーザージャーニーに組み込み

### テストデータ更新時
1. `tests/config.py` のデータ定義更新
2. 関連テストケースの更新確認
3. バリデーションルール変更の反映
