import React, { useState } from 'react';
import { X, Copy, Check, UserPlus, Trash2, Users, ArrowRightCircle } from 'lucide-react';
import { Friend, FriendStatus } from '../types';

interface FriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  myFriendCode: string;
  friends: Friend[];
  friendsStatus: Record<string, FriendStatus>;
  onAddFriend: (code: string) => { success: boolean; message: string };
  onRemoveFriend: (code: string) => void;
  onJoinRoom: (roomId: string) => void;
}

export const FriendModal: React.FC<FriendModalProps> = ({
  isOpen,
  onClose,
  myFriendCode,
  friends,
  friendsStatus,
  onAddFriend,
  onRemoveFriend,
  onJoinRoom
}) => {
  const [inputCode, setInputCode] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myFriendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const res = onAddFriend(inputCode);
    setMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setInputCode('');
    }
    setTimeout(() => setMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-b border-slate-700/80 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-600/40">
              👥
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-white">フレンド管理</h3>
              <p className="text-xs text-slate-400">オンライン中のフレンドと同じ部屋で遊べます</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {/* 自分のフレンドコード確認エリア */}
          <div className="bg-slate-800/80 rounded-2xl p-3.5 sm:p-4 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">あなたのフレンドコード</span>
              <span className="text-lg sm:text-xl font-black text-white tracking-widest font-mono">
                {myFriendCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'コピー完了！' : 'コードをコピー'}</span>
            </button>
          </div>

          {/* フレンドコード入力フォーム */}
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              フレンドコードで追加
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                placeholder="例: FG-123456"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500 uppercase"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>追加</span>
              </button>
            </div>
            {message && (
              <p className={`text-xs font-bold ${message.isError ? 'text-rose-400' : 'text-emerald-400'} animate-fade-in`}>
                {message.text}
              </p>
            )}
          </form>

          {/* フレンド一覧 */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-400">
                登録フレンド一覧（{friends.length}人）
              </h4>
            </div>

            {friends.length === 0 ? (
              <div className="text-center py-8 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700/80 p-4">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-bold">まだフレンドがいません</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  上のコードを教えてもらうか、部屋に入室してメンバー横の「👤＋」ボタンから追加できます！
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {friends.map(friend => {
                  const status = friendsStatus[friend.friendCode];
                  const isOnline = status?.isOnline ?? false;
                  const currentRoomId = status?.currentRoomId;
                  const currentRoomName = status?.currentRoomName;
                  const displayName = status?.name || friend.name;
                  const displayAvatar = status?.avatar || friend.avatar;

                  return (
                    <div
                      key={friend.friendCode}
                      className="bg-slate-800/90 border border-slate-700/70 hover:border-slate-600 rounded-2xl p-3 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative text-2xl w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                          {displayAvatar}
                          {/* オンラインバッジ */}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white truncate">
                              {displayName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({friend.friendCode})
                            </span>
                          </div>
                          <div className="text-[11px] flex items-center gap-1.5 mt-0.5">
                            {isOnline ? (
                              currentRoomId ? (
                                <span className="text-indigo-300 font-bold flex items-center gap-1">
                                  🎮 部屋: {currentRoomName || currentRoomId}
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-bold">🟢 ロビー待機中</span>
                              )
                            ) : (
                              <span className="text-slate-500">⚪ オフライン</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* 参加中部屋への合流ボタン */}
                        {isOnline && currentRoomId && (
                          <button
                            onClick={() => {
                              onJoinRoom(currentRoomId);
                              onClose();
                            }}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1.5 rounded-xl shadow-md transition"
                            title="この部屋に合流する"
                          >
                            <ArrowRightCircle className="w-3.5 h-3.5" />
                            <span>合流</span>
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveFriend(friend.friendCode)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded-xl transition"
                          title="フレンドを解除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};