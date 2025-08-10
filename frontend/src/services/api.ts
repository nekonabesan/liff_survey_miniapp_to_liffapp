import axios from 'axios';
import { SurveyFormData, ApiResponse, UserStatus, UserStatusRequest, SurveyResponse } from '@/types';

// API ベースURL（環境変数から取得、fallbackは開発用）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Axiosインスタンスを作成
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（IDTokenを自動付与）
apiClient.interceptors.request.use(
  (config) => {
    // IDTokenを取得してヘッダーに追加
    const idToken = getStoredIDToken();
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // 認証エラーの場合、IDTokenをクリア
      clearStoredIDToken();
      console.warn('認証エラー: IDTokenが無効です');
    } else if (error.response?.status >= 500) {
      // サーバーエラーの場合の処理
      console.error('サーバーエラーが発生しました');
    }
    
    return Promise.reject(error);
  }
);

// IDTokenを一時的に保存・取得する関数
let temporaryIDToken: string | null = null;

export const setIDTokenForAPI = (idToken: string) => {
  temporaryIDToken = idToken;
};

export const getStoredIDToken = (): string | null => {
  return temporaryIDToken;
};

export const clearStoredIDToken = () => {
  temporaryIDToken = null;
};

// ユーザー状態確認
export const checkUserStatus = async (userRequest: UserStatusRequest): Promise<UserStatus> => {
  try {
    const response = await apiClient.post<ApiResponse<UserStatus>>('/user/status', userRequest);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'ユーザー状態の確認に失敗しました');
    }
  } catch (error: any) {
    console.error('Error checking user status:', error);
    throw new Error(error.response?.data?.detail || error.message || 'ユーザー状態の確認に失敗しました');
  }
};

// ユーザーの最新回答取得
export const getUserLatestResponse = async (userId: string): Promise<SurveyResponse | null> => {
  try {
    const response = await apiClient.get<ApiResponse<SurveyResponse>>(`/user/${userId}/latest-response`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      return null; // 回答が見つからない場合
    }
  } catch (error: any) {
    console.error('Error fetching user latest response:', error);
    // 404エラー（回答が見つからない）の場合はnullを返す
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(error.response?.data?.detail || error.message || '回答の取得に失敗しました');
  }
};

// アンケート回答送信
export const submitSurvey = async (surveyData: SurveyFormData & { userId?: string; displayName?: string }): Promise<string> => {
  try {
    const response = await apiClient.post<ApiResponse<{ id: string }>>('/survey/submit', surveyData);
    
    if (response.data.success && response.data.data) {
      return response.data.data.id;
    } else {
      throw new Error(response.data.error || 'アンケートの送信に失敗しました');
    }
  } catch (error: any) {
    console.error('Error submitting survey:', error);
    throw new Error(error.response?.data?.detail || error.message || 'アンケートの送信に失敗しました');
  }
};

// ヘルスチェック
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get<ApiResponse<any>>('/health');
    return response.data.success;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export default apiClient;
