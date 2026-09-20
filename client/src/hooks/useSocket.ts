import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { Room, PublicRoomSummary, ChatMessage, ReactionStamp, CommunityPost, Announcement, Feedback, Friend, FriendStatus, AdminServerOverview, BroadcastAnnouncement } from '../types';

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
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [broadcastAlert, setBroadcastAlert] = useState<BroadcastAnnouncement | null>(null);
  const [roomForceClosedReason, setRoomForceClosedReason] = useState<string | null>(null);

  // 自分のフレンドコード（ローカルストレージ永続化）
  const [myFriendCode] = useState<string>(() => {
    const saved = localStorage.getItem('chatgame_my_friend_code');
    if (saved && saved.startsWith('FG-')) {
      return saved;
    }
    const generated = `FG-${Math.floor(100000 + Math.random() * 900000)}`;
    localStorage.setItem('chatgame_my_friend_code', generated);
    return generated;
  });

  // フレンドリスト（ローカルストレージ永続化）
  const [friends, setFriends] = useState<Friend[]>(() => {
    try {
      const saved = localStorage.getItem('chatgame_friends');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // フレンドのリアルタイムステータス
  const [friendsStatus, setFriendsStatus] = useState<Record<string, FriendStatus>>({});
  
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

      // 自身のフレンドコードとプロフィールをサーバーに登録
      const savedName = localStorage.getItem('chatgame_player_name') || 'ゲスト';
      const savedAvatar = localStorage.getItem('chatgame_player_avatar') || '🐱';
      s.emit('register_friend_code', { friendCode: myFriendCode, name: savedName, avatar: savedAvatar });
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

    // 管理者判定ステータス
    s.on('admin_status', (data: { isAdmin: boolean }) => {
      console.log('管理者ステータス受信:', data.isAdmin);
      setIsAdmin(data.isAdmin);
    });

    // 全体緊急アナウンス
    s.on('broadcast_announcement', (annc: BroadcastAnnouncement) => {
      setBroadcastAlert(annc);
    });

    // 管理者による部屋強制解散
    s.on('room_force_closed', (data: { reason: string }) => {
      setCurrentRoom(null);
      setRoomForceClosedReason(data.reason || '管理者によって部屋が解散されました。');
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

  // フレンドステータスの取得
  const fetchFriendsStatus = (list?: Friend[]) => {
    const targetList = list || friends;
    if (!socket || !isConnected || targetList.length === 0) return;
    const codes = targetList.map(f => f.friendCode);
    socket.emit('get_friends_status', codes, (statuses: FriendStatus[]) => {
      const map: Record<string, FriendStatus> = {};
      statuses.forEach(s => {
        map[s.friendCode] = s;
      });
      setFriendsStatus(map);
    });
  };

  // 定期的なフレンドステータス同期
  useEffect(() => {
    if (!socket || !isConnected || friends.length === 0) return;
    fetchFriendsStatus();
    const interval = setInterval(() => {
      fetchFriendsStatus();
    }, 8000);
    return () => clearInterval(interval);
  }, [socket, isConnected, friends]);

  // フレンド追加
  const addFriend = (friendCode: string, name?: string, avatar?: string): { success: boolean; message: string } => {
    const code = friendCode.trim().toUpperCase();
    if (!code) return { success: false, message: 'フレンドコードを入力してください。' };
    if (code === myFriendCode) return { success: false, message: '自分自身をフレンドに追加することはできません。' };
    if (friends.some(f => f.friendCode === code)) return { success: false, message: '既にフレンドに追加されています。' };

    const newFriend: Friend = {
      friendCode: code,
      name: name || 'フレンド',
      avatar: avatar || '🐱',
      addedAt: Date.now()
    };
    const updated = [newFriend, ...friends];
    setFriends(updated);
    localStorage.setItem('chatgame_friends', JSON.stringify(updated));
    fetchFriendsStatus(updated);
    return { success: true, message: `${newFriend.name} をフレンドに追加しました！` };
  };

  // フレンド削除
  const removeFriend = (friendCode: string) => {
    const updated = friends.filter(f => f.friendCode !== friendCode);
    setFriends(updated);
    localStorage.setItem('chatgame_friends', JSON.stringify(updated));
  };

  // ルーム内での名前・アバター変更
  const updatePlayerProfile = (name: string, avatar: string, callback?: (success: boolean) => void) => {
    if (!socket || !isConnected) return;
    socket.emit('update_player_profile', { name, avatar }, (res: { success: boolean }) => {
      if (callback) callback(res.success);
    });
  };

  // 管理者操作
  const adminGetOverview = (callback: (res: { success?: boolean; overview?: AdminServerOverview; error?: string }) => void) => {
    if (!socket || !isConnected) return callback({ error: 'サーバーに接続されていません' });
    socket.emit('admin_get_overview', callback);
  };

  const adminCloseRoom = (roomId: string, callback?: (res: { success: boolean; error?: string }) => void) => {
    if (!socket || !isConnected) return;
    socket.emit('admin_close_room', roomId, callback);
  };

  const adminBroadcast = (message: string, callback?: (res: { success: boolean }) => void) => {
    if (!socket || !isConnected) return;
    socket.emit('admin_broadcast_announcement', { message }, callback);
  };

  const adminAddCode = (friendCode: string, callback?: (res: { success: boolean; adminCodes?: string[] }) => void) => {
    if (!socket || !isConnected) return;
    socket.emit('admin_add_admin_code', friendCode, callback);
  };

  const adminRemoveCode = (friendCode: string, callback?: (res: { success: boolean; adminCodes?: string[] }) => void) => {
    if (!socket || !isConnected) return;
    socket.emit('admin_remove_admin_code', friendCode, callback);
  };

  const adminCreateAnnouncement = (
    data: { title: string; content: string; tag: any; isImportant?: boolean },
    callback?: (res: { success: boolean }) => void
  ) => {
    if (!socket || !isConnected) return;
    socket.emit('admin_create_announcement', data, callback);
  };

  const adminDeleteAnnouncement = (id: string, callback?: (res: { success: boolean }) => void) => {
    if (!socket || !isConnected) return;
    socket.emit('admin_delete_announcement', id, callback);
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
    updatePlayerProfile,
    myFriendCode,
    friends,
    friendsStatus,
    addFriend,
    removeFriend,
    fetchFriendsStatus,
    isAdmin,
    broadcastAlert,
    setBroadcastAlert,
    roomForceClosedReason,
    setRoomForceClosedReason,
    adminGetOverview,
    adminCloseRoom,
    adminBroadcast,
    adminAddCode,
    adminRemoveCode,
    adminCreateAnnouncement,
    adminDeleteAnnouncement
  };
}
