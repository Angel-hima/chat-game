import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronUp, ChevronDown, MessageSquare, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatAndStampsProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onSendReaction: (data: { emoji: string; text: string }) => void;
}

const STAMPS = [
  { emoji: '💡', text: 'わかる！' },
  { emoji: '👍', text: 'それな！' },
  { emoji: '👏', text: '拍手！' },
  { emoji: '🤣', text: '草w' },
  { emoji: '😲', text: 'えー！？' },
  { emoji: '✨', text: '神！' },
  { emoji: '🤔', text: '怪しい…' },
  { emoji: '🙏', text: 'ありがとう' }
];

export const ChatAndStamps: React.FC<ChatAndStampsProps> = ({
  messages,
  currentUserId,
  onSendMessage,
  onSendReaction
}) => {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pb-4">
      <div className="bg-slate-800/90 border border-slate-700/90 rounded-3xl shadow-2xl backdrop-blur overflow-hidden transition-all">
        {/* スタンプバー（いつでもワンタップで飛ばせる） */}
        <div className="p-2.5 bg-slate-900/60 border-b border-slate-700/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-extrabold text-indigo-400 whitespace-nowrap pl-1.5 pr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> リアクション:
          </span>
          {STAMPS.map((stamp) => (
            <button
              key={stamp.text}
              onClick={() => onSendReaction(stamp)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-indigo-600/40 active:scale-90 border border-slate-700 hover:border-indigo-500/50 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-200 whitespace-nowrap transition"
            >
              <span>{stamp.emoji}</span>
              <span className="text-[11px]">{stamp.text}</span>
            </button>
          ))}
        </div>

        {/* チャットヘッダー（折りたたみトグル） */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 bg-slate-800/60 flex items-center justify-between cursor-pointer hover:bg-slate-800 transition"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            チャット ({messages.length}件)
          </div>
          <button className="text-slate-400 hover:text-slate-200">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* チャットメッセージ一覧 */}
        {isExpanded && (
          <div className="p-4 h-48 sm:h-56 overflow-y-auto space-y-2.5 animate-fade-in text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-center">
                まだメッセージはありません。<br />雑談や挨拶を書き込んでみましょう！
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.type === 'system') {
                  return (
                    <div key={msg.id} className="text-center my-1.5">
                      <span className="inline-block bg-slate-900/80 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full text-[11px] font-medium">
                        {msg.senderAvatar} {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <span className="text-lg select-none">{msg.senderAvatar}</span>
                    <div className={`max-w-[75%] ${isMe ? 'text-right' : 'text-left'}`}>
                      <div className="text-[10px] text-slate-400 mb-0.5 font-bold">
                        {msg.senderName}
                      </div>
                      <div
                        className={`inline-block px-3 py-2 rounded-2xl text-xs font-medium break-words leading-relaxed shadow ${
                          isMe
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-900 border border-slate-700/80 text-slate-100 rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* 入力フォーム */}
        <form onSubmit={handleSend} className="p-2.5 bg-slate-900/80 border-t border-slate-700/60 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
