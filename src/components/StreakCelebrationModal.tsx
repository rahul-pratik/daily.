import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, ArrowRight, Award } from 'lucide-react';
import { vibrateStreakCelebration } from '../services/haptics';

interface StreakCelebrationModalProps {
  isOpen: boolean;
  streakCount?: number;
  isNewStreakDay?: boolean;
  onClose: () => void;
}

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Tactile haptic vibration for post celebration
      vibrateStreakCelebration();

      // Fire vibrant confetti bursts
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2F6FED', '#38BDF8', '#4ADE80', '#F59E0B', '#FFFFFF'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 45,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#2F6FED', '#38BDF8', '#FFFFFF'],
          });
          confetti({
            particleCount: 45,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#2F6FED', '#38BDF8', '#FFFFFF'],
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
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#2F6FED]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Celebratory Icon */}
        <div className="relative inline-flex items-center justify-center my-4">
          <div className="w-20 h-20 rounded-full bg-[#2F6FED]/10 border border-[#2F6FED]/30 p-1 flex items-center justify-center shadow-xl">
            <Sparkles className="w-10 h-10 text-[#2F6FED] animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="relative inline-flex rounded-full h-5 w-5 bg-[#2F6FED] items-center justify-center text-white font-black text-[10px] shadow-sm">
              ★
            </span>
          </span>
        </div>

        {/* Milestone Title */}
        <h2 className="text-xl font-black text-white tracking-tight">
          Nice Post !! Great Proofs!!
        </h2>

        <p className="text-xs text-white/60 mt-2 leading-relaxed px-2">
          Your daily proof is now live. Keep inspiring the community with your authentic progress!
        </p>

        {/* Proof summary pill (no streak count) */}
        <div className="my-5 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-around">
          <div className="text-center">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block font-bold">
              Today
            </span>
            <span className="text-xs font-bold text-white flex items-center justify-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6FED]" /> Done
            </span>
          </div>
          <div className="h-7 w-[1px] bg-white/10" />
          <div className="text-center">
            <span className="text-[10px] text-white/40 uppercase tracking-wider block font-bold">
              Daily Proof
            </span>
            <span className="text-xs font-bold text-[#2F6FED] flex items-center justify-center gap-1 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2F6FED]" /> Published
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-[#2F6FED] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#2F6FED]/90 active:scale-[0.98] transition-all shadow-lg shadow-[#2F6FED]/20 cursor-pointer"
        >
          <span>Awesome, Keep Going</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
