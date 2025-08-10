"""テスト用設定ファイル"""
import os

# テスト用のベースURL（Docker環境対応）
BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8080")

# テスト用のFirestoreプロジェクトID
TEST_PROJECT_ID = os.getenv("TEST_PROJECT_ID", "demo-project")

# テスト用のサンプルデータ（実際のAPIレスポンス構造に合わせて修正）
SAMPLE_SURVEY_DATA = {
    "age": "20-29",
    "gender": "male", 
    "frequency": "weekly",
    "satisfaction": "4",
    "feedback": "とても良いサービスです",
    "userId": "test-user-001",
    "displayName": "テストユーザー"
}

# 無効なデータ（バリデーションテスト用）
INVALID_SURVEY_DATA = {
    "age": "invalid-age",
    "gender": "",
    "frequency": "invalid-frequency", 
    "satisfaction": "10",  # 1-5の範囲外
    "feedback": "",
    "userId": "",
    "displayName": ""
}

# テスト用の複数データセット
MULTIPLE_TEST_DATA = [
    {
        "age": "20-29",
        "gender": "male",
        "frequency": "daily",
        "satisfaction": "5",
        "feedback": "素晴らしいサービスです",
        "userId": "test-user-multi-001",
        "displayName": "テストユーザー1"
    },
    {
        "age": "30-39", 
        "gender": "female",
        "frequency": "weekly",
        "satisfaction": "4",
        "feedback": "満足しています",
        "userId": "test-user-multi-002", 
        "displayName": "テストユーザー2"
    },
    {
        "age": "40-49",
        "gender": "other",
        "frequency": "monthly", 
        "satisfaction": "3",
        "feedback": "普通です",
        "userId": "test-user-multi-003",
        "displayName": "テストユーザー3"
    }
]
