import React, { useState } from 'react';
import { X, Lock, Globe, MessageSquare, HelpCircle, Users } from 'lucide-react';
import { GameMode } from '../types';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    isPublic: boolean;
    passcode?: string;
    maxPlayers: number;
    gameMode: GameMode;
  }) => void;
  defaultPlayerName: string;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  onClose,
  onCreate,
  defaultPlayerName
}) => {
  const [roomName, setRoomName] = useState(`${defaultPlayerName}の雑談部屋`);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [gameMode, setGameMode] = useState<GameMode>('talk');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      name: roomName,
      description: description.trim() || undefined,
      isPublic,
      passcode: isPublic ? undefined : passcode,
      maxPlayers,
      gameMode
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-pop relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-extrabold text-slate-100 mb-5 flex items-center gap-2">
          <span className="text-2xl">✨</span> 新しい部屋を作る
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 部屋名 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">部屋名</label>
            <input
              type="text"
              required
              maxLength={20}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="例: まったり雑談！"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 部屋の説明 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              部屋の説明・ルール（任意）
            </label>
            <textarea
              rows={2}
              maxLength={60}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例: 初見大歓迎！アニメの話をしましょう / 誰でも参加OK！"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* 公開設定 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">公開タイプ</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition ${
                  isPublic
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                公開部屋
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition ${
                  !isPublic
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-400" />
                非公開（合言葉）
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isPublic ? '※公開部屋は誰でもロビー一覧から参加できます。' : '※合言葉を知っている友達だけが参加できます。'}
            </p>
          </div>

          {/* 合言葉（非公開時） */}
          {!isPublic && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-300 mb-1.5">合言葉（パスワード）</label>
              <input
                type="text"
                required={!isPublic}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="例: 1234 や apple"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          )}

          {/* ゲームモード */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">ゲームモード</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setGameMode('talk')}
                className={`cursor-pointer p-3 rounded-xl border transition ${
                  gameMode === 'talk'
                    ? 'bg-pink-900/30 border-pink-500 text-pink-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <MessageSquare className="w-4 h-4 text-pink-400" />
                  お題トーク
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  ランダムなお題カードで自由にトーク
                </p>
              </div>

              <div
                onClick={() => setGameMode('wordwolf')}
                className={`cursor-pointer p-3 rounded-xl border transition ${
                  gameMode === 'wordwolf'
                    ? 'bg-amber-900/30 border-amber-500 text-amber-200'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  ワードウルフ
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  1人だけ違うお題の人を探す推理ゲーム
                </p>
              </div>
            </div>
          </div>

          {/* 最大人数 */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 最大人数</span>
              <span className="text-indigo-400">{maxPlayers}人</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-2 bg-slate-900 rounded-lg cursor-pointer"
            />
          </div>

          {/* ボタン */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 transition transform active:scale-95"
            >
              部屋を作成する 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
