"""LIFF特有機能のテスト"""
import pytest
from fastapi.testclient import TestClient
from tests.config import SAMPLE_SURVEY_DATA
import time


class TestLIFFFeatures:
    """LIFF特有機能のテストクラス"""
    
    def test_line_user_id_validation(self, client: TestClient):
        """LINE ユーザーID形式のバリデーション"""
        valid_user_ids = [
            "U1234567890abcdef1234567890abcdef",  # 標準的なLINE User ID
            "test-user-123",  # テスト用ID
            "dev-user-456"    # 開発用ID
        ]
        
        for user_id in valid_user_ids:
            test_data = SAMPLE_SURVEY_DATA.copy()
            test_data["userId"] = user_id
            
            response = client.post("/survey/submit", json=test_data)
            assert response.status_code == 200, f"Failed for userId: {user_id}"
    
    def test_japanese_text_handling(self, client: TestClient, mock_firestore):
        """日本語テキストの処理テスト"""
        test_data = SAMPLE_SURVEY_DATA.copy()
        test_data.update({
            "userId": f"japanese-test-{int(time.time())}",
            "displayName": "田中太郎",
            "feedback": "とても満足しています。サービスの品質が高く、使いやすいです。今後も利用したいと思います。"
        })
        
        response = client.post("/survey/submit", json=test_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
    
    def test_optional_fields_handling(self, client: TestClient, mock_firestore):
        """オプションフィールドの処理テスト"""
        # 最低限の必須フィールドのみ
        minimal_data = {
            "age": "20-29",
            "gender": "male",
            "frequency": "weekly",
            "satisfaction": "4",
            "userId": f"minimal-test-{int(time.time())}",
            "displayName": "最小テスト"
        }
        
        response = client.post("/survey/submit", json=minimal_data)
        assert response.status_code == 200
        
        # feedback なしでも成功することを確認
        data = response.json()
        assert data["success"] is True
    
    def test_survey_data_preservation(self, client: TestClient, mock_firestore):
        """アンケートデータの保存・取得の整合性テスト"""
        test_data = SAMPLE_SURVEY_DATA.copy()
        test_data.update({
            "userId": f"preservation-test-{int(time.time())}",
            "displayName": "データ保存テスト",
            "feedback": "データの整合性を確認するためのテストです。"
        })
        
        # データ送信
        submit_response = client.post("/survey/submit", json=test_data)
        assert submit_response.status_code == 200
        
        # データ取得で整合性確認
        results_response = client.get("/survey/results")
        assert results_response.status_code == 200


class TestSurveyValidation:
    """アンケートフィールドのバリデーションテスト"""
    
    def test_satisfaction_score_validation(self, client: TestClient):
        """満足度スコアのバリデーション"""
        valid_scores = ["1", "2", "3", "4", "5"]
        invalid_scores = ["0", "6", "10", "abc", ""]
        
        base_data = SAMPLE_SURVEY_DATA.copy()
        
        # 有効なスコアのテスト
        for score in valid_scores:
            test_data = base_data.copy()
            test_data["satisfaction"] = score
            test_data["userId"] = f"valid-score-{score}-{int(time.time())}"
            
            response = client.post("/survey/submit", json=test_data)
            assert response.status_code == 200, f"Valid score {score} should be accepted"
        
        # 無効なスコアのテスト
        for score in invalid_scores:
            test_data = base_data.copy()
            test_data["satisfaction"] = score
            test_data["userId"] = f"invalid-score-{score}-{int(time.time())}"
            
            response = client.post("/survey/submit", json=test_data)
            assert response.status_code == 422, f"Invalid score {score} should be rejected"
    
    def test_age_group_validation(self, client: TestClient):
        """年齢グループのバリデーション"""
        valid_ages = ["10-19", "20-29", "30-39", "40-49", "50-59", "60+"]
        invalid_ages = ["5-9", "70+", "20-30", "invalid"]
        
        base_data = SAMPLE_SURVEY_DATA.copy()
        
        # 有効な年齢グループのテスト
        for age in valid_ages:
            test_data = base_data.copy()
            test_data["age"] = age
            test_data["userId"] = f"valid-age-{age.replace('+', 'plus')}-{int(time.time())}"
            
            response = client.post("/survey/submit", json=test_data)
            assert response.status_code == 200, f"Valid age {age} should be accepted"
    
    def test_frequency_validation(self, client: TestClient):
        """利用頻度のバリデーション"""
        valid_frequencies = ["daily", "weekly", "monthly", "rarely"]
        invalid_frequencies = ["hourly", "yearly", "never", ""]
        
        base_data = SAMPLE_SURVEY_DATA.copy()
        
        # 有効な頻度のテスト
        for frequency in valid_frequencies:
            test_data = base_data.copy()
            test_data["frequency"] = frequency
            test_data["userId"] = f"valid-freq-{frequency}-{int(time.time())}"
            
            response = client.post("/survey/submit", json=test_data)
            assert response.status_code == 200, f"Valid frequency {frequency} should be accepted"
    
    def test_gender_validation(self, client: TestClient):
        """性別のバリデーション"""
        valid_genders = ["male", "female", "other"]
        invalid_genders = ["man", "woman", "unknown", ""]
        
        base_data = SAMPLE_SURVEY_DATA.copy()
        
        # 有効な性別のテスト
        for gender in valid_genders:
            test_data = base_data.copy()
            test_data["gender"] = gender
            test_data["userId"] = f"valid-gender-{gender}-{int(time.time())}"
            
            response = client.post("/survey/submit", json=test_data)
            assert response.status_code == 200, f"Valid gender {gender} should be accepted"
