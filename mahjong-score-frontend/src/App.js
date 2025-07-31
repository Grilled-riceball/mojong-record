import React, { useState, useEffect } from 'react';
import './App.css'; // 必要に応じてCSSファイルを調整

function App() {
  const [liffInitialized, setLiffInitialized] = useState(false);
  const [liffError, setLiffError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [scores, setScores] = useState({ player1: '', player2: '', player3: '', player4: '' });
  const [matchResults, setMatchResults] = useState([]);

  // ダミーデータ（本来はバックエンドから取得）
  const groups = [
    { id: 'group-1', name: 'いつもの麻雀会', members: ['田中', '佐藤', '鈴木', '高橋'] },
    { id: 'group-2', name: '会社麻雀部', members: ['山田', '伊藤', '小林', '加藤'] },
  ];

  useEffect(() => {
    // LIFF SDKの初期化
    const initLiff = async () => {
      try {
        // 環境変数からLIFF IDを取得する（重要！）
        // .env ファイルに REACT_APP_LIFF_ID=YOUR_LIFF_ID と記述
        const liffId = process.env.REACT_APP_LIFF_ID;
        if (!liffId) {
          throw new Error('LIFF ID is not defined in environment variables.');
        }

        await window.liff.init({ liffId: liffId });
        setLiffInitialized(true);

        // ログイン状態の確認とプロフィール取得
        if (window.liff.isLoggedIn()) {
          const liffProfile = await window.liff.getProfile();
          setProfile(liffProfile);
          console.log('LIFF Profile:', liffProfile);
          // ここでバックエンドにユーザー情報を送信するAPI呼び出しを行う
          // 例: sendProfileToBackend(liffProfile.userId, liffProfile.displayName);
        } else {
          // 未ログインの場合、ログイン画面へリダイレクト（LIFFアプリ内なら自動的にLINEログイン画面へ）
          // 開発中はここでリダイレクトされると不便な場合があるので、コメントアウトして手動ログインを促すことも
          // window.liff.login();
          console.log('LIFF Not logged in. Please log in to LINE.');
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error);
        setLiffError(error.message);
      }
    };

    if (window.liff) {
      initLiff();
    } else {
      setLiffError('LIFF SDK not loaded. Make sure you included it in public/index.html');
    }
  }, []);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setMatchResults([]); // グループ変更で成績をリセット
  };

  const handleScoreChange = (player, value) => {
    setScores(prev => ({ ...prev, [player]: value }));
  };

  const addMatchResult = () => {
    if (!selectedGroup) {
      alert('グループを選択してください。');
      return;
    }
    // ここで入力値のバリデーションを行う（例: 数値であること）
    if (Object.values(scores).some(s => s === '' || isNaN(s))) {
        alert('全てのプレイヤーの点数を数値で入力してください。');
        return;
    }

    const newResult = {
      id: matchResults.length + 1,
      group: selectedGroup.name,
      date: new Date().toLocaleDateString(),
      players: {
        [selectedGroup.members[0]]: scores.player1,
        [selectedGroup.members[1]]: scores.player2,
        [selectedGroup.members[2]]: scores.player3,
        [selectedGroup.members[3]]: scores.player4,
      },
      recordedBy: profile ? profile.displayName : '不明なユーザー',
    };
    setMatchResults(prev => [...prev, newResult]);
    setScores({ player1: '', player2: '', player3: '', player4: '' }); // 入力欄をクリア
    alert('試合結果を登録しました！ (実際にはバックエンドに送信)');

    // 実際にはここでバックエンドAPIを呼び出す
    // 例: axios.post('/api/match', newResult);
  };

  if (liffError) {
    return (
      <div className="App-container error">
        <h1>LIFF Initialization Error</h1>
        <p>Error: {liffError}</p>
        <p>LIFF IDが正しく設定されているか、`public/index.html`にLIFF SDKが読み込まれているか確認してください。</p>
        <p>開発環境: `npm start` で起動している場合、ブラウザの開発者ツール (F12) のコンソールも確認してください。</p>
      </div>
    );
  }

  if (!liffInitialized) {
    return (
      <div className="App-container loading">
        <h1>LIFF SDKを初期化中...</h1>
        <p>LINEミニアプリの準備をしています。しばらくお待ちください。</p>
      </div>
    );
  }

  return (
    <div className="App-container">
      <header className="App-header">
        <h1>麻雀成績管理</h1>
        {profile ? (
          <div className="user-profile">
            <img src={profile.pictureUrl} alt="User Profile" className="profile-pic" />
            <span>こんにちは、{profile.displayName}さん！</span>
          </div>
        ) : (
          <p>LINEにログインしていません。</p>
        )}
      </header>

      <section className="group-selection">
        <h2>グループ選択</h2>
        <div className="group-buttons">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => handleGroupSelect(group)}
              className={selectedGroup && selectedGroup.id === group.id ? 'active' : ''}
            >
              {group.name}
            </button>
          ))}
        </div>
        {selectedGroup && (
          <p>選択中のグループ: <strong>{selectedGroup.name}</strong></p>
        )}
      </section>

      {selectedGroup && (
        <section className="score-entry">
          <h2>成績入力 ({selectedGroup.name})</h2>
          <div className="player-inputs">
            {selectedGroup.members.map((member, index) => (
              <div key={member} className="player-input-item">
                <label htmlFor={`player${index + 1}`}>{member}:</label>
                <input
                  type="number"
                  id={`player${index + 1}`}
                  value={scores[`player${index + 1}`]}
                  onChange={(e) => handleScoreChange(`player${index + 1}`, e.target.value)}
                  placeholder="点数を入力"
                />
              </div>
            ))}
          </div>
          <button onClick={addMatchResult} className="submit-button">
            試合結果を登録
          </button>
        </section>
      )}

      {matchResults.length > 0 && (
        <section className="match-history">
          <h2>最近の試合結果 ({selectedGroup.name})</h2>
          {matchResults.map(result => (
            <div key={result.id} className="match-card">
              <p><strong>日付:</strong> {result.date}</p>
              <p><strong>記録者:</strong> {result.recordedBy}</p>
              <div className="match-scores">
                {Object.entries(result.players).map(([player, score]) => (
                  <span key={player}><strong>{player}:</strong> {score}点 </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {!selectedGroup && (
        <section className="no-group-selected">
          <p>グループを選択すると、成績入力フォームが表示されます。</p>
        </section>
      )}
    </div>
  );
}

export default App;