import React from 'react';
import {
  Users,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { DailyStorageService } from '../services/storage';
import { vibrateLight } from '../services/haptics';

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

  // Find squad group ID if user wants to urge teammates in chat
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
        className="p-3 rounded-2xl bg-[#141414] border border-amber-500/25 space-y-2.5"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-black text-amber-300 truncate">
              {stats.teamName ? `${stats.teamName} Squad Proofs` : 'Group Daily Proofs'}
            </span>
          </div>
          <span className="font-mono text-xs font-black text-white shrink-0">
            {stats.submittedCount} of {stats.totalMembers} verified{' '}
            <span className="text-[#D4AF37]">({stats.percentage}%)</span>
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden p-0.5 relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.allSubmitted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                : 'bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-300'
            }`}
            style={{ width: `${Math.max(8, stats.percentage)}%` }}
          />
        </div>

        {/* Status Callout & Avatars */}
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <div className="flex items-center gap-2 text-white/60">
            {stats.allSubmitted ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All members locked in today!</span>
              </span>
            ) : (
              <span className="text-amber-400/90 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {stats.totalMembers - stats.submittedCount} member(s) pending before midnight
                </span>
              </span>
            )}
          </div>

          <div className="flex -space-x-1.5 overflow-hidden">
            {stats.submittedMembers.map((m) => (
              <img
                key={m.userId}
                src={m.userAvatar}
                alt={m.userName}
                title={`${m.userName}: Submitted`}
                className="w-5 h-5 rounded-full border border-emerald-500 object-cover"
                referrerPolicy="no-referrer"
              />
            ))}
            {stats.pendingMembers.map((m) => (
              <img
                key={m.userId}
                src={m.userAvatar}
                alt={m.userName}
                title={`${m.userName}: Pending proof`}
                className="w-5 h-5 rounded-full border border-amber-500/60 opacity-50 object-cover"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Full Featured Banner (for Challenge Screen header / Active Challenge Section)
  return (
    <div
      id={`active-challenge-proof-tracker-${challengeId}`}
      className="bg-gradient-to-b from-[#16130B] to-[#0D0D0D] border-2 border-[#D4AF37]/30 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-[#D4AF37]/10 blur-3xl pointer-events-none -z-0" />

      {/* Top Row: Challenge context & Urgency Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-xl shrink-0">
            {challenge.icon || '⚔️'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/25">
                Active Group Challenge
              </span>
              {stats.teamName && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {stats.teamName} Squad
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-black text-white truncate mt-0.5">
              {challenge.title}
            </h3>
          </div>
        </div>

        {/* Urgency Badge */}
        <div className="self-start sm:self-auto">
          {stats.allSubmitted ? (
            <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Locked In • Safe</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 animate-pulse shadow-sm shadow-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {stats.totalMembers - stats.submittedCount} Pending • Submit Before Midnight
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Visual Progress Bar */}
      <div className="space-y-2 bg-black/40 border border-white/10 rounded-2xl p-3.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            <span className="font-black text-white">Daily Proof Accountability</span>
          </div>
          <div className="font-mono text-xs font-black">
            <span className="text-white">{stats.submittedCount}</span>
            <span className="text-white/40"> / {stats.totalMembers} members</span>{' '}
            <span className="text-[#D4AF37]">({stats.percentage}%)</span>
          </div>
        </div>

        {/* The Visual Progress Bar Container */}
        <div className="relative h-3.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              stats.allSubmitted
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-md shadow-emerald-500/40'
                : 'bg-gradient-to-r from-amber-500 via-[#D4AF37] to-amber-300 shadow-md shadow-[#D4AF37]/30'
            }`}
            style={{ width: `${Math.max(6, stats.percentage)}%` }}
          />

          {/* Member Milestones Markers */}
          {Array.from({ length: stats.totalMembers - 1 }).map((_, i) => {
            const pos = ((i + 1) / stats.totalMembers) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-0.5 bg-black/60"
                style={{ left: `${pos}%` }}
              />
            );
          })}
        </div>

        {/* Urgency Explanation Text */}
        <p className="text-[11px] text-white/60 leading-relaxed flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {stats.allSubmitted
              ? 'Amazing discipline! Every squad member submitted their photo proof for today.'
              : 'Collective Rule: All group members must submit their daily photo proof to protect the squad streak multiplier!'}
          </span>
        </p>
      </div>

      {/* Member Roster & Today's Proof Status */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center justify-between">
          <span>Squad Submissions Today</span>
          <span className="text-[10px] text-white/40 lowercase">verified via photo receipts</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Submitted Members */}
          {stats.submittedMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={member.userAvatar}
                    alt={member.userName}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-400/40"
                    referrerPolicy="no-referrer"
                  />
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 bg-black rounded-full absolute -bottom-1 -right-1" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate text-xs">{member.userName}</p>
                  <p className="text-[10px] text-emerald-300 font-medium">
                    Verified {member.timeAgo}
                  </p>
                </div>
              </div>

              {member.imageUrl && (
                <img
                  src={member.imageUrl}
                  alt="Proof preview"
                  className="w-8 h-8 rounded-lg object-cover border border-white/10 shrink-0 ml-2 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          ))}

          {/* Pending Members */}
          {stats.pendingMembers.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={member.userAvatar}
                    alt={member.userName}
                    className="w-7 h-7 rounded-full object-cover border border-amber-500/40 opacity-70"
                    referrerPolicy="no-referrer"
                  />
                  <Clock className="w-3.5 h-3.5 text-amber-400 bg-black rounded-full absolute -bottom-1 -right-1 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white/90 truncate text-xs">{member.userName}</p>
                  <p className="text-[10px] text-amber-300/80 font-medium">Pending proof today</p>
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 shrink-0">
                ⏳ Waiting
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
        {!stats.hasCurrentUserSubmitted ? (
          <button
            onClick={handleSubmitProof}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-amber-400 hover:from-[#e2be4a] hover:to-amber-300 text-black font-black text-xs transition-all shadow-md shadow-[#D4AF37]/20 flex items-center justify-center gap-1.5 min-h-[40px]"
          >
            <Camera className="w-4 h-4" />
            <span>Submit Your Daily Proof</span>
          </button>
        ) : !stats.allSubmitted ? (
          <button
            onClick={handleUrgeTeammates}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-black text-xs transition-all flex items-center justify-center gap-1.5 min-h-[40px]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Urge Teammates in Squad Chat</span>
          </button>
        ) : (
          <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Squad 100% Verified Today • Great Job!</span>
          </div>
        )}

        {onOpenChallenge && (
          <button
            onClick={() => {
              vibrateLight();
              onOpenChallenge(challengeId);
            }}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition-colors flex items-center gap-1 min-h-[40px]"
          >
            <span>Hub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
