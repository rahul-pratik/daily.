import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  BookOpen,
  Flame,
  MessageCircle,
  Users,
  Trophy,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  Sparkles,
  Share2,
  PenTool,
  RotateCcw,
  Tag,
  Hash,
} from 'lucide-react';
import { User, Post, ChallengeProgressPost, PersonalHabit } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';

interface DailyDiaryNotebookProps {
  user: User;
  initialDate?: string;
  onClose?: () => void;
  onOpenCreatePost?: () => void;
  onOpenChatWithUser?: (userId: string) => void;
}

export const DailyDiaryNotebook: React.FC<DailyDiaryNotebookProps> = ({
  user,
  initialDate,
  onClose,
  onOpenCreatePost,
  onOpenChatWithUser,
}) => {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Helper to add/subtract days
  const changeDay = (delta: number) => {
    setFlipDirection(delta > 0 ? 'next' : 'prev');
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + delta);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const jumpToToday = () => {
    setFlipDirection(selectedDate < todayStr ? 'next' : 'prev');
    setSelectedDate(todayStr);
  };

  // Get aggregated data for the current day
  const dayData = useMemo(() => {
    return DailyStorageService.getDayActivityData(selectedDate, user.id);
  }, [selectedDate, user.id]);

  const isToday = selectedDate === todayStr;

  // Calculate day index relative to today
  const dayDiffFromToday = useMemo(() => {
    const partsToday = todayStr.split('-').map(Number);
    const partsSel = selectedDate.split('-').map(Number);
    const dToday = new Date(partsToday[0], partsToday[1] - 1, partsToday[2]);
    const dSel = new Date(partsSel[0], partsSel[1] - 1, partsSel[2]);
    const diffTime = dToday.getTime() - dSel.getTime();
    return Math.round(diffTime / (1000 * 3600 * 24));
  }, [selectedDate, todayStr]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Top Leather Binder Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1c140d]/90 border border-[#8b5a2b]/30 rounded-2xl p-3 sm:p-4 text-amber-100 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-900/40 border border-amber-600/40 flex items-center justify-center text-amber-300 shadow-inner">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200 tracking-wide flex items-center gap-2">
              <span>Personal Daily Diary</span>
              <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/40 text-amber-300">
                {isToday ? 'Today' : dayDiffFromToday > 0 ? `${dayDiffFromToday}d ago` : `+${Math.abs(dayDiffFromToday)}d`}
              </span>
            </h2>
            <p className="text-xs text-amber-300/60 font-serif italic">
              {dayData.formattedDate}
            </p>
          </div>
        </div>

        {/* Navigation buttons: Flip backward (prev), jump to today, flip forward (next) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDay(-1)}
            className="px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/40 text-amber-200 text-xs font-serif font-bold flex items-center gap-1.5 transition-all shadow active:scale-95 min-h-[40px]"
            title="Turn to Previous Day"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Previous Day</span>
          </button>

          {!isToday && (
            <button
              onClick={jumpToToday}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-sans font-black flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 min-h-[40px]"
              title="Jump to Today's Diary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/40 text-amber-200 text-xs flex items-center justify-center transition-all min-h-[40px] min-w-[40px]"
              title="Select Specific Date"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 top-12 bg-[#2a1a0e] border border-amber-700/60 rounded-2xl p-3 shadow-2xl z-30 animate-in fade-in text-white min-w-[220px]">
                <label className="text-[11px] font-sans font-bold text-amber-300 block mb-1.5">
                  Pick a diary entry date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedDate(e.target.value);
                      setShowDatePicker(false);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#170e07] border border-amber-700/40 rounded-xl text-xs text-amber-100 font-mono outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          <button
            onClick={() => changeDay(1)}
            className="px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-700/40 text-amber-200 text-xs font-serif font-bold flex items-center gap-1.5 transition-all shadow active:scale-95 min-h-[40px]"
            title="Turn to Next Day"
          >
            <span className="hidden sm:inline">Next Day</span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs ml-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* VINTAGE BINDER NOTEBOOK SPREAD (Matching Photo 2) */}
      <div className="relative rounded-[28px] p-2 sm:p-5 bg-gradient-to-b from-[#3a2012] via-[#28150a] to-[#1a0c05] shadow-2xl border-4 border-[#523018]">
        {/* Leather Stitched Border Accent */}
        <div className="absolute inset-1.5 border border-dashed border-[#8c572e]/40 rounded-[24px] pointer-events-none" />

        {/* Notebook Main Open Spread Container */}
        <div className="relative bg-[#f7f2e4] rounded-[20px] shadow-2xl overflow-hidden min-h-[560px] border border-[#d2c29d] flex flex-col md:flex-row">
          {/* Subtle Paper Grain & Lined Ruled Texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
            style={{
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 27px,
                rgba(180, 160, 130, 0.35) 28px
              )`,
            }}
          />

          {/* Center Metal Binder Rings (Desktop / Tablet view) */}
          <div className="hidden md:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 z-20 flex-col justify-around items-center pointer-events-none py-12">
            {[1, 2, 3, 4].map((ring) => (
              <div key={ring} className="relative flex items-center justify-center w-full">
                {/* Left Hole */}
                <div className="w-3 h-3 rounded-full bg-[#3d2716] shadow-inner -mr-1" />
                {/* Silver Metal Ring Curved Highlight */}
                <div className="w-10 h-3.5 bg-gradient-to-r from-neutral-400 via-neutral-100 to-neutral-500 rounded-full shadow-lg border border-neutral-600/60 z-10" />
                {/* Right Hole */}
                <div className="w-3 h-3 rounded-full bg-[#3d2716] shadow-inner -ml-1" />
              </div>
            ))}
            {/* Center Crease Shadow */}
            <div className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-black/15 via-black/25 to-black/15 pointer-events-none -z-0" />
          </div>

          {/* Animated Page Spread Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDate}
              initial={{
                opacity: 0,
                x: flipDirection === 'next' ? 25 : -25,
                rotateY: flipDirection === 'next' ? 4 : -4,
              }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{
                opacity: 0,
                x: flipDirection === 'next' ? -25 : 25,
                rotateY: flipDirection === 'next' ? -4 : 4,
              }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full flex flex-col md:flex-row divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#d9cbb2]"
            >
              {/* --- LEFT PAGE: Main Discipline Proof & Community Contributions --- */}
              <div className="flex-1 p-5 sm:p-7 text-[#2c1d11] space-y-5 relative">
                {/* Red Vintage Left Margin Line */}
                <div className="absolute top-0 bottom-0 left-4 w-px bg-red-400/30 hidden sm:block pointer-events-none" />

                {/* Left Page Header */}
                <div className="border-b-2 border-[#b89b72]/40 pb-3 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#8a6b47] font-bold">
                      ENTRY DATE • {dayData.dayOfWeek}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-[#2e1c0c] tracking-tight leading-tight">
                      {dayData.formattedDate}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-serif italic text-sm text-[#8a6b47]">Pg.</span>
                    <span className="font-serif font-bold text-lg text-[#3d2716] ml-1">
                      {Math.max(1, 49 - dayDiffFromToday)}
                    </span>
                  </div>
                </div>

                {/* 1. Main Discipline Proof Card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-700" />
                      <span>Daily Proof Submission</span>
                    </h4>
                    {dayData.mainPost && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-700/10 text-emerald-900 border border-emerald-700/30">
                        VERIFIED PROOF ✓
                      </span>
                    )}
                  </div>

                  {dayData.mainPost ? (
                    <div className="bg-[#ede4d0] border border-[#c7b38d] rounded-2xl p-4 shadow-sm relative space-y-3">
                      {/* Wax Seal Stamp Accent */}
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-red-800/80 border border-red-950 text-red-100 flex items-center justify-center text-[9px] font-serif font-bold shadow-md transform rotate-12">
                        SEAL
                      </div>

                      {/* Polaroid Photo Frame if post has an image */}
                      {dayData.mainPost.imageUrl && (
                        <div className="bg-white p-2.5 rounded-xl shadow-md border border-[#c4b595] transform -rotate-1 max-w-[280px] mx-auto sm:mx-0">
                          {/* Washi Tape Accent */}
                          <div className="w-16 h-3.5 bg-amber-200/80 border border-amber-300/90 mx-auto -mt-4 mb-1.5 shadow-sm transform rotate-2 rounded-sm" />
                          <img
                            src={dayData.mainPost.imageUrl}
                            alt="Discipline Proof"
                            className="w-full h-44 object-cover rounded-lg border border-neutral-200"
                            referrerPolicy="no-referrer"
                          />
                          <div className="mt-1.5 text-center text-[10px] font-serif italic text-neutral-600">
                            Logged proof • {dayData.mainPost.createdAt}
                          </div>
                        </div>
                      )}

                      {/* Handwritten Post Reflection */}
                      <div className="font-serif italic text-sm text-[#382312] leading-relaxed pl-1 pt-1">
                        "{dayData.mainPost.content}"
                      </div>

                      {/* Tags & Stats */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#c7b38d]/50">
                        {dayData.mainPost.tags?.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#dac8a2] text-[#4a3018] font-bold"
                          >
                            #{t}
                          </span>
                        ))}
                        <span className="text-[10px] font-mono text-[#7a5c3d] ml-auto">
                          ❤️ {dayData.mainPost.likesCount} cheers • 💬 {dayData.mainPost.comments?.length || 0} notes
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Empty Proof Fallback */
                    <div className="bg-[#f0e8d5] border border-dashed border-[#b89b72] rounded-2xl p-5 text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-[#dfd0b5] flex items-center justify-center text-[#73522f] mx-auto">
                        <PenTool className="w-4 h-4" />
                      </div>
                      <p className="font-serif italic text-sm text-[#664b2d]">
                        "No public discipline proof logged in the registry for this day. Quiet focus or restorative rest."
                      </p>
                      {isToday && onOpenCreatePost && (
                        <button
                          onClick={onOpenCreatePost}
                          className="mt-2 px-4 py-1.5 rounded-xl bg-[#543419] hover:bg-[#3d2410] text-[#f7eedc] text-xs font-serif font-bold transition-colors inline-flex items-center gap-1.5 shadow"
                        >
                          <PenTool className="w-3.5 h-3.5 text-amber-300" />
                          <span>Write & Log Today's Proof</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Community Contributions Section */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#8a5d30]" />
                    <span>Community Circles Active ({dayData.communityPosts.length})</span>
                  </h4>

                  {dayData.communityPosts.length > 0 ? (
                    <div className="space-y-2">
                      {dayData.communityPosts.map((cp) => (
                        <div
                          key={cp.id}
                          className="bg-[#ede4d0] border border-[#c7b38d] rounded-xl p-2.5 text-xs font-serif text-[#332011] flex items-start gap-2.5"
                        >
                          <div className="w-6 h-6 rounded-lg bg-amber-800/20 text-amber-900 font-bold flex items-center justify-center shrink-0 mt-0.5">
                            <Hash className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-[#2e1a0b] block truncate">
                              {cp.communityName || 'Community Hub'}
                            </span>
                            <p className="italic text-[#593d24] text-[11px] line-clamp-2 mt-0.5">
                              {cp.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-serif italic text-[#8c704f] pl-1">
                      No community thread entries on this date.
                    </div>
                  )}
                </div>
              </div>

              {/* --- RIGHT PAGE: Challenges, Conversations & Habits --- */}
              <div className="flex-1 p-5 sm:p-7 text-[#2c1d11] space-y-5 relative">
                {/* Right Page Header */}
                <div className="border-b-2 border-[#b89b72]/40 pb-3 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#8a6b47] font-bold">
                      ENGAGEMENT & CIRCLES
                    </span>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#2e1c0c] tracking-tight">
                      Daily Summary & Checkpoints
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-serif italic text-sm text-[#8a6b47]">Pg.</span>
                    <span className="font-serif font-bold text-lg text-[#3d2716] ml-1">
                      {Math.max(2, 50 - dayDiffFromToday)}
                    </span>
                  </div>
                </div>

                {/* 3. Challenge Progress Checkpoints */}
                <div className="space-y-2">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-700" />
                    <span>Challenge Checkpoints ({dayData.challengePosts.length})</span>
                  </h4>

                  {dayData.challengePosts.length > 0 ? (
                    <div className="space-y-2">
                      {dayData.challengePosts.map((ch) => (
                        <div
                          key={ch.id}
                          className="bg-[#ede4d0] border border-[#c7b38d] rounded-xl p-2.5 flex items-start gap-2.5 shadow-sm"
                        >
                          {ch.imageUrl && (
                            <img
                              src={ch.imageUrl}
                              alt="Challenge check"
                              className="w-12 h-12 object-cover rounded-lg border border-[#b89b72] shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-serif font-bold text-[#2b1708]">
                                Day {ch.dayNumber} Check-in
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-200/60 px-1.5 py-0.5 rounded">
                                🔥 Completed
                              </span>
                            </div>
                            {ch.text && (
                              <p className="text-[11px] font-serif italic text-[#4a311c] mt-0.5 line-clamp-2">
                                "{ch.text}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-serif italic text-[#8c704f] pl-1">
                      No challenge check-in submitted for this day.
                    </div>
                  )}
                </div>

                {/* 4. Conversations & Circles Talked With */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#8a5d30]" />
                    <span>People & Groups Talked With ({dayData.conversations.length})</span>
                  </h4>

                  {dayData.conversations.length > 0 ? (
                    <div className="space-y-2">
                      {dayData.conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => {
                            if (!conv.isGroup && onOpenChatWithUser) {
                              onOpenChatWithUser(conv.id);
                            }
                          }}
                          className="bg-[#ede4d0] hover:bg-[#e4d9c0] border border-[#c7b38d] rounded-xl p-2.5 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <img
                            src={conv.avatar}
                            alt={conv.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#b89b72] shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-serif font-bold text-[#2e1909] truncate">
                                {conv.name} {conv.isGroup && '👥'}
                              </span>
                              <span className="text-[10px] font-mono text-[#8a6b47] shrink-0">
                                {conv.time}
                              </span>
                            </div>
                            <p className="text-[11px] font-serif italic text-[#593d24] truncate mt-0.5">
                              "{conv.lastMessageText}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-serif italic text-[#8c704f] pl-1">
                      No direct messages logged on this date.
                    </div>
                  )}
                </div>

                {/* 5. Daily Habits Checked */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                    <span>Habits Executed ({dayData.completedHabits.length})</span>
                  </h4>

                  {dayData.completedHabits.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {dayData.completedHabits.map((habit) => (
                        <div
                          key={habit.id}
                          className="bg-[#ede4d0] border border-[#c7b38d] rounded-xl px-2.5 py-1.5 flex items-center gap-2 text-xs font-serif text-[#332011]"
                        >
                          <span className="text-sm">{habit.icon}</span>
                          <span className="truncate flex-1 font-medium">{habit.title}</span>
                          <span className="text-emerald-800 font-bold">✓</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-serif italic text-[#8c704f] pl-1">
                      No habit tracker items checked for this date.
                    </div>
                  )}
                </div>

                {/* Bottom Vintage Inscription & Stamp */}
                <div className="pt-3 border-t-2 border-[#b89b72]/40 flex items-center justify-between text-[11px] font-serif italic text-[#735332]">
                  <span>Chronicle of Alex Rivera</span>
                  <div className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#ded0b6] text-[#4a321c]">
                    Total Signals: {dayData.totalActivityCount}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
