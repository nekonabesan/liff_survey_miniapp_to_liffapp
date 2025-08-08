import axios from 'axios';
import { SurveyResponse, ApiResponse, SurveyStatistics } from '@/types';

// API設定
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// アンケート回答を送信
export const submitSurvey = async (data: SurveyResponse): Promise<ApiResponse<{ id: string }>> => {
  try {
    const response = await apiClient.post('/survey/submit', data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'サーバーエラーが発生しました');
    } else if (error.request) {
      throw new Error('ネットワークエラーが発生しました');
    } else {
      throw new Error('予期しないエラーが発生しました');
    }
  }
};

// アンケート結果を取得（管理者用）
export const getSurveyResults = async (limit = 100, offset = 0): Promise<ApiResponse<{
  responses: SurveyResponse[];
  statistics: SurveyStatistics;
  pagination: { limit: number; offset: number; total: number };
}>> => {
  try {
    const response = await apiClient.get('/survey/results', {
      params: { limit, offset }
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.message || 'データの取得に失敗しました');
    } else {
      throw new Error('ネットワークエラーが発生しました');
    }
  }
};

// ヘルスチェック
export const healthCheck = async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error: any) {
    throw new Error('サーバーに接続できませんでした');
  }
};
