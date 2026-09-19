import React, { useState } from 'react';
import { X, Check, UserCheck } from 'lucide-react';

interface EditProfileModalProps {
  currentName: string;
  currentAvatar: string;
  onClose: () => void;
  onSave: (name: string, avatar: string) => void;
}

const AVATARS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐰', '🦁', '🐯', '🦄', '🐸', '🐙', '🐧', '🐵', '🚀', '⭐'];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  currentName,
  currentAvatar,
  onClose,
  onSave
}) => {
  const [name, setName] = useState(currentName);
  const [avatar, setAvatar] = useState(currentAvatar);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), avatar);
    setSaved(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-pop relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-extrabold text-slate-100 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-400" />
          プロフィールの変更・保存
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* プレビュー */}
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-4xl shadow-xl shadow-indigo-600/30">
              {avatar}
            </div>
          </div>

          {/* 名前入力 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">ニックネーム</label>
            <input
              type="text"
              required
              maxLength={12}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="あなたの名前"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* アバター選択 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">アバターを選択</label>
            <div className="grid grid-cols-4 gap-2 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-700/60 max-h-36 overflow-y-auto">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`text-2xl p-2 rounded-xl transition ${
                    avatar === emoji
                      ? 'bg-indigo-600/50 ring-2 ring-indigo-500 scale-105'
                      : 'hover:bg-slate-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saved || !name.trim()}
              className={`w-full py-3 rounded-2xl font-black text-xs shadow-xl transition flex items-center justify-center gap-1.5 ${
                saved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 active:scale-95'
              }`}
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" /> 変更を保存しました！
                </>
              ) : (
                '変更を保存して反映する ✨'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
