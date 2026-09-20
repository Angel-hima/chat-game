export type GameMode = 'talk' | 'wordwolf';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
  friendCode?: string;
  isAdmin?: boolean;
}

export interface Friend {
  friendCode: string;
  name: string;
  avatar: string;
  addedAt: number;
}

export interface FriendStatus {
  friendCode: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  isAdmin?: boolean;
  currentRoomId?: string;
  currentRoomName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  type: 'chat' | 'system';
  senderIsAdmin?: boolean;
}

export interface ReactionStamp {
  id: string;
  emoji: string;
  text: string;
  senderName: string;
  timestamp: number;
}

export interface WordWolfState {
  phase: 'briefing' | 'discussion' | 'voting' | 'result';
  majorityWord: string;
  minorityWord: string;
  wolfPlayerIds: string[];
  roles: { [playerId: string]: { word: string; isWolf: boolean } };
  votes: { [playerId: string]: string };
  winner: 'citizens' | 'wolf' | null;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  passcode?: string;
  maxPlayers: number;
  hostId: string;
  players: Player[];
  gameMode: GameMode;
  status: 'lobby' | 'playing' | 'result';
  currentTopic: string;
  remainingTime: number;
  wordWolfState?: WordWolfState;
  createdAt: number;
}

export interface PublicRoomSummary {
  id: string;
  name: string;
  description?: string;
  playerCount: number;
  maxPlayers: number;
  gameMode: GameMode;
  status: 'lobby' | 'playing' | 'result';
  hostName: string;
}

// コミュニティ掲示板の投稿
export interface CommunityPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: number;
  likes: number;
}

// 公式お知らせ
export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  tag: 'お知らせ' | 'アップデート' | 'イベント' | '重要';
  isImportant?: boolean;
}

// フィードバック
export interface Feedback {
  id: string;
  category: '感想・応援' | '不具合報告' | '機能リクエスト' | 'その他';
  message: string;
  userName: string;
  createdAt: number;
}

// 管理者機能用データ型
export interface AdminRoomInfo {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  passcode?: string;
  playerCount: number;
  maxPlayers: number;
  gameMode: GameMode;
  status: 'lobby' | 'playing' | 'result';
  hostName: string;
  createdAt: number;
  players: {
    id: string;
    name: string;
    avatar: string;
    friendCode?: string;
    isAdmin?: boolean;
    isHost: boolean;
  }[];
}

export interface AdminUserInfo {
  socketId: string;
  friendCode: string;
  name: string;
  avatar: string;
  isAdmin: boolean;
  currentRoomId?: string;
}

export interface AdminServerOverview {
  connectedUserCount: number;
  totalRoomsCount: number;
  activeGameCount: number;
  serverUptimeSeconds: number;
  rooms: AdminRoomInfo[];
  users: AdminUserInfo[];
  adminFriendCodes: string[];
}

export interface BroadcastAnnouncement {
  id: string;
  message: string;
  senderName: string;
  timestamp: number;
}

