import React, { useState } from 'react';
import { Flame, Sparkles, Filter, Users, RefreshCw, BookOpen, Eye, Check } from 'lucide-react';
import { Post, User } from '../types';
import { PostCard } from './PostCard';
import { getTodayDateString } from '../services/storage';
import { PullToRefresh } from './PullToRefresh';
import { handleHorizontalWheelScroll } from '../utils/scroll';
import { vibrateLight } from '../services/haptics';

interface HomeFeedProps {
  posts: Post[];
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onToggleFollow: (userId: string) => void;
  onSendDM: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onOpenCreate: () => void;
  onSelectTab: (tab: any) => void;
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  savedPostIds?: string[];
  reportedPostIds?: string[];
  onToggleSave?: (postId: string) => void;
  onReportPost?: (post: Post) => void;
  onSharePost?: (post: Post) => void;
  onRefresh?: () => Promise<void> | void;
  onOpenInsights?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  posts,
  currentUser,
  onToggleLike,
  onOpenComments,
  onToggleFollow,
  onSendDM,
  onOpenCreate,
  onSelectTab,
  onViewUser,
  savedPostIds = [],
  reportedPostIds = [],
  onToggleSave,
  onReportPost,
  onSharePost,
  onRefresh,
  onOpenInsights,
  onDeletePost,
}) => {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const today = getTodayDateString();
  const hasPostedToday = currentUser.lastPostedDate === today;

  // Filter out blocked users
  const unblockedPosts = posts.filter(
    (post) => !currentUser.blockedUserIds?.includes(post.userId)
  );

  // Filter posts based on active tag and following (fallback to all if no followed posts)
  const followedAndOwnPosts = unblockedPosts.filter((post) => {
    const isSelf = post.userId === currentUser.id || post.userId === 'user_me';
    const isFollowing = currentUser.followedUserIds.includes(post.userId);
    return isSelf || isFollowing;
  });

  const basePosts = followedAndOwnPosts.length > 0 ? followedAndOwnPosts : unblockedPosts;

  const filteredPosts = basePosts.filter((post) => {
    if (activeTag) {
      return post.tags && post.tags.includes(activeTag);
    }
    return true;
  });

  // Extract all available tags in current posts
  const availableTags = Array.from(
    new Set(unblockedPosts.flatMap((p) => p.tags || []))
  ).slice(0, 10);

  const handleFeedRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const toggleFocusMode = () => {
    vibrateLight();
    setIsFocusMode(!isFocusMode);
  };

  return (
    <PullToRefresh
      onRefresh={handleFeedRefresh}
      pullText="Pull down to refresh feed"
      releaseText="Release to refresh feed"
      refreshingText="Refreshing daily stream..."
      completedText="Feed updated • Just now"
    >
      <div className="w-full pb-20 pt-2 px-3 sm:px-4 max-w-lg mx-auto">
        {/* Focus Reading Mode Active Bar */}
        {isFocusMode ? (
          <div className="mb-4 p-3.5 rounded-2xl bg-[#141414] border border-[#D4AF37]/40 flex items-center justify-between shadow-lg shadow-black/60 sticky top-2 z-20 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  Focus Reading Mode
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </span>
                <p className="text-[10px] text-white/50">Clean, distraction-free post text</p>
              </div>
            </div>
            <button
              onClick={toggleFocusMode}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors border border-white/10"
            >
              Exit Focus
            </button>
          </div>
        ) : (
          /* Daily Streak Reminder Banner (if not posted today) */
          !hasPostedToday && (
            <div className="mb-4 p-4 sm:p-5 rounded-[28px] bg-gradient-to-r from-[#1c110b] to-[#121212] border border-[#D4AF37]/40 flex items-center justify-between shadow-lg shadow-[#D4AF37]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-white">What did you do today?</span>
                    <span className="text-[10px] bg-[#D4AF37] text-black font-black px-2 py-0.5 rounded-full">
                      🔥 {currentUser.currentStreak}d
                    </span>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    Post your action, proof photo, and reflection to keep your streak.
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenCreate}
                className="px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5B842] text-black font-black text-xs shrink-0 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20 min-h-[38px]"
              >
                Post Proof 🔥
              </button>
            </div>
          )
        )}

        {/* Home Feed Header */}
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              {isFocusMode ? 'Focus Stream' : "Today's Proof of Work"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFocusMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border ${
                isFocusMode
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
              }`}
              title="Toggle Focus Reading Mode"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isFocusMode ? 'Focus On' : 'Focus Mode'}</span>
            </button>
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold pl-1">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'receipt' : 'receipts'}
            </span>
          </div>
        </div>

        {/* Tag filter pills (Horizontally Scrollable - hidden in focus mode) */}
        {!isFocusMode && availableTags.length > 0 && (
          <div 
            onWheel={handleHorizontalWheelScroll}
            className="w-full flex items-center gap-1.5 overflow-x-auto whitespace-nowrap flex-nowrap pb-3 mb-2 no-scrollbar touch-pan-x overscroll-x-contain py-1"
          >
            <button
              onClick={() => setActiveTag(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                activeTag === null
                  ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                  activeTag === tag
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Posts Stream */}
        {filteredPosts.length > 0 ? (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onToggleLike={onToggleLike}
                onOpenComments={onOpenComments}
                onToggleFollow={onToggleFollow}
                onSendDM={onSendDM}
                onTagClick={(tag) => setActiveTag(tag)}
                onViewUser={onViewUser}
                isSaved={savedPostIds.includes(post.id)}
                onToggleSave={onToggleSave}
                onReportPost={onReportPost}
                isReported={reportedPostIds.includes(post.id)}
                onSharePost={onSharePost}
                onOpenInsights={onOpenInsights}
                onDeletePost={onDeletePost}
                isFocusMode={isFocusMode}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white/5 rounded-[32px] border border-white/10 my-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-white/40" />
            </div>
            <h3 className="font-bold text-white text-base">No updates yet</h3>
            <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
              Follow more creators or share your own habit milestone for today!
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => onSelectTab('discover')}
                className="px-4 py-2.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs shadow-lg shadow-[#D4AF37]/20"
              >
                Discover Creators & Communities
              </button>
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};

