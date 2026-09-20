import { useState } from 'react';
import { Crown, CheckCircle2, Circle, Play, LogOut, Copy, Check, MessageSquare, HelpCircle, Users, Globe, Lock, Edit3, UserPlus } from 'lucide-react';
import { Room, GameMode, Player, Friend } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface LobbyViewProps {
  room: Room;
  currentUserId: string;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onChangeGameMode: (mode: GameMode) => void;
  onSelectPlayer?: (player: Player) => void;
  onOpenEditProfile?: () => void;
  onAddFriend?: (player: Player) => void;
  friends?: Friend[];
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentUserId,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
  onChangeGameMode,
  onSelectPlayer,
  onOpenEditProfile,
  onAddFriend,
  friends = []
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === currentUserId;
  const me = room.players.find(p => p.id === currentUserId);

  const copyRoomCode = async () => {
    const success = await copyToClipboard(room.id);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ホスト以外のプレイヤーが全員準備完了しているか
  const allReady = room.players.filter(p => !p.isHost).every(p => p.isReady);
  const canStart = isHost && room.players.length >= (room.gameMode === 'wordwolf' ? 3 : 1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* 部屋情報ヘッダー */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl backdrop-blur">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-extrabold text-slate-100">{room.name}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                room.isPublic ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-purple-950/80 text-purple-300 border border-purple-500/30'
              }`}>
                {room.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {room.isPublic ? '公開部屋' : '合言葉'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              モード: <span className="text-indigo-300 font-bold">{room.gameMode === 'talk' ? 'お題トーク' : 'ワードウルフ'}</span>
            </p>
            {room.description && (
              <p className="text-xs text-indigo-300/90 mt-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-500/20 max-w-md">
                💬 {room.description}
              </p>
            )}
          </div>

          {/* ルームコード・コピーボタン */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-xs text-slate-400">部屋コード:</span>
              <span className="font-mono font-black text-indigo-400 text-base tracking-widest">{room.id}</span>
              <button
                onClick={copyRoomCode}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                title="コードをコピー"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <button
              onClick={onLeaveRoom}
              className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-2xl border border-rose-500/30 transition"
              title="退出する"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ホスト専用: ゲームモード切り替え */}
        {isHost && (
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-300">ゲームモード変更:</span>
            <div className="flex gap-2">
              <button
                onClick={() => onChangeGameMode('talk')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  room.gameMode === 'talk'
                    ? 'bg-pink-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                お題トーク
              </button>
              <button
                onClick={() => onChangeGameMode('wordwolf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  room.gameMode === 'wordwolf'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                ワードウルフ (3人〜)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 参加者一覧 */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            参加プレイヤー ({room.players.length} / {room.maxPlayers}人)
          </h3>
          <span className="text-xs text-slate-400">
            {room.gameMode === 'wordwolf' ? '※ワードウルフは3人以上で開始できます' : '※1人からでもお題ガチャとして遊べます'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {room.players.map((player) => (
            <div
              key={player.id}
              onClick={() => player.id !== currentUserId && onSelectPlayer && onSelectPlayer(player)}
              className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                player.id !== currentUserId ? 'cursor-pointer hover:border-slate-500' : ''
              } ${
                player.id === currentUserId
                  ? 'bg-indigo-950/40 border-indigo-500/50'
                  : 'bg-slate-900/60 border-slate-700/60'
              }`}
              title={player.id !== currentUserId ? 'クリックして通報・ブロック' : ''}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{player.avatar}</span>
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-sm text-slate-100">
                    <span>{player.name}</span>
                    {player.id === currentUserId && (
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 rounded font-normal">自分</span>
                    )}
                    {player.id === currentUserId && onOpenEditProfile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditProfile();
                        }}
                        className="text-[10px] bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 px-1.5 py-0.5 rounded-lg flex items-center gap-1 font-bold transition shadow"
                        title="ニックネームやアバターを変更"
                      >
                        <Edit3 className="w-2.5 h-2.5" /> 名前変更
                      </button>
                    )}
                    {player.isHost && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {player.isHost ? '部屋のホスト' : player.isReady ? '準備OK' : '準備中...'}
                    {player.id !== currentUserId && ' (管理)'}
                  </span>
                </div>
              </div>

              {/* 状態バッジ & フレンド追加ボタン */}
              <div className="flex items-center gap-1.5">
                {player.id !== currentUserId && onAddFriend && (
                  friends.some(f => f.friendCode === player.friendCode) ? (
                    <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950/60 border border-indigo-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" /> フレンド
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddFriend(player);
                      }}
                      className="text-[10px] font-bold text-indigo-200 bg-indigo-800/80 hover:bg-indigo-700 px-2 py-1 rounded-lg flex items-center gap-1 border border-indigo-500/40 shadow transition active:scale-95"
                      title="フレンドに追加"
                    >
                      <UserPlus className="w-3 h-3 text-indigo-300" />
                      <span>追加</span>
                    </button>
                  )
                )}

                {player.isHost ? (
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> ホスト
                  </span>
                ) : player.isReady ? (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> READY
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <Circle className="w-3 h-3" /> 待機中
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* コントロールボタンバー */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 flex flex-col sm:flex-row gap-3">
          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition transform active:scale-95 ${
                canStart
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white shadow-emerald-600/30'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              ゲームを開始する！
            </button>
          ) : (
            <button
              onClick={onToggleReady}
              className={`flex-1 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition transform active:scale-95 ${
                me?.isReady
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
              }`}
            >
              {me?.isReady ? (
                <>
                  <Circle className="w-4 h-4" /> 準備完了を取り消す
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> 準備完了にする（READY）
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
