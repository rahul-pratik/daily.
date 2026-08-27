import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Flame, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { vibrateStreakCelebration } from '../services/haptics';

interface StreakCelebrationModalProps {
  isOpen: boolean;
  streakCount: number;
  isNewStreakDay: boolean;
  onClose: () => void;
}

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  isOpen,
  streakCount,
  isNewStreakDay,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Tactile haptic vibration for streak celebration
      vibrateStreakCelebration();

      // Fire vibrant confetti bursts
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF5722', '#FF9800', '#FFC107', '#FFFFFF'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#FF5722', '#FF9800', '#FFC107'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#FF5722', '#FF9800', '#FFC107'],
          });
        }, 250);
      } catch (err) {
        console.error('Confetti error:', err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-[32px] p-6 shadow-2xl text-center relative overflow-hidden">
        {/* Ambient glow in background */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#FF4D00]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Big Animated Flame */}
        <div className="relative inline-flex items-center justify-center my-4">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 p-1 flex items-center justify-center shadow-xl">
            <Flame className="w-10 h-10 text-[#FF4D00] fill-[#FF4D00] animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="relative inline-flex rounded-full h-5 w-5 bg-[#FF4D00] items-center justify-center text-black font-black text-[10px]">
              ★
            </span>
          </span>
        </div>

        {/* Milestone Title */}
        <h2 className="text-xl font-black text-white tracking-tight">
          🔥 {streakCount}-Day Streak Active!
        </h2>

        <p className="text-xs text-white/60 mt-2 leading-relaxed px-2">
          {isNewStreakDay
            ? 'You logged today’s update on Daily. Your discipline is paying off!'
            : 'You posted another update today. Keep inspiring the community!'}
        </p>

        {/* Streak summary pill */}
        <div className="my-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-around">
          <div className="text-center">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block font-bold">
              Today
            </span>
            <span className="text-xs font-bold text-white flex items-center justify-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4D00]" /> Done
            </span>
          </div>
          <div className="h-7 w-[1px] bg-white/10" />
          <div className="text-center">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block font-bold">
              Current Streak
            </span>
            <span className="text-xs font-bold text-[#FF4D00] flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-3.5 h-3.5 fill-[#FF4D00]" /> {streakCount} Days
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-[#FF4D00] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FF4D00]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#FF4D00]/20"
        >
          <span>Awesome, Keep Going</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
