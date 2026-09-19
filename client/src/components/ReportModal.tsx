import React, { useState } from 'react';
import { Flag, Ban, X, Check } from 'lucide-react';
import { Player } from '../types';

interface ReportModalProps {
  targetPlayer: Player;
  onClose: () => void;
  onBlock: (playerId: string) => void;
  onReport: (playerId: string, reason: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  targetPlayer,
  onClose,
  onBlock,
  onReport
}) => {
  const [reason, setReason] = useState('誹謗中傷・嫌がらせ');
  const [reported, setReported] = useState(false);

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    onReport(targetPlayer.id, reason);
    setReported(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-5 max-w-sm w-full shadow-2xl animate-pop relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{targetPlayer.avatar}</span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100">{targetPlayer.name}</h3>
            <span className="text-[11px] text-slate-400">プレイヤー管理</span>
          </div>
        </div>

        {reported ? (
          <div className="py-6 text-center text-emerald-400 font-bold text-xs flex flex-col items-center gap-2">
            <Check className="w-8 h-8" />
            通報を受け付けました。運営にて確認いたします。
          </div>
        ) : (
          <div className="space-y-3">
            <form onSubmit={handleReport} className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">通報の理由</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="誹謗中傷・暴言">誹謗中傷・暴言・迷惑行為</option>
                <option value="不適切な名前・アバター">不適切な名前・アバター</option>
                <option value="公序良俗に反する発言">公序良俗に反する発言</option>
                <option value="スパム・宣伝行為">スパム・荒らし行為</option>
              </select>

              <button
                type="submit"
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                通報する
              </button>
            </form>

            <div className="pt-2 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  onBlock(targetPlayer.id);
                  onClose();
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5 text-amber-400" />
                このプレイヤーをブロック（非表示）
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
