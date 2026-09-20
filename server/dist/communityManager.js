"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class CommunityManager {
    posts = [
        {
            id: 'post-init-1',
            authorName: '運営チーム',
            authorAvatar: '👑',
            content: '雑談パーティーへようこそ！新機能「コミュニティ機能」と「部屋説明機能」が追加されました！みんなで自由に募集や雑談を投稿してみてください✨',
            createdAt: Date.now() - 3600000 * 2,
            likes: 12
        },
        {
            id: 'post-init-2',
            authorName: 'ねこたろう',
            authorAvatar: '🐱',
            content: '今日から始めました！誰かお題トーク一緒にやりませんかー？',
            createdAt: Date.now() - 1800000,
            likes: 5
        }
    ];
    feedbacks = [];
    announcements = [];
    dataDir = path_1.default.join(__dirname, '../data');
    feedbackFile = path_1.default.join(this.dataDir, 'feedbacks.json');
    announcementFile = path_1.default.join(this.dataDir, 'announcements.json');
    defaultAnnouncements = [
        {
            id: 'anno-1',
            title: '🎉 メジャーアップデート！新機能が追加されました',
            content: '「コミュニティ掲示板」「公式お知らせ」「部屋説明」「入室中の名前変更」「フィードバック機能」が利用可能になりました！',
            date: '2026/09/18',
            tag: 'アップデート',
            isImportant: true
        },
        {
            id: 'anno-2',
            title: '🔰 はじめて遊ぶ方へ：遊び方ガイド',
            content: '画面右上の「❓ 使い方」ボタンから、お題トークやワードウルフの基本ルール、リアクション弾幕スタンプの使い方がいつでも確認できます。',
            date: '2026/09/18',
            tag: 'お知らせ',
            isImportant: false
        }
    ];
    constructor() {
        this.ensureDataDir();
        this.loadFeedbacks();
        this.loadAnnouncements();
    }
    ensureDataDir() {
        if (!fs_1.default.existsSync(this.dataDir)) {
            try {
                fs_1.default.mkdirSync(this.dataDir, { recursive: true });
            }
            catch (e) {
                console.error('データディレクトリ作成エラー:', e);
            }
        }
    }
    // 緩やかなJSONパース（末尾の余計なカンマやBOM、コメントを自動除去）
    parseLenientJson(raw) {
        const clean = raw
            .replace(/^\uFEFF/, '') // BOM除去
            .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // コメント除去
            .replace(/,\s*([\]}])/g, '$1'); // 末尾カンマ除去 (Trailing comma)
        return JSON.parse(clean);
    }
    // お知らせの読み込み（ファイルが無ければ初期データを書き出す）
    loadAnnouncements() {
        try {
            if (fs_1.default.existsSync(this.announcementFile)) {
                const raw = fs_1.default.readFileSync(this.announcementFile, 'utf-8');
                let parsed;
                try {
                    parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
                }
                catch {
                    // 通常パース失敗時は末尾カンマ等を除去して再トライ
                    parsed = this.parseLenientJson(raw);
                }
                if (Array.isArray(parsed)) {
                    this.announcements = parsed;
                    return this.announcements;
                }
            }
        }
        catch (e) {
            console.error('お知らせファイル読み込みエラー:', e);
            return this.announcements;
        }
        // ファイルが存在しない場合は初期データを作成して保存
        this.announcements = [...this.defaultAnnouncements];
        this.saveAnnouncements();
        return this.announcements;
    }
    // お知らせの追加
    addAnnouncement(title, content, tag, isImportant) {
        const today = new Date();
        const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
        const newAnno = {
            id: `anno-${Date.now()}`,
            title: title.trim(),
            content: content.trim(),
            date: dateStr,
            tag,
            isImportant: !!isImportant
        };
        this.announcements.unshift(newAnno);
        this.saveAnnouncements();
        return newAnno;
    }
    // お知らせの削除
    deleteAnnouncement(id) {
        const idx = this.announcements.findIndex(a => a.id === id);
        if (idx >= 0) {
            this.announcements.splice(idx, 1);
            this.saveAnnouncements();
            return true;
        }
        return false;
    }
    // お知らせの保存
    saveAnnouncements() {
        try {
            this.ensureDataDir();
            fs_1.default.writeFileSync(this.announcementFile, JSON.stringify(this.announcements, null, 2), 'utf-8');
        }
        catch (e) {
            console.error('お知らせファイル保存エラー:', e);
        }
    }
    // announcements.json の変更を監視してコールバックを実行
    watchAnnouncements(onUpdate) {
        if (!fs_1.default.existsSync(this.announcementFile)) {
            this.saveAnnouncements();
        }
        try {
            // 1秒間隔で更新確認
            fs_1.default.watchFile(this.announcementFile, { interval: 1000 }, (curr, prev) => {
                if (curr.mtimeMs !== prev.mtimeMs) {
                    const updated = this.loadAnnouncements();
                    onUpdate(updated);
                }
            });
        }
        catch (e) {
            console.error('お知らせファイル監視登録エラー:', e);
        }
    }
    loadFeedbacks() {
        try {
            if (fs_1.default.existsSync(this.feedbackFile)) {
                const data = fs_1.default.readFileSync(this.feedbackFile, 'utf-8').replace(/^\uFEFF/, '');
                this.feedbacks = JSON.parse(data);
            }
        }
        catch (e) {
            console.error('フィードバック読み込みエラー:', e);
        }
    }
    saveFeedbacks() {
        try {
            fs_1.default.writeFileSync(this.feedbackFile, JSON.stringify(this.feedbacks, null, 2), 'utf-8');
        }
        catch (e) {
            console.error('フィードバック保存エラー:', e);
        }
    }
    // 掲示板投稿一覧の取得
    getPosts() {
        return this.posts.slice(-50).reverse(); // 最新50件を新しい順で
    }
    // 投稿作成
    addPost(authorName, authorAvatar, content) {
        const newPost = {
            id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            authorName: authorName.trim() || 'ゲスト',
            authorAvatar: authorAvatar || '🐱',
            content: content.trim(),
            createdAt: Date.now(),
            likes: 0
        };
        this.posts.push(newPost);
        return newPost;
    }
    // いいね
    likePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            post.likes += 1;
            return post;
        }
        return undefined;
    }
    // お知らせ一覧の取得
    getAnnouncements() {
        return this.announcements;
    }
    // フィードバック追加
    addFeedback(category, message, userName) {
        const item = {
            id: `fb-${Date.now()}`,
            category,
            message: message.trim(),
            userName: userName.trim() || '匿名',
            createdAt: Date.now()
        };
        this.feedbacks.push(item);
        this.saveFeedbacks();
        console.log(`[Feedback 受信] [${category}] ${userName}: ${message}`);
        return item;
    }
}
exports.CommunityManager = CommunityManager;
