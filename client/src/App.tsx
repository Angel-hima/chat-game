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
import { FriendModal } from './components/FriendModal';
import { AdminModal } from './components/AdminModal';
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
    updatePlayerProfile,
    myFriendCode,
    friends,
    friendsStatus,
    addFriend,
    removeFriend,
    isAdmin,
    broadcastAlert,
    setBroadcastAlert,
    roomForceClosedReason,
    setRoomForceClosedReason,
    adminGetOverview,
    adminCloseRoom,
    adminBroadcast,
    adminAddCode,
    adminRemoveCode,
    adminCreateAnnouncement,
    adminDeleteAnnouncement
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
  const [showFriends, setShowFriends] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // プレイヤーカードからのワンタップフレンド追加
  const handleAddFriendFromPlayer = (player: Player) => {
    if (!player.friendCode) {
      setErrorMessage('相手のフレンドコードが見つかりませんでした。');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    const res = addFriend(player.friendCode, player.name, player.avatar);
    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setErrorMessage(res.message);
      setTimeout(() => setErrorMessage(null), 3000);
    }
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
      player: { name: playerName, avatar: playerAvatar, friendCode: myFriendCode },
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
      player: { name: playerName, avatar: playerAvatar, friendCode: myFriendCode },
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
        onOpenFriends={() => setShowFriends(true)}
        onlineFriendCount={Object.values(friendsStatus).filter(s => s.isOnline).length}
        isAdmin={isAdmin}
        onOpenAdmin={() => setShowAdminModal(true)}
      />

      {/* 成功アラートポップアップ */}
      {successMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-pop">
          <div className="bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2">
            <span>✨ {successMessage}</span>
          </div>
        </div>
      )}

      {/* 未接続アラートバナー */}
      {!isConnected && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 px-4 py-2 text-center text-xs text-rose-200 flex flex-wrap items-center justify-center gap-2">
          <span>⚠️ リアルタイムサーバーに接続されていません（接続先: {serverUrl}）</span>
          <span className="text-[11px] text-rose-400">※サーバー（server）が起動しているか確認してください</span>
          <button
            onClick={() => updateServerUrl('http://52.68.217.139:3010')}
            className="underline text-white hover:text-indigo-200 font-bold ml-2"
          >
            AWSサーバーに再接続
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
            onAddFriend={handleAddFriendFromPlayer}
            friends={friends}
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

      {/* フレンド管理モーダル */}
      {showFriends && (
        <FriendModal
          isOpen={showFriends}
          onClose={() => setShowFriends(false)}
          myFriendCode={myFriendCode}
          friends={friends}
          friendsStatus={friendsStatus}
          onAddFriend={addFriend}
          onRemoveFriend={removeFriend}
          onJoinRoom={(roomId) => handleJoinRoom(roomId)}
        />
      )}

      {/* 管理者コントロールパネル */}
      {showAdminModal && (
        <AdminModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          myFriendCode={myFriendCode}
          onGetOverview={adminGetOverview}
          onCloseRoom={adminCloseRoom}
          onBroadcast={adminBroadcast}
          onAddCode={adminAddCode}
          onRemoveCode={adminRemoveCode}
          onCreateAnnouncement={adminCreateAnnouncement}
          onDeleteAnnouncement={adminDeleteAnnouncement}
          announcements={announcements}
        />
      )}

      {/* 緊急全体アナウンス受信ポップアップ */}
      {broadcastAlert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-pop">
          <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl shadow-amber-500/20">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 mx-auto flex items-center justify-center text-2xl font-black">
              📢
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                【重要】{broadcastAlert.senderName} からの緊急アナウンス
              </span>
              <p className="text-sm font-extrabold text-white leading-relaxed whitespace-pre-wrap">
                {broadcastAlert.message}
              </p>
            </div>
            <button
              onClick={() => setBroadcastAlert(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition"
            >
              確認しました
            </button>
          </div>
        </div>
      )}

      {/* 部屋強制解散メッセージ */}
      {roomForceClosedReason && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-pop">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl shadow-rose-500/20">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 mx-auto flex items-center justify-center text-2xl font-black">
              🚨
            </div>
            <div>
              <h4 className="text-base font-black text-white mb-1">部屋が解散されました</h4>
              <p className="text-xs text-rose-300 leading-relaxed">
                {roomForceClosedReason}
              </p>
            </div>
            <button
              onClick={() => setRoomForceClosedReason(null)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
