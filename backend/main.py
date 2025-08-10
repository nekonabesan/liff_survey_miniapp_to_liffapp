from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import os
import httpx
import json
from contextlib import asynccontextmanager

# セキュリティスキーム
security = HTTPBearer(auto_error=False)

# LINE IDToken検証エンドポイント
LINE_ID_TOKEN_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify"

# IDToken検証結果のモデル
class LineUser(BaseModel):
    userId: str
    displayName: str
    pictureUrl: Optional[str] = None
    statusMessage: Optional[str] = None

# IDToken検証関数
async def verify_line_id_token(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[LineUser]:
    """LINE IDTokenを検証してユーザー情報を返す"""
    
    # 開発環境の場合、モックユーザーを返す
    if os.getenv("ENVIRONMENT") == "development" or not credentials:
        return LineUser(
            userId="U_mock_user_123",
            displayName="Mock Development User",
            pictureUrl="https://via.placeholder.com/150",
            statusMessage="Development mode user"
        )
    
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンが必要です"
        )
    
    id_token = credentials.credentials
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LINE_ID_TOKEN_VERIFY_URL,
                data={
                    "id_token": id_token,
                    "client_id": os.getenv("LINE_CHANNEL_ID", "")  # LINEチャンネルIDが必要
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="無効なIDTokenです"
                )
            
            user_data = response.json()
            
            return LineUser(
                userId=user_data.get("sub"),
                displayName=user_data.get("name", "Unknown User"),
                pictureUrl=user_data.get("picture"),
                statusMessage=None  # IDTokenにはstatusMessageは含まれない
            )
            
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="IDToken検証に失敗しました"
        )
    except Exception as e:
        print(f"IDToken verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="IDToken検証に失敗しました"
        )
try:
    # Cloud Functions環境では自動的に認証される
    from google.cloud import firestore
    db = firestore.Client()
    FIRESTORE_AVAILABLE = True
    print("Firestore client initialized successfully")
except ImportError:
    print("Warning: google-cloud-firestore not installed. Using mock storage.")
    FIRESTORE_AVAILABLE = False
    # モック用のインメモリストレージ
    mock_storage: List[Dict[str, Any]] = []
except Exception as e:
    print(f"Warning: Failed to initialize Firestore client: {e}. Using mock storage.")
    FIRESTORE_AVAILABLE = False
    # モック用のインメモリストレージ
    mock_storage: List[Dict[str, Any]] = []

# Pydanticモデル
class UserStatusRequest(BaseModel):
    userId: str = Field(..., description="LINEユーザーID")
    displayName: Optional[str] = Field(None, description="ユーザー表示名")

class UserStatus(BaseModel):
    userId: str
    hasResponse: bool
    lastResponseId: Optional[str] = None
    lastResponseDate: Optional[str] = None
    responseCount: int = 0

class SurveyRequest(BaseModel):
    age: str = Field(..., description="年齢層")
    gender: str = Field(..., pattern="^(male|female|other)$", description="性別")
    frequency: str = Field(..., pattern="^(daily|weekly|monthly|rarely)$", description="利用頻度")
    satisfaction: str = Field(..., pattern="^[1-5]$", description="満足度 (1-5)")
    feedback: Optional[str] = Field(None, description="自由記述")
    userId: Optional[str] = Field(None, description="LINEユーザーID")
    displayName: Optional[str] = Field(None, description="ユーザー表示名")

class SurveyResponse(BaseModel):
    id: Optional[str] = None
    age: str
    gender: str
    frequency: str
    satisfaction: str
    feedback: Optional[str] = None
    userId: Optional[str] = None
    displayName: Optional[str] = None
    timestamp: str
    createdAt: str

class ApiResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[str] = None

class Statistics(BaseModel):
    total_responses: int
    age_distribution: Dict[str, int]
    gender_distribution: Dict[str, int]
    frequency_distribution: Dict[str, int]
    satisfaction_distribution: Dict[str, int]
    average_satisfaction: float
    responses_by_date: Dict[str, int]

class SurveyResultsResponse(BaseModel):
    responses: List[SurveyResponse]
    statistics: Statistics
    pagination: Dict[str, int]

# アプリケーション初期化
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時の処理
    print("FastAPI Survey API starting up...")
    yield
    # 終了時の処理
    print("FastAPI Survey API shutting down...")

app = FastAPI(
    title="LIFF Survey API",
    description="LINE Front-end Framework用アンケートAPI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では具体的なドメインを指定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ヘルスチェック
@app.get("/health", response_model=ApiResponse)
async def health_check():
    """APIのヘルスチェック"""
    return ApiResponse(
        success=True,
        message="LIFF Survey API is running",
        data={
            "status": "OK",
            "timestamp": datetime.now().isoformat(),
            "firestore_available": FIRESTORE_AVAILABLE
        }
    )

# ユーザーの回答状態確認
@app.post("/user/status", response_model=ApiResponse)
async def check_user_status(user_request: UserStatusRequest, current_user: LineUser = Depends(verify_line_id_token)):
    """ユーザーの回答状態を確認"""
    try:
        # 認証されたユーザーIDを使用
        user_id = current_user.userId
        
        if FIRESTORE_AVAILABLE:
            # Firestoreでユーザーの回答を検索
            query = db.collection('survey_responses').where('userId', '==', user_id).order_by('createdAt', direction=firestore.Query.DESCENDING)
            docs = list(query.stream())
            
            if docs:
                # 最新の回答を取得
                latest_response = docs[0].to_dict()
                user_status = UserStatus(
                    userId=user_id,
                    hasResponse=True,
                    lastResponseId=docs[0].id,
                    lastResponseDate=latest_response.get('createdAt'),
                    responseCount=len(docs)
                )
            else:
                user_status = UserStatus(
                    userId=user_id,
                    hasResponse=False,
                    responseCount=0
                )
        else:
            # モックストレージでユーザーの回答を検索
            user_responses = [r for r in mock_storage if r.get('userId') == user_id]
            
            if user_responses:
                # 最新の回答を取得（createdAtでソート）
                latest_response = max(user_responses, key=lambda x: x.get('createdAt', ''))
                user_status = UserStatus(
                    userId=user_id,
                    hasResponse=True,
                    lastResponseId=latest_response.get('id'),
                    lastResponseDate=latest_response.get('createdAt'),
                    responseCount=len(user_responses)
                )
            else:
                user_status = UserStatus(
                    userId=user_id,
                    hasResponse=False,
                    responseCount=0
                )

        return ApiResponse(
            success=True,
            message="ユーザー状態を取得しました",
            data=user_status.model_dump()
        )

    except Exception as e:
        print(f"Error checking user status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ユーザー状態の確認に失敗しました"
        )

# ユーザーの最新回答取得
@app.get("/user/{user_id}/latest-response", response_model=ApiResponse)
async def get_user_latest_response(user_id: str, current_user: LineUser = Depends(verify_line_id_token)):
    """ユーザーの最新回答を取得"""
    try:
        # 認証されたユーザーのみが自分の回答を取得可能
        if user_id != current_user.userId:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="他のユーザーの回答は取得できません"
            )
        
        if FIRESTORE_AVAILABLE:
            # Firestoreから最新の回答を取得
            query = db.collection('survey_responses').where('userId', '==', user_id).order_by('createdAt', direction=firestore.Query.DESCENDING).limit(1)
            docs = list(query.stream())
            
            if docs:
                data = docs[0].to_dict()
                data['id'] = docs[0].id
                response = SurveyResponse(**data)
                return ApiResponse(
                    success=True,
                    data=response.model_dump()
                )
            else:
                return ApiResponse(
                    success=False,
                    message="回答が見つかりませんでした"
                )
        else:
            # モックストレージから最新の回答を取得
            user_responses = [r for r in mock_storage if r.get('userId') == user_id]
            
            if user_responses:
                latest_response = max(user_responses, key=lambda x: x.get('createdAt', ''))
                response = SurveyResponse(**latest_response)
                return ApiResponse(
                    success=True,
                    data=response.model_dump()
                )
            else:
                return ApiResponse(
                    success=False,
                    message="回答が見つかりませんでした"
                )

    except Exception as e:
        print(f"Error fetching user latest response: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="回答の取得に失敗しました"
        )

# アンケート回答の送信
@app.post("/survey/submit", response_model=ApiResponse)
async def submit_survey(survey_data: SurveyRequest, current_user: LineUser = Depends(verify_line_id_token)):
    """アンケート回答を保存"""
    try:
        # データの準備（認証されたユーザー情報を使用）
        timestamp = datetime.now().isoformat()
        response_data = {
            **survey_data.model_dump(),
            "userId": current_user.userId,
            "displayName": current_user.displayName,
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

        return ApiResponse(
            success=True,
            message="アンケート回答を保存しました",
            data={"id": doc_id}
        )

    except Exception as e:
        print(f"Error saving survey response: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="サーバーエラーが発生しました"
        )

# アンケート結果の取得
@app.get("/survey/results", response_model=ApiResponse)
async def get_survey_results(limit: int = 100, offset: int = 0):
    """アンケート結果を取得（管理者用）"""
    try:
        # パラメータのバリデーション
        if limit < 1 or limit > 1000:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="limitは1から1000の間で指定してください"
            )
        
        if offset < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="offsetは0以上で指定してください"
            )
        
        if FIRESTORE_AVAILABLE:
            # Firestoreから取得
            query = db.collection('survey_responses').order_by('createdAt', direction=firestore.Query.DESCENDING)
            docs = query.limit(limit).offset(offset).stream()
            
            responses = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                responses.append(SurveyResponse(**data))
        else:
            # モックストレージから取得
            start_idx = offset
            end_idx = offset + limit
            mock_responses = mock_storage[start_idx:end_idx]
            responses = [SurveyResponse(**response) for response in mock_responses]

        # 統計データを計算
        stats = calculate_statistics(responses)

        return ApiResponse(
            success=True,
            data=SurveyResultsResponse(
                responses=responses,
                statistics=stats,
                pagination={
                    "limit": limit,
                    "offset": offset,
                    "total": len(responses)
                }
            )
        )

    except HTTPException:
        # HTTPExceptionは再度raiseして適切な処理に委ねる
        raise
    except Exception as e:
        print(f"Error fetching survey results: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="データの取得に失敗しました"
        )

def calculate_statistics(responses: List[SurveyResponse]) -> Statistics:
    """統計データを計算"""
    if not responses:
        return Statistics(
            total_responses=0,
            age_distribution={},
            gender_distribution={},
            frequency_distribution={},
            satisfaction_distribution={},
            average_satisfaction=0.0,
            responses_by_date={}
        )

    age_dist = {}
    gender_dist = {}
    frequency_dist = {}
    satisfaction_dist = {}
    responses_by_date = {}
    satisfaction_sum = 0

    for response in responses:
        # 年齢分布
        age_dist[response.age] = age_dist.get(response.age, 0) + 1
        
        # 性別分布
        gender_dist[response.gender] = gender_dist.get(response.gender, 0) + 1
        
        # 利用頻度分布
        frequency_dist[response.frequency] = frequency_dist.get(response.frequency, 0) + 1
        
        # 満足度分布
        satisfaction_dist[response.satisfaction] = satisfaction_dist.get(response.satisfaction, 0) + 1
        
        # 満足度合計
        satisfaction_sum += int(response.satisfaction)
        
        # 日付別回答数
        date_key = response.timestamp.split('T')[0]  # YYYY-MM-DD
        responses_by_date[date_key] = responses_by_date.get(date_key, 0) + 1

    # 平均満足度を計算
    avg_satisfaction = round(satisfaction_sum / len(responses), 2) if responses else 0.0

    return Statistics(
        total_responses=len(responses),
        age_distribution=age_dist,
        gender_distribution=gender_dist,
        frequency_distribution=frequency_dist,
        satisfaction_distribution=satisfaction_dist,
        average_satisfaction=avg_satisfaction,
        responses_by_date=responses_by_date
    )

# エラーハンドラー
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ApiResponse(
            success=False,
            error=exc.detail,
            message=exc.detail
        ).model_dump()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content=ApiResponse(
            success=False,
            error="Internal server error",
            message="予期しないエラーが発生しました"
        ).model_dump()
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
