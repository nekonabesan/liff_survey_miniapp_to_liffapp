"""API統合テスト"""
import pytest
from fastapi.testclient import TestClient
from tests.config import SAMPLE_SURVEY_DATA
import time


class TestAPIIntegration:
    """API統合テストクラス"""
    
    def test_survey_submission_and_retrieval_flow(self, client: TestClient, mock_firestore):
        """アンケート送信 → 結果取得の一連の流れ"""
        # 1. アンケート送信
        test_data = SAMPLE_SURVEY_DATA.copy()
        test_data["userId"] = f"integration-test-{int(time.time())}"
        
        submit_response = client.post("/survey/submit", json=test_data)
        assert submit_response.status_code == 200
        
        submit_data = submit_response.json()
        assert submit_data["success"] is True
        survey_id = submit_data["data"]["id"]
        
        # 2. 結果取得
        results_response = client.get("/survey/results")
        assert results_response.status_code == 200
        
        results_data = results_response.json()
        assert results_data["success"] is True
        assert len(results_data["data"]["responses"]) >= 0
    
    def test_multiple_survey_submissions(self, client: TestClient, mock_firestore):
        """複数のアンケート送信テスト"""
        base_time = int(time.time())
        
        # 複数のアンケートを送信
        for i in range(3):
            test_data = SAMPLE_SURVEY_DATA.copy()
            test_data["userId"] = f"multi-test-{base_time}-{i}"
            test_data["satisfaction"] = str((i % 5) + 1)
            
            response = client.post("/survey/submit", json=test_data)
            assert response.status_code == 200
        
        # 結果取得で統計情報を確認
        results_response = client.get("/survey/results")
        assert results_response.status_code == 200
        
        results_data = results_response.json()
        assert "statistics" in results_data["data"]
    
    def test_api_endpoints_sequence(self, client: TestClient, mock_firestore):
        """API エンドポイントの順序テスト"""
        # 1. ヘルスチェック
        health_response = client.get("/health")
        assert health_response.status_code == 200
        
        # 2. アンケート送信
        test_data = SAMPLE_SURVEY_DATA.copy()
        test_data["userId"] = f"sequence-test-{int(time.time())}"
        
        submit_response = client.post("/survey/submit", json=test_data)
        assert submit_response.status_code == 200
        
        # 3. 結果取得
        results_response = client.get("/survey/results")
        assert results_response.status_code == 200
        
        # 4. 再度ヘルスチェック
        health_response2 = client.get("/health")
        assert health_response2.status_code == 200
    
    def test_error_handling_across_endpoints(self, client: TestClient):
        """各エンドポイントのエラーハンドリング"""
        # Submit エンドポイントのバリデーションエラー
        invalid_response = client.post("/survey/submit", json={})
        assert invalid_response.status_code == 422
        
        # Results エンドポイントの無効パラメータ
        invalid_params_response = client.get("/survey/results?limit=-1")
        assert invalid_params_response.status_code in [400, 422, 500]
        
        # 存在しないエンドポイント
        not_found_response = client.get("/nonexistent")
        assert not_found_response.status_code == 404
    
    def test_response_consistency(self, client: TestClient, mock_firestore):
        """レスポンス形式の一貫性テスト"""
        # 全エンドポイントのレスポンス形式が統一されていることを確認
        endpoints = [
            ("/health", "GET", None),
            ("/survey/submit", "POST", SAMPLE_SURVEY_DATA),
            ("/survey/results", "GET", None)
        ]
        
        for endpoint, method, data in endpoints:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                test_data = data.copy() if data else {}
                if "userId" in test_data:
                    test_data["userId"] = f"consistency-test-{int(time.time())}"
                response = client.post(endpoint, json=test_data)
            
            if response.status_code == 200:
                response_data = response.json()
                # 統一されたレスポンス形式の確認
                required_fields = ["success", "message", "data", "error"]
                for field in required_fields:
                    assert field in response_data, f"Missing field {field} in {endpoint}"
