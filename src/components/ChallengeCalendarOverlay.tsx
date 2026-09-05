import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Flame,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trophy,
  Filter,
  Image as ImageIcon,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Clock,
  Plus,
} from 'lucide-react';
import { Challenge, ChallengeProgressPost, User } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight } from '../services/haptics';

interface ChallengeCalendarOverlayProps {
  currentUser: User;
  challenges: Challenge[];
  onOpenChallenge: (challenge: Challenge, initialTab?: 'proofs' | 'leaderboard' | 'squads' | 'chat') => void;
  onOpenCreate?: () => void;
}

export const ChallengeCalendarOverlay: React.FC<ChallengeCalendarOverlayProps> = ({
  currentUser,
  challenges,
  onOpenChallenge,
  onOpenCreate,
}) => {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed, 7 = August (current in mock context)
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = getTodayDateString();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => {
    vibrateLight();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    vibrateLight();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calendar Math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Get all user challenge post dates
  const userChallengeDates = DailyStorageService.getUserChallengePostDates(currentUser.id);

  // Filter joined challenges
  const joinedChallenges = challenges.filter((c) =>
    (c.participantIds || []).includes(currentUser.id)
  );

  // Compute month stats
  const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthActivityDates = userChallengeDates.filter((d) => d.startsWith(currentMonthPrefix));
  const daysPassedInMonth =
    currentYear === 2026 && currentMonth === 7
      ? 31
      : currentYear < 2026 || (currentYear === 2026 && currentMonth < 7)
      ? daysInMonth
      : Math.min(daysInMonth, new Date().getDate());

  const monthConsistencyPercent = Math.min(
    100,
    Math.round((monthActivityDates.length / Math.max(1, Math.min(daysPassedInMonth, 30))) * 100)
  );

  // Get posts for selected date
  const selectedDatePosts = selectedDate
    ? DailyStorageService.getChallengePostsByDate(selectedDate, currentUser.id).filter(
        (item) => selectedChallengeId === 'all' || item.challenge.id === selectedChallengeId
      )
    : [];

  return (
    <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 text-white">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-white flex items-center gap-1.5">
              <span>Commitment Calendar</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                Visual History
              </span>
            </h3>
            <p className="text-xs text-white/50">
              Verified challenge check-in receipts & streak integrity
            </p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-white/90">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Challenge Filter Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-white/40 text-[11px] font-bold flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" />
          Filter:
        </span>
        <button
          onClick={() => {
            vibrateLight();
            setSelectedChallengeId('all');
          }}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
            selectedChallengeId === 'all'
              ? 'bg-[#2F6FED] text-white font-black shadow-sm shadow-[#2F6FED]/30'
              : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
          }`}
        >
          All Challenges ({userChallengeDates.length} days)
        </button>

        {joinedChallenges.map((c) => {
          const isSelected = selectedChallengeId === c.id;
          const userDates = c.userPostDates?.[currentUser.id] || [];
          return (
            <button
              key={c.id}
              onClick={() => {
                vibrateLight();
                setSelectedChallengeId(c.id);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                isSelected
                  ? 'bg-amber-400 text-black font-black shadow-sm'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
              }`}
            >
              <span>{c.icon}</span>
              <span className="truncate max-w-[120px]">{c.title}</span>
              <span className="text-[10px] opacity-70 font-mono">({userDates.length})</span>
            </button>
          );
        })}
      </div>

      {/* Monthly Interactive Calendar Grid */}
      <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-2">
        <div className="grid grid-cols-7 gap-1 text-center">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
            <div key={i} className="text-[10px] font-black text-white/40 py-1">
              {d}
            </div>
          ))}

          {/* Empty prefix slots */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 sm:h-12 rounded-xl bg-white/[0.01]" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;

            // Check if user has posts on this date
            const challengePostsOnDate = (DailyStorageService.getChallengePostsByDate(
              dStr,
              currentUser.id
            ) || []).filter(
              (item) => selectedChallengeId === 'all' || item.challenge?.id === selectedChallengeId
            );

            // Also check challenge userPostDates records
            let hasRecordInChallenge = false;
            if (selectedChallengeId === 'all') {
              hasRecordInChallenge = (userChallengeDates || []).includes(dStr);
            } else {
              const target = (challenges || []).find((c) => c.id === selectedChallengeId);
              hasRecordInChallenge = Boolean(
                target?.userPostDates?.[currentUser.id]?.includes(dStr)
              );
            }

            const hasActivity = challengePostsOnDate.length > 0 || hasRecordInChallenge;
            const isTodayDate = dStr === today;
            const isSelected = selectedDate === dStr;

            return (
              <button
                key={dayNum}
                onClick={() => {
                  vibrateLight();
                  setSelectedDate(isSelected ? null : dStr);
                }}
                className={`h-10 sm:h-12 rounded-xl text-xs font-bold flex flex-col items-center justify-between p-1 transition-all relative group cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-amber-400 bg-amber-500/20'
                    : hasActivity
                    ? 'bg-gradient-to-br from-amber-500/25 to-amber-600/10 border border-amber-500/40 text-amber-300 hover:scale-105 shadow-md shadow-amber-500/10'
                    : isTodayDate
                    ? 'border-2 border-[#2F6FED] text-[#2F6FED] hover:bg-[#2F6FED]/10'
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
                title={`${dStr}: ${hasActivity ? 'Verified challenge check-in' : 'No receipts'}`}
              >
                <div className="w-full flex items-center justify-between text-[10px]">
                  <span className={hasActivity ? 'font-black text-white' : ''}>{dayNum}</span>
                  {hasActivity && (
                    <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  )}
                </div>

                {hasActivity ? (
                  <span className="text-[9px] font-black text-amber-400 font-mono">
                    {challengePostsOnDate.length > 1 ? `${challengePostsOnDate.length} proofs` : 'Proof'}
                  </span>
                ) : isTodayDate ? (
                  <span className="text-[8px] font-bold text-[#2F6FED] uppercase">Today</span>
                ) : (
                  <span className="text-[9px] text-transparent">•</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-white/50 px-1 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
              <span>Verified Proof Logged</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-[#2F6FED]" />
              <span>Current Day</span>
            </span>
          </div>
          <span className="italic text-[10px]">Tap any day to inspect receipts</span>
        </div>
      </div>

      {/* Commitment History Summary Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-0.5">
          <span className="text-[10px] text-white/40 uppercase font-bold">Month Receipts</span>
          <p className="text-base font-black text-amber-400 font-mono">
            {monthActivityDates.length} Days
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-0.5">
          <span className="text-[10px] text-white/40 uppercase font-bold">Consistency</span>
          <p className="text-base font-black text-white font-mono">{monthConsistencyPercent}%</p>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-0.5">
          <span className="text-[10px] text-white/40 uppercase font-bold">Active Streak</span>
          <p className="text-base font-black text-emerald-400 font-mono">
            {currentUser.currentStreak} Days
          </p>
        </div>
      </div>

      {/* Selected Date Receipts Inspection Drawer */}
      {selectedDate && (
        <div className="p-4 rounded-2xl bg-[#141414] border border-amber-500/30 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="font-black text-xs text-white">
                Receipts for {selectedDate}
              </h4>
            </div>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-[11px] text-white/40 hover:text-white"
            >
              Dismiss
            </button>
          </div>

          {selectedDatePosts.length === 0 ? (
            <div className="py-4 text-center space-y-2">
              <p className="text-xs text-white/50">
                No photo proofs logged on this specific date.
              </p>
              {selectedDate === today && onOpenCreate && (
                <button
                  onClick={() => {
                    vibrateLight();
                    onOpenCreate();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs inline-flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Today's Proof</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDatePosts.map(({ post, challenge }) => (
                <div
                  key={post.id}
                  className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-start gap-3 justify-between"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt="Proof"
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-black text-amber-300">
                          {challenge.icon} {challenge.title}
                        </span>
                        <span className="text-[9px] bg-white/10 px-1.5 py-0.2 rounded font-mono text-white/70">
                          Day {post.dayNumber}
                        </span>
                      </div>
                      {post.text && (
                        <p className="text-xs text-white/70 mt-1 line-clamp-2">
                          "{post.text}"
                        </p>
                      )}
                      <span className="text-[10px] text-white/40 mt-1 block">
                        Logged at {post.createdAt} • {post.cheersCount} cheers
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      onClick={() => onOpenChallenge(challenge, 'proofs')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] flex items-center gap-1"
                    >
                      <span>Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onOpenChallenge(challenge, 'chat')}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-[10px] flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
