import React, { useState, useEffect } from 'react';
import {
  Flame,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Users,
  ChevronRight,
  PlusCircle,
  Sparkles,
  Award,
  ChevronLeft,
  Check,
  Zap,
  MessageSquare,
  Trophy,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  X,
  Target,
  UserPlus,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { User, Post, Challenge } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { CreateChallengeModal } from './CreateChallengeModal';
import { ChallengeProgressScreen } from './ChallengeProgressScreen';
import { CalendarDayPostModal } from './CalendarDayPostModal';
import { DirectChallengeInviteModal } from './DirectChallengeInviteModal';
import { ChallengeCalendarOverlay } from './ChallengeCalendarOverlay';

interface ChallengesScreenProps {
  currentUser: User;
  posts: Post[];
  onOpenCreate: () => void;
  onToggleLike?: (postId: string) => void;
  onOpenComments?: (post: Post) => void;
  savedPostIds?: string[];
  reportedPostIds?: string[];
  onToggleSave?: (postId: string) => void;
  onReportPost?: (post: Post) => void;
  onSharePost?: (post: Post) => void;
  onOpenInsights?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
}

const CATEGORY_CHIPS = [
  'All',
  '👥 Group Squads',
  '🎯 Solo',
  'Joined',
  '30 Days',
  '60 Days',
  '21 Days',
  'Coding',
  'Fitness',
  'Learning',
  'Mindset',
];

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  currentUser,
  posts,
  onOpenCreate,
  onToggleLike = () => {},
  onOpenComments = () => {},
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterChip, setSelectedFilterChip] = useState('All');
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [activeChallengeScreen, setActiveChallengeScreen] = useState<Challenge | null>(null);
  const [initialChallengeTab, setInitialChallengeTab] = useState<'proofs' | 'leaderboard' | 'squads' | 'chat'>('proofs');
  const [inviteChallenge, setInviteChallenge] = useState<Challenge | null>(null);

  // Streak Calendar & Stats Sub-View toggle
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed, 7 = August
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  useEffect(() => {
    const loadedChallenges = DailyStorageService.getAllChallenges();
    setChallenges(loadedChallenges);
  }, []);

  const today = getTodayDateString();
  const hasPostedToday = currentUser.lastPostedDate === today;
  const userChallengeDates = DailyStorageService.getUserChallengePostDates(currentUser.id);

  // Calendar Calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleCalendarDayClick = (dateStr: string) => {
    vibrateLight();
    setSelectedCalendarDate(dateStr);
  };

  // Filter Challenges
  const filteredChallenges = challenges.filter((c) => {
    const isJoined = (c.participantIds || []).includes(currentUser.id);

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      const matchCat = (c.category || '').toLowerCase().includes(q);
      const matchTag = (c.tag || '').toLowerCase().includes(q);
      const matchDuration = `${c.durationDays} days`.includes(q);
      if (!matchTitle && !matchDesc && !matchCat && !matchTag && !matchDuration) {
        return false;
      }
    }

    // Category / Tag / Filter chip
    if (selectedFilterChip === 'Joined') {
      return isJoined;
    } else if (selectedFilterChip === '👥 Group Squads') {
      return c.challengeType === 'group';
    } else if (selectedFilterChip === '🎯 Solo') {
      return c.challengeType === 'individual' || !c.challengeType;
    } else if (selectedFilterChip === '30 Days') {
      return c.durationDays === 30;
    } else if (selectedFilterChip === '60 Days') {
      return c.durationDays === 60;
    } else if (selectedFilterChip === '21 Days') {
      return c.durationDays === 21;
    } else if (selectedFilterChip !== 'All') {
      const catLower = selectedFilterChip.toLowerCase();
      const matchCat = (c.category || '').toLowerCase() === catLower;
      const matchTag = (c.tag || '').toLowerCase() === catLower;
      return matchCat || matchTag;
    }

    return true;
  });

  const handleChallengeCreated = (newChallenge: Challenge) => {
    const all = DailyStorageService.getAllChallenges();
    setChallenges(all);
    setActiveChallengeScreen(newChallenge);
  };

  const handleChallengeUpdated = (updatedChallenge: Challenge) => {
    const all = DailyStorageService.getAllChallenges();
    setChallenges(all);
    if (activeChallengeScreen && activeChallengeScreen.id === updatedChallenge.id) {
      setActiveChallengeScreen(updatedChallenge);
    }
  };

  const handleToggleJoin = (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    vibrateLight();
    const result = DailyStorageService.toggleJoinChallenge(challengeId);
    setChallenges(DailyStorageService.getAllChallenges());
    if (activeChallengeScreen && activeChallengeScreen.id === challengeId) {
      setActiveChallengeScreen(result.challenge);
    }
  };

  // If viewing a specific challenge's progress hub
  if (activeChallengeScreen) {
    return (
      <ChallengeProgressScreen
        challenge={activeChallengeScreen}
        currentUser={currentUser}
        initialTab={initialChallengeTab}
        onBack={() => {
          setActiveChallengeScreen(null);
          setInitialChallengeTab('proofs');
          setChallenges(DailyStorageService.getAllChallenges());
        }}
        onChallengeUpdated={handleChallengeUpdated}
      />
    );
  }

  return (
    <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4 text-white">
      {/* Hero Streak & Challenges Bar (Swapped: Streak is Blue, Actions are Golden) */}
      <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Blue Streak Flame */}
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/10">
              <Flame className="w-6 h-6 fill-blue-400 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-black text-white">{currentUser.currentStreak} Day Streak</h2>
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-bold border border-blue-500/20">
                  Electric Blue
                </span>
              </div>
              <p className="text-xs text-white/50">
                {hasPostedToday
                  ? 'Daily proof verified for today! 🔥'
                  : 'Post proof today to maintain your streak'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              vibrateLight();
              setShowCalendarView(!showCalendarView);
            }}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              showCalendarView
                ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md shadow-[#D4AF37]/20'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
            }`}
            title="Toggle Calendar & Commitment History Overlay"
          >
            <CalendarIcon className={`w-4 h-4 ${showCalendarView ? 'text-black' : 'text-[#D4AF37]'}`} />
            <span>{showCalendarView ? 'Hide' : 'History'}</span>
          </button>
        </div>

        {/* Monthly Calendar View Overlay with Challenge Post Indicators */}
        {showCalendarView && (
          <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
            <ChallengeCalendarOverlay
              currentUser={currentUser}
              challenges={challenges}
              onOpenChallenge={(ch) => {
                setInitialChallengeTab('proofs');
                setActiveChallengeScreen(ch);
              }}
            />
          </div>
        )}
      </div>

      {/* SEARCH BAR FOR CHALLENGES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-black text-white">Grounded Challenges</h2>
          </div>

          <button
            onClick={() => {
              vibrateLight();
              setIsCreateChallengeOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5c158] text-black font-black text-xs transition-all shadow-md shadow-[#D4AF37]/20 flex items-center gap-1.5 min-h-[34px]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Challenge</span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search challenges by title, goal, or #tag..."
            className="w-full bg-[#111111] border border-white/15 focus:border-[#D4AF37] rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Chips (Active chip is Golden) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = selectedFilterChip === chip;
            return (
              <button
                key={chip}
                onClick={() => {
                  vibrateLight();
                  setSelectedFilterChip(chip);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 min-h-[30px] ${
                  isSelected
                    ? 'bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/25'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* CHALLENGES LIST */}
      <div className="space-y-3 pt-1">
        {filteredChallenges.length === 0 ? (
          <div className="bg-[#0F0F0F] border border-white/10 rounded-3xl p-8 text-center space-y-3">
            <Trophy className="w-10 h-10 text-white/30 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No challenges found</h3>
              <p className="text-xs text-white/50">
                {searchQuery
                  ? `No challenges matched "${searchQuery}". Try a different query.`
                  : 'Launch a new challenge with custom days and deadline!'}
              </p>
            </div>
            <button
              onClick={() => setIsCreateChallengeOpen(true)}
              className="py-2 px-4 rounded-xl bg-[#D4AF37] text-black font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-[#D4AF37]/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create First Challenge</span>
            </button>
          </div>
        ) : (
          filteredChallenges.map((challenge) => {
            const isJoined = (challenge.participantIds || []).includes(currentUser.id);
            const userProgress = DailyStorageService.getChallengeUserProgress(challenge.id, currentUser.id);
            const percent = Math.min(100, Math.round((userProgress.daysCompleted / challenge.durationDays) * 100));
            const isGroup = challenge.challengeType === 'group';
            const userTeam = userProgress.userTeam;
            const hasCheckedInToday = userProgress.userPostDates.includes(today);
            const daysRemaining = Math.max(0, challenge.durationDays - userProgress.daysCompleted);

            // Group squad stats calculation
            const squadTotalCheckins = userTeam?.totalCheckinsCount || 0;
            const squadGoalCheckins = challenge.durationDays * (challenge.teamSize || 3);
            const squadPercent = Math.min(100, Math.round((squadTotalCheckins / squadGoalCheckins) * 100));

            return (
              <div
                key={challenge.id}
                onClick={() => {
                  vibrateLight();
                  setActiveChallengeScreen(challenge);
                }}
                className="bg-[#0F0F0F] hover:bg-[#141414] border border-white/15 hover:border-[#D4AF37]/50 rounded-3xl p-4 sm:p-5 shadow-xl transition-all cursor-pointer group space-y-3.5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      {challenge.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {isGroup ? (
                          <span className="text-[10px] font-black text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                            <Users className="w-3 h-3 text-amber-300" />
                            <span>Group Squad ({challenge.teamSize || 3}/team)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">
                            <Target className="w-3 h-3 text-blue-400" />
                            <span>Solo Challenge</span>
                          </span>
                        )}

                        <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/20">
                          #{challenge.tag || challenge.category}
                        </span>
                        <span className="text-[10px] text-white/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Ends {challenge.deadlineDate}
                        </span>
                      </div>
                      <h3 className="font-black text-sm text-white group-hover:text-[#D4AF37] transition-colors leading-tight">
                        {challenge.title}
                      </h3>
                      <p className="text-xs text-white/60 line-clamp-2 mt-1 leading-relaxed">
                        {challenge.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-[#D4AF37] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                {/* VISUAL PROGRESS BARS FOR JOINED INDIVIDUAL & GROUP CHALLENGES */}
                {isJoined ? (
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                    {/* Goal Completion Progress & Proximity */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/80 font-bold flex items-center gap-1.5">
                          <span>Goal Progress</span>
                          <span className="text-[10px] text-white/40 font-normal">
                            ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left)
                          </span>
                        </span>
                        <span className="text-[#D4AF37] font-black font-mono">
                          Day {userProgress.daysCompleted} of {challenge.durationDays}{' '}
                          <span className="text-white/50 text-[10px]">({percent}%)</span>
                        </span>
                      </div>

                      {/* Main Animated Progress Bar */}
                      <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 flex items-center">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 via-[#D4AF37] to-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-[#D4AF37]/40"
                          style={{ width: `${Math.max(4, percent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Streak Requirement & Daily Status Tracker */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Flame className="w-3 h-3 fill-amber-400" />
                        </div>
                        <span className="font-black text-white">
                          {userProgress.currentStreak} Day Streak
                        </span>
                      </div>

                      {hasCheckedInToday ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Posted Today • Streak Safe</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                          <Zap className="w-3 h-3" />
                          <span>Check-in Needed Today</span>
                        </span>
                      )}
                    </div>

                    {/* If Group Squad Challenge, show Squad Goal Progress Bar */}
                    {isGroup && userTeam && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 space-y-2 mt-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-amber-300 flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>Squad: {userTeam.name}</span>
                          </span>
                          <span className="text-white/80 font-mono text-[10px]">
                            {squadTotalCheckins} / {squadGoalCheckins} receipts ({squadPercent}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full"
                            style={{ width: `${Math.max(5, squadPercent)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/50">
                          <span>Your check-ins: {userProgress.daysCompleted}</span>
                          <span>{userTeam.members.length}/{challenge.teamSize || 3} members</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Explore / Unjoined Challenge Cohort Momentum Bar */
                  <div className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-white/60">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                        <span>Cohort Completion Momentum</span>
                      </span>
                      <span className="text-[#D4AF37] font-bold">85% Active Pace</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#D4AF37]/50 to-[#D4AF37] rounded-full w-2/3" />
                    </div>
                  </div>
                )}

                {/* Group Challenge Squads Preview (if not joined or exploring) */}
                {isGroup && !isJoined && challenge.teams && challenge.teams.length > 0 && (
                  <div className="p-2.5 rounded-2xl bg-[#141414] border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                        {challenge.teams.slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-bold text-[#D4AF37]"
                          >
                            {t.name.slice(0, 1)}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] text-white/70 truncate">
                        {challenge.teams.length} Squad{challenge.teams.length > 1 ? 's' : ''} competing •{' '}
                        <strong className="text-white">
                          {challenge.teams.reduce((acc, t) => acc + (t.totalCheckinsCount || 0), 0)} receipts
                        </strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-[#D4AF37] shrink-0 font-bold">Join a Squad →</span>
                  </div>
                )}

                {/* Footer: Participants + Direct Challenge Invite + Join/Hub button */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="font-bold text-white">
                      {(challenge.participantsCount || 1).toLocaleString()}
                    </span>
                    <span>members {isGroup && `(${challenge.teams?.length || 0} squads)`}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Go to Team Chat Button (for joined challenge or group challenge) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        vibrateLight();
                        setInitialChallengeTab('chat');
                        setActiveChallengeScreen(challenge);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 hover:text-amber-200 font-bold text-[11px] transition-all flex items-center gap-1 shadow-sm shadow-amber-500/10"
                      title="Go to Team / Squad Chat"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>Team Chat</span>
                    </button>

                    {/* Direct Challenge Invite Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        vibrateLight();
                        setInviteChallenge(challenge);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/40 text-white/80 hover:text-amber-400 font-bold text-[11px] transition-all flex items-center gap-1"
                      title="Direct Challenge Invite to Friends or Squads"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Invite</span>
                    </button>

                    {!isJoined ? (
                      <button
                        type="button"
                        onClick={(e) => handleToggleJoin(e, challenge.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#e5c158] text-black font-black text-xs transition-all shadow-md shadow-[#D4AF37]/20"
                      >
                        Join
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-[#D4AF37] flex items-center gap-1 group-hover:underline">
                        <span>Progress Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DIRECT CHALLENGE INVITE MODAL */}
      {inviteChallenge && (
        <DirectChallengeInviteModal
          isOpen={Boolean(inviteChallenge)}
          onClose={() => setInviteChallenge(null)}
          currentUser={currentUser}
          initialChallengeId={inviteChallenge.id}
        />
      )}

      {/* CREATE CHALLENGE MODAL */}
      {isCreateChallengeOpen && (
        <CreateChallengeModal
          isOpen={isCreateChallengeOpen}
          onClose={() => setIsCreateChallengeOpen(false)}
          currentUser={currentUser}
          onChallengeCreated={handleChallengeCreated}
        />
      )}

      {/* MONTHLY CALENDAR DAY POST INSPECTION MODAL */}
      {selectedCalendarDate && (
        <CalendarDayPostModal
          isOpen={Boolean(selectedCalendarDate)}
          onClose={() => setSelectedCalendarDate(null)}
          selectedDate={selectedCalendarDate}
          currentUser={currentUser}
          allPosts={posts}
          onOpenCreate={onOpenCreate}
          onToggleLike={onToggleLike}
          onOpenComments={onOpenComments}
        />
      )}
    </div>
  );
};
