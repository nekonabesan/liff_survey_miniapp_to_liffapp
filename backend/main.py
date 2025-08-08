from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import os
from contextlib import asynccontextmanager

# Firestore クライアント（本番環境用）
try:
    from google.cloud import firestore
    db = firestore.Client()
    FIRESTORE_AVAILABLE = True
except ImportError:
    print("Warning: google-cloud-firestore not installed. Using mock storage.")
    FIRESTORE_AVAILABLE = False
    # モック用のインメモリストレージ
    mock_storage: List[Dict[str, Any]] = []

# Pydanticモデル
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
    print("🚀 FastAPI Survey API starting up...")
    yield
    # 終了時の処理
    print("👋 FastAPI Survey API shutting down...")

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

# アンケート回答の送信
@app.post("/survey/submit", response_model=ApiResponse)
async def submit_survey(survey_data: SurveyRequest):
    """アンケート回答を保存"""
    try:
        # データの準備
        timestamp = datetime.now().isoformat()
        response_data = {
            **survey_data.dict(),
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
        ).dict()
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
        ).dict()
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        log_level="info",
        reload=True
    )
