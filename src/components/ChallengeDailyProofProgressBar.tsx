import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowRight,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { DailyStorageService } from '../services/storage';
import { vibrateLight } from '../services/haptics';

/**
 * Design tokens for this component (and the rest of the app going forward):
 *
 *   Base:      black / white only. No gold, amber, emerald, or gradients.
 *   Accent:    one signal blue (#2F6FED) — reserved for "active" / "needs
 *              your attention" / "verified". Everything structural stays
 *              grayscale so the blue keeps its meaning.
 *   Dark mode: bg-black, surfaces bg-white/[0.03]-[0.05], borders white/10.
 *   Light mode: bg-white, surfaces black/[0.02]-[0.04], borders black/10.
 *
 * Toggle dark mode by adding/removing a `dark` class on <html> — this file
 * assumes Tailwind's class-based dark variant. If index.css doesn't have it
 * yet, add: `@custom-variant dark (&:where(.dark, .dark *));`
 */

interface ChallengeDailyProofProgressBarProps {
  challengeId: string;
  teamId?: string;
  compact?: boolean;
  onOpenSubmitProof?: (challengeId: string) => void;
  onOpenGroupChat?: (groupId: string) => void;
  onOpenChallenge?: (challengeId: string) => void;
}

export const ChallengeDailyProofProgressBar: React.FC<ChallengeDailyProofProgressBarProps> = ({
  challengeId,
  teamId,
  compact = false,
  onOpenSubmitProof,
  onOpenGroupChat,
  onOpenChallenge,
}) => {
  const stats = DailyStorageService.getChallengeTodayProofStats(challengeId, teamId);
  const challenge = DailyStorageService.getChallengeById(challengeId);

  if (!challenge || stats.totalMembers === 0) {
    return null;
  }

  const resolvedTeamId = teamId || (challenge.teams?.find((t) => t.name === stats.teamName)?.id);
  const squadGroupId = resolvedTeamId ? `group_squad_${challenge.id}_${resolvedTeamId}` : undefined;

  const handleUrgeTeammates = () => {
    vibrateLight();
    if (squadGroupId && onOpenGroupChat) {
      onOpenGroupChat(squadGroupId);
    } else if (onOpenChallenge) {
      onOpenChallenge(challengeId);
    }
  };

  const handleSubmitProof = () => {
    vibrateLight();
    if (onOpenSubmitProof) {
      onOpenSubmitProof(challengeId);
    } else if (onOpenChallenge) {
      onOpenChallenge(challengeId);
    }
  };

  // Compact inline version (for challenge cards in lists)
  if (compact) {
    return (
      <div
        id={`group-daily-proof-compact-${challengeId}`}
        className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 space-y-2.5"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED]" />
            <span className="font-semibold text-black dark:text-white truncate">
              {stats.teamName ? `${stats.teamName} squad` : 'Group daily proof'}
            </span>
          </div>
          <span className="font-mono text-xs text-black/60 dark:text-white/60 shrink-0">
            {stats.submittedCount} / {stats.totalMembers} · {stats.percentage}%
          </span>
        </div>

        <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2F6FED] transition-all duration-500"
            style={{ width: `${Math.max(6, stats.percentage)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <div className="flex items-center gap-1.5 text-black/60 dark:text-white/60">
            {stats.allSubmitted ? (
              <span className="font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Everyone's in today</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{stats.totalMembers - stats.submittedCount} still pending</span>
              </span>
            )}
          </div>

          <div className="flex -space-x-1.5 overflow-hidden">
            {stats.submittedMembers.map((m) => (
              <img
                key={m.userId}
                src={m.userAvatar}
                alt={m.userName}
                title={`${m.userName}: submitted`}
                className="w-5 h-5 rounded-full border-2 border-white dark:border-black object-cover"
                referrerPolicy="no-referrer"
              />
            ))}
            {stats.pendingMembers.map((m) => (
              <img
                key={m.userId}
                src={m.userAvatar}
                alt={m.userName}
                title={`${m.userName}: pending`}
                className="w-5 h-5 rounded-full border-2 border-white dark:border-black object-cover opacity-40"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Full featured banner (Challenge Screen header / Active Challenge section)
  return (
    <div
      id={`active-challenge-proof-tracker-${challengeId}`}
      className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-3xl p-4 sm:p-5 space-y-4"
    >
      {/* Top row: challenge context & urgency */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-lg shrink-0">
            {challenge.icon || '🎯'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-black/50 dark:text-white/50">
                Active challenge
              </span>
              {stats.teamName && (
                <span className="text-[11px] font-medium text-[#2F6FED] bg-[#2F6FED]/10 px-2 py-0.5 rounded-full">
                  {stats.teamName} squad
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-black dark:text-white truncate mt-0.5">
              {challenge.title}
            </h3>
          </div>
        </div>

        {/* Urgency badge — blue only when action is needed, quiet otherwise */}
        <div className="self-start sm:self-auto">
          {stats.allSubmitted ? (
            <div className="px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-black/70 dark:text-white/70 text-xs font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Everyone's locked in</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-[#2F6FED]/10 text-[#2F6FED] text-xs font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {stats.totalMembers - stats.submittedCount} pending before midnight
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main progress card */}
      <div className="space-y-2 bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 rounded-2xl p-3.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-black/50 dark:text-white/50" />
            <span className="font-semibold text-black dark:text-white">Daily proof</span>
          </div>
          <div className="font-mono text-xs">
            <span className="text-black dark:text-white font-semibold">{stats.submittedCount}</span>
            <span className="text-black/40 dark:text-white/40"> / {stats.totalMembers}</span>{' '}
            <span className="text-[#2F6FED]">({stats.percentage}%)</span>
          </div>
        </div>

        <div className="relative h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#2F6FED] transition-all duration-700 ease-out"
            style={{ width: `${Math.max(4, stats.percentage)}%` }}
          />
        </div>

        <p className="text-[11px] text-black/50 dark:text-white/50 leading-relaxed">
          {stats.allSubmitted
            ? "Every squad member submitted their photo proof today."
            : 'All members need to submit a daily photo proof to protect the squad streak.'}
        </p>
      </div>

      {/* Member roster */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-black/50 dark:text-white/50">
          Today's submissions
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {stats.submittedMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={member.userAvatar}
                    alt={member.userName}
                    className="w-7 h-7 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6FED] bg-white dark:bg-black rounded-full absolute -bottom-1 -right-1" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-black dark:text-white truncate text-xs">{member.userName}</p>
                  <p className="text-[10px] text-black/40 dark:text-white/40">
                    {member.timeAgo}
                  </p>
                </div>
              </div>

              {member.imageUrl && (
                <img
                  src={member.imageUrl}
                  alt="Proof preview"
                  className="w-8 h-8 rounded-lg object-cover shrink-0 ml-2"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          ))}

          {stats.pendingMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={member.userAvatar}
                    alt={member.userName}
                    className="w-7 h-7 rounded-full object-cover opacity-50"
                    referrerPolicy="no-referrer"
                  />
                  <Clock className="w-3.5 h-3.5 text-black/40 dark:text-white/40 bg-white dark:bg-black rounded-full absolute -bottom-1 -right-1" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-black/60 dark:text-white/60 truncate text-xs">{member.userName}</p>
                  <p className="text-[10px] text-black/35 dark:text-white/35">Pending</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action footer */}
      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
        {!stats.hasCurrentUserSubmitted ? (
          <button
            onClick={handleSubmitProof}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2F6FED] hover:bg-[#2861d6] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
          >
            <Camera className="w-4 h-4" />
            <span>Submit your proof</span>
          </button>
        ) : !stats.allSubmitted ? (
          <button
            onClick={handleUrgeTeammates}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2F6FED]/10 hover:bg-[#2F6FED]/15 text-[#2F6FED] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[40px]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Nudge teammates</span>
          </button>
        ) : (
          <div className="flex-1 py-2 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-black/70 dark:text-white/70 font-medium text-xs flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Squad fully verified today</span>
          </div>
        )}

        {onOpenChallenge && (
          <button
            onClick={() => {
              vibrateLight();
              onOpenChallenge(challengeId);
            }}
            className="py-2.5 px-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-black/70 dark:text-white/70 font-medium text-xs transition-colors flex items-center gap-1 min-h-[40px]"
          >
            <span>Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};