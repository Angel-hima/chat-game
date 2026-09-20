import React, { useState, useEffect } from 'react';
import { 
  X, ShieldAlert, Server, Users, MessageCircle, AlertTriangle, 
  Trash2, Send, Plus, RefreshCw, CheckCircle2, ShieldCheck, DoorOpen, Radio
} from 'lucide-react';
import { AdminServerOverview, Announcement } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  myFriendCode: string;
  onGetOverview: (callback: (res: { success?: boolean; overview?: AdminServerOverview; error?: string }) => void) => void;
  onCloseRoom: (roomId: string, callback?: (res: { success: boolean; error?: string }) => void) => void;
  onBroadcast: (message: string, callback?: (res: { success: boolean }) => void) => void;
  onAddCode: (friendCode: string, callback?: (res: { success: boolean; adminCodes?: string[] }) => void) => void;
  onRemoveCode: (friendCode: string, callback?: (res: { success: boolean; adminCodes?: string[] }) => void) => void;
  onCreateAnnouncement: (data: { title: string; content: string; tag: any; isImportant?: boolean }, callback?: (res: { success: boolean }) => void) => void;
  onDeleteAnnouncement: (id: string, callback?: (res: { success: boolean }) => void) => void;
  announcements: Announcement[];
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  myFriendCode,
  onGetOverview,
  onCloseRoom,
  onBroadcast,
  onAddCode,
  onRemoveCode,
  onCreateAnnouncement,
  onDeleteAnnouncement,
  announcements
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'users' | 'broadcast' | 'announcements' | 'admins'>('overview');
  const [overview, setOverview] = useState<AdminServerOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [msgNotice, setMsgNotice] = useState<{ text: string; isError: boolean } | null>(null);

  // 全体アナウンス送信フォーム
  const [broadcastText, setBroadcastText] = useState('');

  // 管理者追加フォーム
  const [newAdminCode, setNewAdminCode] = useState('');

  // お知らせ作成フォーム
  const [annoTitle, setAnnoTitle] = useState('');
  const [annoContent, setAnnoContent] = useState('');
  const [annoTag, setAnnoTag] = useState<'お知らせ' | 'アップデート' | 'イベント' | '重要'>('お知らせ');
  const [annoImportant, setAnnoImportant] = useState(false);

  const showToast = (text: string, isError = false) => {
    setMsgNotice({ text, isError });
    setTimeout(() => setMsgNotice(null), 3500);
  };

  const refreshData = () => {
    setIsLoading(true);
    onGetOverview((res) => {
      setIsLoading(false);
      if (res.success && res.overview) {
        setOverview(res.overview);
      } else {
        showToast(res.error || 'データの取得に失敗しました', true);
      }
    });
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    onBroadcast(broadcastText, (res) => {
      if (res.success) {
        showToast('全プレイヤーに緊急アナウンスを送信しました！');
        setBroadcastText('');
      } else {
        showToast('アナウンスの送信に失敗しました', true);
      }
    });
  };

  const handleCloseRoom = (roomId: string, name: string) => {
    if (!window.confirm(`本当に部屋「${name}」(${roomId}) を強制解散しますか？\n参加者は全員退室となります。`)) return;
    onCloseRoom(roomId, (res) => {
      if (res.success) {
        showToast(`部屋 ${roomId} を強制解散しました`);
        refreshData();
      } else {
        showToast(res.error || '強制解散に失敗しました', true);
      }
    });
  };

  const handleAddAdmin = (codeToAdd?: string) => {
    const code = (codeToAdd || newAdminCode).trim().toUpperCase();
    if (!code) return;
    onAddCode(code, (res) => {
      if (res.success) {
        showToast(`フレンドコード ${code} を管理者に登録しました`);
        setNewAdminCode('');
        refreshData();
      } else {
        showToast('管理者登録に失敗しました', true);
      }
    });
  };

  const handleRemoveAdmin = (code: string) => {
    if (code === myFriendCode) {
      if (!window.confirm('自分自身の管理者権限を削除しようとしています。削除すると管理者パネルが開けなくなりますが本当によろしいですか？')) return;
    } else {
      if (!window.confirm(`フレンドコード ${code} の管理者権限を削除しますか？`)) return;
    }

    onRemoveCode(code, (res) => {
      if (res.success) {
        showToast(`管理者 ${code} を解除しました`);
        refreshData();
      } else {
        showToast('管理者解除に失敗しました', true);
      }
    });
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annoTitle.trim() || !annoContent.trim()) return;
    onCreateAnnouncement({
      title: annoTitle,
      content: annoContent,
      tag: annoTag,
      isImportant: annoImportant
    }, (res) => {
      if (res.success) {
        showToast('公式お知らせを掲載しました！');
        setAnnoTitle('');
        setAnnoContent('');
        setAnnoImportant(false);
      } else {
        showToast('お知らせの掲載に失敗しました', true);
      }
    });
  };

  const handleDeleteAnnouncement = (id: string, title: string) => {
    if (!window.confirm(`お知らせ「${title}」を削除しますか？`)) return;
    onDeleteAnnouncement(id, (res) => {
      if (res.success) {
        showToast('お知らせを削除しました');
      } else {
        showToast('お知らせの削除に失敗しました', true);
      }
    });
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}時間${m}分${s}秒`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/50 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-purple-600/30 border-b border-amber-500/40 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/40 text-xl">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">管理者コントロールパネル</h3>
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  ADMIN AUTH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                あなたのコード: <span className="font-mono text-amber-300 font-bold">{myFriendCode}</span>（admins.jsonにより認証済）
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              title="データを更新"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">更新</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* トースト通知 */}
        {msgNotice && (
          <div className={`px-4 py-2 text-xs font-bold text-center ${msgNotice.isError ? 'bg-rose-500/90 text-white' : 'bg-emerald-600/90 text-white'} animate-fade-in`}>
            {msgNotice.text}
          </div>
        )}

        {/* タブナビゲーション */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 overflow-x-auto no-scrollbar px-3 pt-2 gap-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> サーバー概況
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'rooms'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" /> 部屋管理 ({overview?.totalRoomsCount ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 接続プレイヤー ({overview?.connectedUserCount ?? 0})
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> 全体アナウンス
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'announcements'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" /> 公式お知らせ
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'admins'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> 管理者コード設定
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-900">
          
          {/* --- 1. サーバー概況 --- */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-400 block mb-1">接続プレイヤー数</span>
                  <div className="text-2xl sm:text-3xl font-black text-indigo-400">
                    {overview?.connectedUserCount ?? 0} <span className="text-xs text-slate-400 font-normal">人</span>
                  </div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-400 block mb-1">現在の稼働部屋数</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {overview?.totalRoomsCount ?? 0} <span className="text-xs text-slate-400 font-normal">部屋</span>
                  </div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-400 block mb-1">プレイ中の部屋数</span>
                  <div className="text-2xl sm:text-3xl font-black text-amber-400">
                    {overview?.activeGameCount ?? 0} <span className="text-xs text-slate-400 font-normal">部屋</span>
                  </div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
                  <span className="text-xs font-bold text-slate-400 block mb-1">サーバー稼働時間</span>
                  <div className="text-base sm:text-lg font-black text-purple-400 font-mono">
                    {overview ? formatUptime(overview.serverUptimeSeconds) : '--'}
                  </div>
                </div>
              </div>

              {/* クイック情報 */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                <h4 className="font-extrabold text-xs text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> 管理者機能について
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  内部ファイル <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">server/data/admins.json</code> に登録されたフレンドコードを持つユーザーのみがこのパネルにアクセスでき、ゲーム内のチャットやロビーで <span className="text-amber-400 font-bold">👑 管理者</span> タグが表示されます。
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span>登録管理者数: <strong className="text-white">{overview?.adminFriendCodes.length ?? 0} 名</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* --- 2. 部屋管理 --- */}
          {activeTab === 'rooms' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400">稼働中の全部屋一覧（非公開部屋含む）</h4>
                <span className="text-xs text-slate-500 font-mono">計 {overview?.rooms.length ?? 0} 部屋</span>
              </div>

              {(!overview?.rooms || overview.rooms.length === 0) ? (
                <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 text-slate-500 text-xs">
                  現在稼働している部屋はありません
                </div>
              ) : (
                <div className="space-y-3">
                  {overview.rooms.map((r) => (
                    <div
                      key={r.id}
                      className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            {r.id}
                          </span>
                          <span className="font-extrabold text-sm text-white">{r.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.isPublic ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'}`}>
                            {r.isPublic ? '公開' : `合言葉: ${r.passcode || 'あり'}`}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${r.status === 'playing' ? 'bg-amber-500/20 text-amber-300 animate-pulse' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {r.status === 'playing' ? 'ゲーム中' : 'ロビー待機'}
                          </span>
                          <span className="text-[10px] bg-slate-700/80 text-slate-300 px-2 py-0.5 rounded">
                            {r.gameMode === 'wordwolf' ? 'ワードウルフ' : 'お題トーク'}
                          </span>
                        </div>
                        {r.description && (
                          <p className="text-xs text-slate-400 line-clamp-1">{r.description}</p>
                        )}
                        <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                          <span>ホスト: <strong className="text-slate-200">{r.hostName}</strong></span>
                          <span>•</span>
                          <span>参加者: <strong className="text-slate-200">{r.playerCount} / {r.maxPlayers}人</strong></span>
                          <span>(メンバー: {r.players.map(p => `${p.avatar}${p.name}${p.isAdmin ? '👑' : ''}`).join(', ')})</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCloseRoom(r.id, r.name)}
                        className="bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 shadow-md"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>強制解散</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- 3. プレイヤー管理 --- */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400">現在接続中の全プレイヤー一覧</h4>
                <span className="text-xs text-slate-500 font-mono">{overview?.users.length ?? 0} 人接続中</span>
              </div>

              {(!overview?.users || overview.users.length === 0) ? (
                <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-dashed border-slate-700 text-slate-500 text-xs">
                  接続中のユーザーがいません
                </div>
              ) : (
                <div className="space-y-2">
                  {overview.users.map((u) => (
                    <div
                      key={u.socketId}
                      className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{u.avatar}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{u.name}</span>
                            <span className="font-mono text-xs text-slate-400">({u.friendCode})</span>
                            {u.isAdmin && (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                👑 管理者
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            所在: {u.currentRoomId ? <span className="text-indigo-300 font-bold">部屋 {u.currentRoomId}</span> : 'ホーム待機中'}
                          </div>
                        </div>
                      </div>

                      <div>
                        {u.isAdmin ? (
                          <button
                            onClick={() => handleRemoveAdmin(u.friendCode)}
                            className="text-xs text-slate-400 hover:text-rose-400 bg-slate-700/60 hover:bg-slate-700 px-3 py-1.5 rounded-xl font-bold transition"
                          >
                            管理者解除
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddAdmin(u.friendCode)}
                            className="text-xs text-amber-300 hover:text-white bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold transition"
                          >
                            👑 管理者に任命
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- 4. 全体アナウンス送信 --- */}
          {activeTab === 'broadcast' && (
            <div className="space-y-4 animate-fade-in max-w-xl">
              <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4">
                <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-amber-400" /> 緊急全体アナウンス配信
                </h4>
                <p className="text-xs text-slate-400">
                  現在ゲームを開いている全てのプレイヤー（ロビー中・ゲーム中問わず）の画面に、ポップアップで通知を即座に表示します。
                </p>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    送信メッセージ内容
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="例: 【メンテナンス告知】本日16:00よりサーバーメンテナンスを実施します。一旦ゲームを終了してください。"
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!broadcastText.trim()}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-extrabold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>全プレイヤーへ一斉送信</span>
                </button>
              </form>
            </div>
          )}

          {/* --- 5. 公式お知らせ作成・管理 --- */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleCreateAnnouncement} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-400" /> 公式お知らせの新規掲載
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-400 block mb-1">タイトル</label>
                    <input
                      type="text"
                      value={annoTitle}
                      onChange={(e) => setAnnoTitle(e.target.value)}
                      placeholder="例: 🎉 新機能「管理者機能」がリリースされました！"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-1">タグ</label>
                    <select
                      value={annoTag}
                      onChange={(e) => setAnnoTag(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="お知らせ">お知らせ</option>
                      <option value="アップデート">アップデート</option>
                      <option value="イベント">イベント</option>
                      <option value="重要">重要</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">本文</label>
                  <textarea
                    rows={3}
                    value={annoContent}
                    onChange={(e) => setAnnoContent(e.target.value)}
                    placeholder="お知らせの詳細内容を入力してください..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                    <input
                      type="checkbox"
                      checked={annoImportant}
                      onChange={(e) => setAnnoImportant(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700"
                    />
                    <span>重要なお知らせとしてピン留め表示する</span>
                  </label>

                  <button
                    type="submit"
                    disabled={!annoTitle.trim() || !annoContent.trim()}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md"
                  >
                    お知らせを掲載
                  </button>
                </div>
              </form>

              {/* 既存お知らせリスト */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400">掲載中のお知らせ一覧（{announcements.length}件）</h4>
                {announcements.map((a) => (
                  <div
                    key={a.id}
                    className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-bold">
                          {a.tag}
                        </span>
                        {a.isImportant && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold">
                            重要
                          </span>
                        )}
                        <h5 className="text-xs font-extrabold text-white">{a.title}</h5>
                        <span className="text-[10px] text-slate-500">{a.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnouncement(a.id, a.title)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded-xl transition shrink-0"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- 6. 管理者フレンドコード設定 --- */}
          {activeTab === 'admins' && (
            <div className="space-y-5 animate-fade-in max-w-xl">
              <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4">
                <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> 管理者フレンドコード設定
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  ここに登録されているフレンドコードを持つ端末は、サーバー接続時に自動で管理者権限が付与されます（<code className="text-amber-300">server/data/admins.json</code> に永続保存されます）。
                </p>
              </div>

              {/* 追加フォーム */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAdminCode}
                  onChange={(e) => setNewAdminCode(e.target.value.toUpperCase())}
                  placeholder="追加するフレンドコード (例: FG-123456)"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 font-mono uppercase focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddAdmin()}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>追加</span>
                </button>
              </div>

              {/* 管理者コード一覧 */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-400">現在登録されている管理者コード</h5>
                {(!overview?.adminFriendCodes || overview.adminFriendCodes.length === 0) ? (
                  <p className="text-xs text-slate-500">登録されている管理者はいません。</p>
                ) : (
                  overview.adminFriendCodes.map((code) => {
                    const isMe = code === myFriendCode;
                    return (
                      <div
                        key={code}
                        className="bg-slate-800 border border-slate-700/80 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-amber-300">{code}</span>
                          {isMe && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                              あなた
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemoveAdmin(code)}
                          className="text-xs text-slate-500 hover:text-rose-400 p-1 rounded-lg transition"
                          title="管理者権限を解除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
