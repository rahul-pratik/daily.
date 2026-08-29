import React, { useState } from 'react';
import { Flame, Sparkles, Filter, Users, RefreshCw } from 'lucide-react';
import { Post, User } from '../types';
import { PostCard } from './PostCard';
import { getTodayDateString } from '../services/storage';
import { PullToRefresh } from './PullToRefresh';
import { handleHorizontalWheelScroll } from '../utils/scroll';

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

  const today = getTodayDateString();
  const hasPostedToday = currentUser.lastPostedDate === today;

  // Filter posts based on active tag and following (fallback to all if no followed posts)
  const followedAndOwnPosts = posts.filter((post) => {
    const isSelf = post.userId === currentUser.id || post.userId === 'user_me';
    const isFollowing = currentUser.followedUserIds.includes(post.userId);
    return isSelf || isFollowing;
  });

  const basePosts = followedAndOwnPosts.length > 0 ? followedAndOwnPosts : posts;

  const filteredPosts = basePosts.filter((post) => {
    if (activeTag) {
      return post.tags && post.tags.includes(activeTag);
    }
    return true;
  });

  // Extract all available tags in current posts
  const availableTags = Array.from(
    new Set(posts.flatMap((p) => p.tags || []))
  ).slice(0, 10);

  const handleFeedRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
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
        {/* Daily Streak Reminder Banner (if not posted today) */}
        {!hasPostedToday && (
          <div className="mb-4 p-4 sm:p-5 rounded-[28px] bg-white/5 border border-[#FF4D00]/30 flex items-center justify-between shadow-lg shadow-[#FF4D00]/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-[#FF4D00] fill-[#FF4D00] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">Daily Streak at Risk</span>
                  <span className="text-[10px] bg-[#FF4D00] text-black font-black px-2 py-0.5 rounded-full">
                    🔥 {currentUser.currentStreak}d
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Post what you did today to maintain your streak.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#ff5d19] text-black font-black text-xs shrink-0 active:scale-95 transition-all shadow-md shadow-[#FF4D00]/20"
            >
              Post Now
            </button>
          </div>
        )}

        {/* Home Feed Header */}
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#FF4D00] animate-ping" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Daily Feed
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'update' : 'updates'}
            </span>
          </div>
        </div>

        {/* Tag filter pills (Horizontally Scrollable) */}
        {availableTags.length > 0 && (
          <div 
            onWheel={handleHorizontalWheelScroll}
            className="w-full flex items-center gap-1.5 overflow-x-auto whitespace-nowrap flex-nowrap pb-3 mb-2 no-scrollbar touch-pan-x overscroll-x-contain py-1"
          >
            <button
              onClick={() => setActiveTag(null)}
              className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                activeTag === null
                  ? 'bg-[#FF4D00] text-black border-[#FF4D00]'
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
                    ? 'bg-[#FF4D00] text-black border-[#FF4D00]'
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
                className="px-4 py-2.5 rounded-xl bg-[#FF4D00] text-black font-black text-xs shadow-lg shadow-[#FF4D00]/20"
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

