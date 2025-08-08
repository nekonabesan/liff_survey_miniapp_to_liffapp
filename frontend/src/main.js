// LIFF設定
const LIFF_ID = 'YOUR_LIFF_ID_HERE'; // 実際のLIFF IDに置き換えてください

// API設定
const API_BASE_URL = 'https://your-region-your-project-id.cloudfunctions.net'; // 実際のURLに置き換えてください

// DOM要素
const loadingElement = document.getElementById('loading');
const appElement = document.getElementById('app');
const surveyForm = document.getElementById('surveyForm');
const thankYouElement = document.getElementById('thankYou');
const closeAppButton = document.getElementById('closeApp');

// LIFF初期化
async function initializeLiff() {
    try {
        await liff.init({ liffId: LIFF_ID });
        
        if (!liff.isLoggedIn()) {
            liff.login();
            return;
        }

        // ユーザー情報を取得
        const profile = await liff.getProfile();
        console.log('User profile:', profile);

        // ローディング画面を非表示にしてアプリを表示
        setTimeout(() => {
            loadingElement.style.display = 'none';
            appElement.style.display = 'block';
        }, 1000);

    } catch (error) {
        console.error('LIFF initialization failed:', error);
        // エラーハンドリング - LIFFが利用できない場合でもアプリを表示
        setTimeout(() => {
            loadingElement.style.display = 'none';
            appElement.style.display = 'block';
        }, 1000);
    }
}

// フォーム送信処理
async function handleFormSubmit(event) {
    event.preventDefault();

    // フォームデータを収集
    const formData = new FormData(surveyForm);
    const surveyData = {
        age: formData.get('age'),
        gender: formData.get('gender'),
        frequency: formData.get('frequency'),
        satisfaction: formData.get('satisfaction'),
        feedback: formData.get('feedback') || '',
        timestamp: new Date().toISOString()
    };

    try {
        // バリデーション
        if (!validateForm(surveyData)) {
            return;
        }

        // ローディング状態を表示
        const submitButton = document.querySelector('.submit-button');
        const originalText = submitButton.textContent;
        submitButton.textContent = '送信中...';
        submitButton.disabled = true;

        // ユーザー情報を追加（LIFFが利用可能な場合）
        if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            surveyData.userId = profile.userId;
            surveyData.displayName = profile.displayName;
        }

        // アンケートデータを送信
        await submitSurveyData(surveyData);

        // 成功時の処理
        surveyForm.style.display = 'none';
        thankYouElement.style.display = 'block';

        // LINEに完了通知を送信（オプション）
        if (typeof liff !== 'undefined' && liff.isLoggedIn()) {
            sendCompletionMessage();
        }

    } catch (error) {
        console.error('Survey submission error:', error);
        alert('送信に失敗しました。もう一度お試しください。');
        
        // エラー時はボタンを元に戻す
        const submitButton = document.querySelector('.submit-button');
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// フォームバリデーション
function validateForm(data) {
    const requiredFields = ['age', 'gender', 'frequency', 'satisfaction'];
    
    for (const field of requiredFields) {
        if (!data[field]) {
            alert(`${getFieldDisplayName(field)}を選択してください。`);
            return false;
        }
    }
    
    return true;
}

// フィールド表示名を取得
function getFieldDisplayName(field) {
    const fieldNames = {
        age: '年齢',
        gender: '性別',
        frequency: '利用頻度',
        satisfaction: '満足度'
    };
    return fieldNames[field] || field;
}

// アンケートデータ送信
async function submitSurveyData(data) {
    console.log('Survey data to submit:', data);
    
    try {
        // Firebase Functions APIにPOST送信
        const response = await fetch(`${API_BASE_URL}/submitSurvey`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'サーバーエラーが発生しました');
        }
        
        const result = await response.json();
        console.log('Survey submitted successfully:', result);
        
        return result;
    } catch (error) {
        console.error('Failed to submit survey:', error);
        
        // エラー時はローカルストレージにバックアップとして保存
        const existingData = JSON.parse(localStorage.getItem('surveyResponses') || '[]');
        existingData.push(data);
        localStorage.setItem('surveyResponses', JSON.stringify(existingData));
        
        throw error;
    }
}

// 完了通知メッセージ送信
function sendCompletionMessage() {
    if (typeof liff !== 'undefined' && liff.isInClient()) {
        try {
            liff.sendMessages([
                {
                    type: 'text',
                    text: 'アンケートにご協力いただき、ありがとうございました！'
                }
            ]);
        } catch (error) {
            console.error('Failed to send completion message:', error);
        }
    }
}

// アプリを閉じる
function closeApp() {
    if (typeof liff !== 'undefined' && liff.isInClient()) {
        liff.closeWindow();
    } else {
        // LIFFブラウザ外の場合
        window.close();
        // 閉じられない場合は前のページに戻る
        setTimeout(() => {
            if (!window.closed) {
                history.back();
            }
        }, 100);
    }
}

// 保存されたアンケート結果を表示（デバッグ用）
function showSavedSurveys() {
    const savedData = JSON.parse(localStorage.getItem('surveyResponses') || '[]');
    console.log('Saved survey responses:', savedData);
    return savedData;
}

// イベントリスナー設定
document.addEventListener('DOMContentLoaded', () => {
    // LIFF初期化
    initializeLiff();
    
    // フォーム送信イベント
    surveyForm.addEventListener('submit', handleFormSubmit);
    
    // アプリを閉じるボタン
    closeAppButton.addEventListener('click', closeApp);
    
    // デバッグ用：保存されたデータを確認
    window.showSavedSurveys = showSavedSurveys;
});

// フォーム要素のインタラクション向上
document.addEventListener('DOMContentLoaded', () => {
    // ラジオボタンとセレクトボックスのアニメーション
    const radioInputs = document.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', () => {
            // 同じname属性のエラー状態をクリア
            const questionGroup = input.closest('.question-group');
            questionGroup.classList.remove('error');
        });
    });
    
    const selectInputs = document.querySelectorAll('select');
    selectInputs.forEach(select => {
        select.addEventListener('change', () => {
            const questionGroup = select.closest('.question-group');
            questionGroup.classList.remove('error');
        });
    });
});

// エラーハンドリング
window.addEventListener('error', (event) => {
    console.error('JavaScript error:', event.error);
});

// LIFF関連エラーハンドリング
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ユーティリティ関数
const utils = {
    // フォームデータをクリア
    clearForm: () => {
        surveyForm.reset();
        thankYouElement.style.display = 'none';
        surveyForm.style.display = 'block';
    },
    
    // 統計データを取得
    getStatistics: () => {
        const data = showSavedSurveys();
        if (data.length === 0) return null;
        
        const stats = {
            totalResponses: data.length,
            ageDistribution: {},
            genderDistribution: {},
            averageSatisfaction: 0
        };
        
        let satisfactionSum = 0;
        
        data.forEach(response => {
            // 年齢分布
            stats.ageDistribution[response.age] = (stats.ageDistribution[response.age] || 0) + 1;
            
            // 性別分布
            stats.genderDistribution[response.gender] = (stats.genderDistribution[response.gender] || 0) + 1;
            
            // 満足度合計
            satisfactionSum += parseInt(response.satisfaction);
        });
        
        stats.averageSatisfaction = (satisfactionSum / data.length).toFixed(2);
        
        return stats;
    }
};

// グローバルでユーティリティ関数を利用可能にする
window.surveyUtils = utils;
