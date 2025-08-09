import React, { useState, useEffect } from 'react';
import { submitSurvey } from '@/services/api';
import { LiffProfile, SurveyFormData, SurveyResponse } from '@/types';

interface SurveyFormProps {
  userProfile: LiffProfile | null;
  onSubmitSuccess: () => void;
  previousResponse?: SurveyResponse | null;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ userProfile, onSubmitSuccess, previousResponse }) => {
  const [formData, setFormData] = useState<SurveyFormData>({
    age: '',
    gender: 'male',
    frequency: 'daily',
    satisfaction: '1',
    feedback: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 前回の回答がある場合、フォームに初期値として設定
  useEffect(() => {
    if (previousResponse) {
      setFormData({
        age: previousResponse.age,
        gender: previousResponse.gender,
        frequency: previousResponse.frequency,
        satisfaction: previousResponse.satisfaction,
        feedback: previousResponse.feedback || ''
      });
    }
  }, [previousResponse]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // ユーザー情報を含めたアンケートデータを送信
      const surveyData = {
        ...formData,
        userId: userProfile?.userId,
        displayName: userProfile?.displayName
      };

      await submitSurvey(surveyData);
      onSubmitSuccess();
    } catch (err: any) {
      console.error('Survey submission failed:', err);
      setError(err.message || 'アンケートの送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      {previousResponse && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 前回の回答を編集できます
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            年齢層 <span className="text-red-500">*</span>
          </label>
          <select
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            <option value="10-19">10代</option>
            <option value="20-29">20代</option>
            <option value="30-39">30代</option>
            <option value="40-49">40代</option>
            <option value="50-59">50代</option>
            <option value="60+">60代以上</option>
          </select>
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            性別 <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div>
          <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
            利用頻度 <span className="text-red-500">*</span>
          </label>
          <select
            id="frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">毎日</option>
            <option value="weekly">週に数回</option>
            <option value="monthly">月に数回</option>
            <option value="rarely">あまり使わない</option>
          </select>
        </div>

        <div>
          <label htmlFor="satisfaction" className="block text-sm font-medium text-gray-700 mb-1">
            満足度 <span className="text-red-500">*</span>
          </label>
          <select
            id="satisfaction"
            name="satisfaction"
            value={formData.satisfaction}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="5">5 - とても満足</option>
            <option value="4">4 - 満足</option>
            <option value="3">3 - 普通</option>
            <option value="2">2 - 不満</option>
            <option value="1">1 - とても不満</option>
          </select>
        </div>

        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
            ご意見・ご要望
          </label>
          <textarea
            id="feedback"
            name="feedback"
            value={formData.feedback}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ご自由にお書きください（任意）"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isSubmitting ? '送信中...' : previousResponse ? '回答を更新' : '回答を送信'}
        </button>
      </form>
    </div>
  );
};

export default SurveyForm;