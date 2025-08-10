"""Survey Results エンドポイントのユニットテスト"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch


class TestSurveyResultsEndpoint:
    """Survey Results エンドポイントのテストクラス"""
    
    def test_get_results_success(self, client: TestClient, mock_firestore, mock_document):
        """正常な結果取得のテスト"""
        response = client.get("/survey/results")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "responses" in data["data"]
        assert "pagination" in data["data"]
        assert "statistics" in data["data"]
    
    def test_get_results_with_pagination(self, client: TestClient, mock_firestore, mock_document):
        """ページネーション機能のテスト"""
        # limitパラメータのテスト
        response = client.get("/survey/results?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert data["data"]["pagination"]["limit"] == 5
        
        # offsetパラメータのテスト
        response = client.get("/survey/results?offset=10")
        assert response.status_code == 200
        
        data = response.json()
        assert data["data"]["pagination"]["offset"] == 10
        
        # limit + offsetの組み合わせテスト
        response = client.get("/survey/results?limit=3&offset=2")
        assert response.status_code == 200
    
    def test_get_results_invalid_params(self, client: TestClient):
        """無効なパラメータのテスト"""
        # 負の値のlimit
        response = client.get("/survey/results?limit=-1")
        assert response.status_code == 422 or response.status_code == 400
        
        # 負の値のoffset
        response = client.get("/survey/results?offset=-1")
        assert response.status_code == 422 or response.status_code == 400
        
        # 文字列のパラメータ
        response = client.get("/survey/results?limit=abc")
        assert response.status_code == 422
    
    def test_get_results_empty_collection(self, client: TestClient, mock_firestore):
        """空のコレクションのテスト"""
        # 空の結果は既にデフォルトで設定されている
        
        response = client.get("/survey/results")
        assert response.status_code == 200
        
        data = response.json()
        assert data["data"]["responses"] == []
        assert data["data"]["pagination"]["total"] == 0
    
    @patch('main.FIRESTORE_AVAILABLE', True)
    @patch('main.db')
    def test_get_results_firestore_error(self, mock_db, client: TestClient):
        """Firestoreエラーのテスト"""
        # Firestoreエラーをシミュレート
        mock_db.collection.side_effect = Exception("Firestore connection error")
        
        response = client.get("/survey/results")
        assert response.status_code == 500
    
    def test_get_results_response_structure(self, client: TestClient, mock_firestore, mock_document):
        """レスポンス構造の詳細テスト"""
        response = client.get("/survey/results")
        data = response.json()
        
        # トップレベルの構造確認
        required_fields = ["success", "message", "data", "error"]
        for field in required_fields:
            assert field in data
        
        # dataフィールド内の構造確認
        data_fields = ["responses", "pagination", "statistics"]
        for field in data_fields:
            assert field in data["data"]
        
        # paginationフィールドの構造確認
        pagination_fields = ["total", "limit", "offset"]
        for field in pagination_fields:
            assert field in data["data"]["pagination"]
