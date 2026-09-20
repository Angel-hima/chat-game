"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class AdminManager {
    dataDir = path_1.default.join(__dirname, '../data');
    adminsFile = path_1.default.join(this.dataDir, 'admins.json');
    adminCodes = new Set();
    constructor() {
        this.ensureDataDir();
        this.loadAdmins();
    }
    ensureDataDir() {
        if (!fs_1.default.existsSync(this.dataDir)) {
            try {
                fs_1.default.mkdirSync(this.dataDir, { recursive: true });
            }
            catch (e) {
                console.error('Failed to create data directory:', e);
            }
        }
    }
    loadAdmins() {
        try {
            if (fs_1.default.existsSync(this.adminsFile)) {
                const raw = fs_1.default.readFileSync(this.adminsFile, 'utf-8');
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    this.adminCodes = new Set(parsed.map(code => String(code).trim().toUpperCase()));
                    console.log(`[AdminManager] 管理者フレンドコードをロードしました (${this.adminCodes.size}件):`, Array.from(this.adminCodes));
                    return;
                }
            }
        }
        catch (e) {
            console.error('[AdminManager] admins.json の読み込みに失敗しました:', e);
        }
        // 初回などファイルが存在しない場合は空配列で作成
        this.saveAdmins();
    }
    saveAdmins() {
        try {
            this.ensureDataDir();
            fs_1.default.writeFileSync(this.adminsFile, JSON.stringify(Array.from(this.adminCodes), null, 2), 'utf-8');
        }
        catch (e) {
            console.error('[AdminManager] admins.json の保存に失敗しました:', e);
        }
    }
    isAdmin(friendCode) {
        if (!friendCode)
            return false;
        const normalized = friendCode.trim().toUpperCase();
        return this.adminCodes.has(normalized);
    }
    getAdminCodes() {
        // 外部編集されている可能性があるため最新ファイルを再チェック
        this.loadAdmins();
        return Array.from(this.adminCodes);
    }
    addAdmin(friendCode) {
        if (!friendCode)
            return false;
        const normalized = friendCode.trim().toUpperCase();
        this.adminCodes.add(normalized);
        this.saveAdmins();
        console.log(`[AdminManager] 管理者を追加しました: ${normalized}`);
        return true;
    }
    removeAdmin(friendCode) {
        if (!friendCode)
            return false;
        const normalized = friendCode.trim().toUpperCase();
        const removed = this.adminCodes.delete(normalized);
        if (removed) {
            this.saveAdmins();
            console.log(`[AdminManager] 管理者を削除しました: ${normalized}`);
        }
        return removed;
    }
}
exports.AdminManager = AdminManager;
