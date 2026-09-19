import React, { useState } from 'react';
import { Megaphone, Send, Heart, MessageSquare, Sparkles, Clock, Tag } from 'lucide-react';
import { CommunityPost, Announcement } from '../types';

interface CommunityBoardProps {
  posts: CommunityPost[];
  announcements: Announcement[];
  currentUserName: string;
  currentUserAvatar: string;
  onAddPost: (content: string) => void;
  onLikePost: (postId: string) => void;
}

export const CommunityBoard: React.FC<CommunityBoardProps> = ({
  posts,
  announcements,
  currentUserName,
  currentUserAvatar,
  onAddPost,
  onLikePost
}) => {
  const [content, setContent] = useState('');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddPost(content.trim());
    setContent('');
  };

  const handleLike = (postId: string) => {
    if (likedPosts.includes(postId)) return;
    setLikedPosts(prev => [...prev, postId]);
    onLikePost(postId);
  };

  const formatTime = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'たった今';
    if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
    return `${Math.floor(diff / 86400)}日前`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 公式お知らせセクション */}
      {announcements.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-slate-900/80 border border-indigo-500/40 rounded-3xl p-5 shadow-xl backdrop-blur">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-xl bg-indigo-600/30 text-indigo-400">
              <Megaphone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
              公式お知らせ
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                NEWS
              </span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {announcements.map((anno) => (
              <div
                key={anno.id}
                className="p-3.5 bg-slate-900/70 border border-slate-700/60 rounded-2xl transition hover:border-indigo-500/40"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      anno.tag === 'アップデート'
                        ? 'bg-pink-950 text-pink-300 border border-pink-500/30'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {anno.tag}
                    </span>
                    <span className="text-xs font-bold text-slate-100">{anno.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{anno.date}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-1">
                  {anno.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* コミュニティ掲示板 */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-5 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-pink-600/30 text-pink-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                みんなの掲示板
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                  {posts.length}件
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">メンバー募集や挨拶、雑談を書き込んでみましょう！</p>
            </div>
          </div>
        </div>

        {/* 投稿フォーム */}
        <form onSubmit={handleSubmit} className="mb-5 bg-slate-900/80 border border-slate-700 rounded-2xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-xs text-slate-400">
            <span>{currentUserAvatar}</span>
            <span className="font-bold text-slate-300">{currentUserName}</span>
            <span className="text-[11px] text-slate-500">として投稿</span>
          </div>
          <textarea
            rows={2}
            maxLength={140}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="「今から遊べる人いませんか？」「よろしくお願いします！」など..."
            className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500">{content.length}/140</span>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-4 py-1.5 bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              投稿する
            </button>
          </div>
        </form>

        {/* 投稿一覧 */}
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {posts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              まだ投稿はありません。最初のメッセージを投稿してみましょう！
            </div>
          ) : (
            posts.map((post) => {
              const isLiked = likedPosts.includes(post.id);
              return (
                <div
                  key={post.id}
                  className="p-3.5 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-700/60 rounded-2xl transition flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="text-2xl mt-0.5 select-none">{post.authorAvatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-200 truncate max-w-[120px]">
                          {post.authorName}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTime(post.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>
                  </div>

                  {/* いいねボタン */}
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition select-none ${
                      isLiked
                        ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-slate-800 active:scale-90'
                    }`}
                    title="いいね！"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{post.likes}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
