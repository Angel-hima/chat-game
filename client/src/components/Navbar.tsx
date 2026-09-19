import React, { useState } from 'react';
import { Wifi, WifiOff, Settings, HelpCircle, MessageSquarePlus, Edit3 } from 'lucide-react';

interface NavbarProps {
  isConnected: boolean;
  serverUrl: string;
  onUpdateServerUrl: (url: string) => void;
  playerName: string;
  playerAvatar: string;
  onOpenHowToPlay: () => void;
  onOpenFeedback: () => void;
  onOpenEditProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isConnected,
  serverUrl,
  onUpdateServerUrl,
  playerName,
  playerAvatar,
  onOpenHowToPlay,
  onOpenFeedback,
  onOpenEditProfile
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [inputUrl, setInputUrl] = useState(serverUrl);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateServerUrl(inputUrl);
    setShowSettings(false);
  };

  return (
    <>
      <header className="bg-slate-900/80 backdrop-blur border-b border-indigo-500/20 px-3 sm:px-4 py-2.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
            💬
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-wide bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 bg-clip-text text-transparent">
              雑談パーティー！
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* 使い方ボタン */}
          <button
            onClick={onOpenHowToPlay}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-700 transition"
            title="遊び方を見る"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">使い方</span>
          </button>

          {/* フィードバックボタン */}
          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-700 transition"
            title="ご意見・フィードバック"
          >
            <MessageSquarePlus className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">ご意見</span>
          </button>

          {/* プレイヤー情報バッジ（タップで名前変更可能） */}
          {playerName && (
            <button
              onClick={onOpenEditProfile}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-xl border border-slate-700 text-xs text-slate-200 font-bold transition group"
              title="クリックして名前やアバターを変更"
            >
              <span className="text-sm sm:text-base">{playerAvatar}</span>
              <span className="truncate max-w-[80px] sm:max-w-[100px]">{playerName}</span>
              <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-300" />
            </button>
          )}

          {/* 接続状態 */}
          <div className="flex items-center gap-1 text-xs">
            {isConnected ? (
              <span className="flex items-center text-emerald-400 gap-1 bg-emerald-950/50 px-2 py-1 rounded-xl border border-emerald-500/30 text-[11px] font-bold">
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden md:inline">接続中</span>
              </span>
            ) : (
              <span className="flex items-center text-rose-400 gap-1 bg-rose-950/50 px-2 py-1 rounded-xl border border-rose-500/30 animate-pulse text-[11px] font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">切断</span>
              </span>
            )}
          </div>

          {/* 接続先設定ボタン（別端末・実機接続時にIP入力用） */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            title="サーバー接続設定"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* サーバー設定モーダル */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl animate-pop">
            <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              サーバー接続設定
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              スマホや別PCから接続する場合は、ホストPCのIPアドレス（例: http://192.168.1.10:3001）を入力してください。
            </p>
            <form onSubmit={handleSave}>
              <label className="block text-xs font-semibold text-slate-300 mb-1">サーバーURL</label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-700 rounded-xl transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg transition"
                >
                  保存して再接続
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
