import React from 'react';
import { ShieldCheck, X, Flame, Sparkles, Clock, ArrowRight, Bell } from 'lucide-react';
import { User } from '../types';
import { vibrateLight } from '../services/haptics';

interface StreakFreezeAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  streakCount?: number;
  onOpenNotifications?: () => void;
  onOpenChallenges?: () => void;
}

export const StreakFreezeAlertModal: React.FC<StreakFreezeAlertModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  streakCount,
  onOpenNotifications,
  onOpenChallenges,
}) => {
  if (!isOpen) return null;

  const effectiveStreak = streakCount ?? currentUser.currentStreak ?? 1;
  const freezesLeft = currentUser.streakFreezes ?? 0;

  // Format today's date nicely
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleDismiss = () => {
    vibrateLight();
    onClose();
  };

  return (
    <div
      id="streak-freeze-alert-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={handleDismiss}
    >
      <div
        id="streak-freeze-alert-card"
        className="bg-[#0A0A0A] border border-cyan-500/30 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl shadow-cyan-950/40 flex flex-col relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Top Ambient Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-300" />

        {/* Close Button */}
        <button
          id="streak-freeze-close-btn"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10 min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Close Streak Freeze notification alert"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 flex flex-col items-center text-center space-y-4">
          {/* Animated Frost Shield Icon */}
          <div className="relative mt-2">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-transparent border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-4xl select-none animate-bounce duration-1000">❄️</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-cyan-400 border-2 border-[#0A0A0A] flex items-center justify-center text-black shadow-md">
              <ShieldCheck className="w-4 h-4 text-black stroke-[3]" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Streak Freeze Active</span>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Streak Protected for Today!
            </h2>
            <p className="text-sm font-medium text-cyan-200/90">
              {todayFormatted} • Shield Deployed
            </p>
          </div>

          {/* Clarification & Message */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-left space-y-3 w-full">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                <Flame className="w-4 h-4 fill-blue-400 text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white leading-snug">
                  Your <span className="text-cyan-300 font-black">{effectiveStreak}-Day Streak</span> is 100% safe.
                </p>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Your streak freeze has absorbed today's required proof. Your records and leaderboard positions remain untouched.
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-amber-300">
                  Return Tomorrow to Keep Momentum
                </p>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Take today to rest and recharge. Make sure to return tomorrow to log your daily proof and keep your fire burning! 🔥
                </p>
              </div>
            </div>
          </div>

          {/* Token balance summary */}
          <div className="flex items-center justify-between w-full px-2 text-xs text-white/50">
            <span>Freezes remaining: <strong className="text-white">{freezesLeft}</strong></span>
            <span className="text-cyan-400 font-semibold">Protected until midnight</span>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2 pt-2">
            <button
              id="streak-freeze-confirm-btn"
              onClick={handleDismiss}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black font-black text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 active:scale-[0.98] min-h-[48px]"
            >
              <span>Got it, I'll return tomorrow!</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {onOpenNotifications && (
              <button
                id="streak-freeze-notifs-btn"
                onClick={() => {
                  onClose();
                  onOpenNotifications();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>View in Notifications</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
