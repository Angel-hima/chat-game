import React from 'react';
import { Clock, Dices, RotateCcw, MessageSquare, Sparkles } from 'lucide-react';
import { Room } from '../types';

interface TalkGameViewProps {
  room: Room;
  currentUserId: string;
  onNextTopic: () => void;
  onResetToLobby: () => void;
}

export const TalkGameView: React.FC<TalkGameViewProps> = ({
  room,
  currentUserId,
  onNextTopic,
  onResetToLobby
}) => {
  const isHost = room.hostId === currentUserId;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      {/* ステータスバー */}
      <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-600/30 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">トークテーマ</div>
            <div className="text-xs font-bold text-slate-200 truncate max-w-[120px] sm:max-w-none">
              {room.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-black font-mono tracking-wider ${
            room.remainingTime <= 30
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse'
              : 'bg-slate-900 border-slate-700 text-indigo-300'
          }`}>
            <Clock className="w-4 h-4" />
            {formatTime(room.remainingTime)}
          </div>

          {isHost && (
            <button
              onClick={onResetToLobby}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-700 rounded-xl transition text-xs flex items-center gap-1"
              title="ロビーに戻る"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">終了</span>
            </button>
          )}
        </div>
      </div>

      {/* メイン: お題カード */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-slate-900/90 border-2 border-indigo-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl text-center flex flex-col items-center justify-center min-h-[260px] animate-pop">
        <div className="absolute top-4 left-4 text-indigo-400/40 text-4xl select-none">💬</div>
        <div className="absolute bottom-4 right-4 text-purple-400/40 text-4xl select-none">✨</div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 mb-4 shadow">
          <Sparkles className="w-3.5 h-3.5" /> 今回のトークお題
        </span>

        <h2 className="text-xl sm:text-3xl font-black text-white leading-relaxed max-w-xl drop-shadow-md">
          「{room.currentTopic}」
        </h2>

        {/* ホスト用お題シャッフルボタン */}
        {isHost && (
          <div className="mt-8">
            <button
              onClick={onNextTopic}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-pink-600/30 flex items-center gap-2 transition transform active:scale-95"
            >
              <Dices className="w-4 h-4" />
              次のお題を引く（サイコロ）
            </button>
          </div>
        )}
      </div>

      {/* 参加メンバー一覧アバター */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-slate-400 font-bold whitespace-nowrap px-2">参加中:</span>
        <div className="flex items-center gap-2">
          {room.players.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border text-xs text-slate-300 whitespace-nowrap ${
                p.isAdmin ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-700'
              }`}
            >
              <span>{p.avatar}</span>
              <span className="font-semibold">{p.name}</span>
              {p.isAdmin && (
                <span className="text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 px-1 py-0.2 rounded">
                  👑
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
