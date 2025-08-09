const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Firebase Admin SDK を初期化
admin.initializeApp();
const db = admin.firestore();

// ヘルスチェック
exports.health = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    res.json({
      success: true,
      message: 'LIFF Survey API is running on Firebase Functions',
      data: {
        status: 'OK',
        timestamp: new Date().toISOString(),
        firestore_available: true
      }
    });
  });
});

// ユーザー状態確認
exports.userStatus = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
      const { userId, displayName } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }

      // Firestoreでユーザーの回答を検索（インデックス不要版）
      const query = db.collection('survey_responses')
        .where('userId', '==', userId);
      
      const snapshot = await query.get();

      let userStatus;
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        // 手動でソート
        const sortedDocs = docs.sort((a, b) => {
          const aTime = new Date(a.data().createdAt);
          const bTime = new Date(b.data().createdAt);
          return bTime - aTime;
        });
        const latestResponse = sortedDocs[0].data();
        
        userStatus = {
          userId: userId,
          hasResponse: true,
          lastResponseId: sortedDocs[0].id,
          lastResponseDate: latestResponse.createdAt,
          responseCount: docs.length
        };
      } else {
        userStatus = {
          userId: userId,
          hasResponse: false,
          responseCount: 0
        };
      }

      res.json({
        success: true,
        message: 'ユーザー状態を取得しました',
        data: userStatus
      });

    } catch (error) {
      console.error('Error checking user status:', error);
      res.status(500).json({
        success: false,
        error: 'Error checking user status: ' + error.message
      });
    }
  });
});

// ユーザーの最新回答取得
exports.userLatestResponse = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
      // URLパスからユーザーIDを取得 (/user/{userId}/latest-response)
      const pathParts = req.path.split('/');
      const userId = pathParts[2];

      if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
      }

      const query = db.collection('survey_responses')
        .where('userId', '==', userId);
      
      const snapshot = await query.get();

      if (!snapshot.empty) {
        const docs = snapshot.docs;
        // 手動でソートして最新を取得
        const sortedDocs = docs.sort((a, b) => {
          const aTime = new Date(a.data().createdAt);
          const bTime = new Date(b.data().createdAt);
          return bTime - aTime;
        });
        const doc = sortedDocs[0];
        const data = { id: doc.id, ...doc.data() };
        
        res.json({
          success: true,
          data: data
        });
      } else {
        res.json({
          success: false,
          message: '回答が見つかりませんでした'
        });
      }

    } catch (error) {
      console.error('Error fetching user latest response:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching user latest response: ' + error.message
      });
    }
  });
});

// アンケート送信
exports.surveySubmit = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
      const { age, gender, frequency, satisfaction, feedback, userId, displayName } = req.body;

      // 必須フィールドの検証
      const requiredFields = ['age', 'gender', 'frequency', 'satisfaction'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({
            success: false,
            error: `Required field '${field}' is missing`
          });
        }
      }

        // バリデーション
        if (!['male', 'female', 'other'].includes(gender)) {
          return res.status(400).json({ success: false, error: 'Invalid gender value' });
        }

        if (!['daily', 'weekly', 'monthly', 'rarely'].includes(frequency)) {
          return res.status(400).json({ success: false, error: 'Invalid frequency value' });
        }

        if (!['1', '2', '3', '4', '5'].includes(satisfaction)) {
          return res.status(400).json({ success: false, error: 'Invalid satisfaction value' });
        }      // データの準備
      const timestamp = new Date().toISOString();
      const responseData = {
        age,
        gender,
        frequency,
        satisfaction,
        feedback: feedback || null,
        userId: userId || null,
        displayName: displayName || null,
        timestamp,
        createdAt: timestamp
      };

      // Firestoreに保存
      const docRef = await db.collection('survey_responses').add(responseData);

      res.json({
        success: true,
        message: 'アンケート回答を保存しました',
        data: { id: docRef.id }
      });

    } catch (error) {
      console.error('Error saving survey response:', error);
      res.status(500).json({
        success: false,
        error: 'Error saving survey response: ' + error.message
      });
    }
  });
});

// 統合API (単一エンドポイント)
exports.api = functions.region('asia-northeast1').https.onRequest((req, res) => {
  return cors(req, res, async () => {
    const path = req.path;
    const method = req.method;

    try {
      if (path === '/health' && method === 'GET') {
        res.json({
          success: true,
          message: 'LIFF Survey API is running on Firebase Functions',
          data: {
            status: 'OK',
            timestamp: new Date().toISOString(),
            firestore_available: true
          }
        });
      } else if (path === '/user/status' && method === 'POST') {
        // ユーザー状態確認の処理
        const { userId } = req.body;
        if (!userId) {
          return res.status(400).json({ success: false, error: 'userId is required' });
        }

        const query = db.collection('survey_responses')
          .where('userId', '==', userId);
        
        const snapshot = await query.get();
        
        let userStatus;
        if (!snapshot.empty) {
          const docs = snapshot.docs;
          // 手動でソート
          const sortedDocs = docs.sort((a, b) => {
            const aTime = new Date(a.data().createdAt);
            const bTime = new Date(b.data().createdAt);
            return bTime - aTime;
          });
          const latestResponse = sortedDocs[0].data();
          
          userStatus = {
            userId: userId,
            hasResponse: true,
            lastResponseId: sortedDocs[0].id,
            lastResponseDate: latestResponse.createdAt,
            responseCount: docs.length
          };
        } else {
          userStatus = {
            userId: userId,
            hasResponse: false,
            responseCount: 0
          };
        }

        res.json({
          success: true,
          message: 'ユーザー状態を取得しました',
          data: userStatus
        });
      } else if (path.match(/^\/user\/[^\/]+\/latest-response$/) && method === 'GET') {
        // 最新回答取得の処理
        const userId = path.split('/')[2];
        
        const query = db.collection('survey_responses')
          .where('userId', '==', userId);
        
        const snapshot = await query.get();
        
        if (!snapshot.empty) {
          const docs = snapshot.docs;
          // 手動でソートして最新を取得
          const sortedDocs = docs.sort((a, b) => {
            const aTime = new Date(a.data().createdAt);
            const bTime = new Date(b.data().createdAt);
            return bTime - aTime;
          });
          const doc = sortedDocs[0];
          const data = { id: doc.id, ...doc.data() };
          
          res.json({
            success: true,
            data: data
          });
        } else {
          res.json({
            success: false,
            message: '回答が見つかりませんでした'
          });
        }
      } else if (path === '/survey/submit' && method === 'POST') {
        // アンケート送信の処理
        const { age, gender, frequency, satisfaction, feedback, userId, displayName } = req.body;

        // バリデーション
        const requiredFields = ['age', 'gender', 'frequency', 'satisfaction'];
        for (const field of requiredFields) {
          if (!req.body[field]) {
            return res.status(400).json({
              success: false,
              error: `Required field '${field}' is missing`
            });
          }
        }

        // 値の妥当性チェック
        if (!['male', 'female', 'other'].includes(gender)) {
          return res.status(400).json({ success: false, error: 'Invalid gender value' });
        }

        if (!['daily', 'weekly', 'monthly', 'rarely'].includes(frequency)) {
          return res.status(400).json({ success: false, error: 'Invalid frequency value' });
        }

        if (!['1', '2', '3', '4', '5'].includes(satisfaction)) {
          return res.status(400).json({ success: false, error: 'Invalid satisfaction value' });
        }

        const timestamp = new Date().toISOString();
        const responseData = {
          age, gender, frequency, satisfaction,
          feedback: feedback || null,
          userId: userId || null,
          displayName: displayName || null,
          timestamp, createdAt: timestamp
        };

        const docRef = await db.collection('survey_responses').add(responseData);

        res.json({
          success: true,
          message: 'アンケート回答を保存しました',
          data: { id: docRef.id }
        });
      } else {
        res.status(404).json({
          success: false,
          error: `Endpoint ${method} ${path} not found`
        });
      }
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error: ' + error.message
      });
    }
  });
});
