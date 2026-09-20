import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './roomManager';
import { CommunityManager } from './communityManager';
import { AdminManager } from './adminManager';
import { ChatMessage, ReactionStamp, Feedback, FriendStatus, AdminServerOverview, AdminRoomInfo, AdminUserInfo } from './types';

// 接続中ユーザーの管理
interface ConnectedUser {
  socketId: string;
  friendCode: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
}
const connectedUsers = new Map<string, ConnectedUser>();
const serverStartTime = Date.now();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();
const communityManager = new CommunityManager();
const adminManager = new AdminManager();

// ヘルスチェックと公開部屋リスト取得用RESTエンドポイント
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/rooms', (req, res) => {
  res.json(roomManager.getPublicRooms());
});

app.get('/api/announcements', (req, res) => {
  res.json(communityManager.getAnnouncements());
});

app.get('/api/community/posts', (req, res) => {
  res.json(communityManager.getPosts());
});

app.post('/api/feedback', (req, res) => {
  const { category, message, userName } = req.body;
  const fb = communityManager.addFeedback(category, message, userName);
  res.json({ success: true, feedback: fb });
});

// 公開部屋の更新を全クライアントにブロードキャストするヘルパー
function broadcastPublicRooms() {
  io.emit('public_rooms_updated', roomManager.getPublicRooms());
}

// コミュニティ掲示板の更新を全クライアントにブロードキャスト
function broadcastCommunityPosts() {
  io.emit('community_posts_updated', communityManager.getPosts());
}

// 公式お知らせの更新を全クライアントにブロードキャスト
function broadcastAnnouncements() {
  io.emit('announcements_updated', communityManager.getAnnouncements());
}

// announcements.json の変更を監視し、全接続クライアントにリアルタイム反映
communityManager.watchAnnouncements((annos) => {
  console.log(`[お知らせ更新検知] announcements.json の変更を検知しました (${annos.length}件)。全クライアントにブロードキャストします。`);
  io.emit('announcements_updated', annos);
});

io.on('connection', (socket: Socket) => {
  console.log(`[Socket] 接続: ${socket.id}`);

  // 初回接続時に公開部屋一覧とお知らせ・掲示板を返す
  socket.emit('public_rooms_updated', roomManager.getPublicRooms());
  socket.emit('announcements_updated', communityManager.getAnnouncements());
  socket.emit('community_posts_updated', communityManager.getPosts());

  // 公開部屋一覧のリクエスト
  socket.on('get_public_rooms', () => {
    socket.emit('public_rooms_updated', roomManager.getPublicRooms());
  });

  // コミュニティデータのリクエスト
  socket.on('get_community_data', () => {
    socket.emit('announcements_updated', communityManager.getAnnouncements());
    socket.emit('community_posts_updated', communityManager.getPosts());
  });

  // コミュニティ掲示板への投稿
  socket.on('add_community_post', (data: { authorName: string; authorAvatar: string; content: string }, callback) => {
    try {
      const post = communityManager.addPost(data.authorName, data.authorAvatar, data.content);
      broadcastCommunityPosts();
      if (callback) callback({ success: true, post });
    } catch (err) {
      if (callback) callback({ success: false });
    }
  });

  // 掲示板投稿へのいいね
  socket.on('like_community_post', (postId: string) => {
    const post = communityManager.likePost(postId);
    if (post) {
      broadcastCommunityPosts();
    }
  });

  // フィードバック送信
  socket.on('send_feedback', (data: { category: Feedback['category']; message: string; userName: string }, callback) => {
    try {
      const fb = communityManager.addFeedback(data.category, data.message, data.userName);
      if (callback) callback({ success: true, feedback: fb });
    } catch (err) {
      if (callback) callback({ success: false });
    }
  });

  // 自身のフレンドコード登録
  socket.on('register_friend_code', (data: { friendCode: string; name: string; avatar: string }) => {
    const isAdmin = adminManager.isAdmin(data.friendCode);
    connectedUsers.set(socket.id, {
      socketId: socket.id,
      friendCode: data.friendCode,
      name: data.name,
      avatar: data.avatar,
      isAdmin
    });
    // クライアントへ管理者ステータスを通知
    socket.emit('admin_status', { isAdmin, friendCode: data.friendCode });
    console.log(`[Socket] ユーザー登録: ${data.name} (${data.friendCode}) - 管理者: ${isAdmin}`);
  });

  // フレンド一覧のリアルタイムステータス照会
  socket.on('get_friends_status', (friendCodes: string[], callback) => {
    if (!Array.isArray(friendCodes) || !callback) return;
    const statuses: FriendStatus[] = friendCodes.map(code => {
      let user: ConnectedUser | undefined;
      for (const u of connectedUsers.values()) {
        if (u.friendCode === code) {
          user = u;
          break;
        }
      }
      if (user) {
        const room = roomManager.getRoomBySocketId(user.socketId);
        return {
          friendCode: code,
          name: user.name,
          avatar: user.avatar,
          isOnline: true,
          isAdmin: user.isAdmin,
          currentRoomId: room ? room.id : undefined,
          currentRoomName: room ? room.name : undefined
        };
      }
      return {
        friendCode: code,
        name: '',
        avatar: '👤',
        isOnline: false,
        isAdmin: false
      };
    });
    callback(statuses);
  });

  // ルーム入室中のプロフィール変更（名前・アバター）
  socket.on('update_player_profile', (data: { name: string; avatar: string }, callback) => {
    const existing = connectedUsers.get(socket.id);
    if (existing) {
      existing.name = data.name;
      existing.avatar = data.avatar;
    }

    const result = roomManager.updatePlayerProfile(socket.id, data.name, data.avatar);
    if (result.room) {
      io.to(result.room.id).emit('room_updated', result.room);
      if (result.room.isPublic) broadcastPublicRooms();

      // チャットで名前変更を通知
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'システム',
        senderAvatar: '✏️',
        text: `${result.oldName} さんが名前を「${data.name}」に変更しました。`,
        timestamp: Date.now(),
        type: 'system'
      };
      io.to(result.room.id).emit('chat_message', sysMsg);

      if (callback) callback({ success: true, room: result.room });
    } else {
      if (callback) callback({ success: false });
    }
  });

  // ルーム作成
  socket.on('create_room', (data: {
    player: { name: string; avatar: string; friendCode?: string };
    name: string;
    description?: string;
    isPublic: boolean;
    passcode?: string;
    maxPlayers: number;
    gameMode: 'talk' | 'wordwolf';
  }, callback) => {
    try {
      const isAdmin = adminManager.isAdmin(data.player.friendCode);
      if (data.player.friendCode) {
        connectedUsers.set(socket.id, {
          socketId: socket.id,
          friendCode: data.player.friendCode,
          name: data.player.name,
          avatar: data.player.avatar,
          isAdmin
        });
      }

      const room = roomManager.createRoom(
        {
          id: socket.id,
          name: data.player.name,
          avatar: data.player.avatar,
          friendCode: data.player.friendCode,
          isAdmin
        },
        data.name,
        data.description,
        data.isPublic,
        data.passcode,
        data.maxPlayers,
        data.gameMode
      );

      socket.join(room.id);
      callback({ success: true, room });

      // 公開部屋なら更新を配信
      if (room.isPublic) {
        broadcastPublicRooms();
      }

      console.log(`[Room] 作成成功: ${room.id} (${room.name}) by ${data.player.name} (管理者: ${isAdmin})`);
    } catch (err: any) {
      console.error('[Room] 作成エラー:', err);
      callback({ success: false, error: '部屋の作成に失敗しました。' });
    }
  });

  // ルーム参加
  socket.on('join_room', (data: {
    roomId: string;
    player: { name: string; avatar: string; friendCode?: string };
    passcode?: string;
  }, callback) => {
    const isAdmin = adminManager.isAdmin(data.player.friendCode);
    if (data.player.friendCode) {
      connectedUsers.set(socket.id, {
        socketId: socket.id,
        friendCode: data.player.friendCode,
        name: data.player.name,
        avatar: data.player.avatar,
        isAdmin
      });
    }

    const result = roomManager.joinRoom(
      data.roomId,
      {
        id: socket.id,
        name: data.player.name,
        avatar: data.player.avatar,
        friendCode: data.player.friendCode,
        isAdmin
      },
      data.passcode
    );

    if (result.error || !result.room) {
      callback({ success: false, error: result.error || '入室に失敗しました。' });
      return;
    }

    const room = result.room;
    socket.join(room.id);
    callback({ success: true, room });

    // 部屋内の全員に更新を通知
    io.to(room.id).emit('room_updated', room);

    // システムメッセージを発行
    const sysMsg: ChatMessage = {
      id: `sys-${Date.now()}-${Math.random()}`,
      senderId: 'system',
      senderName: 'システム',
      senderAvatar: '📢',
      text: `${data.player.name} さんが入室しました。`,
      timestamp: Date.now(),
      type: 'system'
    };
    io.to(room.id).emit('chat_message', sysMsg);

    // 公開部屋の人数変更を通知
    if (room.isPublic) {
      broadcastPublicRooms();
    }

    console.log(`[Room] 参加: ${room.id} に ${data.player.name} が参加`);
  });

  // 準備完了トグル
  socket.on('toggle_ready', () => {
    const room = roomManager.toggleReady(socket.id);
    if (room) {
      io.to(room.id).emit('room_updated', room);
    }
  });

  // ゲームモード変更
  socket.on('change_game_mode', (mode: 'talk' | 'wordwolf') => {
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    if (currentRoom && currentRoom.hostId === socket.id) {
      const room = roomManager.changeGameMode(currentRoom.id, mode);
      if (room) {
        io.to(room.id).emit('room_updated', room);
        if (room.isPublic) broadcastPublicRooms();
      }
    }
  });

  // ゲーム開始
  socket.on('start_game', () => {
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    if (!currentRoom || currentRoom.hostId !== socket.id) return;

    const onTick = (updatedRoom: typeof currentRoom) => {
      io.to(updatedRoom.id).emit('timer_tick', {
        remainingTime: updatedRoom.remainingTime,
        phase: updatedRoom.wordWolfState?.phase
      });
    };

    const onTimeUp = (updatedRoom: typeof currentRoom) => {
      io.to(updatedRoom.id).emit('room_updated', updatedRoom);
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'システム',
        senderAvatar: '⏰',
        text: '時間になりました！',
        timestamp: Date.now(),
        type: 'system'
      };
      io.to(updatedRoom.id).emit('chat_message', sysMsg);
    };

    const room = roomManager.startGame(currentRoom.id, onTick, onTimeUp);
    if (room) {
      io.to(room.id).emit('room_updated', room);
      if (room.isPublic) broadcastPublicRooms();

      const startMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'システム',
        senderAvatar: '🎮',
        text: room.gameMode === 'talk' ? '雑談ゲームがスタートしました！' : 'ワードウルフがスタートしました！',
        timestamp: Date.now(),
        type: 'system'
      };
      io.to(room.id).emit('chat_message', startMsg);
    }
  });

  // お題の引き直し（ホスト用）
  socket.on('next_topic', () => {
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    if (!currentRoom || currentRoom.hostId !== socket.id) return;

    const room = roomManager.nextTopic(currentRoom.id);
    if (room) {
      io.to(room.id).emit('room_updated', room);
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'システム',
        senderAvatar: '🎲',
        text: `お題が更新されました：「${room.currentTopic}」`,
        timestamp: Date.now(),
        type: 'system'
      };
      io.to(room.id).emit('chat_message', sysMsg);
    }
  });

  // ワードウルフ投票
  socket.on('submit_vote', (targetPlayerId: string) => {
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    if (!currentRoom) return;

    const room = roomManager.submitVote(currentRoom.id, socket.id, targetPlayerId, (updatedRoom) => {
      io.to(updatedRoom.id).emit('room_updated', updatedRoom);
    });
    if (room) {
      io.to(room.id).emit('room_updated', room);
    }
  });

  // ロビーへ戻る
  socket.on('reset_to_lobby', () => {
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    if (!currentRoom || currentRoom.hostId !== socket.id) return;

    const room = roomManager.resetToLobby(currentRoom.id);
    if (room) {
      io.to(room.id).emit('room_updated', room);
      if (room.isPublic) broadcastPublicRooms();

      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'システム',
        senderAvatar: '🏠',
        text: 'ロビーに戻りました。',
        timestamp: Date.now(),
        type: 'system'
      };
      io.to(room.id).emit('chat_message', sysMsg);
    }
  });

  // チャットメッセージ
  socket.on('send_message', (text: string) => {
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    if (!currentRoom || !text.trim()) return;

    const player = currentRoom.players.find(p => p.id === socket.id);
    if (!player) return;

    const isAdmin = player.isAdmin || adminManager.isAdmin(player.friendCode);

    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: player.id,
      senderName: player.name,
      senderAvatar: player.avatar,
      text: text.trim(),
      timestamp: Date.now(),
      type: 'chat',
      senderIsAdmin: isAdmin
    };

    io.to(currentRoom.id).emit('chat_message', msg);
  });

  // リアクションスタンプ（画面に弾幕・ポップアップ表示）
  socket.on('send_reaction', (data: { emoji: string; text: string }) => {
    const currentRoom = roomManager.getRoomBySocketId(socket.id);
    if (!currentRoom) return;

    const player = currentRoom.players.find(p => p.id === socket.id);
    if (!player) return;

    const stamp: ReactionStamp = {
      id: `stamp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      emoji: data.emoji,
      text: data.text,
      senderName: player.name,
      timestamp: Date.now()
    };

    io.to(currentRoom.id).emit('reaction_stamp', stamp);
  });

  // 退出処理
  // --- 管理者専用イベント ---
  const checkAdminAuth = (): boolean => {
    const user = connectedUsers.get(socket.id);
    return !!(user && adminManager.isAdmin(user.friendCode));
  };

  // サーバー全体概要（管理者用）
  socket.on('admin_get_overview', (callback) => {
    if (!checkAdminAuth()) {
      return callback({ error: '管理者権限がありません。' });
    }

    const allRooms = roomManager.getAllRooms();
    const roomsInfo: AdminRoomInfo[] = allRooms.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isPublic: r.isPublic,
      passcode: r.passcode,
      playerCount: r.players.length,
      maxPlayers: r.maxPlayers,
      gameMode: r.gameMode,
      status: r.status,
      hostName: r.players.find(p => p.id === r.hostId)?.name || '不明',
      createdAt: r.createdAt,
      players: r.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        friendCode: p.friendCode,
        isAdmin: p.isAdmin,
        isHost: p.isHost
      }))
    }));

    const usersInfo: AdminUserInfo[] = Array.from(connectedUsers.values()).map(u => {
      const room = roomManager.getRoomBySocketId(u.socketId);
      return {
        socketId: u.socketId,
        friendCode: u.friendCode,
        name: u.name,
        avatar: u.avatar,
        isAdmin: u.isAdmin,
        currentRoomId: room ? room.id : undefined
      };
    });

    const overview: AdminServerOverview = {
      connectedUserCount: connectedUsers.size,
      totalRoomsCount: allRooms.length,
      activeGameCount: allRooms.filter(r => r.status === 'playing').length,
      serverUptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
      rooms: roomsInfo,
      users: usersInfo,
      adminFriendCodes: adminManager.getAdminCodes()
    };

    callback({ success: true, overview });
  });

  // 部屋の強制解散
  socket.on('admin_close_room', (roomId: string, callback) => {
    if (!checkAdminAuth()) {
      return callback && callback({ success: false, error: '管理者権限がありません。' });
    }

    const closed = roomManager.forceCloseRoom(roomId);
    if (closed) {
      io.to(roomId).emit('room_force_closed', { reason: '管理者によって部屋が解散されました。' });
      // 所属ソケットを退出させる
      io.in(roomId).socketsLeave(roomId);
      broadcastPublicRooms();
      console.log(`[Admin] 管理者により部屋 ${roomId} が強制解散されました。`);
      if (callback) callback({ success: true });
    } else {
      if (callback) callback({ success: false, error: '部屋が見つかりませんでした。' });
    }
  });

  // 全体アナウンス（ブロードキャスト）
  socket.on('admin_broadcast_announcement', (data: { message: string; senderName?: string }, callback) => {
    if (!checkAdminAuth()) {
      return callback && callback({ success: false, error: '管理者権限がありません。' });
    }

    const broadcastData = {
      id: `annc-${Date.now()}`,
      message: data.message.trim(),
      senderName: data.senderName || '管理者',
      timestamp: Date.now()
    };

    io.emit('broadcast_announcement', broadcastData);
    console.log(`[Admin] 全体アナウンス配信: "${data.message}"`);
    if (callback) callback({ success: true });
  });

  // 管理者フレンドコードの追加
  socket.on('admin_add_admin_code', (friendCode: string, callback) => {
    if (!checkAdminAuth()) {
      return callback && callback({ success: false, error: '管理者権限がありません。' });
    }

    const success = adminManager.addAdmin(friendCode);
    // 対象のオンラインユーザーがいれば即時更新
    for (const u of connectedUsers.values()) {
      if (u.friendCode.toUpperCase() === friendCode.trim().toUpperCase()) {
        u.isAdmin = true;
        io.to(u.socketId).emit('admin_status', { isAdmin: true, friendCode: u.friendCode });
      }
    }
    if (callback) callback({ success, adminCodes: adminManager.getAdminCodes() });
  });

  // 管理者フレンドコードの削除
  socket.on('admin_remove_admin_code', (friendCode: string, callback) => {
    if (!checkAdminAuth()) {
      return callback && callback({ success: false, error: '管理者権限がありません。' });
    }

    const success = adminManager.removeAdmin(friendCode);
    for (const u of connectedUsers.values()) {
      if (u.friendCode.toUpperCase() === friendCode.trim().toUpperCase()) {
        u.isAdmin = false;
        io.to(u.socketId).emit('admin_status', { isAdmin: false, friendCode: u.friendCode });
      }
    }
    if (callback) callback({ success, adminCodes: adminManager.getAdminCodes() });
  });

  // 公式お知らせ作成
  socket.on('admin_create_announcement', (data: { title: string; content: string; tag: any; isImportant?: boolean }, callback) => {
    if (!checkAdminAuth()) {
      return callback && callback({ success: false, error: '管理者権限がありません。' });
    }
    const anno = communityManager.addAnnouncement(data.title, data.content, data.tag, data.isImportant);
    broadcastAnnouncements();
    if (callback) callback({ success: true, announcement: anno });
  });

  // 公式お知らせ削除
  socket.on('admin_delete_announcement', (id: string, callback) => {
    if (!checkAdminAuth()) {
      return callback && callback({ success: false, error: '管理者権限がありません。' });
    }
    const success = communityManager.deleteAnnouncement(id);
    broadcastAnnouncements();
    if (callback) callback({ success });
  });

  const handleLeave = () => {
    const result = roomManager.leaveRoom(socket.id);
    if (result.room) {
      socket.leave(result.room.id);
      io.to(result.room.id).emit('room_updated', result.room);

      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        senderId: 'system',
        senderName: 'システム',
        senderAvatar: '🚪',
        text: `参加者が退室しました。`,
        timestamp: Date.now(),
        type: 'system'
      };
      io.to(result.room.id).emit('chat_message', sysMsg);

      if (result.room.isPublic) broadcastPublicRooms();
    } else if (result.removedRoomId) {
      broadcastPublicRooms();
      console.log(`[Room] 部屋 ${result.removedRoomId} が空になったため削除されました。`);
    }
  };

  socket.on('leave_room', handleLeave);
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    handleLeave();
  });
});

// 本番環境用: クライアントビルド（client/dist）の静的配信（オールインワン構成）
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log(`[Static] Webクライアント静的配信が有効です: ${clientDistPath}`);
}

const PORT: number = Number(process.env.PORT) || 3010;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(` 雑談ゲーム サーバー稼働中: http://localhost:${PORT}`);
  console.log(` 同一ネットワークから接続可能 (0.0.0.0:${PORT})`);
  console.log(`========================================`);
});
