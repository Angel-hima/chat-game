import React, { useState } from 'react';
import { Plus, LogIn, RefreshCw, Users, Globe, Lock, MessageSquare, Megaphone, Edit3, Check } from 'lucide-react';
import { PublicRoomSummary, CommunityPost, Announcement } from '../types';
import { CommunityBoard } from './CommunityBoard';

interface HomeViewProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  playerAvatar: string;
  setPlayerAvatar: (avatar: string) => void;
  publicRooms: PublicRoomSummary[];
  communityPosts: CommunityPost[];
  announcements: Announcement[];
  onRefreshRooms: () => void;
  onOpenCreateModal: () => void;
  onJoinRoom: (roomId: string, passcode?: string) => void;
  onAddCommunityPost: (content: string) => void;
  onLikeCommunityPost: (postId: string) => void;
  onOpenEditProfile: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  playerName,
  setPlayerName,
  playerAvatar,
  setPlayerAvatar,
  publicRooms,
  communityPosts,
  announcements,
  onRefreshRooms,
  onOpenCreateModal,
  onJoinRoom,
  onAddCommunityPost,
  onLikeCommunityPost,
  onOpenEditProfile
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'community'>('rooms');
  const [joinCode, setJoinCode] = useState('');
  const [joinPasscode, setJoinPasscode] = useState('');
  const [showPasscodeInput, setShowPasscodeInput] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase(), joinPasscode.trim() || undefined);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* ユーザープロフィール設定カード */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl backdrop-blur">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            <button
              onClick={onOpenEditProfile}
              className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-3xl flex items-center justify-center shadow-lg hover:scale-105 transition active:scale-95"
              title="アバター・名前を変更"
            >
              {playerAvatar}
            </button>
            <button
              onClick={onOpenEditProfile}
              className="absolute -bottom-1 -right-1 bg-indigo-500 hover:bg-indigo-400 text-[10px] px-2 py-0.5 rounded-full font-bold shadow"
            >
              変更
            </button>
          </div>

          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <label className="block text-xs font-bold text-slate-400">プレイヤー名</label>
              {savedBadge && (
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 animate-fade-in">
                  <Check className="w-3 h-3" /> 保存済み
                </span>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <input
                type="text"
                maxLength={12}
                value={playerName}
                onChange={handleNameChange}
                placeholder="あなたのニックネーム"
                className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={onOpenEditProfile}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded-xl"
                title="プロフィール詳細編集"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* クイック作成ボタン */}
          <button
            onClick={onOpenCreateModal}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            部屋を作る
          </button>
        </div>
      </div>

      {/* メインタブ切り替え (部屋一覧 / コミュニティ) */}
      <div className="flex p-1 bg-slate-900/80 border border-slate-700/80 rounded-2xl">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            activeTab === 'rooms'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          部屋を探す・入る
        </button>

        <button
          onClick={() => setActiveTab('community')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
            activeTab === 'community'
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          コミュニティ & お知らせ
          {communityPosts.length > 0 && (
            <span className="text-[10px] bg-pink-900 text-pink-200 px-1.5 py-0.2 rounded-full font-black">
              {communityPosts.length}
            </span>
          )}
        </button>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'rooms' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* ルームコードで入室カード */}
          <div className="md:col-span-1 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl backdrop-blur flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-100 mb-2 flex items-center gap-2">
                <LogIn className="w-4 h-4 text-indigo-400" />
                コード・合言葉で参加
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                友達から教えてもらったルームコード（5桁）を入力して入室します。
              </p>

              <form onSubmit={handleJoinByCode} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">ルームコード</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="例: 7A9K2"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-indigo-300 uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {showPasscodeInput ? (
                  <div className="animate-fade-in">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">合言葉（パスワード）</label>
                    <input
                      type="text"
                      value={joinPasscode}
                      onChange={(e) => setJoinPasscode(e.target.value)}
                      placeholder="パスワードを入力"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowPasscodeInput(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Lock className="w-3 h-3" /> 合言葉が必要な部屋ですか？
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="w-full py-2.5 bg-slate-700 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition shadow"
                >
                  入室する
                </button>
              </form>
            </div>
          </div>

          {/* 公開部屋一覧リスト（メイン領域） */}
          <div className="md:col-span-2 bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                公開部屋一覧（パブリック）
                <span className="text-xs bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">
                  {publicRooms.length}件
                </span>
              </h3>

              <button
                onClick={onRefreshRooms}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition"
                title="一覧を更新"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {publicRooms.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-700/60 rounded-2xl">
                <div className="text-4xl mb-3">☕</div>
                <p className="text-sm font-bold text-slate-300 mb-1">
                  現在、募集中の公開部屋はありません
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  「部屋を作る」から最初の部屋を開いてみましょう！
                </p>
                <button
                  onClick={onOpenCreateModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  ＋ 公開部屋を作成
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {publicRooms.map((room) => {
                  const isFull = room.playerCount >= room.maxPlayers;
                  return (
                    <div
                      key={room.id}
                      className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-700/60 hover:border-indigo-500/50 rounded-2xl transition group"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-slate-100 text-sm truncate">
                              {room.name}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                room.gameMode === 'talk'
                                  ? 'bg-pink-950/80 text-pink-300 border border-pink-500/30'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {room.gameMode === 'talk' ? 'お題トーク' : 'ワードウルフ'}
                            </span>
                            {room.status === 'playing' && (
                              <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse">
                                対戦中
                              </span>
                            )}
                          </div>

                          {/* 部屋説明（あれば表示） */}
                          {room.description && (
                            <p className="text-xs text-indigo-300/90 mb-2 line-clamp-2 bg-slate-950/50 px-2.5 py-1.5 rounded-xl border border-indigo-500/20">
                              💬 {room.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>ホスト: {room.hostName}</span>
                            <span className="flex items-center gap-1 font-semibold text-slate-300">
                              <Users className="w-3.5 h-3.5" />
                              {room.playerCount} / {room.maxPlayers}人
                            </span>
                            <span className="font-mono text-indigo-400 text-[11px]">#{room.id}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onJoinRoom(room.id)}
                          disabled={isFull}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap self-center ${
                            isFull
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 active:scale-95'
                          }`}
                        >
                          {isFull ? '満員' : '参加する'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* コミュニティ & お知らせタブ */
        <CommunityBoard
          posts={communityPosts}
          announcements={announcements}
          currentUserName={playerName}
          currentUserAvatar={playerAvatar}
          onAddPost={onAddCommunityPost}
          onLikePost={onLikeCommunityPost}
        />
      )}
    </div>
  );
};
