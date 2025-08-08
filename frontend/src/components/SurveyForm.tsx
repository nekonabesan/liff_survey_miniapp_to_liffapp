import React, { useState } from 'react';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

interface SurveyFormProps {
  userProfile: LiffProfile | null;
  onSubmitSuccess: () => void;
}

interface SurveyData {
  age: string;
  gender: string;
  satisfaction: string;
  comments: string;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ userProfile, onSubmitSuccess }) => {
  const [formData, setFormData] = useState<SurveyData>({
    age: '',
    gender: '',
    satisfaction: '',
    comments: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    try {
      // API call to submit survey data
      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: userProfile?.userId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        onSubmitSuccess();
      } else {
        console.error('Survey submission failed');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
            年齢
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
            性別
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
            <option value="other">その他</option>
            <option value="prefer-not-to-say">回答しない</option>
          </select>
        </div>

        <div>
          <label htmlFor="satisfaction" className="block text-sm font-medium text-gray-700 mb-1">
            満足度
          </label>
          <select
            id="satisfaction"
            name="satisfaction"
            value={formData.satisfaction}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            <option value="very-satisfied">とても満足</option>
            <option value="satisfied">満足</option>
            <option value="neutral">普通</option>
            <option value="dissatisfied">不満</option>
            <option value="very-dissatisfied">とても不満</option>
          </select>
        </div>

        <div>
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
            ご意見・ご要望
          </label>
          <textarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ご自由にお書きください"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isSubmitting ? '送信中...' : '送信'}
        </button>
      </form>
    </div>
  );
};

export default SurveyForm;