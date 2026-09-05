import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Info,
  X,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { StreakFreezeAlertModal } from './StreakFreezeAlertModal';

interface StreakFreezeCardProps {
  currentUser: User;
  onUserUpdated?: (updatedUser: User) => void;
  onOpenNotifications?: () => void;
}

export const StreakFreezeCard: React.FC<StreakFreezeCardProps> = ({
  currentUser,
  onUserUpdated,
  onOpenNotifications,
}) => {
  const [showFreezeExplainer, setShowFreezeExplainer] = useState(false);
  const [showFreezeAlertModal, setShowFreezeAlertModal] = useState(false);

  const today = getTodayDateString();
  const isProtectedToday = currentUser.lastStreakFreezeUsedDate === today;

  const freezeStatus = DailyStorageService.getStreakFreezeStatus();

  const handleToggleFreezeEquip = () => {
    vibrateLight();
    const result = DailyStorageService.toggleEquipStreakFreeze();
    if (onUserUpdated) {
      onUserUpdated(result.user);
    }
  };

  const handleUseStreakFreeze = () => {
    vibrateStreakMilestone();
    const result = DailyStorageService.useStreakFreeze('Protected by User Action');
    if (result.success) {
      if (onUserUpdated) {
        onUserUpdated(result.user);
      }
      setShowFreezeAlertModal(true);
    }
  };

  const handleClaimDemoFreeze = () => {
    vibrateStreakMilestone();
    const { user } = DailyStorageService.claimChallengeStreakFreeze(
      'ch_profile',
      'Daily Practice Consistency'
    );
    if (onUserUpdated) {
      onUserUpdated(user);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-[28px] p-4 sm:p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Streak Freeze Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <span className="text-2xl select-none">❄️</span>
            </div>
            {freezeStatus.isActive && freezeStatus.freezesAvailable > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-black flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">Streak Freeze Shield</h3>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  freezeStatus.isActive && freezeStatus.freezesAvailable > 0
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}
              >
                {freezeStatus.freezesAvailable} Available
              </span>
            </div>
            <p className="text-xs text-white/50 truncate sm:whitespace-normal">
              {isProtectedToday
                ? 'Protected today • Streak safely guarded'
                : freezeStatus.isActive && freezeStatus.freezesAvailable > 0
                ? 'Active • Protects streak for 1 missed day'
                : 'Protects your streak if you miss a day'}
            </p>
          </div>
        </div>

        {/* Freeze Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isProtectedToday ? (
            <button
              onClick={() => {
                vibrateLight();
                setShowFreezeAlertModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 active:scale-95"
              title="Click to view your protected streak alert"
            >
              <span>❄️ Protected Today</span>
            </button>
          ) : freezeStatus.freezesAvailable > 0 ? (
            <>
              <button
                onClick={handleUseStreakFreeze}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black transition-all shadow-md shadow-cyan-500/25 flex items-center gap-1 active:scale-95"
                title="Use a Streak Freeze to protect today's streak"
              >
                <span>❄️ Use Freeze</span>
              </button>
              <button
                onClick={handleToggleFreezeEquip}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  freezeStatus.isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                }`}
              >
                {freezeStatus.isActive ? 'Equipped' : 'Auto-Equip'}
              </button>
            </>
          ) : (
            <button
              onClick={handleClaimDemoFreeze}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
              title="Claim Streak Freeze"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Claim +1 Freeze</span>
            </button>
          )}

          <button
            onClick={() => setShowFreezeExplainer(true)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="How Streak Freezes work"
            aria-label="How Streak Freezes work"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* EXPLAINER MODAL */}
      {showFreezeExplainer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowFreezeExplainer(false)}
        >
          <div
            className="bg-[#0A0A0A] border border-cyan-500/30 w-full max-w-sm rounded-3xl p-5 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-cyan-300">
                <span className="text-xl">❄️</span>
                <h4 className="text-sm font-black">How Streak Freezes Work</h4>
              </div>
              <button
                onClick={() => setShowFreezeExplainer(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-white/70">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Automatic Protection:</strong> When equipped, your streak freeze automatically activates if a day passes without a logged proof.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Peace of Mind:</strong> Keeps your day counter, momentum, and unbroken records safe while you rest or travel.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Earning Freezes:</strong> Maintain consistent activity across challenges and community goals to earn additional freezes.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFreezeExplainer(false)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ALERT MODAL (ACTIVE PROTECTION VIEW) */}
      <StreakFreezeAlertModal
        isOpen={showFreezeAlertModal}
        onClose={() => setShowFreezeAlertModal(false)}
        currentUser={currentUser}
        streakCount={currentUser.currentStreak}
        onOpenNotifications={onOpenNotifications}
      />
    </div>
  );
};
