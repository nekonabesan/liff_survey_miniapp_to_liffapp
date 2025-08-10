"""Survey Submit エンドポイントのユニットテスト"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from tests.config import SAMPLE_SURVEY_DATA, INVALID_SURVEY_DATA
import time


class TestSurveySubmitEndpoint:
    """Survey Submit エンドポイントのテストクラス"""
    
    def test_submit_survey_success(self, client: TestClient, sample_survey_data, mock_firestore):
        """正常なアンケート送信のテスト"""
        response = client.post("/survey/submit", json=sample_survey_data)
        
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"
        
        data = response.json()
        assert data["success"] is True
        assert "message" in data
        assert "data" in data
        assert "id" in data["data"]
    
    def test_submit_survey_validation_error(self, client: TestClient):
        """バリデーションエラーのテスト"""
        invalid_data = {
            "age": "invalid-age",
            "gender": "",
            "frequency": "invalid-frequency",
            "satisfaction": "10",  # 範囲外
            "feedback": "",
            "userId": "",
            "displayName": ""
        }
        
        response = client.post("/survey/submit", json=invalid_data)
        assert response.status_code == 422
    
    def test_submit_survey_missing_fields(self, client: TestClient):
        """必須フィールド不足のテスト"""
        incomplete_data = {
            "age": "20-29",
            # 他の必須フィールドが不足
        }
        
        response = client.post("/survey/submit", json=incomplete_data)
        assert response.status_code == 422
    
    def test_submit_survey_empty_body(self, client: TestClient):
        """空のリクエストボディのテスト"""
        response = client.post("/survey/submit", json={})
        assert response.status_code == 422
    
    def test_submit_survey_invalid_json(self, client: TestClient):
        """不正なJSONのテスト"""
        response = client.post("/survey/submit", content="invalid json")
        assert response.status_code == 422
    
    @patch('main.FIRESTORE_AVAILABLE', True)
    @patch('main.db')
    def test_submit_survey_firestore_error(self, mock_db, client: TestClient, sample_survey_data):
        """Firestoreエラーのテスト"""
        # Firestoreエラーをシミュレート
        mock_db.collection.side_effect = Exception("Firestore connection error")
        
        response = client.post("/survey/submit", json=sample_survey_data)
        assert response.status_code == 500
    
    def test_submit_survey_satisfaction_scores(self, client: TestClient, sample_survey_data, mock_firestore):
        """満足度スコアの境界値テスト"""
        valid_scores = ["1", "2", "3", "4", "5"]
        
        for score in valid_scores:
            test_data = sample_survey_data.copy()
            test_data["satisfaction"] = score
            test_data["userId"] = f"test-user-{score}-{int(time.time())}"
            
            response = client.post("/survey/submit", json=test_data)
            assert response.status_code == 200
    
    def test_submit_survey_age_groups(self, client: TestClient, sample_survey_data, mock_firestore):
        """年齢グループのバリデーションテスト"""
        valid_ages = ["10-19", "20-29", "30-39", "40-49", "50-59", "60+"]
        
        for age in valid_ages:
            test_data = sample_survey_data.copy()
            test_data["age"] = age
            test_data["userId"] = f"test-user-{age}-{int(time.time())}"
            
            response = client.post("/survey/submit", json=test_data)
            assert response.status_code == 200
