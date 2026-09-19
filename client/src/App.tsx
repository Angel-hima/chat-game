import { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { CreateRoomModal } from './components/CreateRoomModal';
import { LobbyView } from './components/LobbyView';
import { TalkGameView } from './components/TalkGameView';
import { WordWolfGameView } from './components/WordWolfGameView';
import { ChatAndStamps } from './components/ChatAndStamps';
import { StampOverlay } from './components/StampOverlay';
import { TermsModal } from './components/TermsModal';
import { ReportModal } from './components/ReportModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { FeedbackModal } from './components/FeedbackModal';
import { EditProfileModal } from './components/EditProfileModal';
import { GameMode, Player, Feedback } from './types';

export function App() {
  const {
    socket,
    isConnected,
    currentRoom,
    setCurrentRoom,
    publicRooms,
    messages,
    setMessages,
    stamps,
    communityPosts,
    announcements,
    serverUrl,
    updateServerUrl,
    addCommunityPost,
    likeCommunityPost,
    sendFeedback,
    updatePlayerProfile
  } = useSocket();

  // プレイヤー情報（ローカルストレージで永続化）
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('chatgame_player_name') || `ゲスト${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [playerAvatar, setPlayerAvatar] = useState<string>(() => {
    return localStorage.getItem('chatgame_player_avatar') || '🐱';
  });

  // モーダル管理
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(() => {
    // 初回アクセス時のみ自動表示
    return localStorage.getItem('chatgame_seen_tutorial') !== 'true';
  });
  const [showFeedback, setShowFeedback] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 利用規約同意状態 (Apple App Store審査必須)
  const [hasAgreedTerms, setHasAgreedTerms] = useState<boolean>(() => {
    return localStorage.getItem('chatgame_terms_agreed') === 'true';
  });

  // ブロックされたプレイヤーID一覧 (ローカルで発言非表示)
  const [blockedIds, setBlockedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('chatgame_blocked_players') || '[]');
    } catch {
      return [];
    }
  });

  // 通報対象のプレイヤー
  const [reportingPlayer, setReportingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    localStorage.setItem('chatgame_player_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('chatgame_player_avatar', playerAvatar);
  }, [playerAvatar]);

  const handleAgreeTerms = () => {
    localStorage.setItem('chatgame_terms_agreed', 'true');
    setHasAgreedTerms(true);
  };

  const handleCloseHowToPlay = () => {
    localStorage.setItem('chatgame_seen_tutorial', 'true');
    setShowHowToPlay(false);
  };

  const handleBlockPlayer = (id: string) => {
    const updated = [...blockedIds, id];
    setBlockedIds(updated);
    localStorage.setItem('chatgame_blocked_players', JSON.stringify(updated));
  };

  const handleReportPlayer = (id: string, reason: string) => {
    socket?.emit('report_user', { targetId: id, reason });
  };

  // プロフィール変更・保存（入室中も全員に同期）
  const handleSaveProfile = (newName: string, newAvatar: string) => {
    setPlayerName(newName);
    setPlayerAvatar(newAvatar);
    localStorage.setItem('chatgame_player_name', newName);
    localStorage.setItem('chatgame_player_avatar', newAvatar);

    if (currentRoom) {
      updatePlayerProfile(newName, newAvatar);
    }
  };

  // 公開部屋の再取得
  const handleRefreshRooms = () => {
    socket?.emit('get_public_rooms');
  };

  // 部屋作成
  const handleCreateRoom = (data: {
    name: string;
    description?: string;
    isPublic: boolean;
    passcode?: string;
    maxPlayers: number;
    gameMode: GameMode;
  }) => {
    if (!socket || !isConnected) {
      setErrorMessage('サーバーに接続されていません。');
      return;
    }

    socket.emit('create_room', {
      player: { name: playerName, avatar: playerAvatar },
      ...data
    }, (res: { success: boolean; room?: any; error?: string }) => {
      if (res.success && res.room) {
        setCurrentRoom(res.room);
        setMessages([]);
        setShowCreateModal(false);
      } else {
        setErrorMessage(res.error || '部屋の作成に失敗しました。');
      }
    });
  };

  // 部屋参加
  const handleJoinRoom = (roomId: string, passcode?: string) => {
    if (!socket || !isConnected) {
      setErrorMessage('サーバーに接続されていません。');
      return;
    }

    socket.emit('join_room', {
      roomId,
      player: { name: playerName, avatar: playerAvatar },
      passcode
    }, (res: { success: boolean; room?: any; error?: string }) => {
      if (res.success && res.room) {
        setCurrentRoom(res.room);
        setMessages([]);
      } else {
        setErrorMessage(res.error || '部屋への参加に失敗しました。');
      }
    });
  };

  // 退出
  const handleLeaveRoom = () => {
    socket?.emit('leave_room');
    setCurrentRoom(null);
    setMessages([]);
  };

  // 準備完了トグル
  const handleToggleReady = () => {
    socket?.emit('toggle_ready');
  };

  // ゲームモード変更
  const handleChangeGameMode = (mode: GameMode) => {
    socket?.emit('change_game_mode', mode);
  };

  // ゲーム開始
  const handleStartGame = () => {
    socket?.emit('start_game');
  };

  // お題引き直し
  const handleNextTopic = () => {
    socket?.emit('next_topic');
  };

  // ワードウルフ投票
  const handleSubmitVote = (targetPlayerId: string) => {
    socket?.emit('submit_vote', targetPlayerId);
  };

  // ロビーに戻る
  const handleResetToLobby = () => {
    socket?.emit('reset_to_lobby');
  };

  // チャット送信
  const handleSendMessage = (text: string) => {
    socket?.emit('send_message', text);
  };

  // リアクションスタンプ送信
  const handleSendReaction = (data: { emoji: string; text: string }) => {
    socket?.emit('send_reaction', data);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* 画面上の弾幕スタンプ演出 */}
      <StampOverlay stamps={stamps} />

      {/* ナビゲーションバー */}
      <Navbar
        isConnected={isConnected}
        serverUrl={serverUrl}
        onUpdateServerUrl={updateServerUrl}
        playerName={playerName}
        playerAvatar={playerAvatar}
        onOpenHowToPlay={() => setShowHowToPlay(true)}
        onOpenFeedback={() => setShowFeedback(true)}
        onOpenEditProfile={() => setShowEditProfile(true)}
      />

      {/* 未接続アラートバナー */}
      {!isConnected && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 px-4 py-2 text-center text-xs text-rose-200 flex flex-wrap items-center justify-center gap-2">
          <span>⚠️ リアルタイムサーバーに接続されていません（接続先: {serverUrl}）</span>
          <span className="text-[11px] text-rose-400">※サーバー（server）が起動しているか確認してください</span>
          <button
            onClick={() => updateServerUrl('http://localhost:3010')}
            className="underline text-white hover:text-indigo-200 font-bold ml-2"
          >
            localhost:3010に再接続
          </button>
        </div>
      )}

      {/* エラーアラートポップアップ */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-pop">
          <div className="bg-rose-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-2 bg-rose-700 hover:bg-rose-800 px-2 py-0.5 rounded-lg"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* メインビュー */}
      <main className="flex-1">
        {!currentRoom ? (
          <HomeView
            playerName={playerName}
            setPlayerName={setPlayerName}
            playerAvatar={playerAvatar}
            setPlayerAvatar={setPlayerAvatar}
            publicRooms={publicRooms}
            communityPosts={communityPosts}
            announcements={announcements}
            onRefreshRooms={handleRefreshRooms}
            onOpenCreateModal={() => setShowCreateModal(true)}
            onJoinRoom={handleJoinRoom}
            onAddCommunityPost={(content) => addCommunityPost(content, playerName, playerAvatar)}
            onLikeCommunityPost={likeCommunityPost}
            onOpenEditProfile={() => setShowEditProfile(true)}
          />
        ) : currentRoom.status === 'lobby' ? (
          <LobbyView
            room={currentRoom}
            currentUserId={socket?.id || ''}
            onToggleReady={handleToggleReady}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
            onChangeGameMode={handleChangeGameMode}
            onSelectPlayer={(p) => setReportingPlayer(p)}
            onOpenEditProfile={() => setShowEditProfile(true)}
          />
        ) : currentRoom.gameMode === 'talk' ? (
          <TalkGameView
            room={currentRoom}
            currentUserId={socket?.id || ''}
            onNextTopic={handleNextTopic}
            onResetToLobby={handleResetToLobby}
          />
        ) : (
          <WordWolfGameView
            room={currentRoom}
            currentUserId={socket?.id || ''}
            onSubmitVote={handleSubmitVote}
            onResetToLobby={handleResetToLobby}
          />
        )}

        {/* 部屋に参加中の場合、チャット＆スタンプバーを表示 (ブロックしたユーザーの発言は非表示) */}
        {currentRoom && (
          <ChatAndStamps
            messages={messages.filter(m => !blockedIds.includes(m.senderId))}
            currentUserId={socket?.id || ''}
            onSendMessage={handleSendMessage}
            onSendReaction={handleSendReaction}
          />
        )}
      </main>

      {/* 部屋作成モーダル */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
          defaultPlayerName={playerName}
        />
      )}

      {/* 遊び方ガイドモーダル（初回自動表示 ＆ いつでも閲覧可能） */}
      {showHowToPlay && (
        <HowToPlayModal onClose={handleCloseHowToPlay} />
      )}

      {/* ご意見・フィードバックモーダル */}
      {showFeedback && (
        <FeedbackModal
          userName={playerName}
          onClose={() => setShowFeedback(false)}
          onSendFeedback={sendFeedback}
        />
      )}

      {/* プロフィール変更モーダル（入室中もいつでも変更可能） */}
      {showEditProfile && (
        <EditProfileModal
          currentName={playerName}
          currentAvatar={playerAvatar}
          onClose={() => setShowEditProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* 初回起動時: 利用規約モーダル (App Store Guideline 1.2 必須) */}
      {!hasAgreedTerms && (
        <TermsModal onAgree={handleAgreeTerms} />
      )}

      {/* プレイヤー通報・ブロックモーダル */}
      {reportingPlayer && (
        <ReportModal
          targetPlayer={reportingPlayer}
          onClose={() => setReportingPlayer(null)}
          onBlock={handleBlockPlayer}
          onReport={handleReportPlayer}
        />
      )}
    </div>
  );
}

export default App;
