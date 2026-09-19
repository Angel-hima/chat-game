import React from 'react';
import { ReactionStamp } from '../types';

interface StampOverlayProps {
  stamps: ReactionStamp[];
}

export const StampOverlay: React.FC<StampOverlayProps> = ({ stamps }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {stamps.map((stamp, index) => {
        // スタンプごとに左右の散らばりを算出
        const leftPercent = 15 + ((stamp.timestamp * (index + 1) * 37) % 70);
        return (
          <div
            key={stamp.id}
            style={{ left: `${leftPercent}%`, bottom: '10%' }}
            className="absolute animate-float-up flex flex-col items-center select-none"
          >
            <span className="text-4xl filter drop-shadow-lg transform hover:scale-125 transition">
              {stamp.emoji}
            </span>
            <span className="bg-slate-900/90 text-yellow-300 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-500/40 shadow-lg mt-1 whitespace-nowrap">
              {stamp.senderName}: {stamp.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};
