import React, { useState } from 'react';
import { Flame, Sparkles, Filter, Users, Globe } from 'lucide-react';
import { Post, User } from '../types';
import { PostCard } from './PostCard';
import { getTodayDateString } from '../services/storage';

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
}) => {
  const [feedFilter, setFeedFilter] = useState<'following' | 'explore'>('following');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const today = getTodayDateString();
  const hasPostedToday = currentUser.lastPostedDate === today;

  // Filter posts based on selected tab and active tag
  const filteredPosts = posts.filter((post) => {
    // Tab filter
    if (feedFilter === 'following') {
      const isSelf = post.userId === currentUser.id;
      const isFollowing = currentUser.followedUserIds.includes(post.userId);
      if (!isSelf && !isFollowing) return false;
    }

    // Tag filter
    if (activeTag) {
      return post.tags && post.tags.includes(activeTag);
    }

    return true;
  });

  // Extract all available tags in current posts
  const availableTags = Array.from(
    new Set(posts.flatMap((p) => p.tags || []))
  ).slice(0, 8);

  return (
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

      {/* Feed Tabs: Following vs Explore */}
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setFeedFilter('following')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              feedFilter === 'following'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Following
          </button>
          <button
            onClick={() => setFeedFilter('explore')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              feedFilter === 'explore'
                ? 'bg-white text-black shadow-sm'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Explore
          </button>
        </div>

        <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
          {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}
        </span>
      </div>

      {/* Tag filter pills */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 no-scrollbar">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
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
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
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
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white/5 rounded-[32px] border border-white/10 my-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-white/40" />
          </div>
          <h3 className="font-bold text-white text-base">No updates to show</h3>
          <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
            {feedFilter === 'following'
              ? "You aren't following anyone with posts yet. Switch to Explore or discover like-minded creators!"
              : 'No posts match this filter tag.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            {feedFilter === 'following' && (
              <button
                onClick={() => setFeedFilter('explore')}
                className="px-4 py-2.5 rounded-xl bg-[#FF4D00] text-black font-black text-xs shadow-lg shadow-[#FF4D00]/20"
              >
                Switch to Explore
              </button>
            )}
            <button
              onClick={() => onSelectTab('discover')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10"
            >
              Discover Creators
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
