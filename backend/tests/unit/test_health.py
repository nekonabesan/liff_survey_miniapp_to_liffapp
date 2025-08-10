"""Health エンドポイントのユニットテスト"""
import pytest
from fastapi.testclient import TestClient
from tests.config import BASE_URL
import requests


class TestHealthEndpoint:
    """Health エンドポイントのテストクラス"""
    
    def test_health_check_success(self, client: TestClient):
        """ヘルスチェック基本機能のテスト"""
        response = client.get("/health")

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

        data = response.json()
        assert data["success"] is True
        assert "message" in data
        assert "data" in data
        assert data["data"]["status"] == "OK"
        assert "timestamp" in data["data"]
        # テスト環境ではFirestoreがないのでFalseになる
        assert "firestore_available" in data["data"]

    def test_health_check_response_format(self, client: TestClient):
        """レスポンス形式の詳細テスト"""
        response = client.get("/health")
        data = response.json()
        
        # レスポンス構造の確認
        required_fields = ["success", "message", "data", "error"]
        for field in required_fields:
            assert field in data
        
        # dataフィールド内の構造確認
        data_fields = ["status", "timestamp", "firestore_available"]
        for field in data_fields:
            assert field in data["data"]
    
    def test_health_check_response_time(self, client: TestClient):
        """レスポンス時間のテスト"""
        import time
        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()
        
        assert response.status_code == 200
        # 1秒以内のレスポンスを期待
        assert (end_time - start_time) < 1.0
