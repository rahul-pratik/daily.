import React, { useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Info,
  X,
  CheckCircle2,
  Snowflake,
  Shield,
  Zap,
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

  const hasFreezes = freezeStatus.freezesAvailable > 0;
  const isEquipped = freezeStatus.isActive && hasFreezes;

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-cyan-500/25 bg-gradient-to-br from-[#0A1420]/90 via-[#060D17]/85 to-black/90 p-4 sm:p-5 shadow-2xl backdrop-blur-xl">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-500/10 blur-2xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Left: Icon & Status Text */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
              isProtectedToday
                ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-cyan-500/25'
                : isEquipped
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 shadow-cyan-500/15'
                : 'bg-white/5 border border-white/10 text-white/40'
            }`}>
              <Snowflake className={`w-6 h-6 ${isEquipped || isProtectedToday ? 'animate-pulse text-cyan-300' : 'text-white/40'}`} />
            </div>

            {isEquipped && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400 border border-black" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Streak Freeze Shield</span>
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider border ${
                  isProtectedToday
                    ? 'bg-cyan-400/20 text-cyan-200 border-cyan-400/50 shadow-sm'
                    : isEquipped
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-white/50 border-white/10'
                }`}
              >
                <Shield className="w-2.5 h-2.5" />
                {freezeStatus.freezesAvailable} {freezeStatus.freezesAvailable === 1 ? 'Shield' : 'Shields'}
              </span>
            </div>

            <p className="text-xs text-white/60 mt-0.5 leading-tight">
              {isProtectedToday
                ? 'Protected today • Streak safely guarded against drops'
                : isEquipped
                ? 'Active defense • Protects streak automatically if 1 day is missed'
                : 'Safeguard your progress if you ever need an off-day'}
            </p>
          </div>
        </div>

        {/* Right: Interactive Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {isProtectedToday ? (
            <button
              onClick={() => {
                vibrateLight();
                setShowFreezeAlertModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/35 text-cyan-200 border border-cyan-400/50 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95"
              title="View protection status"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
              <span>Protected Today</span>
            </button>
          ) : hasFreezes ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUseStreakFreeze}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-black text-xs font-black transition-all shadow-md shadow-cyan-500/25 flex items-center gap-1.5 active:scale-95"
                title="Consume 1 freeze now for today"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>Use Now</span>
              </button>

              <button
                onClick={handleToggleFreezeEquip}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  freezeStatus.isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                }`}
                title={freezeStatus.isActive ? 'Equipped for auto-use' : 'Click to equip for automatic backup'}
              >
                {freezeStatus.isActive ? '✓ Equipped' : 'Auto-Equip'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleClaimDemoFreeze}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Claim complimentary streak freeze"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Claim +1 Freeze</span>
            </button>
          )}

          <button
            onClick={() => {
              vibrateLight();
              setShowFreezeExplainer(true);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white border border-white/10 transition-colors"
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
            className="bg-[#0A0E17] border border-cyan-500/30 w-full max-w-sm rounded-[28px] p-5 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2 text-cyan-300">
                <Snowflake className="w-5 h-5 text-cyan-400" />
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
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Automatic Protection:</strong> When equipped, your streak freeze automatically engages if midnight passes without a logged proof.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Momentum Keeper:</strong> Protects your unbroken daily streak records while taking a rest day or traveling.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/[0.02]">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Replenish Shields:</strong> Earn additional shields by completing challenge sprints and group milestones.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFreezeExplainer(false)}
              className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ALERT MODAL */}
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
