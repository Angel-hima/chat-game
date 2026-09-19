import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, MessageSquare, Users, Sparkles, HelpCircle, Heart } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: <Users className="w-8 h-8 text-indigo-400" />,
    title: '1. アバターと名前を決めよう！',
    subtitle: '入室中もいつでも変更OK',
    description: '好きな絵文字アバターとニックネームを設定します。設定した名前は自動で保存され、部屋に入った後でもアイコンをタップしていつでも変更できます！'
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-pink-400" />,
    title: '2. 部屋を作るか、公開部屋に参加！',
    subtitle: 'ワンタップで誰とでも繋がれる',
    description: '「部屋を作る」からテーマや説明文を決めてオープンしたり、ロビーの「公開部屋一覧」から気になる部屋にワンタップで参加できます。友達とだけ遊ぶ合言葉（非公開）部屋も作れます。'
  },
  {
    icon: <HelpCircle className="w-8 h-8 text-amber-400" />,
    title: '3. 2つの楽しい雑談ゲームモード',
    subtitle: 'お題トーク & ワードウルフ',
    description: '「お題トーク」はランダムなお題カードで自由に会話を楽しむモード！「ワードウルフ」は1人だけ違うお題が配られたウルフを雑談の中から見つけ出す心理推理ゲームです。'
  },
  {
    icon: <Sparkles className="w-8 h-8 text-purple-400" />,
    title: '4. リアクション弾幕スタンプ！',
    subtitle: '「わかる！」「それな！」「草w」',
    description: '会話中、画面下のスタンプボタンを押すと、全員の画面にリアルタイムでスタンプがぷかぷか浮き上がります！相手の話にどんどんリアクションして盛り上げましょう。'
  }
];

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-pop relative flex flex-col justify-between min-h-[420px]">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700 transition"
          title="閉じる"
        >
          <X className="w-5 h-5" />
        </button>

        {/* コンテンツ */}
        <div className="text-center pt-2">
          {/* ステップバッジ */}
          <div className="inline-flex items-center gap-1 bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full mb-4">
            <span>遊び方ガイド</span>
            <span>({currentStep + 1} / {STEPS.length})</span>
          </div>

          <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-900/80 border border-slate-700 flex items-center justify-center mb-4 shadow-inner">
            {step.icon}
          </div>

          <h3 className="text-lg font-black text-slate-100 mb-1">
            {step.title}
          </h3>
          <p className="text-xs font-bold text-indigo-400 mb-4">
            {step.subtitle}
          </p>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 text-left">
            {step.description}
          </p>
        </div>

        {/* ページインジケーター & ボタン */}
        <div className="pt-6 border-t border-slate-700/60 flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-700 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1"
            >
              {currentStep === STEPS.length - 1 ? '準備完了！遊ぶ 🚀' : '次へ'}
              {currentStep < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
