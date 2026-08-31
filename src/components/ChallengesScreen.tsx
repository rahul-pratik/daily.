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
} from 'lucide-react';
import { User, Post, Challenge } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { CreateChallengeModal } from './CreateChallengeModal';
import { ChallengeProgressScreen } from './ChallengeProgressScreen';

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
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterChip, setSelectedFilterChip] = useState('All');
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [activeChallengeScreen, setActiveChallengeScreen] = useState<Challenge | null>(null);

  // Streak Calendar & Stats Sub-View toggle
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed, 7 = August

  useEffect(() => {
    const loadedChallenges = DailyStorageService.getAllChallenges();
    setChallenges(loadedChallenges);
  }, []);

  const today = getTodayDateString();
  const hasPostedToday = currentUser.lastPostedDate === today;

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
        onBack={() => {
          setActiveChallengeScreen(null);
          setChallenges(DailyStorageService.getAllChallenges());
        }}
        onChallengeUpdated={handleChallengeUpdated}
      />
    );
  }

  return (
    <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4 text-white">
      {/* Hero Streak & Challenges Bar */}
      <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-lg">
              <Flame className="w-6 h-6 fill-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-black text-white">{currentUser.currentStreak} Day Streak</h2>
                <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full font-bold border border-[#D4AF37]/20">
                  Gold
                </span>
              </div>
              <p className="text-xs text-white/50">
                {hasPostedToday
                  ? 'Daily proof completed for today! 🔥'
                  : 'Post proof today to maintain your streak'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              vibrateLight();
              setShowCalendarView(!showCalendarView);
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1 transition-colors"
            title="Toggle Calendar"
          >
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">{showCalendarView ? 'Challenges' : 'Calendar'}</span>
          </button>
        </div>

        {/* Optional Calendar Dropdown */}
        {showCalendarView && (
          <div className="pt-3 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white/80">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-[10px] font-bold text-white/40 py-1">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const hasActivity = (currentUser.activityDates || []).includes(dStr);
                const isTodayDate = dStr === today;

                return (
                  <div
                    key={dayNum}
                    className={`h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all ${
                      hasActivity
                        ? 'bg-[#D4AF37] text-black font-black shadow-sm'
                        : isTodayDate
                        ? 'border border-blue-500 text-blue-400 font-bold'
                        : 'text-white/40'
                    }`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SEARCH BAR FOR CHALLENGES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-black text-white">Grounded Challenges</h2>
          </div>

          <button
            onClick={() => {
              vibrateLight();
              setIsCreateChallengeOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 min-h-[34px]"
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
            className="w-full bg-[#111111] border border-white/15 focus:border-blue-500 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
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

        {/* Category Filter Chips */}
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
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
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
              className="py-2 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
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

            return (
              <div
                key={challenge.id}
                onClick={() => {
                  vibrateLight();
                  setActiveChallengeScreen(challenge);
                }}
                className="bg-[#0F0F0F] hover:bg-[#141414] border border-white/15 hover:border-blue-500/50 rounded-3xl p-4 sm:p-5 shadow-xl transition-all cursor-pointer group space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                      {challenge.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          #{challenge.tag || challenge.category}
                        </span>
                        <span className="text-[10px] text-white/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Ends {challenge.deadlineDate}
                        </span>
                      </div>
                      <h3 className="font-black text-sm text-white group-hover:text-blue-300 transition-colors leading-tight">
                        {challenge.title}
                      </h3>
                      <p className="text-xs text-white/60 line-clamp-2 mt-1 leading-relaxed">
                        {challenge.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                </div>

                {/* Progress bar if joined */}
                {isJoined && (
                  <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60 font-bold">Your Progress:</span>
                      <span className="text-[#D4AF37] font-black">
                        Day {userProgress.daysCompleted} of {challenge.durationDays}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-[#D4AF37] to-amber-400 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Footer: Participants + Join/Hub button */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-1.5 text-white/50">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-white">
                      {(challenge.participantsCount || 1).toLocaleString()}
                    </span>
                    <span>members</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isJoined ? (
                      <button
                        onClick={(e) => handleToggleJoin(e, challenge.id)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20"
                      >
                        Join
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1 group-hover:underline">
                        <span>Progress Hub & Chat</span>
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

      {/* CREATE CHALLENGE MODAL */}
      {isCreateChallengeOpen && (
        <CreateChallengeModal
          isOpen={isCreateChallengeOpen}
          onClose={() => setIsCreateChallengeOpen(false)}
          currentUser={currentUser}
          onChallengeCreated={handleChallengeCreated}
        />
      )}
    </div>
  );
};
