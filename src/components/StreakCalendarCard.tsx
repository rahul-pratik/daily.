import React, { useState } from 'react';
import { Flame, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, Award, PlusCircle, Sparkles } from 'lucide-react';
import { User, Post } from '../types';
import { getTodayDateString } from '../services/storage';
import { vibrateLight } from '../services/haptics';

interface StreakCalendarCardProps {
  currentUser: User;
  posts: Post[];
  onOpenCreate: () => void;
  onSelectDateFilter?: (date: string | null) => void;
  selectedDateFilter?: string | null;
}

export const StreakCalendarCard: React.FC<StreakCalendarCardProps> = ({
  currentUser,
  posts,
  onOpenCreate,
  onSelectDateFilter,
  selectedDateFilter = null,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-indexed, 7 = August

  const today = getTodayDateString();
  const hasPostedToday = currentUser.lastPostedDate === today;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calculate 7-day rolling week days ending today or current week
  const todayDateObj = new Date();
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(todayDateObj.getDate() - (6 - i));
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const isToday = dateStr === today;
    const hasActivity = currentUser.activityDates?.includes(dateStr) || (isToday && hasPostedToday);
    return {
      dateStr,
      dayName,
      dayNumber: d.getDate(),
      isToday,
      hasActivity,
    };
  });

  // Calendar calculations for expanded view
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    vibrateLight();
    if (onSelectDateFilter) {
      onSelectDateFilter(selectedDateFilter === dateStr ? null : dateStr);
    }
  };

  return (
    <div className="mb-4 rounded-[28px] bg-gradient-to-br from-[#181308] via-[#101010] to-[#0A0A0A] border border-[#D4AF37]/35 shadow-xl shadow-black/60 overflow-hidden transition-all duration-300">
      {/* Top Banner Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 shadow-inner">
              <Flame className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {currentUser.currentStreak} Day Streak
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#D4AF37] text-black px-2 py-0.5 rounded-full">
                  🔥 Active
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                {hasPostedToday
                  ? "✓ Today's proof logged! Momentum locked in."
                  : '⏳ Pending today’s proof. Post before midnight!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasPostedToday ? (
              <button
                onClick={onOpenCreate}
                className="px-3.5 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E5B842] text-black font-black text-xs shrink-0 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20 flex items-center gap-1.5 min-h-[38px]"
              >
                <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Post Proof</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Done</span>
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Rolling Week Strip */}
        <div className="mt-4 pt-3.5 border-t border-white/5">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            {weekDays.map((day) => {
              const isSelected = selectedDateFilter === day.dateStr;
              return (
                <button
                  key={day.dateStr}
                  onClick={() => handleDayClick(day.dateStr)}
                  className={`flex-1 py-2 px-1 rounded-2xl flex flex-col items-center gap-1 transition-all relative border min-h-[56px] ${
                    isSelected
                      ? 'bg-white/20 border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]'
                      : day.isToday
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50'
                      : day.hasActivity
                      ? 'bg-white/5 border-white/10 hover:border-[#D4AF37]/40'
                      : 'bg-white/[0.02] border-white/5 opacity-60 hover:opacity-100'
                  }`}
                  title={`${day.dateStr}: ${day.hasActivity ? 'Proof logged' : 'No proof'}`}
                >
                  <span className="text-[10px] font-bold text-white/40 uppercase">
                    {day.dayName}
                  </span>
                  <span className={`text-xs font-black ${day.isToday ? 'text-[#D4AF37]' : 'text-white'}`}>
                    {day.dayNumber}
                  </span>
                  {day.hasActivity ? (
                    <Flame className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37] shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 my-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle Expand Full Calendar Button */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              vibrateLight();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1.5 text-white/60 hover:text-[#D4AF37] font-semibold transition-colors py-1 px-1.5 rounded-lg"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{isExpanded ? 'Hide Monthly Heatmap' : 'View Monthly Calendar'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {selectedDateFilter && (
            <button
              onClick={() => onSelectDateFilter && onSelectDateFilter(null)}
              className="text-[11px] text-[#D4AF37] hover:underline font-bold"
            >
              Clear Filter ({selectedDateFilter}) ✕
            </button>
          )}

          <div className="text-[11px] text-white/40 font-mono">
            Best: <strong className="text-white/80">{currentUser.longestStreak}d</strong>
          </div>
        </div>
      </div>

      {/* Expanded Monthly Calendar */}
      {isExpanded && (
        <div className="p-4 sm:p-5 bg-black/40 border-t border-white/10 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="text-xs sm:text-sm font-bold text-white">
                {monthNames[currentMonth]} {currentYear}
              </h4>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-white/40 uppercase">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="py-0.5">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8 rounded-lg bg-transparent" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const formattedMonth = String(currentMonth + 1).padStart(2, '0');
              const formattedDay = String(dayNum).padStart(2, '0');
              const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

              const isTodayDate = dateStr === today;
              const hasActivity = currentUser.activityDates?.includes(dateStr) || (isTodayDate && hasPostedToday);
              const isSelected = selectedDateFilter === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-8 sm:h-9 rounded-xl flex flex-col items-center justify-center relative transition-all active:scale-95 border ${
                    isSelected
                      ? 'ring-2 ring-[#D4AF37] border-[#D4AF37] bg-white/20'
                      : hasActivity
                      ? 'bg-[#D4AF37]/20 border-[#D4AF37]/40 text-white font-bold'
                      : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-[11px]">{dayNum}</span>
                  {hasActivity && (
                    <Flame className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37] absolute bottom-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex items-center justify-between text-[10px] text-white/40">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#D4AF37]/30 border border-[#D4AF37]/50 inline-block" />
              Proof verified
            </span>
            <span>Tap any date to filter feed receipts</span>
          </div>
        </div>
      )}
    </div>
  );
};
