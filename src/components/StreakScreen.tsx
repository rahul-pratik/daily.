import React, { useState } from 'react';
import { Flame, Zap, Award, Calendar as CalendarIcon, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, PlusCircle, MessageSquare, Heart, Bookmark, Flag, X, Image as ImageIcon } from 'lucide-react';
import { User, Post } from '../types';
import { getTodayDateString } from '../services/storage';
import { PostCard } from './PostCard';
import { vibrateLight } from '../services/haptics';

interface StreakScreenProps {
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
}

const MILESTONES = [
  { days: 3, title: 'Spark', icon: '✨', desc: '3 consecutive days of showing up' },
  { days: 7, title: 'Week Warrior', icon: '🔥', desc: '1 full week of uninterrupted daily posts' },
  { days: 14, title: 'Blaze Master', icon: '⚡', desc: '2 solid weeks of continuous momentum' },
  { days: 30, title: 'Inferno Legend', icon: '👑', desc: '30-day champion of personal discipline' },
  { days: 100, title: 'Supernova', icon: '🌟', desc: '100 days of legendary consistency' },
];

export const StreakScreen: React.FC<StreakScreenProps> = ({
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
}) => {
  // Calendar month state (August 2026 default or current)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed, 7 = August
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayDateString());

  const today = getTodayDateString();
  const hasPostedToday = currentUser.lastPostedDate === today;

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

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

  // Find posts for selected date
  const postsOnSelectedDate = selectedDate
    ? posts.filter((p) => {
        if (p.userId !== currentUser.id) return false;
        // Direct match by postDate
        if (p.postDate && p.postDate === selectedDate) return true;
        // If today and post has no postDate
        if (selectedDate === today && p.createdAt.includes('Today')) return true;
        return false;
      })
    : [];

  const handleDateClick = (dateStr: string) => {
    vibrateLight();
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  return (
    <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* Hero Streak Card */}
      <div className="relative overflow-hidden rounded-[32px] bg-white/5 border border-[#FF4D00]/30 p-6 text-center shadow-2xl shadow-[#FF4D00]/5">
        {/* Glow orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#FF4D00]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Animated flame emblem */}
        <div className="relative inline-flex items-center justify-center mb-3">
          <div className="w-20 h-20 rounded-full bg-[#FF4D00]/10 border border-[#FF4D00]/30 flex items-center justify-center shadow-lg shadow-[#FF4D00]/20">
            <Flame className="w-10 h-10 text-[#FF4D00] fill-[#FF4D00] animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <span>🔥</span> {currentUser.currentStreak} Day Streak
        </h1>

        <p className="text-xs text-white/60 mt-1 max-w-xs mx-auto">
          {hasPostedToday
            ? '🔥 You completed today’s check-in! Streak secured.'
            : '⚠️ Post your daily update before midnight to keep your streak alive!'}
        </p>

        {/* Check-in CTA Button if not done today */}
        {!hasPostedToday && (
          <button
            onClick={onOpenCreate}
            className="mt-4 px-6 py-3 rounded-2xl bg-[#FF4D00] text-black font-black text-xs inline-flex items-center gap-2 hover:bg-[#ff5d19] active:scale-95 transition-all shadow-lg shadow-[#FF4D00]/25"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post Today’s Update</span>
          </button>
        )}
      </div>

      {/* Stats 3-Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
          <div className="w-7 h-7 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center mx-auto mb-1.5">
            <Flame className="w-4 h-4 text-[#FF4D00] fill-[#FF4D00]" />
          </div>
          <span className="text-lg font-black text-white block">{currentUser.currentStreak}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Current</span>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center mx-auto mb-1.5">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black text-white block">{currentUser.longestStreak}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Longest</span>
        </div>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 text-center">
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center mx-auto mb-1.5">
            <Award className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-black text-white block">{currentUser.totalPosts}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Total Posts</span>
        </div>
      </div>

      {/* Calendar Activity Heatmap */}
      <div className="bg-white/5 border border-white/5 rounded-[32px] p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-white">Activity History</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white/70">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-2 min-w-[36px] min-h-[36px] rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-colors flex items-center justify-center active:scale-95"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 min-w-[36px] min-h-[36px] rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-colors flex items-center justify-center active:scale-95"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
            <span key={idx} className="text-[10px] font-bold text-white/30 uppercase tracking-widest py-1">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty padding slots before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNumber = idx + 1;
            const formattedMonth = String(currentMonth + 1).padStart(2, '0');
            const formattedDay = String(dayNumber).padStart(2, '0');
            const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

            const isActive = currentUser.activityDates.includes(dateStr);
            const isToday = dateStr === today;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'bg-[#FF4D00] text-black font-black shadow-md shadow-[#FF4D00]/20 hover:scale-105'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                } ${isToday ? 'ring-2 ring-[#FF4D00]' : ''} ${
                  isSelected ? 'ring-2 ring-white scale-105 z-10' : ''
                }`}
                aria-label={`View entry for ${dateStr}`}
              >
                <span className={`text-[11px] ${isActive ? 'font-black' : 'font-medium'}`}>
                  {dayNumber}
                </span>
                {isActive && (
                  <Flame className="w-2.5 h-2.5 fill-black text-black absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Detail & Posts View */}
        {selectedDate && (
          <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/80 animate-in fade-in space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center text-[#FF4D00]">
                  <CalendarIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">
                    {selectedDate}
                  </span>
                  <span className="text-[10px] text-white/40">
                    {currentUser.activityDates.includes(selectedDate)
                      ? 'Activity Recorded'
                      : 'No Record'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    currentUser.activityDates.includes(selectedDate)
                      ? 'bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/30'
                      : 'bg-white/5 text-white/40'
                  }`}
                >
                  {currentUser.activityDates.includes(selectedDate)
                    ? '🔥 Streak Active'
                    : 'Missed Day'}
                </span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close day view"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content posted on this day */}
            {postsOnSelectedDate.length > 0 ? (
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-bold text-white/70 block uppercase tracking-wider">
                  What you posted on this day:
                </span>
                {postsOnSelectedDate.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onToggleLike={onToggleLike}
                    onOpenComments={onOpenComments}
                    onToggleFollow={() => {}}
                    onSendDM={() => {}}
                    isSaved={savedPostIds.includes(post.id)}
                    onToggleSave={onToggleSave}
                    onReportPost={onReportPost}
                    isReported={reportedPostIds.includes(post.id)}
                    onSharePost={onSharePost}
                  />
                ))}
              </div>
            ) : currentUser.activityDates.includes(selectedDate) ? (
              <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Daily check-in completed</span>
                </div>
                <p className="text-[11px] text-white/50">
                  You logged your habit and maintained your streak for this day.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center space-y-2">
                <p className="text-[11px] text-white/50">
                  No post was recorded on this date.
                </p>
                {selectedDate === today && (
                  <button
                    onClick={onOpenCreate}
                    className="px-4 py-2 rounded-xl bg-[#FF4D00] text-black font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-[#FF4D00]/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Post Check-in for Today</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-[#FF4D00]" />
            <span>Streak Maintained</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-white/5 border border-white/10" />
            <span>No Post</span>
          </div>
        </div>
      </div>

      {/* Streak Milestones Roadmap */}
      <div className="bg-white/5 border border-white/5 rounded-[32px] p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#FF4D00]" />
          <h2 className="font-bold text-sm text-white">Streak Milestones</h2>
        </div>

        <div className="space-y-2.5">
          {MILESTONES.map((m) => {
            const isUnlocked = currentUser.currentStreak >= m.days;
            return (
              <div
                key={m.days}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  isUnlocked
                    ? 'bg-white/5 border-[#FF4D00]/30'
                    : 'bg-white/[0.02] border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                      isUnlocked
                        ? 'bg-[#FF4D00]/10 border border-[#FF4D00]/30 text-[#FF4D00]'
                        : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {m.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">{m.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 font-semibold">
                        {m.days} Days
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5">{m.desc}</p>
                  </div>
                </div>

                {isUnlocked ? (
                  <span className="text-[10px] font-bold text-[#FF4D00] bg-[#FF4D00]/10 px-2 py-1 rounded-full border border-[#FF4D00]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-white/40">
                    {m.days - currentUser.currentStreak}d left
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
