import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Award,
  Crown,
  Sunrise,
  Trophy,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
  ChevronRight,
  X,
} from 'lucide-react';
import { User } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { StreakFreezeAlertModal } from './StreakFreezeAlertModal';

interface ChallengeStreakFreezeBadgesCardProps {
  currentUser: User;
  onUserUpdated?: (updatedUser: User) => void;
  onNavigateToGroupChallenges?: () => void;
  onOpenNotifications?: () => void;
}

interface BadgeDef {
  id: string;
  name: string;
  icon: string;
  category: 'Engagement' | 'Consistency' | 'Punctuality' | 'Milestone';
  description: string;
  criteria: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export const ChallengeStreakFreezeBadgesCard: React.FC<ChallengeStreakFreezeBadgesCardProps> = ({
  currentUser,
  onUserUpdated,
  onNavigateToGroupChallenges,
  onOpenNotifications,
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);
  const [showFreezeExplainer, setShowFreezeExplainer] = useState(false);
  const [showFreezeAlertModal, setShowFreezeAlertModal] = useState(false);

  const today = getTodayDateString();
  const isProtectedToday = currentUser.lastStreakFreezeUsedDate === today;

  const freezeStatus = DailyStorageService.getStreakFreezeStatus();
  const userBadges = currentUser.challengeBadges || freezeStatus.badges;

  const BADGES_CATALOG: BadgeDef[] = [
    {
      id: 'early_bird',
      name: 'Early Bird',
      icon: '🌅',
      category: 'Punctuality',
      description: 'Awarded for locking in your challenge proof receipt before 9:00 AM.',
      criteria: 'Submit any challenge check-in before 9:00 AM.',
      unlocked: userBadges.includes('Early Bird'),
      unlockedAt: 'Unlocked',
    },
    {
      id: 'consistency_king',
      name: 'Consistency King',
      icon: '👑',
      category: 'Consistency',
      description: 'Awarded for completing 7 consecutive check-ins within a group challenge.',
      criteria: 'Achieve a 7-day streak in any group or solo challenge.',
      unlocked: userBadges.includes('Consistency King'),
      unlockedAt: 'Unlocked',
    },
    {
      id: 'squad_mvp',
      name: 'Squad MVP',
      icon: '⚔️',
      category: 'Engagement',
      description: 'Named top contributor in the weekly collective challenge recap.',
      criteria: 'Log the most verified receipts for your squad in a week.',
      unlocked: userBadges.includes('Squad MVP') || userBadges.includes('MVP Contributor'),
      unlockedAt: 'Unlocked',
    },
    {
      id: 'iron_anchor',
      name: 'Iron Anchor',
      icon: '🛡️',
      category: 'Milestone',
      description: 'Master of discipline with 10+ consecutive verified photo receipts.',
      criteria: 'Reach Day 10 in any challenge cohort.',
      unlocked: userBadges.includes('Iron Anchor') || (currentUser.currentStreak >= 10),
      unlockedAt: currentUser.currentStreak >= 10 ? 'Unlocked' : undefined,
    },
  ];

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
      'ch_demo',
      'High Engagement in Squad Challenge'
    );
    if (onUserUpdated) {
      onUserUpdated(user);
    }
  };

  return (
    <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Top row: Streak Freeze Status & Badges Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        {/* Streak Freeze Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <span className="text-xl">❄️</span>
            </div>
            {freezeStatus.isActive && freezeStatus.freezesAvailable > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-black flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
              </span>
            )}
          </div>

          <div>
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
            <p className="text-xs text-white/50">
              {freezeStatus.isActive && freezeStatus.freezesAvailable > 0
                ? 'Active • Protects streak for 1 missed day'
                : 'Earn freezes via high engagement in group challenges'}
            </p>
          </div>
        </div>

        {/* Freeze Controls & Info */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isProtectedToday ? (
            <button
              onClick={() => {
                vibrateLight();
                setShowFreezeAlertModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm shadow-cyan-500/20"
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
                <span>❄️ Use Streak Freeze</span>
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
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all flex items-center gap-1"
              title="Claim Challenge Streak Freeze"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Claim +1 Freeze</span>
            </button>
          )}

          <button
            onClick={() => setShowFreezeExplainer(true)}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
            title="How Streak Freezes work"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Challenge Badges Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Challenge Digital Badges
            </h4>
          </div>
          <span className="text-[10px] font-mono text-white/40">
            {BADGES_CATALOG.filter((b) => b.unlocked).length}/{BADGES_CATALOG.length} Unlocked
          </span>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BADGES_CATALOG.map((badge) => (
            <button
              key={badge.id}
              onClick={() => {
                vibrateLight();
                setSelectedBadge(badge);
              }}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                badge.unlocked
                  ? 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-[#D4AF37]/50'
                  : 'bg-black/30 border-white/5 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl filter drop-shadow-md">{badge.icon}</span>
                {badge.unlocked ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-white/30 shrink-0" />
                )}
              </div>

              <div className="space-y-0.5">
                <span className="font-bold text-xs text-white block truncate">
                  {badge.name}
                </span>
                <span className="text-[10px] text-white/40 block truncate">
                  {badge.unlocked ? 'Unlocked' : badge.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* BADGE DETAIL POPUP MODAL */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="w-full max-w-sm bg-[#0E0E0E] border border-white/15 rounded-3xl p-5 shadow-2xl text-white space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-3xl mx-auto shadow-xl">
              {selectedBadge.icon}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full border border-[#D4AF37]/20">
                {selectedBadge.category} Badge
              </span>
              <h4 className="text-base font-black text-white pt-1">{selectedBadge.name}</h4>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                {selectedBadge.description}
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-left space-y-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                How to Unlock
              </span>
              <p className="text-xs text-white/90 font-medium">
                {selectedBadge.criteria}
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STREAK FREEZE EXPLAINER MODAL */}
      {showFreezeExplainer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowFreezeExplainer(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0E0E0E] border border-cyan-500/30 rounded-3xl p-5 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xl">❄️</span>
                <h4 className="text-sm font-black text-white">How Streak Freeze Works</h4>
              </div>
              <button
                onClick={() => setShowFreezeExplainer(false)}
                className="p-1.5 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-white/80 leading-relaxed font-sans">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">1-Day Streak Protection:</strong> If you miss a daily check-in, an equipped Streak Freeze activates automatically so your streak counter doesn't reset to zero.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Earn via Group Challenges:</strong> High engagement in group challenges (e.g. Day 5 receipts, MVP contributor) awards new Streak Freezes to your inventory.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Sunrise className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-white">Early Birds & Consistency:</strong> Submitting receipts before 9:00 AM or maintaining 7 days unlocks prestigious digital challenge badges.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowFreezeExplainer(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-colors"
              >
                Got It!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streak Freeze Used Notification Alert Modal */}
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
