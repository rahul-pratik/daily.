import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Clock,
  Sparkles,
  RotateCcw,
  Tag,
  Hash,
  Award,
  Bookmark,
  BookmarkCheck,
  Send,
  Check,
  Volume2,
  VolumeX,
  Search,
  X,
  Filter,
  TrendingUp,
  Activity,
  Zap,
  PenTool,
  Share2,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { User, Post, ChallengeProgressPost, PersonalHabit } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone, vibrateSuccess } from '../services/haptics';
import {
  playPageTurnSound,
  playBookmarkSound,
  isDiarySoundEnabled,
  setDiarySoundEnabled,
} from '../services/diaryAudio';

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
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Audio & Sound FX Toggle
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isDiarySoundEnabled());

  // Search & Filter State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilterType, setSearchFilterType] = useState<
    'all' | 'proofs' | 'habits' | 'community' | 'chats' | 'high_score'
  >('all');

  // Bookmarks State
  const [isBookmarksDrawerOpen, setIsBookmarksDrawerOpen] = useState(false);
  const [bookmarkedDays, setBookmarkedDays] = useState<
    Array<{ dateStr: string; note?: string; formattedDate: string; createdAt: string }>
  >(() => DailyStorageService.getBookmarkedDiaryDays(user.id));
  const [bookmarkCustomNoteModal, setBookmarkCustomNoteModal] = useState<string | null>(null);
  const [customBookmarkNoteText, setCustomBookmarkNoteText] = useState('');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const isCurrentDayBookmarked = useMemo(() => {
    return bookmarkedDays.some((b) => b.dateStr === selectedDate);
  }, [bookmarkedDays, selectedDate]);

  const currentBookmarkObj = useMemo(() => {
    return bookmarkedDays.find((b) => b.dateStr === selectedDate);
  }, [bookmarkedDays, selectedDate]);

  const showToast = (text: string) => {
    setNotificationToast(text);
    setTimeout(() => {
      setNotificationToast(null);
    }, 2400);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    setDiarySoundEnabled(next);
    vibrateLight();
    if (next) {
      playPageTurnSound('next');
    }
    showToast(next ? 'Sound FX Enabled 🔊' : 'Sound FX Muted 🔇');
  };

  // Helper to add/subtract days
  const changeDay = (delta: number) => {
    const dir = delta > 0 ? 'next' : 'prev';
    vibrateLight();
    playPageTurnSound(dir);
    setFlipDirection(dir);
    setIsFlipping(true);
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + delta);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setTimeout(() => setIsFlipping(false), 450);
  };

  const jumpToDate = (targetDate: string) => {
    if (targetDate === selectedDate) return;
    const dir = targetDate > selectedDate ? 'next' : 'prev';
    vibrateLight();
    playPageTurnSound(dir);
    setFlipDirection(dir);
    setIsFlipping(true);
    setSelectedDate(targetDate);
    setIsSearchOpen(false);
    setIsBookmarksDrawerOpen(false);
    setShowDatePicker(false);
    setTimeout(() => setIsFlipping(false), 450);
  };

  const jumpToToday = () => {
    jumpToDate(todayStr);
  };

  const handleToggleBookmark = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const willBookmark = !isCurrentDayBookmarked;
    vibrateSuccess();
    playBookmarkSound(willBookmark);
    const result = DailyStorageService.toggleBookmarkDiaryDay(selectedDate, undefined, user.id);
    setBookmarkedDays(result.allBookmarks);
    showToast(result.isBookmarked ? 'Day Bookmarked for Quick Reference 🔖' : 'Bookmark Removed');
  };

  const handleSaveCustomBookmarkNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmarkCustomNoteModal) return;
    DailyStorageService.updateBookmarkNote(bookmarkCustomNoteModal, customBookmarkNoteText.trim(), user.id);
    setBookmarkedDays(DailyStorageService.getBookmarkedDiaryDays(user.id));
    setBookmarkCustomNoteModal(null);
    vibrateLight();
    showToast('Bookmark Note Saved ✍️');
  };

  // Get aggregated data for the current day
  const dayData = useMemo(() => {
    return DailyStorageService.getDayActivityData(selectedDate, user.id);
  }, [selectedDate, user.id]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() && searchFilterType === 'all') return [];
    return DailyStorageService.searchDiaryEntries(searchQuery, user.id, searchFilterType);
  }, [searchQuery, searchFilterType, user.id]);

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

  // Realistic 3D Page flip variants
  const pageFlipVariants = {
    initial: (dir: 'next' | 'prev') => ({
      rotateY: dir === 'next' ? 65 : -65,
      opacity: 0.6,
      scale: 0.98,
      boxShadow:
        dir === 'next'
          ? '-25px 0 35px -10px rgba(0,0,0,0.45)'
          : '25px 0 35px -10px rgba(0,0,0,0.45)',
    }),
    animate: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      boxShadow: '0 15px 30px -5px rgba(0,0,0,0.15)',
      transition: {
        duration: 0.42,
      },
    },
    exit: (dir: 'next' | 'prev') => ({
      rotateY: dir === 'next' ? -65 : 65,
      opacity: 0.4,
      scale: 0.98,
      boxShadow:
        dir === 'next'
          ? '25px 0 35px -10px rgba(0,0,0,0.45)'
          : '-25px 0 35px -10px rgba(0,0,0,0.45)',
      transition: {
        duration: 0.38,
      },
    }),
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 relative">
      {/* Floating Notification Toast */}
      {notificationToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-[#D4AF37] text-black font-black text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Top Leather Binder Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1c140d]/95 border border-[#8b5a2b]/40 rounded-2xl p-3 sm:p-4 text-amber-100 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-900/50 border border-amber-600/40 flex items-center justify-center text-amber-300 shadow-inner">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-amber-200 tracking-wide flex items-center gap-2">
              <span>Personal Daily Diary</span>
              <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-full bg-amber-950/90 border border-amber-600/40 text-amber-300">
                {isToday
                  ? 'Today'
                  : dayDiffFromToday > 0
                  ? `${dayDiffFromToday}d ago`
                  : `+${Math.abs(dayDiffFromToday)}d`}
              </span>
            </h2>
            <p className="text-xs text-amber-300/70 font-serif italic">
              {dayData.formattedDate} • Score: {dayData.disciplineScore}%
            </p>
          </div>
        </div>

        {/* Primary Controls & Tools in Header */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Sound FX Toggle Button */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border text-xs flex items-center justify-center transition-all min-h-[38px] min-w-[38px] ${
              soundEnabled
                ? 'bg-amber-900/70 hover:bg-amber-800 text-amber-200 border-amber-600/50'
                : 'bg-black/40 text-amber-500/40 border-amber-900/30 hover:text-amber-300'
            }`}
            title={soundEnabled ? 'Page Turn Sound FX: Enabled (Click to Mute)' : 'Page Turn Sound FX: Muted (Click to Enable)'}
            aria-label="Toggle Page Turning Sound Effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-300" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Search Button */}
          <button
            onClick={() => {
              vibrateLight();
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen) setIsBookmarksDrawerOpen(false);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-serif font-bold flex items-center gap-1.5 transition-all min-h-[38px] ${
              isSearchOpen
                ? 'bg-amber-400 text-black border-amber-300 shadow-md font-black'
                : 'bg-amber-950/70 hover:bg-amber-900/90 text-amber-200 border-amber-700/50'
            }`}
            title="Search Diary by keywords, habits, or interactions"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Bookmarked Days Selector Button */}
          <button
            onClick={() => {
              vibrateLight();
              setIsBookmarksDrawerOpen(!isBookmarksDrawerOpen);
              if (!isBookmarksDrawerOpen) setIsSearchOpen(false);
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-serif font-bold flex items-center gap-1.5 transition-all min-h-[38px] ${
              isBookmarksDrawerOpen
                ? 'bg-[#D4AF37] text-black border-[#e0be48] shadow-md font-black'
                : 'bg-amber-950/70 hover:bg-amber-900/90 text-amber-200 border-amber-700/50'
            }`}
            title="View Bookmarked Days & Milestone Records"
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarkedDays.length > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Bookmarks ({bookmarkedDays.length})</span>
          </button>

          {/* Date Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2 rounded-xl bg-amber-950/70 hover:bg-amber-900/90 border border-amber-700/50 text-amber-200 text-xs flex items-center justify-center transition-all min-h-[38px] min-w-[38px]"
              title="Pick Date from Calendar"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 top-12 bg-[#2a1a0e] border border-amber-700/60 rounded-2xl p-3 shadow-2xl z-40 animate-in fade-in text-white min-w-[220px]">
                <label className="text-[11px] font-sans font-bold text-amber-300 block mb-1.5">
                  Jump to diary entry date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      jumpToDate(e.target.value);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#170e07] border border-amber-700/40 rounded-xl text-xs text-amber-100 font-mono outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Turn Previous Day */}
          <button
            onClick={() => changeDay(-1)}
            disabled={isFlipping}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/90 border border-amber-700/50 text-amber-200 text-xs font-serif font-bold flex items-center gap-1 transition-all shadow-md active:scale-95 min-h-[38px] disabled:opacity-50"
            title="Turn to Previous Day (3D Flip & Sound)"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Jump to Today button */}
          {!isToday && (
            <button
              onClick={jumpToToday}
              disabled={isFlipping}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#e0be48] text-black text-xs font-sans font-black flex items-center gap-1 shadow-md shadow-[#D4AF37]/25 active:scale-95 min-h-[38px]"
              title="Jump to Today's Diary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>
          )}

          {/* Turn Next Day */}
          <button
            onClick={() => changeDay(1)}
            disabled={isFlipping}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-950/70 hover:bg-amber-900/90 border border-amber-700/50 text-amber-200 text-xs font-serif font-bold flex items-center gap-1 transition-all shadow-md active:scale-95 min-h-[38px] disabled:opacity-50"
            title="Turn to Next Day (3D Flip & Sound)"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs ml-1 min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Close Diary"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* SEARCH DRAWER PANEL */}
      {isSearchOpen && (
        <div className="bg-[#24150c] border border-amber-700/60 rounded-3xl p-4 sm:p-5 shadow-2xl text-amber-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-serif font-bold text-amber-200">
                Search Chronicle & Filter Diary
              </h3>
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="text-amber-400/60 hover:text-amber-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword (e.g. 'marathon', 'coding', habit name, community)..."
              className="w-full px-4 py-2.5 pl-10 bg-[#150a04] border border-amber-700/50 focus:border-amber-400 rounded-2xl text-xs text-amber-100 placeholder-amber-500/40 outline-none"
              autoFocus
            />
            <Search className="w-4 h-4 text-amber-500/50 absolute left-3.5 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-amber-500 hover:text-amber-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] uppercase font-mono text-amber-500 font-bold mr-1 shrink-0">
              Filter:
            </span>
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'proofs', label: 'Proofs' },
              { id: 'habits', label: 'Habits' },
              { id: 'community', label: 'Community' },
              { id: 'chats', label: 'Conversations' },
              { id: 'high_score', label: 'High Score (≥80%)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  vibrateLight();
                  setSearchFilterType(f.id as any);
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-sans font-bold whitespace-nowrap transition-all ${
                  searchFilterType === f.id
                    ? 'bg-amber-400 text-black shadow-sm font-black'
                    : 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 no-scrollbar pt-1">
            {searchResults.length > 0 ? (
              searchResults.map((res) => {
                const isSelected = res.dateStr === selectedDate;
                return (
                  <div
                    key={res.dateStr}
                    onClick={() => jumpToDate(res.dateStr)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-900/60 border-amber-400 text-amber-100'
                        : 'bg-[#180d07] border-amber-800/30 hover:border-amber-600 hover:bg-amber-950/40 text-amber-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-xs text-amber-100">
                          {res.formattedDate}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-900/70 text-amber-300 border border-amber-700/40">
                          Score: {res.dayData.disciplineScore}%
                        </span>
                        {res.dateStr === todayStr && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#D4AF37] text-black">
                            TODAY
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-amber-300/80 italic line-clamp-1 mt-0.5">
                        {res.matchedSnippets[0] || 'Activities logged on this date'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold shrink-0">
                      <span>Jump</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })
            ) : searchQuery || searchFilterType !== 'all' ? (
              <div className="text-center py-5 text-xs text-amber-400/60 italic font-serif">
                No matching chronicle entries found for "{searchQuery}".
              </div>
            ) : (
              <div className="text-center py-3 text-[11px] text-amber-500/60 italic font-serif">
                Type a keyword above to scan past 60 days of proofs, habits, or interactions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOOKMARKS DRAWER PANEL */}
      {isBookmarksDrawerOpen && (
        <div className="bg-[#24150c] border border-amber-700/60 rounded-3xl p-4 sm:p-5 shadow-2xl text-amber-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-amber-800/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 fill-amber-400 text-amber-400" />
              <h3 className="text-sm font-serif font-bold text-amber-200">
                Bookmarked Days & Significant Milestones ({bookmarkedDays.length})
              </h3>
            </div>
            <button
              onClick={() => setIsBookmarksDrawerOpen(false)}
              className="text-amber-400/60 hover:text-amber-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 no-scrollbar">
            {bookmarkedDays.length > 0 ? (
              bookmarkedDays.map((bm) => {
                const isSelected = bm.dateStr === selectedDate;
                return (
                  <div
                    key={bm.dateStr}
                    onClick={() => jumpToDate(bm.dateStr)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-900/60 border-amber-400 text-amber-100'
                        : 'bg-[#180d07] border-amber-800/30 hover:border-amber-600 hover:bg-amber-950/40 text-amber-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-amber-950 border border-amber-700/40 text-amber-400 shrink-0 mt-0.5">
                        <Bookmark className="w-4 h-4 fill-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-xs text-amber-100">
                            {bm.formattedDate}
                          </span>
                          {bm.dateStr === todayStr && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#D4AF37] text-black">
                              TODAY
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-amber-300/90 italic font-serif mt-0.5 truncate">
                          "{bm.note || 'Milestone Record'}"
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          vibrateLight();
                          setBookmarkCustomNoteModal(bm.dateStr);
                          setCustomBookmarkNoteText(bm.note || '');
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-amber-300 text-[10px] font-serif border border-amber-700/30"
                        title="Edit Note"
                      >
                        Edit Note
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          vibrateLight();
                          const result = DailyStorageService.toggleBookmarkDiaryDay(bm.dateStr, undefined, user.id);
                          setBookmarkedDays(result.allBookmarks);
                          showToast('Bookmark removed');
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30"
                        title="Delete Bookmark"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-amber-400/60 italic font-serif">
                No bookmarked days yet. Click the gold ribbon bookmark icon on any page to pin significant milestones!
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOM BOOKMARK NOTE MODAL */}
      {bookmarkCustomNoteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setBookmarkCustomNoteModal(null)}
        >
          <div
            className="w-full max-w-sm bg-[#1c140d] border border-amber-700/60 rounded-3xl p-5 shadow-2xl text-amber-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-amber-800/40 pb-2">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 fill-amber-400 text-amber-400" />
                <h4 className="font-serif font-bold text-sm text-amber-200">
                  Bookmark Note for {bookmarkCustomNoteModal}
                </h4>
              </div>
              <button
                onClick={() => setBookmarkCustomNoteModal(null)}
                className="text-amber-400/50 hover:text-amber-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomBookmarkNote} className="space-y-3">
              <div>
                <label className="text-[11px] font-serif italic text-amber-300 block mb-1">
                  Why is this day significant?
                </label>
                <input
                  type="text"
                  value={customBookmarkNoteText}
                  onChange={(e) => setCustomBookmarkNoteText(e.target.value)}
                  placeholder="e.g. Hit 50-day streak, 10k Run PR, Launched Beta..."
                  className="w-full px-3 py-2 bg-[#100703] border border-amber-700/50 focus:border-amber-400 rounded-xl text-xs text-amber-100 outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBookmarkCustomNoteModal(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 text-xs font-serif"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#e0be48] text-black text-xs font-black"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3D BOOK CONTAINER WITH CSS PERSPECTIVE & REALISTIC TURNING SHADOWS */}
      <div
        className="relative rounded-[32px] p-2.5 sm:p-5 bg-gradient-to-b from-[#3a2012] via-[#28150a] to-[#1a0c05] shadow-2xl border-4 border-[#523018]"
        style={{ perspective: '1800px' }}
      >
        {/* INTERACTIVE BOOKMARK RIBBON HANGING FROM TOP */}
        <div
          onClick={handleToggleBookmark}
          className={`absolute -top-3 left-14 sm:left-16 z-30 w-8 h-16 border-x border-b shadow-2xl flex flex-col items-center justify-end pb-1.5 rounded-b-md cursor-pointer transition-all duration-300 group hover:scale-105 active:scale-95 ${
            isCurrentDayBookmarked
              ? 'bg-gradient-to-b from-[#D4AF37] via-[#e2be4a] to-[#b38f22] border-[#8a6813] shadow-amber-500/30'
              : 'bg-gradient-to-b from-red-700 via-red-800 to-red-950 border-red-950 opacity-80 hover:opacity-100'
          }`}
          title={isCurrentDayBookmarked ? 'Bookmarked Milestone! Click to unbookmark' : 'Click ribbon to Bookmark this Day'}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full shadow-sm mb-1 ${
              isCurrentDayBookmarked ? 'bg-black' : 'bg-amber-400'
            }`}
          />
          <span className="text-[7px] font-sans font-black uppercase tracking-tighter text-white drop-shadow">
            {isCurrentDayBookmarked ? '★ PIN' : 'MARK'}
          </span>
        </div>

        {/* Leather Stitched Border Accent */}
        <div className="absolute inset-1.5 border border-dashed border-[#8c572e]/40 rounded-[26px] pointer-events-none" />

        {/* Notebook Main Open Spread Container */}
        <div
          className="relative bg-[#f7f2e4] rounded-[22px] shadow-2xl overflow-hidden min-h-[580px] border border-[#d2c29d] flex flex-col md:flex-row"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Subtle Paper Grain & Lined Ruled Texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-35 mix-blend-multiply"
            style={{
              backgroundImage: `repeating-linear-gradient(
                to bottom,
                transparent,
                transparent 27px,
                rgba(180, 160, 130, 0.4) 28px
              )`,
            }}
          />

          {/* Center Metal Binder Rings (Desktop / Tablet view) */}
          <div className="hidden md:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 z-20 flex-col justify-around items-center pointer-events-none py-10">
            {[1, 2, 3, 4, 5].map((ring) => (
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

          {/* Animated 3D Page Turn Content */}
          <AnimatePresence mode="wait" custom={flipDirection}>
            <motion.div
              key={selectedDate}
              custom={flipDirection}
              variants={pageFlipVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
                transformStyle: 'preserve-3d',
              }}
              className="w-full flex flex-col md:flex-row divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#d9cbb2] relative bg-[#f8f3e6]"
            >
              {/* Page Curl Gradient Light Overlay during turn */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/10 to-black/5 pointer-events-none z-10" />

              {/* --- LEFT PAGE: Header, QUICK STATS SUMMARY, Main Proof, & Timeline --- */}
              <div className="flex-1 p-5 sm:p-7 text-[#2c1d11] space-y-4 relative">
                {/* Red Vintage Left Margin Line */}
                <div className="absolute top-0 bottom-0 left-4 w-px bg-red-400/30 hidden sm:block pointer-events-none" />

                {/* Left Page Header */}
                <div className="border-b-2 border-[#b89b72]/40 pb-2.5 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-[#8a6b47] font-bold">
                        ENTRY DATE • {dayData.dayOfWeek}
                      </span>
                      {isCurrentDayBookmarked && (
                        <span className="text-[9px] font-sans font-black px-2 py-0.2 rounded-full bg-[#D4AF37] text-black flex items-center gap-1 shadow-sm">
                          <Bookmark className="w-2.5 h-2.5 fill-black" />
                          <span>BOOKMARKED</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif font-black text-[#2e1c0c] tracking-tight leading-tight">
                      {dayData.formattedDate}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Bookmark Action Button */}
                    <button
                      onClick={handleToggleBookmark}
                      className={`p-1.5 rounded-xl border transition-all flex items-center gap-1 text-[10px] font-serif font-bold ${
                        isCurrentDayBookmarked
                          ? 'bg-[#D4AF37] text-black border-[#8a6813] shadow-sm'
                          : 'bg-[#ede4d0] hover:bg-[#dfd0b5] text-[#543419] border-[#c7b38d]'
                      }`}
                      title={isCurrentDayBookmarked ? 'Remove Bookmark' : 'Bookmark this Day'}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isCurrentDayBookmarked ? 'fill-black' : ''}`} />
                      <span className="hidden sm:inline">
                        {isCurrentDayBookmarked ? 'Bookmarked' : 'Bookmark'}
                      </span>
                    </button>

                    <div className="text-right pl-1">
                      <span className="font-serif italic text-xs text-[#8a6b47]">Pg.</span>
                      <span className="font-serif font-bold text-base text-[#3d2716] ml-0.5">
                        {Math.max(1, 49 - dayDiffFromToday)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bookmark Custom Note Annotation banner if present */}
                {isCurrentDayBookmarked && currentBookmarkObj?.note && (
                  <div className="p-2.5 rounded-xl bg-amber-100/80 border border-[#c9ab70] flex items-center justify-between text-xs font-serif text-[#3f2611] shadow-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm">📌</span>
                      <p className="italic font-bold truncate">
                        "{currentBookmarkObj.note}"
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setBookmarkCustomNoteModal(selectedDate);
                        setCustomBookmarkNoteText(currentBookmarkObj.note || '');
                      }}
                      className="text-[10px] font-mono text-[#8a6813] hover:underline shrink-0 ml-2"
                    >
                      Edit Note
                    </button>
                  </div>
                )}

                {/* --- QUICK STATS SUMMARY BOX (MESSAGES, COMMUNITY POSTS, HABITS, SCORE) --- */}
                <div className="bg-gradient-to-br from-[#ede4d0] via-[#e5d9bf] to-[#ded0b6] border-2 border-[#bfa67e] rounded-2xl p-3.5 shadow-sm space-y-2.5 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#bfa67e]/60 pb-1.5">
                    <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-amber-800" />
                      <span>Day Quick Stats & Pulse Summary</span>
                    </span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-black/10 text-[#2e1909]">
                      Discipline: {dayData.disciplineScore}%
                    </span>
                  </div>

                  {/* 4-Box Grid for Quick Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    {/* 1. Messages Exchanged */}
                    <div className="bg-[#f8f3e6]/80 p-2 rounded-xl border border-[#cbb793]">
                      <div className="flex items-center justify-center gap-1 text-[#8a5d30]">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-xs font-black text-[#2e1a0b]">
                          {dayData.messages.length}
                        </span>
                      </div>
                      <span className="text-[9px] font-serif font-bold uppercase tracking-wider text-[#735332] block mt-0.5">
                        Messages Exchanged
                      </span>
                    </div>

                    {/* 2. Community Posts Interacted */}
                    <div className="bg-[#f8f3e6]/80 p-2 rounded-xl border border-[#cbb793]">
                      <div className="flex items-center justify-center gap-1 text-[#8a5d30]">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-xs font-black text-[#2e1a0b]">
                          {dayData.communityPosts.length}
                        </span>
                      </div>
                      <span className="text-[9px] font-serif font-bold uppercase tracking-wider text-[#735332] block mt-0.5">
                        Community Posts
                      </span>
                    </div>

                    {/* 3. Habits Executed */}
                    <div className="bg-[#f8f3e6]/80 p-2 rounded-xl border border-[#cbb793]">
                      <div className="flex items-center justify-center gap-1 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-black text-[#1e3a1e]">
                          {dayData.completedHabits.length}
                        </span>
                      </div>
                      <span className="text-[9px] font-serif font-bold uppercase tracking-wider text-[#735332] block mt-0.5">
                        Habits Executed
                      </span>
                    </div>

                    {/* 4. Checkpoints & Total Signals */}
                    <div className="bg-[#f8f3e6]/80 p-2 rounded-xl border border-[#cbb793]">
                      <div className="flex items-center justify-center gap-1 text-amber-700">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="text-xs font-black text-[#2e1a0b]">
                          {dayData.totalActivityCount}
                        </span>
                      </div>
                      <span className="text-[9px] font-serif font-bold uppercase tracking-wider text-[#735332] block mt-0.5">
                        Total Day Signals
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1. Main Discipline Proof Card */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-700" />
                      <span>Daily Proof Submission</span>
                    </h4>
                    {dayData.mainPost && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-700/10 text-emerald-900 border border-emerald-700/30">
                        VERIFIED RECEIPT ✓
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
                    <div className="bg-[#f0e8d5] border border-dashed border-[#b89b72] rounded-2xl p-4 text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-[#dfd0b5] flex items-center justify-center text-[#73522f] mx-auto">
                        <PenTool className="w-4 h-4" />
                      </div>
                      <p className="font-serif italic text-xs text-[#664b2d]">
                        "No public discipline proof logged in the registry for this day. Quiet focus or restorative rest."
                      </p>
                      {isToday && onOpenCreatePost && (
                        <button
                          onClick={onOpenCreatePost}
                          className="mt-1 px-4 py-1.5 rounded-xl bg-[#543419] hover:bg-[#3d2410] text-[#f7eedc] text-xs font-serif font-bold transition-colors inline-flex items-center gap-1.5 shadow"
                        >
                          <PenTool className="w-3.5 h-3.5 text-amber-300" />
                          <span>Write & Log Today's Proof</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. CHRONOLOGICAL DAY TIMELINE (Everything done on this date) */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#8a5d30]" />
                    <span>Chronological Activity Timeline ({dayData.timelineEvents.length})</span>
                  </h4>

                  {dayData.timelineEvents.length > 0 ? (
                    <div className="space-y-2 bg-[#ede4d0]/70 border border-[#c7b38d] rounded-2xl p-3 max-h-52 overflow-y-auto no-scrollbar">
                      {dayData.timelineEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-2.5 text-xs font-serif text-[#332011] pb-2 border-b border-[#c7b38d]/40 last:border-none last:pb-0"
                        >
                          <span className="font-mono text-[10px] font-bold text-[#8a6b47] shrink-0 pt-0.5">
                            {event.time}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#2e1909]">{event.title}</span>
                              {event.badge && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#dac8a2] text-[#4a3018]">
                                  {event.badge}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-[11px] italic text-[#593d24] mt-0.5 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-serif italic text-[#8c704f] pl-1">
                      No timestamped signals recorded on this date.
                    </div>
                  )}
                </div>
              </div>

              {/* --- RIGHT PAGE: Community Circles, Checkpoints, Notes & Habits --- */}
              <div className="flex-1 p-5 sm:p-7 text-[#2c1d11] space-y-4 relative">
                {/* Right Page Header */}
                <div className="border-b-2 border-[#b89b72]/40 pb-2.5 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#8a6b47] font-bold">
                      ENGAGEMENT & CIRCLES
                    </span>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#2e1c0c] tracking-tight">
                      Daily Summary & Checkpoints
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="font-serif italic text-xs text-[#8a6b47]">Pg.</span>
                    <span className="font-serif font-bold text-base text-[#3d2716] ml-0.5">
                      {Math.max(2, 50 - dayDiffFromToday)}
                    </span>
                  </div>
                </div>

                {/* 3. Community Contributions & Circle Posts */}
                <div className="space-y-2">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#8a5d30]" />
                    <span>Community Circles Active ({dayData.communityPosts.length})</span>
                  </h4>

                  {dayData.communityPosts.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
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
                              "{cp.content}"
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] font-serif italic text-[#8c704f] pl-1">
                      No community circle posts on this date.
                    </div>
                  )}
                </div>

                {/* 4. Instagram-Style Floating Note if present */}
                {dayData.userNote && (
                  <div className="p-3 bg-amber-200/50 border border-amber-400/60 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-900 text-amber-200 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      💭
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#734b22] block">
                        24-Hour Note Shared
                      </span>
                      <p className="text-xs font-serif italic font-bold text-[#2e1909] truncate">
                        "{dayData.userNote.text}"
                      </p>
                      {dayData.userNote.musicTitle && (
                        <p className="text-[10px] text-[#734b22] truncate mt-0.5">
                          🎵 {dayData.userNote.musicTitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Challenge Progress Checkpoints */}
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

                {/* 6. Conversations & Circles Talked With */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-[#694827] flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-[#8a5d30]" />
                    <span>People & Groups Talked With ({dayData.conversations.length})</span>
                  </h4>

                  {dayData.conversations.length > 0 ? (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 no-scrollbar">
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
                            className="w-7 h-7 rounded-full object-cover border border-[#b89b72] shrink-0"
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

                {/* 7. Daily Habits Checked */}
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
                  <span>Chronicle of {user.name}</span>
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
