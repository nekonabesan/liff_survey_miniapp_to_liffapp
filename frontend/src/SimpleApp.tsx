function SimpleApp() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      padding: '2rem',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ 
        maxWidth: '28rem', 
        margin: '0 auto', 
        backgroundColor: 'white', 
        borderRadius: '0.5rem', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        padding: '1.5rem' 
      }}>
        <h1 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          color: '#1f2937', 
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          LIFF アンケート調査
        </h1>
        <p style={{ 
          color: '#6b7280', 
          textAlign: 'center',
          marginBottom: '1rem'
        }}>
          デバッグモード
        </p>
        
        <div style={{ 
          textAlign: 'center', 
          color: '#059669',
          fontSize: '1.125rem',
          marginBottom: '1rem'
        }}>
          Reactアプリが正常に動作しています
        </div>
        
        <p style={{ 
          textAlign: 'center', 
          fontSize: '0.875rem', 
          color: '#6b7280'
        }}>
          ブラウザのコンソール（F12）でLIFF関連のログを確認してください
        </p>
      </div>
    </div>
  );
}

export default SimpleApp;
