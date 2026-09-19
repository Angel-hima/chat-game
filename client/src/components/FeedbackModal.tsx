import React, { useState } from 'react';
import { X, Send, Heart, MessageSquare, Check, Sparkles } from 'lucide-react';
import { Feedback } from '../types';

interface FeedbackModalProps {
  onClose: () => void;
  userName: string;
  onSendFeedback: (category: Feedback['category'], message: string, userName: string, callback: (success: boolean) => void) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  onClose,
  userName,
  onSendFeedback
}) => {
  const [category, setCategory] = useState<Feedback['category']>('感想・応援');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    onSendFeedback(category, message.trim(), userName, (success) => {
      setLoading(false);
      if (success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-pop relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-base font-extrabold text-slate-100 mb-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-pink-400" />
          ご意見・フィードバック
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          ゲームへの感想、追加してほしいお題や新機能のリクエストなど、何でも気軽にお送りください！
        </p>

        {submitted ? (
          <div className="py-8 text-center text-emerald-400 font-black text-sm flex flex-col items-center gap-2 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Check className="w-6 h-6" />
            </div>
            <span>貴重なご意見ありがとうございます！</span>
            <span className="text-xs text-slate-400 font-normal">今後のアップデートの参考にさせていただきます。</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">カテゴリ</label>
              <div className="grid grid-cols-2 gap-2">
                {(['感想・応援', '機能リクエスト', '不具合報告', 'その他'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition text-center ${
                      category === cat
                        ? 'bg-pink-600/30 border-pink-500 text-pink-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">メッセージ内容</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="例: 「ワードウルフの制限時間を変更できるようにしてほしい！」「友達と遊んでめちゃくちゃ盛り上がりました！」"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-pink-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-40 text-white font-black text-xs rounded-2xl shadow-xl transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Send className="w-4 h-4" />
              {loading ? '送信中...' : 'フィードバックを送信する ✨'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
