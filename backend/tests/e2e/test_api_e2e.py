"""E2E (End-to-End) テスト"""
import pytest
import requests
import time
from tests.config import BASE_URL, SAMPLE_SURVEY_DATA


class TestE2EFlow:
    """E2E テストクラス - 実際のHTTPリクエストでテスト"""
    
    @pytest.mark.e2e
    def test_health_endpoint_e2e(self):
        """Health エンドポイントのE2Eテスト"""
        response = requests.get(f"{BASE_URL}/health")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "OK"
        assert data["data"]["firestore_available"] is True
    
    @pytest.mark.e2e
    def test_survey_submission_e2e(self):
        """Survey 送信のE2Eテスト"""
        test_data = SAMPLE_SURVEY_DATA.copy()
        test_data["userId"] = f"e2e-test-{int(time.time())}"
        
        response = requests.post(f"{BASE_URL}/survey/submit", json=test_data)
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        
        data = response.json()
        assert data["success"] is True
        assert "id" in data["data"]
    
    @pytest.mark.e2e
    def test_survey_results_e2e(self):
        """Survey 結果取得のE2Eテスト"""
        response = requests.get(f"{BASE_URL}/survey/results")
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        
        data = response.json()
        assert data["success"] is True
        assert "responses" in data["data"]
        assert "pagination" in data["data"]
        assert "statistics" in data["data"]
    
    @pytest.mark.e2e 
    def test_complete_user_journey_e2e(self):
        """完全なユーザージャーニーのE2Eテスト"""
        # 1. ヘルスチェック（サービス稼働確認）
        health_response = requests.get(f"{BASE_URL}/health")
        assert health_response.status_code == 200
        
        # 2. アンケート送信
        test_data = SAMPLE_SURVEY_DATA.copy()
        test_data["userId"] = f"journey-test-{int(time.time())}"
        test_data["feedback"] = "E2Eテストからの投稿です"
        
        submit_response = requests.post(f"{BASE_URL}/survey/submit", json=test_data)
        assert submit_response.status_code == 200
        
        submit_data = submit_response.json()
        survey_id = submit_data["data"]["id"]
        
        # 3. 結果確認
        results_response = requests.get(f"{BASE_URL}/survey/results")
        assert results_response.status_code == 200
        
        results_data = results_response.json()
        assert len(results_data["data"]["responses"]) > 0
    
    @pytest.mark.e2e
    def test_pagination_e2e(self):
        """ページネーション機能のE2Eテスト"""
        # limitパラメータのテスト
        response = requests.get(f"{BASE_URL}/survey/results?limit=2")
        assert response.status_code == 200
        
        data = response.json()
        assert data["data"]["pagination"]["limit"] == 2
        
        # offsetパラメータのテスト
        response = requests.get(f"{BASE_URL}/survey/results?offset=1")
        assert response.status_code == 200
        
        data = response.json()
        assert data["data"]["pagination"]["offset"] == 1
    
    @pytest.mark.e2e
    def test_error_scenarios_e2e(self):
        """エラーシナリオのE2Eテスト"""
        # 無効なデータ送信
        invalid_data = {"invalid": "data"}
        response = requests.post(f"{BASE_URL}/survey/submit", json=invalid_data)
        assert response.status_code == 422
        
        # 無効なパラメータ
        response = requests.get(f"{BASE_URL}/survey/results?limit=invalid")
        assert response.status_code == 422
        
        # 存在しないエンドポイント
        response = requests.get(f"{BASE_URL}/nonexistent")
        assert response.status_code == 404
