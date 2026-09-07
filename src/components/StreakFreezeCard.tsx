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
    <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all p-4 sm:p-5 shadow-md ${
      isProtectedToday
        ? 'bg-sky-500/10 dark:bg-sky-950/30 border-sky-500/40 text-slate-900 dark:text-white'
        : 'bg-white dark:bg-[#0E131F] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white'
    }`}>
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Left: Icon & Status Text */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isProtectedToday
                ? 'bg-sky-500/20 dark:bg-sky-500/30 border border-sky-400/50 text-sky-600 dark:text-sky-300'
                : isEquipped
                ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
                : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40'
            }`}>
              <Snowflake className={`w-5 h-5 ${isEquipped || isProtectedToday ? 'text-sky-600 dark:text-sky-300' : 'text-slate-400 dark:text-white/40'}`} />
            </div>

            {isEquipped && !isProtectedToday && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Streak Freeze Shield</span>
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${
                  isProtectedToday
                    ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400/40'
                    : isEquipped
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 border-slate-200 dark:border-white/10'
                }`}
              >
                <Shield className="w-3 h-3" />
                {isProtectedToday ? 'Protected Today' : `${freezeStatus.freezesAvailable} Available`}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-white/60 mt-0.5 leading-snug">
              {isProtectedToday
                ? 'Shield is actively guarding your streak from resetting today.'
                : isEquipped
                ? 'Auto-backup equipped • Will protect your streak if you miss a day.'
                : 'Keep your streak momentum intact when taking rest or travel days.'}
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
              className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="View protection status"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protected</span>
            </button>
          ) : hasFreezes ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUseStreakFreeze}
                className="px-3.5 py-2 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                title="Consume 1 freeze now for today"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Use Shield</span>
              </button>

              <button
                onClick={handleToggleFreezeEquip}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                  freezeStatus.isActive
                    ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-400/40 hover:bg-sky-500/20'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={freezeStatus.isActive ? 'Equipped for auto-use' : 'Click to equip for automatic backup'}
              >
                {freezeStatus.isActive ? '✓ Auto-On' : 'Auto-Equip'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleClaimDemoFreeze}
              className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 border border-sky-300 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Claim complimentary streak freeze"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Claim +1 Shield</span>
            </button>
          )}

          <button
            onClick={() => {
              vibrateLight();
              setShowFreezeExplainer(true);
            }}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowFreezeExplainer(false)}
        >
          <div
            className="bg-white dark:bg-[#0F1420] border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-3xl p-5 text-slate-900 dark:text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Snowflake className="w-5 h-5" />
                <h4 className="text-sm font-bold">How Streak Freezes Work</h4>
              </div>
              <button
                onClick={() => setShowFreezeExplainer(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-white/70">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Automatic Protection:</strong> When equipped, your streak freeze automatically engages if midnight passes without a logged proof.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Momentum Keeper:</strong> Protects your unbroken daily streak records while taking a rest day or traveling.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02]">
                <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-white">Replenish Shields:</strong> Earn additional shields by completing challenge sprints and group milestones.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFreezeExplainer(false)}
              className="w-full py-2.5 bg-[#2F6FED] hover:bg-[#255bd1] text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
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
