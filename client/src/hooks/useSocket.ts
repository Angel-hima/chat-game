import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { Room, PublicRoomSummary, ChatMessage, ReactionStamp, CommunityPost, Announcement, Feedback } from '../types';

// AWS Lightsail 本番サーバーURL（デフォルト接続先）
const DEFAULT_AWS_SERVER_URL = 'http://52.68.217.139:3010';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoomSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [stamps, setStamps] = useState<ReactionStamp[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  
  // サーバーURL（ローカルストレージ保存対応・AWSデフォルト対応）
  const [serverUrl, setServerUrl] = useState<string>(() => {
    const saved = localStorage.getItem('chatgame_server_url');
    // 旧ローカルIPや不正なURLを最新のAWS本番サーバーに自動アップグレード
    if (
      saved &&
      !saved.includes('192.168.') &&
      !saved.includes('localhost') &&
      !saved.includes(':3001') &&
      !saved.includes('://:') &&
      saved.length > 8
    ) {
      return saved;
    }
    
    // iOS / Android ネイティブアプリの場合は最初からAWSサーバーを向く
    if (Capacitor.isNativePlatform()) {
      return DEFAULT_AWS_SERVER_URL;
    }

    const host = window.location.hostname;
    // Electron (file://) の場合はAWS本番サーバー
    if (!host || window.location.protocol === 'file:') {
      return DEFAULT_AWS_SERVER_URL;
    }

    // リモートWebサーバー（AWS Lightsail等）で開いている場合は現在のオリジンを使用
    if (window.location.origin && !window.location.origin.startsWith('file:') && host !== 'localhost' && host !== '127.0.0.1') {
      return window.location.origin;
    }

    // ローカル開発環境以外はAWS本番サーバーをデフォルトにする
    return DEFAULT_AWS_SERVER_URL;
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

    s.on('connect_error', (err) => {
      console.warn('Socket 接続エラー:', err.message);
      // 万が一接続に失敗し、かつ現在のURLがAWSでない場合はAWSサーバーへフォールバック
      if (serverUrl !== DEFAULT_AWS_SERVER_URL) {
        console.log(`自動フォールバック: AWSサーバー (${DEFAULT_AWS_SERVER_URL}) を試行します`);
        setServerUrl(DEFAULT_AWS_SERVER_URL);
        localStorage.setItem('chatgame_server_url', DEFAULT_AWS_SERVER_URL);
      }
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
