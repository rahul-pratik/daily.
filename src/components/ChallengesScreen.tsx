import React, { useState } from 'react';
import {
  Flame,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Users,
  ChevronRight,
  PlusCircle,
  Sparkles,
  BookOpen,
  Dumbbell,
  Laptop,
  Compass,
  Award,
  ChevronLeft,
  Check,
  Zap,
} from 'lucide-react';
import { User, Post } from '../types';
import { getTodayDateString } from '../services/storage';
import { PostCard } from './PostCard';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

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

export interface GroundedChallenge {
  id: string;
  title: string;
  icon: string;
  tag: string;
  totalDays: number;
  currentDay: number;
  participantsCount: number;
  goalDescription: string;
  joined: boolean;
  bookTitle?: string;
  bookProgress?: number;
  cohortMembers: {
    name: string;
    avatar: string;
    streak: number;
    hasPostedToday: boolean;
    todayReceiptText?: string;
    todayReceiptTime?: string;
  }[];
}

const INITIAL_CHALLENGES: GroundedChallenge[] = [
  {
    id: 'challenge_build_30',
    title: '30 Days of Building',
    icon: '💻',
    tag: 'Building',
    totalDays: 30,
    currentDay: 18,
    participantsCount: 12438,
    goalDescription: 'Build and ship something every day for 30 consecutive days.',
    joined: true,
    cohortMembers: [
      {
        name: 'Rahul',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        streak: 18,
        hasPostedToday: true,
        todayReceiptText: 'Built the login flow and auth tokens.',
        todayReceiptTime: '1h ago',
      },
      {
        name: 'Aryan',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        streak: 42,
        hasPostedToday: true,
        todayReceiptText: 'Finished my portfolio website responsive layout.',
        todayReceiptTime: '3h ago',
      },
      {
        name: 'Priya',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        streak: 17,
        hasPostedToday: false,
      },
      {
        name: 'Arjun',
        avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
        streak: 26,
        hasPostedToday: true,
        todayReceiptText: 'Shipped dark mode toggle & DB caching.',
        todayReceiptTime: '5h ago',
      },
      {
        name: 'Devika',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        streak: 9,
        hasPostedToday: false,
      },
    ],
  },
  {
    id: 'challenge_fitness_60',
    title: '60-Day Fitness Challenge',
    icon: '🏋️',
    tag: 'Fitness',
    totalDays: 60,
    currentDay: 27,
    participantsCount: 8920,
    goalDescription: 'Workout proof every single day. No excuses.',
    joined: true,
    cohortMembers: [
      {
        name: 'Marcus',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        streak: 27,
        hasPostedToday: true,
        todayReceiptText: 'Leg day + 30 min incline walk. Almost skipped today, went anyway.',
        todayReceiptTime: '45m ago',
      },
      {
        name: 'Elena',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        streak: 27,
        hasPostedToday: true,
        todayReceiptText: 'Ran 5km outdoor pace 5:10/km.',
        todayReceiptTime: '2h ago',
      },
      {
        name: 'Vikram',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        streak: 25,
        hasPostedToday: false,
      },
    ],
  },
  {
    id: 'challenge_reading_12',
    title: 'Read 12 Books Challenge',
    icon: '📚',
    tag: 'Reading',
    totalDays: 365,
    currentDay: 142,
    participantsCount: 6410,
    goalDescription: 'Read & reflect on key takeaways daily.',
    joined: false,
    bookTitle: 'Atomic Habits',
    bookProgress: 62,
    cohortMembers: [
      {
        name: 'Tara',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        streak: 14,
        hasPostedToday: true,
        todayReceiptText: 'Read 32 pages of Atomic Habits: Chapter on identity-based habits.',
        todayReceiptTime: '4h ago',
      },
      {
        name: 'Karan',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        streak: 8,
        hasPostedToday: false,
      },
    ],
  },
];

const MILESTONES = [
  { days: 3, title: 'Spark', icon: '✨', desc: '3 consecutive days of showing up' },
  { days: 7, title: 'Week Warrior', icon: '🔥', desc: '1 full week of uninterrupted daily posts' },
  { days: 14, title: 'Blaze Master', icon: '⚡', desc: '2 solid weeks of continuous momentum' },
  { days: 30, title: 'Inferno Legend', icon: '👑', desc: '30-day champion of personal discipline' },
  { days: 100, title: 'Supernova', icon: '🌟', desc: '100 days of legendary consistency' },
];

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  currentUser,
  posts,
  onOpenCreate,
  onToggleLike = () => {},
  onOpenComments = () => {},
  savedPostIds = [],
  reportedPostIds = [],
  onToggleSave,
  onReportPost,
  onSharePost,
  onOpenInsights,
  onDeletePost,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'challenges' | 'calendar'>('challenges');
  const [challenges, setChallenges] = useState<GroundedChallenge[]>(INITIAL_CHALLENGES);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('challenge_build_30');

  // Calendar month state
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed, 7 = August
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayDateString());

  const today = getTodayDateString();
  const hasPostedToday = currentUser.lastPostedDate === today;

  const selectedChallenge = challenges.find((c) => c.id === selectedChallengeId) || challenges[0];

  const handleToggleJoin = (challengeId: string) => {
    vibrateLight();
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === challengeId
          ? {
              ...c,
              joined: !c.joined,
              participantsCount: c.joined ? c.participantsCount - 1 : c.participantsCount + 1,
            }
          : c
      )
    );
  };

  // Calendar calculations
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

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

  const handleDateClick = (dateStr: string) => {
    vibrateLight();
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const postsOnSelectedDate = selectedDate
    ? posts.filter((p) => {
        if (p.userId !== currentUser.id && p.userId !== 'user_me') return false;
        if (p.postDate && p.postDate === selectedDate) return true;
        if (selectedDate === today && p.createdAt.includes('Today')) return true;
        return false;
      })
    : [];

  return (
    <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4 text-white">
      {/* Top Toggle: Challenges vs Calendar */}
      <div className="flex items-center p-1 bg-white/5 rounded-2xl border border-white/10">
        <button
          onClick={() => {
            vibrateLight();
            setActiveSubTab('challenges');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'challenges'
              ? 'bg-[#FF4D00] text-black shadow-md shadow-[#FF4D00]/20'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Grounded Challenges</span>
        </button>
        <button
          onClick={() => {
            vibrateLight();
            setActiveSubTab('calendar');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'calendar'
              ? 'bg-[#FF4D00] text-black shadow-md shadow-[#FF4D00]/20'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Streak Calendar</span>
        </button>
      </div>

      {activeSubTab === 'challenges' ? (
        /* GROUNDED CHALLENGES VIEW */
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-3xl p-5 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <span className="text-xs font-black uppercase tracking-wider text-[#FF4D00]">
                  Accountability Cohorts
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Don't talk about it. Do it together.
              </h2>
              <p className="text-xs text-white/60 leading-relaxed max-w-sm">
                Join a challenge, post your daily photo proof, and keep each other accountable every single day.
              </p>
            </div>
            <div className="absolute right-2 -bottom-2 text-7xl opacity-5 select-none pointer-events-none">
              🔥
            </div>
          </div>

          {/* Challenge Selector Cards */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/50 px-1">
              Active Challenges
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {challenges.map((c) => {
                const isSelected = c.id === selectedChallengeId;
                const progressPct = Math.round((c.currentDay / c.totalDays) * 100);

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      vibrateLight();
                      setSelectedChallengeId(c.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-3 ${
                      isSelected
                        ? 'bg-[#121212] border-[#FF4D00] shadow-lg shadow-[#FF4D00]/10 ring-1 ring-[#FF4D00]/30'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl p-2 rounded-xl bg-white/5 border border-white/10">
                          {c.icon}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {c.title}
                          </h4>
                          <p className="text-[11px] text-white/50">
                            {c.participantsCount.toLocaleString()} participants
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleJoin(c.id);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                          c.joined
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-[#FF4D00] text-black border-[#FF4D00] hover:bg-[#FF4D00]/90'
                        }`}
                      >
                        {c.joined ? 'Joined ✓' : 'Join'}
                      </button>
                    </div>

                    <p className="text-xs text-white/70">{c.goalDescription}</p>

                    {/* Book Specific info if applicable */}
                    {c.bookTitle && (
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-[#FF4D00]" />
                          <span className="font-semibold text-white">{c.bookTitle}</span>
                        </div>
                        <span className="text-[11px] text-[#FF4D00] font-mono font-bold">
                          {c.bookProgress}% read
                        </span>
                      </div>
                    )}

                    {/* Progress Bar: e.g. Day 18 / 30 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/50 font-medium">
                          Day <strong className="text-white">{c.currentDay}</strong> of {c.totalDays}
                        </span>
                        <span className="text-[#FF4D00] font-bold font-mono">{progressPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF4D00] to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, progressPct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SELECTED CHALLENGE: TODAY'S PROGRESS COHORT ROSTER */}
          <div className="bg-[#101010] border border-white/15 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#FF4D00] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Today's Cohort Progress
                </h3>
                <p className="text-[11px] text-white/50 mt-0.5">{selectedChallenge.title}</p>
              </div>

              {!hasPostedToday && (
                <button
                  onClick={onOpenCreate}
                  className="px-3 py-1.5 rounded-xl bg-[#FF4D00] text-black font-black text-xs flex items-center gap-1 shadow-md hover:bg-[#FF4D00]/90 transition-all active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post Proof</span>
                </button>
              )}
            </div>

            {/* Members Roster List */}
            <div className="space-y-2 divide-y divide-white/5">
              {/* Current user row first */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-[#FF4D00]/40"
                    />
                    {hasPostedToday && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[9px] font-black rounded-full flex items-center justify-center">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      You (@{currentUser.username})
                    </span>
                    <span className="text-[10px] text-white/40">🔥 {currentUser.currentStreak}d Streak</span>
                  </div>
                </div>

                <div>
                  {hasPostedToday ? (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      Posted
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Cohort participants */}
              {selectedChallenge.cohortMembers.map((member, idx) => (
                <div key={idx} className="pt-2.5 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="relative shrink-0 mt-0.5">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-white/10"
                      />
                      {member.hasPostedToday && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[9px] font-black rounded-full flex items-center justify-center">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{member.name}</span>
                        <span className="text-[10px] text-white/40 font-mono">🔥 {member.streak}d</span>
                      </div>
                      {member.hasPostedToday && member.todayReceiptText ? (
                        <p className="text-[11px] text-white/70 italic mt-0.5 line-clamp-1">
                          "{member.todayReceiptText}"
                        </p>
                      ) : (
                        <p className="text-[10px] text-white/30 mt-0.5">
                          ⏳ Waiting for today's proof receipt...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {member.hasPostedToday ? (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Posted
                        </span>
                        {member.todayReceiptTime && (
                          <span className="text-[9px] text-white/30 block mt-0.5">
                            {member.todayReceiptTime}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                        Not yet
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* STREAK CALENDAR & MILESTONES VIEW */
        <div className="space-y-4">
          {/* Hero Streak Card */}
          <div className="bg-gradient-to-br from-[#1c120c] via-[#111111] to-[#0A0A0A] border border-[#FF4D00]/30 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-start justify-between relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Flame className="w-6 h-6 text-[#FF4D00] fill-[#FF4D00] animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#FF4D00]">
                    Current Proof Streak
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                    {currentUser.currentStreak}
                  </span>
                  <span className="text-sm font-bold text-white/50">days in a row</span>
                </div>
                <p className="text-xs text-white/60 pt-1">
                  {hasPostedToday
                    ? "✓ You logged your proof of work today! Tomorrow's check-in unlocks at midnight."
                    : '⏳ You haven’t documented today’s proof of work yet. Post before midnight to keep your streak!'}
                </p>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/40 block">All-time Best</span>
                <span className="text-lg font-black text-white/80">{currentUser.longestStreak} days</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 text-xs text-white/70">
                <Award className="w-4 h-4 text-[#FF4D00]" />
                <span>
                  Next badge: <strong>{MILESTONES.find((m) => m.days > currentUser.currentStreak)?.title || 'Supernova'}</strong> (
                  {(MILESTONES.find((m) => m.days > currentUser.currentStreak)?.days || 100) - currentUser.currentStreak} days to go)
                </span>
              </div>

              {!hasPostedToday && (
                <button
                  onClick={onOpenCreate}
                  className="px-3.5 py-1.5 rounded-full bg-[#FF4D00] text-black font-black text-xs hover:bg-[#FF4D00]/90 transition-all flex items-center gap-1 shadow-md shadow-[#FF4D00]/20"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post Proof</span>
                </button>
              )}
            </div>
          </div>

          {/* Monthly Calendar View */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#FF4D00]" />
                <h3 className="text-sm font-bold text-white">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-white/40 uppercase">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-xs">
              {/* Empty leading days */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-9 sm:h-10 rounded-xl bg-transparent" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const formattedMonth = String(currentMonth + 1).padStart(2, '0');
                const formattedDay = String(dayNum).padStart(2, '0');
                const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

                const isTodayDate = dateStr === today;
                const hasActivity = currentUser.activityDates?.includes(dateStr) || (isTodayDate && hasPostedToday);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateClick(dateStr)}
                    className={`h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 border ${
                      isSelected
                        ? 'ring-2 ring-[#FF4D00] border-[#FF4D00] bg-white/15'
                        : hasActivity
                        ? 'bg-[#FF4D00]/15 border-[#FF4D00]/30 text-white hover:bg-[#FF4D00]/25'
                        : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={`text-xs ${hasActivity ? 'font-bold text-white' : ''}`}>
                      {dayNum}
                    </span>

                    {/* Streak fire icon for active days */}
                    {hasActivity && (
                      <Flame className="w-3 h-3 text-[#FF4D00] fill-[#FF4D00] absolute bottom-1" />
                    )}

                    {/* Today indicator dot */}
                    {isTodayDate && !hasActivity && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/50 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Posts on Selected Date */}
          {selectedDate && (
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-white/50 px-1">
                Receipts from {selectedDate}
              </h4>
              {postsOnSelectedDate.length > 0 ? (
                <div className="space-y-3">
                  {postsOnSelectedDate.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={currentUser}
                      onToggleLike={onToggleLike || (() => {})}
                      onOpenComments={onOpenComments || (() => {})}
                      onToggleSave={onToggleSave}
                      isSaved={savedPostIds.includes(post.id)}
                      onReportPost={onReportPost}
                      isReported={reportedPostIds.includes(post.id)}
                      onSharePost={onSharePost}
                      onOpenInsights={onOpenInsights}
                      onDeletePost={onDeletePost}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-xs text-white/40">
                  No proof receipts logged for this date.
                </div>
              )}
            </div>
          )}

          {/* Milestone Badges */}
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/50">
              Discipline Milestones
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MILESTONES.map((m) => {
                const isUnlocked = currentUser.currentStreak >= m.days || currentUser.longestStreak >= m.days;
                return (
                  <div
                    key={m.days}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-white/5 border-[#FF4D00]/30 text-white'
                        : 'bg-white/[0.02] border-white/5 text-white/30 opacity-60'
                    }`}
                  >
                    <span className="text-2xl p-2 rounded-xl bg-white/5">{m.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{m.title}</span>
                        <span className="text-[10px] font-mono text-[#FF4D00] font-bold">
                          {m.days}d
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate">{m.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
