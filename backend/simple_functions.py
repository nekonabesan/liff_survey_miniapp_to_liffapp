"""
Google Cloud Functions用のシンプルなAPIエンドポイント
FlaskベースでFastAPIの機能を再実装
"""

import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
import functions_framework
from flask import Request

# 環境変数を設定
os.environ.setdefault('GOOGLE_CLOUD_PROJECT', 'liff-survey-app-20250809-282a6')

# Firestore クライアント初期化
try:
    from google.cloud import firestore
    db = firestore.Client()
    FIRESTORE_AVAILABLE = True
    print("Firestore client initialized successfully")
except Exception as e:
    print(f"Warning: Failed to initialize Firestore client: {e}. Using mock storage.")
    FIRESTORE_AVAILABLE = False
    mock_storage: List[Dict[str, Any]] = []

@functions_framework.http
def liff_survey_api(request: Request) -> tuple:
    """
    Cloud Functions HTTP エントリーポイント
    """
    # CORSヘッダーを設定
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    }
    
    # プリフライトリクエストの処理
    if request.method == 'OPTIONS':
        return ('', 204, headers)
    
    try:
        # リクエストパスとメソッドを取得
        path = request.path
        method = request.method.upper()
        
        # JSONデータを取得
        request_data = None
        if request.is_json:
            request_data = request.get_json()
        
        # ルーティング処理
        if path == '/health' and method == 'GET':
            response_data = handle_health_check()
            
        elif path == '/user/status' and method == 'POST':
            response_data = handle_user_status(request_data)
            
        elif path.startswith('/user/') and path.endswith('/latest-response') and method == 'GET':
            user_id = path.split('/')[2]
            response_data = handle_user_latest_response(user_id)
            
        elif path == '/survey/submit' and method == 'POST':
            response_data = handle_survey_submit(request_data)
            
        else:
            response_data = {
                "success": False,
                "error": f"Endpoint {method} {path} not found"
            }
            return (json.dumps(response_data), 404, headers)
        
        # レスポンスを返す
        status_code = 200 if response_data.get("success") else 400
        return (json.dumps(response_data), status_code, headers)
        
    except Exception as e:
        # エラーレスポンス
        error_response = {
            "success": False,
            "error": str(e),
            "message": "Internal server error"
        }
        return (json.dumps(error_response), 500, headers)

def handle_health_check() -> Dict[str, Any]:
    """ヘルスチェックの処理"""
    return {
        "success": True,
        "message": "LIFF Survey API is running on Cloud Functions",
        "data": {
            "status": "OK",
            "timestamp": datetime.now().isoformat(),
            "firestore_available": FIRESTORE_AVAILABLE
        }
    }

def handle_user_status(request_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """ユーザー状態確認の処理"""
    try:
        if not request_data or 'userId' not in request_data:
            return {"success": False, "error": "userId is required"}
        
        user_id = request_data['userId']
        
        if FIRESTORE_AVAILABLE:
            # Firestoreでユーザーの回答を検索
            query = db.collection('survey_responses').where('userId', '==', user_id).order_by('createdAt', direction=firestore.Query.DESCENDING)
            docs = list(query.stream())
            
            if docs:
                latest_response = docs[0].to_dict()
                user_status = {
                    "userId": user_id,
                    "hasResponse": True,
                    "lastResponseId": docs[0].id,
                    "lastResponseDate": latest_response.get('createdAt'),
                    "responseCount": len(docs)
                }
            else:
                user_status = {
                    "userId": user_id,
                    "hasResponse": False,
                    "responseCount": 0
                }
        else:
            # モックストレージでユーザーの回答を検索
            user_responses = [r for r in mock_storage if r.get('userId') == user_id]
            
            if user_responses:
                latest_response = max(user_responses, key=lambda x: x.get('createdAt', ''))
                user_status = {
                    "userId": user_id,
                    "hasResponse": True,
                    "lastResponseId": latest_response.get('id'),
                    "lastResponseDate": latest_response.get('createdAt'),
                    "responseCount": len(user_responses)
                }
            else:
                user_status = {
                    "userId": user_id,
                    "hasResponse": False,
                    "responseCount": 0
                }

        return {
            "success": True,
            "message": "ユーザー状態を取得しました",
            "data": user_status
        }
        
    except Exception as e:
        return {"success": False, "error": f"Error checking user status: {str(e)}"}

def handle_user_latest_response(user_id: str) -> Dict[str, Any]:
    """ユーザーの最新回答取得の処理"""
    try:
        if FIRESTORE_AVAILABLE:
            query = db.collection('survey_responses').where('userId', '==', user_id).order_by('createdAt', direction=firestore.Query.DESCENDING).limit(1)
            docs = list(query.stream())
            
            if docs:
                data = docs[0].to_dict()
                data['id'] = docs[0].id
                return {"success": True, "data": data}
            else:
                return {"success": False, "message": "回答が見つかりませんでした"}
        else:
            user_responses = [r for r in mock_storage if r.get('userId') == user_id]
            
            if user_responses:
                latest_response = max(user_responses, key=lambda x: x.get('createdAt', ''))
                return {"success": True, "data": latest_response}
            else:
                return {"success": False, "message": "回答が見つかりませんでした"}
                
    except Exception as e:
        return {"success": False, "error": f"Error fetching user latest response: {str(e)}"}

def handle_survey_submit(request_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """アンケート送信の処理"""
    try:
        if not request_data:
            return {"success": False, "error": "Request body is required"}
        
        # 必須フィールドの検証
        required_fields = ['age', 'gender', 'frequency', 'satisfaction']
        for field in required_fields:
            if field not in request_data:
                return {"success": False, "error": f"Required field '{field}' is missing"}
        
        # バリデーション
        if request_data['gender'] not in ['male', 'female', 'other']:
            return {"success": False, "error": "Invalid gender value"}
        
        if request_data['frequency'] not in ['daily', 'weekly', 'monthly', 'rarely']:
            return {"success": False, "error": "Invalid frequency value"}
        
        if request_data['satisfaction'] not in ['1', '2', '3', '4', '5']:
            return {"success": False, "error": "Invalid satisfaction value"}
        
        # データの準備
        timestamp = datetime.now().isoformat()
        response_data = {
            **request_data,
            "timestamp": timestamp,
            "createdAt": timestamp
        }

        if FIRESTORE_AVAILABLE:
            # Firestoreに保存
            doc_ref = db.collection('survey_responses').add(response_data)
            doc_id = doc_ref[1].id
        else:
            # モックストレージに保存
            doc_id = f"mock_{len(mock_storage) + 1}"
            response_data["id"] = doc_id
            mock_storage.append(response_data)

        return {
            "success": True,
            "message": "アンケート回答を保存しました",
            "data": {"id": doc_id}
        }
        
    except Exception as e:
        return {"success": False, "error": f"Error saving survey response: {str(e)}"}
