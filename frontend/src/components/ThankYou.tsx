import React from 'react';

interface ThankYouProps {
  onReset: () => void;
}

const ThankYou: React.FC<ThankYouProps> = ({ onReset }) => {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
      <div className="mb-6">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ありがとうございました！
        </h2>
        <p className="text-gray-600">
          アンケートへのご協力をいただき、誠にありがとうございました。
          いただいたご意見を今後のサービス向上に活用させていただきます。
        </p>
      </div>
      
      <button
        onClick={onReset}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        もう一度回答する
      </button>
    </div>
  );
};

export default ThankYou;