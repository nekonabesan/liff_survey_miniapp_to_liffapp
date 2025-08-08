import { useState } from 'react';
import { useLiff } from '@/hooks/useLiff';
import SurveyForm from '@/components/SurveyForm';
import ThankYou from '@/components/ThankYou';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorMessage from '@/components/ErrorMessage';

function App() {
  const { isLoading, error, profile } = useLiff();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitSuccess = () => {
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">アンケート調査</h1>
          <p className="text-gray-600">ご協力をお願いいたします</p>
          {profile && (
            <p className="mt-2 text-sm text-gray-500">
              {profile.displayName} さん
            </p>
          )}
        </header>

        <main>
          {error && <ErrorMessage message={error} />}
          
          {isSubmitted ? (
            <ThankYou onReset={handleReset} />
          ) : (
            <SurveyForm 
              userProfile={profile} 
              onSubmitSuccess={handleSubmitSuccess} 
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
