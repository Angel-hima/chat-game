import fs from 'fs';
import path from 'path';

export class AdminManager {
  private dataDir = path.join(__dirname, '../data');
  private adminsFile = path.join(this.dataDir, 'admins.json');
  private adminCodes: Set<string> = new Set();

  constructor() {
    this.ensureDataDir();
    this.loadAdmins();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (e) {
        console.error('Failed to create data directory:', e);
      }
    }
  }

  private loadAdmins() {
    try {
      if (fs.existsSync(this.adminsFile)) {
        const raw = fs.readFileSync(this.adminsFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.adminCodes = new Set(parsed.map(code => String(code).trim().toUpperCase()));
          console.log(`[AdminManager] 管理者フレンドコードをロードしました (${this.adminCodes.size}件):`, Array.from(this.adminCodes));
          return;
        }
      }
    } catch (e) {
      console.error('[AdminManager] admins.json の読み込みに失敗しました:', e);
    }

    // 初回などファイルが存在しない場合は空配列で作成
    this.saveAdmins();
  }

  private saveAdmins() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(
        this.adminsFile,
        JSON.stringify(Array.from(this.adminCodes), null, 2),
        'utf-8'
      );
    } catch (e) {
      console.error('[AdminManager] admins.json の保存に失敗しました:', e);
    }
  }

  public isAdmin(friendCode?: string): boolean {
    if (!friendCode) return false;
    const normalized = friendCode.trim().toUpperCase();
    return this.adminCodes.has(normalized);
  }

  public getAdminCodes(): string[] {
    // 外部編集されている可能性があるため最新ファイルを再チェック
    this.loadAdmins();
    return Array.from(this.adminCodes);
  }

  public addAdmin(friendCode: string): boolean {
    if (!friendCode) return false;
    const normalized = friendCode.trim().toUpperCase();
    this.adminCodes.add(normalized);
    this.saveAdmins();
    console.log(`[AdminManager] 管理者を追加しました: ${normalized}`);
    return true;
  }

  public removeAdmin(friendCode: string): boolean {
    if (!friendCode) return false;
    const normalized = friendCode.trim().toUpperCase();
    const removed = this.adminCodes.delete(normalized);
    if (removed) {
      this.saveAdmins();
      console.log(`[AdminManager] 管理者を削除しました: ${normalized}`);
    }
    return removed;
  }
}
