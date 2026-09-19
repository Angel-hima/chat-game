import React, { useState } from 'react';
import { ShieldAlert, CheckCircle } from 'lucide-react';

interface TermsModalProps {
  onAgree: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onAgree }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-pop">
        <div className="text-center mb-4">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600/30 text-indigo-400 mb-2">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-100">利用規約およびコミュニティガイドライン</h2>
          <p className="text-xs text-slate-400">みんなで気持ちよく遊ぶためのルールです</p>
        </div>

        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 text-xs text-slate-300 space-y-2.5 max-h-56 overflow-y-auto mb-4 leading-relaxed">
          <p className="font-bold text-indigo-300">第1条（禁止行為）</p>
          <p>本ゲーム内において、以下の行為を固く禁止します：</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400">
            <li>他者に対する誹謗中傷、侮辱、脅迫、いじめ行為</li>
            <li>公序良俗に反するわいせつな発言や画像の共有</li>
            <li>個人情報（本名・電話番号・住所・SNSアカウント等）の無断投稿</li>
            <li>荒らし行為、スパム行為、ゲーム進行の意図的な妨害</li>
          </ul>

          <p className="font-bold text-indigo-300 pt-2">第2条（コンテンツの監視と措置）</p>
          <p>
            利用規約に違反したユーザーに対しては、予告なく発言の削除、部屋からのキック、またはサービスの利用制限（アカウントBAN）を行う場合があります。
          </p>

          <p className="font-bold text-indigo-300 pt-2">第3条（通報・ブロック機能）</p>
          <p>
            不適切な発言や迷惑行為を行うプレイヤーを発見した場合は、チャットや参加者リストから「通報」および「ブロック」機能をご利用いただけます。
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer mb-5 p-2 rounded-xl hover:bg-slate-700/50 transition">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
          />
          <span className="text-xs font-bold text-slate-200">
            上記の利用規約に同意してプレイします
          </span>
        </label>

        <button
          onClick={onAgree}
          disabled={!checked}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 disabled:hover:from-indigo-600 text-white font-black text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          同意してはじめる
        </button>
      </div>
    </div>
  );
};
