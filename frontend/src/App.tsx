import { useState, useEffect } from 'react';
import { useLiff } from '@/hooks/useLiff';
import SurveyForm from '@/components/SurveyForm';
import ThankYou from '@/components/ThankYou';
import LoadingScreen from '@/components/LoadingScreen';
import ErrorMessage from '@/components/ErrorMessage';
import { checkUserStatus, getUserLatestResponse, setIDTokenForAPI } from '@/services/api';
import { UserStatus, SurveyResponse } from '@/types';

function App() {
  const { isLoading, error, profile, isLoggedIn, getIDToken } = useLiff();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [previousResponse, setPreviousResponse] = useState<SurveyResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showPreviousResponseConfirm, setShowPreviousResponseConfirm] = useState(false);

  // ユーザー状態確認
  useEffect(() => {
    const fetchUserStatus = async () => {
      if (!profile || !isLoggedIn) return;

      // 開発環境ではAPIを呼ばずにモック状態を設定
      const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
      
      if (isDevelopment) {
        console.log('Development mode: Skipping API calls, using mock data');
        setUserStatus({ 
          userId: profile.userId,
          hasResponse: false, 
          lastResponseDate: undefined,
          responseCount: 0
        });
        setStatusLoading(false);
        return;
      }

      try {
        setStatusLoading(true);
        
        // IDTokenを取得してAPIクライアントに設定
        const idToken = await getIDToken();
        if (idToken) {
          setIDTokenForAPI(idToken);
        }
        
        // 開発環境では5秒でタイムアウトさせる
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const statusPromise = checkUserStatus({
          userId: profile.userId,
          displayName: profile.displayName
        });
        
        // レースコンディション: タイムアウトまたは正常なレスポンス
        const status = await Promise.race([statusPromise, timeoutPromise]) as UserStatus;
        
        setUserStatus(status);

        // 回答済みの場合、最新の回答を取得
        if (status.hasResponse) {
          try {
            const latestResponse = await getUserLatestResponse(profile.userId);
            if (latestResponse) {
              setPreviousResponse(latestResponse);
              setShowPreviousResponseConfirm(true);
            }
          } catch (responseError) {
            console.warn('Failed to fetch previous response:', responseError);
            // 前回の回答取得に失敗してもユーザー状態は保持
          }
        }
      } catch (error) {
        console.error('Failed to fetch user status:', error);
        // エラーが発生した場合も、ローディングを解除してフォームを表示
        // 開発環境では特にAPIが利用できない場合があるため
        setUserStatus({ 
          userId: profile.userId,
          hasResponse: false, 
          lastResponseDate: undefined,
          responseCount: 0
        });
      } finally {
        setStatusLoading(false);
      }
    };

    fetchUserStatus();
  }, [profile?.userId, isLoggedIn]); // getIDTokenを依存関係から除外

  const handleSubmitSuccess = () => {
    setIsSubmitted(true);
    setShowPreviousResponseConfirm(false);
  };

  const handleReset = () => {
    setIsSubmitted(false);
  };

  const handleProceedWithNewResponse = () => {
    setShowPreviousResponseConfirm(false);
  };

  const handleKeepPreviousResponse = () => {
    setIsSubmitted(true);
    setShowPreviousResponseConfirm(false);
  };

  if (isLoading || statusLoading) {
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
              {userStatus && userStatus.hasResponse && (
                <span className="block text-xs text-blue-500">
                  （前回回答日: {userStatus.lastResponseDate ? new Date(userStatus.lastResponseDate).toLocaleDateString('ja-JP') : '不明'}）
                </span>
              )}
            </p>
          )}
        </header>

        <main>
          {error && <ErrorMessage message={error} />}
          
          {/* 回答済みユーザーへの確認画面 */}
          {showPreviousResponseConfirm && previousResponse && (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                前回の回答が見つかりました
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                <p><strong>回答日:</strong> {new Date(previousResponse.timestamp).toLocaleDateString('ja-JP')}</p>
                <p><strong>年齢:</strong> {previousResponse.age}</p>
                <p><strong>性別:</strong> {previousResponse.gender}</p>
                <p><strong>利用頻度:</strong> {previousResponse.frequency}</p>
                <p><strong>満足度:</strong> {previousResponse.satisfaction}点</p>
                {previousResponse.feedback && (
                  <p><strong>フィードバック:</strong> {previousResponse.feedback}</p>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleProceedWithNewResponse}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  新しく回答し直す
                </button>
                
                <button
                  onClick={handleKeepPreviousResponse}
                  className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  前回の回答を保持する
                </button>
              </div>
            </div>
          )}
          
          {/* メインコンテンツ */}
          {!showPreviousResponseConfirm && (
            <>
              {isSubmitted ? (
                <ThankYou onReset={handleReset} />
              ) : (
                <SurveyForm 
                  userProfile={profile} 
                  onSubmitSuccess={handleSubmitSuccess}
                  previousResponse={previousResponse}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
