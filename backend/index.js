const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Firebase Admin SDKを初期化
admin.initializeApp();

// Firestoreの参照を取得
const db = admin.firestore();

/**
 * アンケート回答を保存するAPI
 */
exports.submitSurvey = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // POSTメソッドのみ許可
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const surveyData = req.body;

      // バリデーション
      if (!surveyData || !surveyData.age || !surveyData.gender || !surveyData.frequency || !surveyData.satisfaction) {
        return res.status(400).json({ 
          error: 'Required fields are missing',
          message: '必須項目が不足しています'
        });
      }

      // タイムスタンプを追加
      const responseData = {
        ...surveyData,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      // Firestoreに保存
      const docRef = await db.collection('survey_responses').add(responseData);

      console.log('Survey response saved:', docRef.id);

      res.status(200).json({
        success: true,
        message: 'アンケート回答を保存しました',
        id: docRef.id
      });

    } catch (error) {
      console.error('Error saving survey response:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'サーバーエラーが発生しました'
      });
    }
  });
});

/**
 * アンケート結果を取得するAPI（管理者用）
 */
exports.getSurveyResults = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // GETメソッドのみ許可
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // 認証チェック（実装する場合）
      // const token = req.headers.authorization;
      // if (!token) {
      //   return res.status(401).json({ error: 'Unauthorized' });
      // }

      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      // Firestoreからデータを取得
      const snapshot = await db.collection('survey_responses')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const responses = [];
      snapshot.forEach(doc => {
        responses.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // 統計データを計算
      const stats = calculateStatistics(responses);

      res.status(200).json({
        success: true,
        data: {
          responses,
          statistics: stats,
          pagination: {
            limit,
            offset,
            total: snapshot.size
          }
        }
      });

    } catch (error) {
      console.error('Error fetching survey results:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'データの取得に失敗しました'
      });
    }
  });
});

/**
 * 統計データを計算する関数
 */
function calculateStatistics(responses) {
  if (responses.length === 0) {
    return {
      totalResponses: 0,
      ageDistribution: {},
      genderDistribution: {},
      frequencyDistribution: {},
      satisfactionDistribution: {},
      averageSatisfaction: 0
    };
  }

  const stats = {
    totalResponses: responses.length,
    ageDistribution: {},
    genderDistribution: {},
    frequencyDistribution: {},
    satisfactionDistribution: {},
    averageSatisfaction: 0
  };

  let satisfactionSum = 0;

  responses.forEach(response => {
    // 年齢分布
    const age = response.age;
    stats.ageDistribution[age] = (stats.ageDistribution[age] || 0) + 1;

    // 性別分布
    const gender = response.gender;
    stats.genderDistribution[gender] = (stats.genderDistribution[gender] || 0) + 1;

    // 利用頻度分布
    const frequency = response.frequency;
    stats.frequencyDistribution[frequency] = (stats.frequencyDistribution[frequency] || 0) + 1;

    // 満足度分布
    const satisfaction = response.satisfaction;
    stats.satisfactionDistribution[satisfaction] = (stats.satisfactionDistribution[satisfaction] || 0) + 1;

    // 満足度合計
    satisfactionSum += parseInt(satisfaction);
  });

  // 平均満足度を計算
  stats.averageSatisfaction = Number((satisfactionSum / responses.length).toFixed(2));

  return stats;
}

/**
 * ヘルスチェックAPI
 */
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'LIFF Survey API is running'
  });
});
