import pytest
import asyncio
from typing import Generator, AsyncGenerator
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import os
import sys

# パスの設定
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app


@pytest.fixture(scope="session")
def event_loop():
    """セッション全体で使用するイベントループを作成"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """FastAPIテストクライアントを提供"""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def mock_firestore():
    """Firestoreクライアントのモック"""
    # FIRESTORE_AVAILABLEをTrueに設定し、dbをモックする
    with patch('main.FIRESTORE_AVAILABLE', True):
        with patch('main.firestore') as mock_firestore_module:
            mock_db = Mock()
            mock_firestore_module.Client.return_value = mock_db
            
            # main.dbをモックのインスタンスに設定
            with patch.object(sys.modules['main'], 'db', mock_db):
                yield mock_db


@pytest.fixture(scope="function") 
def mock_db():
    """Firestoreデータベースインスタンスのモック（直接参照用）"""
    mock_db = Mock()
    with patch.object(sys.modules['main'], 'db', mock_db):
        yield mock_db


@pytest.fixture(scope="function")
def mock_line_user():
    """LINEユーザー認証のモック"""
    mock_user = Mock()
    mock_user.userId = "test-user-123"
    mock_user.displayName = "テストユーザー"
    mock_user.pictureUrl = "https://example.com/picture.jpg"
    mock_user.statusMessage = "テストステータス"
    
    with patch('main.verify_line_id_token', return_value=mock_user):
        yield mock_user


@pytest.fixture(scope="function")
def sample_survey_data():
    """テスト用のサンプルアンケートデータ"""
    return {
        "age": "20-29",
        "gender": "male",
        "frequency": "weekly",
        "satisfaction": "4",
        "feedback": "とても良いサービスです",
        "userId": "test-user-123",
        "displayName": "テストユーザー"
    }


@pytest.fixture(scope="function")
def invalid_survey_data():
    """バリデーションエラー用の無効なアンケートデータ"""
    return {
        "age": "invalid-age",  # 無効な年齢
        "gender": "invalid-gender",  # 無効な性別
        "frequency": "invalid-frequency",  # 無効な頻度
        "satisfaction": "11",  # 範囲外の満足度
        "feedback": "",  # 空文字は有効
        "userId": "",  # 必須フィールドが空
        "displayName": ""  # 必須フィールドが空
    }


@pytest.fixture(scope="function")
def mock_document():
    """Firestoreドキュメントのモック"""
    mock_doc = Mock()
    mock_doc.id = "test-doc-id"
    mock_doc.to_dict.return_value = {
        "age": "20-29",
        "gender": "male",
        "frequency": "weekly",
        "satisfaction": "4",
        "feedback": "テストフィードバック",
        "userId": "test-user-123",
        "displayName": "テストユーザー",
        "timestamp": "2025-08-10T12:00:00Z"
    }
    return mock_doc


@pytest.fixture(scope="function")
def mock_collection():
    """Firestoreコレクションのモック"""
    mock_coll = Mock()
    return mock_coll
