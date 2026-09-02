import React from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Flame,
  CheckCircle2,
  Camera,
  Heart,
  MessageSquare,
  Sparkles,
  PlusCircle,
  Share2,
  ExternalLink,
  Award,
  Clock,
} from 'lucide-react';
import { User, Post, ChallengeProgressPost } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight } from '../services/haptics';

interface CalendarDayPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  currentUser: User;
  allPosts?: Post[];
  onOpenCreate?: () => void;
  onToggleLike?: (postId: string) => void;
  onOpenComments?: (post: Post) => void;
}

export const CalendarDayPostModal: React.FC<CalendarDayPostModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  currentUser,
  allPosts = [],
  onOpenCreate,
  onToggleLike = (_postId: string) => {},
  onOpenComments = (_post: Post) => {},
}) => {
  if (!isOpen || !selectedDate) return null;

  const today = getTodayDateString();
  const isToday = selectedDate === today;
  const hasActivity = (currentUser.activityDates || []).includes(selectedDate);

  // Format human date
  const parsedDate = new Date(`${selectedDate}T00:00:00`);
  const formattedDate = isNaN(parsedDate.getTime())
    ? selectedDate
    : parsedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  // Find user's posts or cohort posts for this date
  const postsOnDate = allPosts.filter((p) => {
    // Exact postDate match
    if (p.postDate && p.postDate === selectedDate) return true;
    // Today match
    if (isToday && (p.createdAt?.includes('Today') || p.postDate === today)) return true;
    return false;
  });

  // Also check if any challenge progress posts exist for this date
  const challengeItemsOnDate = DailyStorageService.getChallengePostsByDate(selectedDate, currentUser.id);

  return (
    <div
      id="calendar-day-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0D0D0D] border border-white/15 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                {formattedDate}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                {hasActivity ? (
                  <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-blue-400" />
                    <span>Daily Proof Verified</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-white/40">No activity recorded</span>
                )}
                {isToday && (
                  <span className="px-1.5 py-0.5 rounded bg-[#D4AF37] text-black font-black text-[9px] uppercase">
                    Today
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-1">
          {postsOnDate.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                Proof Posted On This Day ({postsOnDate.length}):
              </p>
              {postsOnDate.map((post) => (
                <div
                  key={post.id}
                  className="bg-[#141414] border border-white/15 rounded-3xl p-4 space-y-3 shadow-lg"
                >
                  {/* User info & day pill */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={post.userAvatar}
                        alt={post.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <span className="font-bold text-xs text-white block leading-tight">
                          {post.name}
                        </span>
                        <span className="text-[10px] text-white/40">@{post.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">
                      <Flame className="w-3 h-3 fill-blue-400" />
                      <span>{post.userStreak}d Streak</span>
                    </div>
                  </div>

                  {/* Post Image */}
                  {post.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/15 aspect-video bg-black/60 relative">
                      <img
                        src={post.imageUrl}
                        alt="Achievement proof"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold flex items-center gap-1">
                        <Camera className="w-3 h-3 text-[#D4AF37]" />
                        <span>Daily Receipt</span>
                      </div>
                    </div>
                  )}

                  {/* Caption & Content */}
                  <p className="text-xs text-white/90 leading-relaxed font-sans">
                    {post.content}
                  </p>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-[#D4AF37] font-semibold bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/20"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Engagement Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <span className="text-[10px] text-white/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.createdAt}
                    </span>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          vibrateLight();
                          onToggleLike(post.id);
                        }}
                        className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${
                          post.likedByMe ? 'text-red-400' : 'text-white/60 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.likedByMe ? 'fill-red-400' : ''}`} />
                        <span>{post.likesCount}</span>
                      </button>

                      <button
                        onClick={() => {
                          vibrateLight();
                          onOpenComments(post);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-white/60 hover:text-white"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{post.comments?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : challengeItemsOnDate.length > 0 ? (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                Challenge Progress Proof ({challengeItemsOnDate.length}):
              </p>
              {challengeItemsOnDate.map(({ post: cp, challenge }) => (
                <div
                  key={cp.id}
                  className="bg-[#141414] border border-white/15 rounded-3xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                      {challenge.icon} {challenge.title} • Day {cp.dayNumber}
                    </span>
                    <span className="text-[10px] text-white/40">{cp.createdAt}</span>
                  </div>

                  {cp.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-white/15 aspect-video bg-black/60">
                      <img
                        src={cp.imageUrl}
                        alt="Progress proof"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {cp.text && (
                    <p className="text-xs text-white/90 leading-relaxed font-sans">
                      "{cp.text}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : hasActivity ? (
            <div className="bg-[#141414] border border-white/15 rounded-3xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">Daily Habit Check-in Verified</h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Your discipline streak was successfully maintained on {formattedDate}.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#141414] border border-white/10 rounded-3xl p-6 text-center space-y-3">
              <CalendarIcon className="w-10 h-10 text-white/30 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">No Post on this Day</h4>
                <p className="text-xs text-white/50 leading-relaxed">
                  {isToday
                    ? 'You have not submitted your daily proof for today yet.'
                    : `No daily proof was logged for ${formattedDate}.`}
                </p>
              </div>

              {isToday && onOpenCreate && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreate();
                  }}
                  className="py-3 px-5 rounded-2xl bg-[#D4AF37] hover:bg-[#e5c158] text-black font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-[#D4AF37]/25"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post Proof For Today</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/40">
          <span>{hasActivity ? '🔥 Streak Day Verified' : 'Missed / Rest Day'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
