import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Room, PublicRoomSummary, ChatMessage, ReactionStamp, CommunityPost, Announcement, Feedback } from '../types';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stamps, setStamps] = useState<ReactionStamp[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // サーバーURL（ローカルストレージ保存対応）
  const [serverUrl, setServerUrl] = useState<string>(() => {
    const saved = localStorage.getItem('chatgame_server_url');
    // 旧ポート3001や不正なURLを最新ポート3010に自動更新
    if (saved && !saved.includes(':3001') && !saved.includes('://:') && saved.length > 8) {
      return saved;
    }
    const host = window.location.hostname;
    // Electron (file://) や localhost, 127.0.0.1 の場合は必ず localhost:3010 を向く
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3010';
    }
    return `http://${host}:3010`;
  });

  const socketRef = useRef<Socket | null>(null);

  // サーバー変更・接続
  useEffect(() => {
    const s = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      timeout: 8000
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      console.log('Socket 接続成功:', s.id);
      setIsConnected(true);
      s.emit('get_community_data');
    });

    s.on('disconnect', () => {
      console.log('Socket 切断');
      setIsConnected(false);
    });

    s.on('public_rooms_updated', (rooms: PublicRoomSummary[]) => {
      setPublicRooms(rooms);
    });

    s.on('community_posts_updated', (posts: CommunityPost[]) => {
      setCommunityPosts(posts);
    });

    s.on('announcements_updated', (annos: Announcement[]) => {
      setAnnouncements(annos);
    });

    s.on('room_updated', (room: Room) => {
      setCurrentRoom(room);
    });

    s.on('timer_tick', (data: { remainingTime: number; phase?: any }) => {
      setCurrentRoom(prev => {
        if (!prev) return null;
        const updated = { ...prev, remainingTime: data.remainingTime };
        if (prev.wordWolfState && data.phase) {
          updated.wordWolfState = { ...prev.wordWolfState, phase: data.phase };
        }
        return updated;
      });
    });

    s.on('chat_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    s.on('reaction_stamp', (stamp: ReactionStamp) => {
      setStamps(prev => [...prev.slice(-15), stamp]); // 画面上に最新15件まで保持
      setTimeout(() => {
        setStamps(prev => prev.filter(st => st.id !== stamp.id));
      }, 2500);
    });

    return () => {
      s.disconnect();
    };
  }, [serverUrl]);

  const updateServerUrl = (url: string) => {
    let formatted = url.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `http://${formatted}`;
    }
    localStorage.setItem('chatgame_server_url', formatted);
    setServerUrl(formatted);
  };

  // 掲示板投稿
  const addCommunityPost = (content: string, authorName: string, authorAvatar: string) => {
    if (!socket || !isConnected) return;
    socket.emit('add_community_post', { authorName, authorAvatar, content });
  };

  // いいね
  const likeCommunityPost = (postId: string) => {
    if (!socket || !isConnected) return;
    socket.emit('like_community_post', postId);
  };

  // フィードバック
  const sendFeedback = (category: Feedback['category'], message: string, userName: string, callback?: (success: boolean) => void) => {
    if (!socket || !isConnected) {
      if (callback) callback(false);
      return;
    }
    socket.emit('send_feedback', { category, message, userName }, (res: { success: boolean }) => {
      if (callback) callback(res.success);
    });
  };

  // ルーム内での名前・アバター変更
  const updatePlayerProfile = (name: string, avatar: string, callback?: (success: boolean) => void) => {
    if (!socket || !isConnected) return;
    socket.emit('update_player_profile', { name, avatar }, (res: { success: boolean }) => {
      if (callback) callback(res.success);
    });
  };

  return {
    socket,
    isConnected,
    currentRoom,
    setCurrentRoom,
    publicRooms,
    messages,
    setMessages,
    stamps,
    communityPosts,
    announcements,
    serverUrl,
    updateServerUrl,
    addCommunityPost,
    likeCommunityPost,
    sendFeedback,
    updatePlayerProfile
  };
}
