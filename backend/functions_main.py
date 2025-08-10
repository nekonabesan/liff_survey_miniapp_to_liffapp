import functions_framework
from main import app

@functions_framework.http  
def liff_survey_api(request):
    """Cloud Functions用のエントリポイント"""
    from fastapi import Request as FastAPIRequest
    from starlette.responses import Response
    import asyncio
    
    # FastAPIリクエストに変換
    fastapi_request = FastAPIRequest(scope={"type": "http", "method": request.method, "headers": request.headers.items()})
    
    # 非同期でFastAPIアプリを実行
    async def run_app():
        return await app(fastapi_request)
    
    response = asyncio.run(run_app())
    return response