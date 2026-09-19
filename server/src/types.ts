export type GameMode = 'talk' | 'wordwolf';

export interface Player {
  id: string;              // socket.id
  name: string;
  avatar: string;          // 絵文字やアバターID
  isHost: boolean;
  isReady: boolean;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  type: 'chat' | 'system';
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
  votes: { [playerId: string]: string }; // voterId -> targetPlayerId
  winner: 'citizens' | 'wolf' | null;
}

export interface Room {
  id: string;              // 5桁コード（例: "7A9K2"）
  name: string;
  description?: string;    // 部屋の説明・募集文
  isPublic: boolean;
  passcode?: string;       // 非公開部屋の場合の合言葉
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
