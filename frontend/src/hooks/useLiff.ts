import { useState, useEffect } from 'react';
import { LiffProfile } from '@/types';

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
        
        // LIFF IDは環境変数から取得
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
    isInClient: window.liff?.isInClient() || false,
  };
};
