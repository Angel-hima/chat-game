import React, { useState, useEffect } from 'react';
import { Clock, Eye, EyeOff, Vote, HelpCircle, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Room } from '../types';

interface WordWolfGameViewProps {
  room: Room;
  currentUserId: string;
  onSubmitVote: (targetPlayerId: string) => void;
  onResetToLobby: () => void;
}

export const WordWolfGameView: React.FC<WordWolfGameViewProps> = ({
  room,
  currentUserId,
  onSubmitVote,
  onResetToLobby
}) => {
  const [showSecretWord, setShowSecretWord] = useState(true);
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);

  const isHost = room.hostId === currentUserId;
  const state = room.wordWolfState;
  const myRole = state?.roles[currentUserId];
  const myVote = state?.votes[currentUserId];

  // 結果発表時に紙吹雪演出
  useEffect(() => {
    if (state?.phase === 'result') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [state?.phase]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!state) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4 animate-fade-in">
      {/* ステータスバー */}
      <div className="flex items-center justify-between bg-slate-800/80 border border-slate-700/80 rounded-2xl px-4 py-2.5 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-slate-400">
              {state.phase === 'discussion' && '💬 雑談・討論フェーズ'}
              {state.phase === 'voting' && '🗳️ 投票フェーズ'}
              {state.phase === 'result' && '🏆 結果発表'}
            </div>
            <div className="text-xs font-bold text-slate-200">ワードウルフ</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state.phase !== 'result' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-black font-mono tracking-wider ${
              room.remainingTime <= 20
                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-amber-300'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(room.remainingTime)}
            </div>
          )}

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

      {/* 討論フェーズ: あなたの秘密ワード */}
      {state.phase === 'discussion' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-indigo-950/50 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-xl animate-pop">
            <div className="flex justify-center mb-2">
              <span className="text-xs font-bold text-amber-300 bg-amber-950 px-3 py-1 rounded-full border border-amber-500/30">
                あなただけに配られたワード
              </span>
            </div>

            <div className="my-4">
              {showSecretWord ? (
                <div className="text-2xl sm:text-4xl font-black text-amber-200 tracking-wider">
                  「{myRole?.word || '???'}」
                </div>
              ) : (
                <div className="text-2xl sm:text-4xl font-black text-slate-600 tracking-widest">
                  ••••••••
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSecretWord(!showSecretWord)}
              className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 transition"
            >
              {showSecretWord ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showSecretWord ? '画面を隠す' : 'ワードを表示'}
            </button>

            <div className="mt-6 pt-4 border-t border-slate-700/60 text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
              💡 <span className="font-bold text-amber-400">遊び方:</span> あなたと同じお題の「市民」と、微妙に違うお題の「ウルフ」がいます！
              直接ワードを言わずに、感想や特徴を雑談しながらウルフを見つけ出しましょう。
            </div>
          </div>
        </div>
      )}

      {/* 投票フェーズ */}
      {state.phase === 'voting' && (
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl backdrop-blur animate-pop">
          <div className="text-center mb-5">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 mb-2">
              <Vote className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-100">誰が「ウルフ」だと思いますか？</h3>
            <p className="text-xs text-slate-400">怪しいと思うプレイヤーを1人選んで投票してください。</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {room.players.map((p) => {
              const isSelected = (selectedVoteId || myVote) === p.id;
              const isSelf = p.id === currentUserId;
              return (
                <button
                  key={p.id}
                  disabled={Boolean(myVote) || isSelf}
                  onClick={() => setSelectedVoteId(p.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    isSelf ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800' :
                    isSelected
                      ? 'bg-amber-600/30 border-amber-500 text-white ring-2 ring-amber-500/50'
                      : 'bg-slate-900/60 border-slate-700 hover:border-slate-500 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.avatar}</span>
                    <div className="text-left font-bold text-sm flex items-center gap-1.5">
                      <span>{p.name}</span>
                      {p.isAdmin && (
                        <span className="text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 px-1 py-0.2 rounded">
                          👑 管理者
                        </span>
                      )}
                      {isSelf && <span className="text-xs text-slate-400 font-normal">(自分)</span>}
                    </div>
                  </div>
                  {isSelected && <span className="text-xs font-bold text-amber-400">選択中</span>}
                </button>
              );
            })}
          </div>

          {!myVote ? (
            <button
              onClick={() => selectedVoteId && onSubmitVote(selectedVoteId)}
              disabled={!selectedVoteId}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl transition"
            >
              投票を決定する！ 🗳️
            </button>
          ) : (
            <div className="text-center py-2 text-sm font-bold text-emerald-400 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
              ✓ 投票済みです。他の参加者の投票を待っています...
            </div>
          )}
        </div>
      )}

      {/* 結果発表フェーズ */}
      {state.phase === 'result' && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur animate-pop text-center">
          <div className="text-4xl mb-2">
            {state.winner === 'citizens' ? '🎉' : '🐺'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
            {state.winner === 'citizens' ? (
              <span className="text-emerald-400">市民チームの勝利！</span>
            ) : (
              <span className="text-rose-400">ウルフチームの勝利！</span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            {state.winner === 'citizens'
              ? '見事にウルフを見破ることに成功しました！'
              : 'ウルフは正体を隠し通すことに成功しました！'}
          </p>

          {/* お題のネタばらし */}
          <div className="grid grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-700 mb-6">
            <div>
              <div className="text-[11px] font-bold text-slate-400 mb-1">市民のお題</div>
              <div className="text-lg font-black text-indigo-300">「{state.majorityWord}」</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-rose-400 mb-1">ウルフのお題</div>
              <div className="text-lg font-black text-rose-300">「{state.minorityWord}」</div>
            </div>
          </div>

          {/* プレイヤーの役職一覧 */}
          <div className="space-y-2 mb-6 text-left">
            <div className="text-xs font-bold text-slate-400 px-1">プレイヤーの内訳:</div>
            {room.players.map((p) => {
              const role = state.roles[p.id];
              const isWolf = role?.isWolf;
              // このプレイヤーへの得票数
              const votesReceived = Object.values(state.votes).filter(v => v === p.id).length;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    isWolf
                      ? 'bg-rose-950/40 border-rose-500/40'
                      : 'bg-slate-900/60 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{p.avatar}</span>
                    <span className="font-bold text-sm text-slate-200">{p.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isWolf ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                      {isWolf ? '🐺 ウルフ' : '👤 市民'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">
                    {votesReceived}票
                  </span>
                </div>
              );
            })}
          </div>

          {isHost ? (
            <button
              onClick={onResetToLobby}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-2xl shadow-xl transition"
            >
              ロビーに戻って次のゲームへ 🚀
            </button>
          ) : (
            <div className="text-xs text-slate-400">
              ホストが次のゲームを開始するのを待っています...
            </div>
          )}
        </div>
      )}
    </div>
  );
};
