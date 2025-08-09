// LIFF関連の型定義
export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// ユーザー状態関連の型定義
export interface UserStatusRequest {
  userId: string;
  displayName?: string;
}

export interface UserStatus {
  userId: string;
  hasResponse: boolean;
  lastResponseId?: string;
  lastResponseDate?: string;
  responseCount: number;
}

// アンケート回答データの型定義
export interface SurveyFormData {
  age: string;
  gender: 'male' | 'female' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly' | 'rarely';
  satisfaction: '1' | '2' | '3' | '4' | '5';
  feedback?: string;
}

export interface SurveyResponse extends SurveyFormData {
  id?: string;
  userId?: string;
  displayName?: string;
  timestamp: string;
}

// API レスポンスの型定義
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 統計データの型定義
export interface SurveyStatistics {
  total_responses: number;
  age_distribution: Record<string, number>;
  gender_distribution: Record<string, number>;
  frequency_distribution: Record<string, number>;
  satisfaction_distribution: Record<string, number>;
  average_satisfaction: number;
  responses_by_date: Record<string, number>;
}

// エラーの型定義
export interface AppError {
  code: string;
  message: string;
  details?: any;
}
