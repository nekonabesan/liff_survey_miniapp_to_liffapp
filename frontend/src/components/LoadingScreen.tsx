interface LoadingScreenProps {}

const LoadingScreen: React.FC<LoadingScreenProps> = () => {
  return (
    <div className="loading">
      <div className="loading-content">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
