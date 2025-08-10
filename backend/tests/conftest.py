import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
import os
import json


@pytest.fixture(scope="session", autouse=True)
def mock_environment():
    """テスト環境のセットアップ"""
    with patch.dict(os.environ, {"ENVIRONMENT": "test"}):
        yield


@pytest.fixture(autouse=True)
def mock_firestore():
    """Firestoreのモック"""
    
    # ドキュメント参照のモック
    class MockDocumentRef:
        def __init__(self, doc_id, data=None):
            self.id = doc_id
            self._data = data or {}
            
        def get(self):
            mock_doc = Mock()
            mock_doc.exists = bool(self._data)
            mock_doc.to_dict.return_value = self._data
            mock_doc.id = self.id
            return mock_doc
            
        def set(self, data):
            self._data = data
            return self
            
        def update(self, data):
            self._data.update(data)
            return self
    
    # クエリのモック
    class MockQuery:
        def __init__(self, docs=None):
            self._docs = docs or []
            
        def where(self, field, op, value):
            return MockQuery(self._docs)
            
        def order_by(self, field, direction=None):
            return MockQuery(self._docs)
            
        def limit(self, count):
            return MockQuery(self._docs[:count])
            
        def offset(self, count):
            return MockQuery(self._docs[count:])
            
        def stream(self):
            for doc_data in self._docs:
                mock_doc = Mock()
                mock_doc.to_dict.return_value = doc_data
                mock_doc.id = doc_data.get('id', 'mock_id')
                yield mock_doc
    
    # コレクション参照のモック
    class MockCollectionRef:
        def __init__(self):
            self._docs = []
            
        def add(self, data):
            doc_id = f"mock_doc_{len(self._docs)}"
            doc_ref = MockDocumentRef(doc_id, data)
            self._docs.append(data)
            # addメソッドは (WriteResult, DocumentReference) のタプルを返す
            write_result = Mock()
            return (write_result, doc_ref)
            
        def document(self, doc_id):
            return MockDocumentRef(doc_id)
            
        def where(self, field, op, value):
            filtered_docs = []
            for doc in self._docs:
                if field in doc and doc[field] == value:
                    filtered_docs.append(doc)
            return MockQuery(filtered_docs)
            
        def order_by(self, field, direction=None):
            return MockQuery(self._docs)
            
        def limit(self, count):
            return MockQuery(self._docs[:count])
            
        def offset(self, count):
            return MockQuery(self._docs[count:])
            
        def stream(self):
            for doc_data in self._docs:
                mock_doc = Mock()
                mock_doc.to_dict.return_value = doc_data
                mock_doc.id = doc_data.get('id', 'mock_id')
                yield mock_doc
    
    # Firestoreクライアントのモック
    class MockFirestoreClient:
        def __init__(self):
            self._collections = {}
            
        def collection(self, name):
            if name not in self._collections:
                self._collections[name] = MockCollectionRef()
            return self._collections[name]
    
    # mainモジュールのグローバル変数をモック
    mock_client = MockFirestoreClient()
    
    with patch('main.db', mock_client), \
         patch('main.FIRESTORE_AVAILABLE', True), \
         patch('main.firestore'):
        yield mock_client


@pytest.fixture
def mock_db(mock_firestore):
    """テスト用のFirestoreクライアントモック"""
    return mock_firestore


@pytest.fixture
def mock_line_user():
    """モックLINEユーザー"""
    return {
        "userId": "U_test_user_123",
        "displayName": "Test User",
        "pictureUrl": "https://example.com/pic.jpg"
    }


@pytest.fixture
def client():
    """テスト用のFastAPIクライアント"""
    # パッチを適用してからアプリケーションをインポート
    with patch('main.FIRESTORE_AVAILABLE', True):
        from main import app
        return TestClient(app)


@pytest.fixture
def sample_survey_data():
    """テスト用のサンプルアンケートデータ"""
    return {
        "age": "20-29",
        "gender": "male", 
        "frequency": "weekly",
        "satisfaction": "4",
        "comments": "テストコメント",
        "improvements": "テスト改善案"
    }


@pytest.fixture
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
