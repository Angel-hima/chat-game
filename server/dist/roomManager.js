"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const topics_1 = require("./topics");
class RoomManager {
    rooms = new Map();
    socketToRoomId = new Map();
    timers = new Map();
    // ランダムな5桁のルームIDを生成
    generateRoomId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        do {
            result = '';
            for (let i = 0; i < 5; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (this.rooms.has(result));
        return result;
    }
    // 公開部屋の一覧を取得
    getPublicRooms() {
        const list = [];
        for (const room of this.rooms.values()) {
            if (room.isPublic) {
                const host = room.players.find(p => p.id === room.hostId);
                list.push({
                    id: room.id,
                    name: room.name,
                    description: room.description,
                    playerCount: room.players.length,
                    maxPlayers: room.maxPlayers,
                    gameMode: room.gameMode,
                    status: room.status,
                    hostName: host ? host.name : '不明'
                });
            }
        }
        return list;
    }
    // ルーム作成
    createRoom(hostPlayer, name, description, isPublic, passcode, maxPlayers, gameMode) {
        const roomId = this.generateRoomId();
        const fullHostPlayer = {
            ...hostPlayer,
            isHost: true,
            isReady: true,
            isOnline: true
        };
        const room = {
            id: roomId,
            name: name.trim() || `${hostPlayer.name}の部屋`,
            description: description?.trim() || undefined,
            isPublic,
            passcode: isPublic ? undefined : passcode?.trim(),
            maxPlayers: Math.max(2, Math.min(maxPlayers, 12)),
            hostId: fullHostPlayer.id,
            players: [fullHostPlayer],
            gameMode,
            status: 'lobby',
            currentTopic: (0, topics_1.getRandomTopic)(),
            remainingTime: 180, // デフォルト3分
            createdAt: Date.now()
        };
        this.rooms.set(roomId, room);
        this.socketToRoomId.set(fullHostPlayer.id, roomId);
        return room;
    }
    // プレイヤー名・アバターの変更（入室中）
    updatePlayerProfile(socketId, name, avatar) {
        const room = this.getRoomBySocketId(socketId);
        if (!room)
            return {};
        const player = room.players.find(p => p.id === socketId);
        if (!player)
            return {};
        const oldName = player.name;
        player.name = name.trim() || player.name;
        player.avatar = avatar || player.avatar;
        return { room, oldName };
    }
    // ルーム参加
    joinRoom(roomId, player, passcode) {
        const room = this.rooms.get(roomId.toUpperCase());
        if (!room) {
            return { error: '指定された部屋が見つかりません。' };
        }
        if (room.players.length >= room.maxPlayers) {
            return { error: 'この部屋は満員です。' };
        }
        // パスワード確認
        if (!room.isPublic && room.passcode) {
            if (room.passcode !== passcode?.trim()) {
                return { error: '合言葉（パスワード）が一致しません。' };
            }
        }
        // すでに参加中かチェック
        const existingIndex = room.players.findIndex(p => p.id === player.id);
        const newPlayer = {
            ...player,
            isHost: false,
            isReady: false,
            isOnline: true
        };
        if (existingIndex >= 0) {
            room.players[existingIndex] = newPlayer;
        }
        else {
            room.players.push(newPlayer);
        }
        this.socketToRoomId.set(player.id, room.id);
        return { room };
    }
    // プレイヤー退出
    leaveRoom(socketId) {
        const roomId = this.socketToRoomId.get(socketId);
        if (!roomId)
            return {};
        const room = this.rooms.get(roomId);
        this.socketToRoomId.delete(socketId);
        if (!room)
            return {};
        // プレイヤーを除外
        room.players = room.players.filter(p => p.id !== socketId);
        // 部屋が空になったら削除
        if (room.players.length === 0) {
            this.clearRoomTimer(roomId);
            this.rooms.delete(roomId);
            return { removedRoomId: roomId };
        }
        // ホストが抜けたら次の人にホスト権限を移譲
        if (room.hostId === socketId) {
            room.players[0].isHost = true;
            room.hostId = room.players[0].id;
        }
        return { room };
    }
    getRoom(roomId) {
        return this.rooms.get(roomId.toUpperCase());
    }
    getRoomBySocketId(socketId) {
        const roomId = this.socketToRoomId.get(socketId);
        if (!roomId)
            return undefined;
        return this.rooms.get(roomId);
    }
    // 準備完了トグル
    toggleReady(socketId) {
        const room = this.getRoomBySocketId(socketId);
        if (!room || room.status !== 'lobby')
            return undefined;
        const player = room.players.find(p => p.id === socketId);
        if (player && !player.isHost) {
            player.isReady = !player.isReady;
        }
        return room;
    }
    // ゲームモード変更
    changeGameMode(roomId, mode) {
        const room = this.rooms.get(roomId);
        if (!room || room.status !== 'lobby')
            return undefined;
        room.gameMode = mode;
        return room;
    }
    // ゲーム開始
    startGame(roomId, onTick, onTimeUp) {
        const room = this.rooms.get(roomId);
        if (!room)
            return undefined;
        room.status = 'playing';
        if (room.gameMode === 'talk') {
            room.currentTopic = (0, topics_1.getRandomTopic)();
            room.remainingTime = 180; // 3分
            room.wordWolfState = undefined;
        }
        else if (room.gameMode === 'wordwolf') {
            const pair = (0, topics_1.getRandomWordWolfPair)();
            // プレイヤーからランダムに1名をウルフに選出 (参加者が多ければ2名も検討可、ここでは1名)
            const wolfIndex = Math.floor(Math.random() * room.players.length);
            const wolfId = room.players[wolfIndex].id;
            const roles = {};
            room.players.forEach(p => {
                const isWolf = p.id === wolfId;
                roles[p.id] = {
                    word: isWolf ? pair.minority : pair.majority,
                    isWolf
                };
            });
            room.wordWolfState = {
                phase: 'discussion',
                majorityWord: pair.majority,
                minorityWord: pair.minority,
                wolfPlayerIds: [wolfId],
                roles,
                votes: {},
                winner: null
            };
            room.remainingTime = 180; // 討論3分
            room.currentTopic = `市民とお題が違う「ウルフ」は誰？（雑談しながら見つけ出そう！）`;
        }
        // タイマー設定
        this.startRoomTimer(room, onTick, onTimeUp);
        return room;
    }
    // お題の引き直し（雑談モード用）
    nextTopic(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return undefined;
        room.currentTopic = (0, topics_1.getRandomTopic)();
        return room;
    }
    // タイマーの開始
    startRoomTimer(room, onTick, onTimeUp) {
        this.clearRoomTimer(room.id);
        const timer = setInterval(() => {
            if (room.remainingTime > 0) {
                room.remainingTime -= 1;
                if (onTick)
                    onTick(room);
            }
            else {
                this.clearRoomTimer(room.id);
                if (room.gameMode === 'wordwolf' && room.wordWolfState?.phase === 'discussion') {
                    // 討論終了 -> 投票フェーズへ移行
                    room.wordWolfState.phase = 'voting';
                    room.remainingTime = 45; // 投票時間45秒
                    this.startRoomTimer(room, onTick, onTimeUp);
                    if (onTick)
                        onTick(room);
                    return;
                }
                if (room.gameMode === 'wordwolf' && room.wordWolfState?.phase === 'voting') {
                    // 投票締め切り -> 結果判定へ
                    this.finalizeWordWolf(room);
                }
                if (onTimeUp)
                    onTimeUp(room);
            }
        }, 1000);
        this.timers.set(room.id, timer);
    }
    clearRoomTimer(roomId) {
        const existing = this.timers.get(roomId);
        if (existing) {
            clearInterval(existing);
            this.timers.delete(roomId);
        }
    }
    // ワードウルフの投票
    submitVote(roomId, voterId, targetId, onUpdate) {
        const room = this.rooms.get(roomId);
        if (!room || !room.wordWolfState || room.wordWolfState.phase !== 'voting')
            return undefined;
        room.wordWolfState.votes[voterId] = targetId;
        // 全員投票完了したかチェック
        if (Object.keys(room.wordWolfState.votes).length >= room.players.length) {
            this.clearRoomTimer(room.id);
            this.finalizeWordWolf(room);
        }
        if (onUpdate)
            onUpdate(room);
        return room;
    }
    // ワードウルフ結果集計
    finalizeWordWolf(room) {
        if (!room.wordWolfState)
            return;
        room.wordWolfState.phase = 'result';
        room.status = 'result';
        // 得票数集計
        const voteCounts = {};
        for (const targetId of Object.values(room.wordWolfState.votes)) {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
        }
        let maxVotes = -1;
        let mostVotedPlayerId = null;
        let isTie = false;
        for (const [targetId, count] of Object.entries(voteCounts)) {
            if (count > maxVotes) {
                maxVotes = count;
                mostVotedPlayerId = targetId;
                isTie = false;
            }
            else if (count === maxVotes) {
                isTie = true;
            }
        }
        // 最多得票者が同票の場合はウルフの勝ち、最多得票者がウルフなら市民の勝ち
        if (isTie || !mostVotedPlayerId) {
            room.wordWolfState.winner = 'wolf';
        }
        else {
            const isWolf = room.wordWolfState.wolfPlayerIds.includes(mostVotedPlayerId);
            room.wordWolfState.winner = isWolf ? 'citizens' : 'wolf';
        }
    }
    // ロビーへ戻る
    resetToLobby(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return undefined;
        this.clearRoomTimer(roomId);
        room.status = 'lobby';
        room.remainingTime = 180;
        room.wordWolfState = undefined;
        room.players.forEach(p => {
            if (!p.isHost)
                p.isReady = false;
        });
        return room;
    }
    // 管理者用: 全ての部屋（非公開も含む）を取得
    getAllRooms() {
        return Array.from(this.rooms.values());
    }
    // 管理者用: 部屋の強制解散
    forceCloseRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return undefined;
        this.clearRoomTimer(roomId);
        for (const player of room.players) {
            this.socketToRoomId.delete(player.id);
        }
        this.rooms.delete(roomId);
        return room;
    }
}
exports.RoomManager = RoomManager;
