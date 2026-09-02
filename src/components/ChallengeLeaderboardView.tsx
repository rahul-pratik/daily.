import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  Crown,
  Users,
  Target,
  Sparkles,
  Heart,
  TrendingUp,
  Award,
  CheckCircle2,
  Zap,
  UserPlus,
  Shield,
  Medal,
  Check,
} from 'lucide-react';
import { Challenge, ChallengeLeaderboard, User } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight } from '../services/haptics';

interface ChallengeLeaderboardViewProps {
  challenge: Challenge;
  currentUser: User;
  onOpenInvite?: () => void;
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
}

export const ChallengeLeaderboardView: React.FC<ChallengeLeaderboardViewProps> = ({
  challenge,
  currentUser,
  onOpenInvite,
  onViewUser,
}) => {
  const [leaderboardTab, setLeaderboardTab] = useState<'individuals' | 'squads'>(
    challenge.challengeType === 'group' ? 'squads' : 'individuals'
  );

  const leaderboard: ChallengeLeaderboard = DailyStorageService.getChallengeLeaderboard(
    challenge.id,
    currentUser.id
  );

  const isGroup = challenge.challengeType === 'group';

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-black font-black text-xs flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-200 shrink-0">
            <Crown className="w-4 h-4 fill-black" />
          </div>
        );
      case 2:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-black font-black text-xs flex items-center justify-center shadow-md border border-slate-100 shrink-0">
            2
          </div>
        );
      case 3:
        return (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-amber-200 font-black text-xs flex items-center justify-center shadow-md border border-amber-600/40 shrink-0">
            3
          </div>
        );
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/60 font-bold text-xs flex items-center justify-center shrink-0">
            #{rank}
          </div>
        );
    }
  };

  const myIndividualRank = leaderboard.individuals.find((ind) => ind.isCurrentUser);
  const mySquadRank = leaderboard.squads.find((sq) => sq.isUserSquad);

  return (
    <div className="space-y-4">
      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-black/40 border border-amber-500/25">
          <div className="flex items-center gap-1.5 text-amber-400 mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Receipts</span>
          </div>
          <p className="text-lg font-black text-white">{leaderboard.summary.totalCheckins}</p>
          <span className="text-[9px] text-white/50">Verified Check-ins</span>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-black/40 border border-blue-500/25">
          <div className="flex items-center gap-1.5 text-blue-400 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Challengers</span>
          </div>
          <p className="text-lg font-black text-white">{leaderboard.summary.totalParticipants}</p>
          <span className="text-[9px] text-white/50">
            {isGroup ? `${challenge.teams?.length || 0} squads active` : 'Individual racers'}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-black/40 border border-emerald-500/25">
          <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Streak Pace</span>
          </div>
          <p className="text-lg font-black text-white">
            {leaderboard.summary.cohortActiveStreakRate}%
          </p>
          <span className="text-[9px] text-white/50">Active Streak Rate</span>
        </div>

        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-black/40 border border-purple-500/25">
          <div className="flex items-center gap-1.5 text-purple-400 mb-1">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Top Streak</span>
          </div>
          <p className="text-lg font-black text-white">{leaderboard.summary.topStreak} Days</p>
          <span className="text-[9px] text-white/50">Leaderboard Record</span>
        </div>
      </div>

      {/* Mode Switcher & Direct Invite Action Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {isGroup ? (
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => {
                vibrateLight();
                setLeaderboardTab('squads');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                leaderboardTab === 'squads'
                  ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squad Rankings ({leaderboard.squads.length})</span>
            </button>

            <button
              onClick={() => {
                vibrateLight();
                setLeaderboardTab('individuals');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                leaderboardTab === 'individuals'
                  ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Individual Standings ({leaderboard.individuals.length})</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-white/70 font-bold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Challenger Leaderboard Rankings</span>
          </div>
        )}

        {onOpenInvite && (
          <button
            onClick={() => {
              vibrateLight();
              onOpenInvite();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/10 ml-auto"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Invite Challengers</span>
          </button>
        )}
      </div>

      {/* SQUAD LEADERBOARD VIEW */}
      {isGroup && leaderboardTab === 'squads' && (
        <div className="space-y-2.5">
          {leaderboard.squads.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
              <Users className="w-8 h-8 text-amber-400/40 mx-auto mb-1" />
              <p className="text-xs text-white/60">No squads have joined yet.</p>
              <p className="text-[11px] text-white/40">
                Create a squad in the Squads tab to compete for the gold!
              </p>
            </div>
          ) : (
            leaderboard.squads.map((squad) => (
              <div
                key={squad.teamId}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  squad.isUserSquad
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                    : 'bg-[#111111] hover:bg-[#161616] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {getRankBadge(squad.rank)}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-white truncate">{squad.teamName}</h4>
                        {squad.isUserSquad && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-black text-[9px]">
                            Your Squad
                          </span>
                        )}
                      </div>
                      {squad.motto && (
                        <p className="text-[11px] text-white/50 italic truncate">"{squad.motto}"</p>
                      )}
                    </div>
                  </div>

                  {/* Score block */}
                  <div className="text-right shrink-0">
                    <div className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 inline-block text-center">
                      <span className="text-xs font-black text-amber-400 block font-mono">
                        {squad.squadScore} pts
                      </span>
                      <span className="text-[8px] uppercase tracking-wider text-white/40 font-bold">
                        Squad Score
                      </span>
                    </div>
                  </div>
                </div>

                {/* Squad Metrics & Top Contributors */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-3 text-white/70 text-[11px]">
                    <span className="flex items-center gap-1 font-mono">
                      <strong className="text-white">{squad.totalCheckins}</strong>
                      <span className="text-white/40">receipts</span>
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <strong className="text-white">{squad.averageCheckinsPerMember}</strong>
                      <span className="text-white/40">avg/member</span>
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/50">{squad.memberCount} members</span>
                  </div>

                  {/* Top Contributors Avatars */}
                  {squad.topContributors && squad.topContributors.length > 0 && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">
                        Leaders:
                      </span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {squad.topContributors.map((c) => (
                          <img
                            key={c.id}
                            src={c.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                            alt={c.name}
                            title={`${c.name} (${c.checkinsCount} check-ins)`}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover border border-black"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* INDIVIDUAL STANDINGS VIEW */}
      {(leaderboardTab === 'individuals' || !isGroup) && (
        <div className="space-y-2">
          {leaderboard.individuals.length === 0 ? (
            <div className="text-center py-12 p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-2">
              <Trophy className="w-8 h-8 text-amber-400/40 mx-auto mb-1" />
              <p className="text-xs text-white/60">No participants ranked yet.</p>
              <p className="text-[11px] text-white/40">
                Post your daily progress check-in to enter the leaderboard rankings!
              </p>
            </div>
          ) : (
            leaderboard.individuals.map((ind) => (
              <div
                key={ind.user.id}
                onClick={() => {
                  if (onViewUser && ind.user.id !== 'system') {
                    onViewUser({
                      id: ind.user.id,
                      name: ind.user.name,
                      username: ind.user.username,
                      avatar: ind.user.avatar,
                      streak: ind.user.currentStreak,
                    });
                  }
                }}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                  ind.isCurrentUser
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-[#111111] hover:bg-[#171717] border-white/10 hover:border-white/20'
                } ${onViewUser ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {getRankBadge(ind.rank)}

                    <div className="relative shrink-0">
                      <img
                        src={ind.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                        alt={ind.user.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-xl object-cover border border-white/15"
                      />
                      {ind.hasPostedToday && (
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center border border-black"
                          title="Checked in today"
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white truncate">{ind.user.name}</span>
                        {ind.isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-black text-[9px]">
                            You
                          </span>
                        )}
                        {ind.teamName && (
                          <span className="text-[10px] text-amber-400/90 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                            🛡 {ind.teamName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-white/40 block">@{ind.user.username}</span>
                    </div>
                  </div>

                  {/* Individual metrics: checkins, streak, score */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-xs font-black text-white font-mono">
                          {ind.totalCheckins}/{challenge.durationDays}d
                        </span>
                        <span className="text-[11px] font-black text-amber-400 flex items-center gap-0.5">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          <span>{ind.currentStreak}d</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 justify-end text-[9px] text-white/50">
                        <span>Score: {ind.consistencyScore}</span>
                        {ind.totalCheers > 0 && <span>• ❤️ {ind.totalCheers}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Mini Progress Bar */}
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-[#D4AF37] to-emerald-400 rounded-full"
                      style={{ width: `${Math.max(4, ind.completionPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STICKY USER POSITION BANNER */}
      {myIndividualRank && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-black/80 to-amber-500/20 border border-amber-500/40 flex items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-400 text-black font-black text-xs flex items-center justify-center shadow-md">
              #{myIndividualRank.rank}
            </div>
            <div>
              <span className="font-black text-white text-xs block">Your Challenge Standing</span>
              <span className="text-[10px] text-white/60">
                {myIndividualRank.totalCheckins} receipts • {myIndividualRank.currentStreak} day streak
                {mySquadRank && ` • Squad #${mySquadRank.rank}`}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-black text-amber-300 block font-mono">
              {myIndividualRank.consistencyScore} pts
            </span>
            <span className="text-[9px] text-white/50 font-bold uppercase">Consistency</span>
          </div>
        </div>
      )}
    </div>
  );
};
