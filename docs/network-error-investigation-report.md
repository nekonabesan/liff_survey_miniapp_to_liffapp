# Network Error 解決記録

## 概要
- **問題**: アンケート画面の「Network Error」
- **原因**: docker-compose.ymlのAPIエンドポイント設定ミス
- **解決日**: 2025年8月10日

## 根本原因
フロントエンドの環境変数でAPIエンドポイントが間違っていた：
- **誤**: `http://localhost:8000` (停止中のサービス)
- **正**: `http://localhost:8001` (Python FastAPI)

## 修正内容
```yaml
# docker-compose.yml
environment:
  - VITE_API_BASE_URL=http://localhost:8001  # 修正
```

## 結果
- 全E2Eテスト通過 (21/21件)
- ネットワーク接続正常化
- アンケート機能復旧完了

## 再発防止策
- 環境変数の定期確認
- 自動ヘルスチェックの実装
- ドキュメントの最新化
