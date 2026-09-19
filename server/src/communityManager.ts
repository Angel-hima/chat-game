import fs from 'fs';
import path from 'path';
import { CommunityPost, Announcement, Feedback } from './types';

export class CommunityManager {
  private posts: CommunityPost[] = [
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

  private feedbacks: Feedback[] = [];
  private announcements: Announcement[] = [];
  private dataDir = path.join(__dirname, '../data');
  private feedbackFile = path.join(this.dataDir, 'feedbacks.json');
  private announcementFile = path.join(this.dataDir, 'announcements.json');

  private defaultAnnouncements: Announcement[] = [
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

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (e) {
        console.error('データディレクトリ作成エラー:', e);
      }
    }
  }

  // 緩やかなJSONパース（末尾の余計なカンマやBOM、コメントを自動除去）
  private parseLenientJson(raw: string): any {
    const clean = raw
      .replace(/^\uFEFF/, '') // BOM除去
      .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // コメント除去
      .replace(/,\s*([\]}])/g, '$1'); // 末尾カンマ除去 (Trailing comma)
    return JSON.parse(clean);
  }

  // お知らせの読み込み（ファイルが無ければ初期データを書き出す）
  public loadAnnouncements(): Announcement[] {
    try {
      if (fs.existsSync(this.announcementFile)) {
        const raw = fs.readFileSync(this.announcementFile, 'utf-8');
        let parsed: any;
        try {
          parsed = JSON.parse(raw.replace(/^\uFEFF/, ''));
        } catch {
          // 通常パース失敗時は末尾カンマ等を除去して再トライ
          parsed = this.parseLenientJson(raw);
        }

        if (Array.isArray(parsed)) {
          this.announcements = parsed;
          return this.announcements;
        }
      }
    } catch (e) {
      console.error('お知らせファイル読み込みエラー:', e);
      return this.announcements;
    }

    // ファイルが存在しない場合は初期データを作成して保存
    this.announcements = [...this.defaultAnnouncements];
    this.saveAnnouncements();
    return this.announcements;
  }

  // お知らせの保存
  public saveAnnouncements() {
    try {
      fs.writeFileSync(this.announcementFile, JSON.stringify(this.announcements, null, 2), 'utf-8');
    } catch (e) {
      console.error('お知らせファイル保存エラー:', e);
    }
  }

  // announcements.json の変更を監視してコールバックを実行
  public watchAnnouncements(onUpdate: (annos: Announcement[]) => void) {
    if (!fs.existsSync(this.announcementFile)) {
      this.saveAnnouncements();
    }

    try {
      // 1秒間隔で更新確認
      fs.watchFile(this.announcementFile, { interval: 1000 }, (curr, prev) => {
        if (curr.mtimeMs !== prev.mtimeMs) {
          const updated = this.loadAnnouncements();
          onUpdate(updated);
        }
      });
    } catch (e) {
      console.error('お知らせファイル監視登録エラー:', e);
    }
  }

  private loadFeedbacks() {
    try {
      if (fs.existsSync(this.feedbackFile)) {
        const data = fs.readFileSync(this.feedbackFile, 'utf-8').replace(/^\uFEFF/, '');
        this.feedbacks = JSON.parse(data);
      }
    } catch (e) {
      console.error('フィードバック読み込みエラー:', e);
    }
  }

  private saveFeedbacks() {
    try {
      fs.writeFileSync(this.feedbackFile, JSON.stringify(this.feedbacks, null, 2), 'utf-8');
    } catch (e) {
      console.error('フィードバック保存エラー:', e);
    }
  }

  // 掲示板投稿一覧の取得
  public getPosts(): CommunityPost[] {
    return this.posts.slice(-50).reverse(); // 最新50件を新しい順で
  }

  // 投稿作成
  public addPost(authorName: string, authorAvatar: string, content: string): CommunityPost {
    const newPost: CommunityPost = {
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
  public likePost(postId: string): CommunityPost | undefined {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.likes += 1;
      return post;
    }
    return undefined;
  }

  // お知らせ一覧の取得
  public getAnnouncements(): Announcement[] {
    return this.announcements;
  }

  // フィードバック追加
  public addFeedback(category: Feedback['category'], message: string, userName: string): Feedback {
    const item: Feedback = {
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
