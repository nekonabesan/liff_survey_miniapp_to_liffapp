import { useState, useEffect } from 'react';
import { LiffProfile } from '@/types';
import { liffService } from '@/services/liffService';

declare global {
  interface Window {
    liff: any;
  }
}

export const useLiff = () => {
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        setIsLoading(true);
        
        // 開発環境かどうかを判定
        const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
        
        if (isDevelopment) {
          // 開発環境：liffServiceのモック実装を使用
          console.log('Development mode: Using liffService mock implementation');
          
          await liffService.ready();
          const loggedIn = liffService.isLoggedIn();
          setIsLoggedIn(loggedIn);
          
          if (loggedIn) {
            const userProfile = await liffService.getProfile();
            setProfile(userProfile);
          }
          
          setIsLiffReady(true);
        } else {
          // 本番環境：実際のLIFF SDKを使用
          const liffId = import.meta.env.VITE_LIFF_ID;
          
          if (!liffId) {
            throw new Error('LIFF IDが設定されていません');
          }

          if (!window.liff) {
            throw new Error('LIFF SDKが読み込まれていません');
          }

          // LIFF初期化
          await window.liff.init({ liffId });
          setIsLiffReady(true);

          // ログイン状態をチェック
          if (window.liff.isLoggedIn()) {
            setIsLoggedIn(true);
            
            // プロフィール情報を取得
            const userProfile = await window.liff.getProfile();
            setProfile(userProfile);
          } else {
            setIsLoggedIn(false);
          }
        }

      } catch (err: any) {
        console.error('LIFF initialization failed:', err);
        setError(err.message || 'LIFF初期化に失敗しました');
        
        // エラーが発生してもアプリは使用できるようにする
        setIsLiffReady(false);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLiff();
  }, []);

  const login = () => {
    if (window.liff && window.liff.isInClient()) {
      window.liff.login();
    } else {
      setError('LINEアプリ内でのみ利用可能です');
    }
  };

  const logout = () => {
    if (window.liff) {
      window.liff.logout();
      setIsLoggedIn(false);
      setProfile(null);
    }
  };

  const closeWindow = () => {
    if (window.liff && window.liff.isInClient()) {
      window.liff.closeWindow();
    } else {
      // LINEアプリ外の場合は前のページに戻る
      window.history.back();
    }
  };

  const sendMessage = async (message: string) => {
    if (window.liff && window.liff.isInClient()) {
      try {
        await window.liff.sendMessages([
          {
            type: 'text',
            text: message
          }
        ]);
      } catch (err: any) {
        console.error('Failed to send message:', err);
        throw new Error('メッセージの送信に失敗しました');
      }
    }
  };

  const getAccessToken = async () => {
    try {
      return await liffService.getAccessToken();
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  };

  const getIDToken = async () => {
    try {
      return await liffService.getIDToken();
    } catch (error) {
      console.error('Failed to get ID token:', error);
      return null;
    }
  };

  return {
    isLiffReady,
    isLoggedIn,
    profile,
    error,
    isLoading,
    login,
    logout,
    closeWindow,
    sendMessage,
    getAccessToken,
    getIDToken,
    isInClient: window.liff?.isInClient() || false,
  };
};
