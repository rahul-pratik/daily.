import React, { useState } from 'react';
import {
  Flame,
  Sparkles,
  Filter,
  Users,
  RefreshCw,
  BookOpen,
  Eye,
  Check,
  Search,
  X,
  Compass,
  PlusCircle,
  Hash,
  Layers,
} from 'lucide-react';
import { Post, User } from '../types';
import { PostCard } from './PostCard';
import { getTodayDateString } from '../services/storage';
import { PullToRefresh } from './PullToRefresh';
import { StreakCalendarCard } from './StreakCalendarCard';
import { EmptyStateIllustration } from './EmptyStateIllustration';
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
  onOpenAddToCollection?: (post: Post) => void;
}

type FeedCategoryFilter = 'all' | 'following' | 'interests';

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
  onOpenAddToCollection,
}) => {
  const [feedFilter, setFeedFilter] = useState<FeedCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  const today = getTodayDateString();

  // Filter out blocked users & reported posts
  const unblockedPosts = posts.filter(
    (post) => !currentUser.blockedUserIds?.includes(post.userId)
  );

  // Apply Primary Feed Filter ('all' vs 'following' vs 'interests')
  const categoryFilteredPosts = unblockedPosts.filter((post) => {
    if (feedFilter === 'following') {
      const isSelf = post.userId === currentUser.id || post.userId === 'user_me';
      const isFollowing = currentUser.followedUserIds.includes(post.userId);
      return isSelf || isFollowing;
    }

    if (feedFilter === 'interests') {
      const userInterests = (currentUser.interests || []).map((i) => i.toLowerCase());
      const postTags = (post.tags || []).map((t) => t.toLowerCase());
      const hasInterestMatch = postTags.some((tag) =>
        userInterests.some((interest) => tag.includes(interest) || interest.includes(tag))
      );
      return hasInterestMatch;
    }

    return true;
  });

  // Apply Search, Tag, and Date Filters
  const filteredPosts = categoryFilteredPosts.filter((post) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchContent = post.content.toLowerCase().includes(q);
      const matchName = post.name.toLowerCase().includes(q);
      const matchUsername = post.username.toLowerCase().includes(q);
      const matchTags = (post.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchContent && !matchName && !matchUsername && !matchTags) {
        return false;
      }
    }

    // Active tag filter
    if (activeTag && (!post.tags || !post.tags.includes(activeTag))) {
      return false;
    }

    // Date filter
    if (selectedDateFilter) {
      if (post.postDate && post.postDate === selectedDateFilter) return true;
      if (selectedDateFilter === today && post.createdAt?.includes('Today')) return true;
      return false;
    }

    return true;
  });

  // Extract available tags
  const availableTags =
    feedFilter === 'interests' && currentUser.interests && currentUser.interests.length > 0
      ? currentUser.interests
      : Array.from(new Set(unblockedPosts.flatMap((p) => p.tags || []))).slice(0, 12);

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
      <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-3">
        {/* Streak Calendar on Home Screen */}
        {!isFocusMode && (
          <StreakCalendarCard
            currentUser={currentUser}
            posts={posts}
            onOpenCreate={onOpenCreate}
            selectedDateFilter={selectedDateFilter}
            onSelectDateFilter={setSelectedDateFilter}
          />
        )}

        {/* Global Search Bar */}
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search proofs, #tags, creators, topics..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-xs font-semibold focus:outline-none focus:border-[#2F6FED] focus:bg-white/[0.08] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Focus Reading Mode Active Bar */}
        {isFocusMode && (
          <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#2F6FED]/40 flex items-center justify-between shadow-lg shadow-black/60 sticky top-2 z-20 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#2F6FED]/10 border border-[#2F6FED]/30 flex items-center justify-center text-[#2F6FED]">
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
        )}

        {/* Primary Filter Tabs: 'All' | 'Following' | 'Interests' */}
        {!isFocusMode && (
          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => {
                  vibrateLight();
                  setFeedFilter('all');
                  setActiveTag(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  feedFilter === 'all'
                    ? 'bg-[#2F6FED] text-white font-black shadow-md shadow-[#2F6FED]/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                All
              </button>

              <button
                onClick={() => {
                  vibrateLight();
                  setFeedFilter('following');
                  setActiveTag(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  feedFilter === 'following'
                    ? 'bg-[#2F6FED] text-white font-black shadow-md shadow-[#2F6FED]/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Following</span>
              </button>

              <button
                onClick={() => {
                  vibrateLight();
                  setFeedFilter('interests');
                  setActiveTag(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  feedFilter === 'interests'
                    ? 'bg-[#2F6FED] text-white font-black shadow-md shadow-[#2F6FED]/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Interests</span>
              </button>
            </div>

            {/* Right controls: Focus mode toggle + Result count */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFocusMode}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/10 min-h-[36px] min-w-[36px] flex items-center justify-center"
                title="Toggle Focus Reading Mode"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] uppercase tracking-widest text-white/40 font-semibold whitespace-nowrap">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'proof' : 'proofs'}
              </span>
            </div>
          </div>
        )}

        {/* Tag filter pills (Horizontally Scrollable) */}
        {!isFocusMode && availableTags.length > 0 && (
          <div
            onWheel={handleHorizontalWheelScroll}
            className="w-full flex items-center gap-1.5 overflow-x-auto whitespace-nowrap flex-nowrap pb-1 no-scrollbar touch-pan-x overscroll-x-contain py-1"
          >
            <button
              onClick={() => {
                vibrateLight();
                setActiveTag(null);
              }}
              className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                activeTag === null
                  ? 'bg-white text-black border-white font-black'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {feedFilter === 'interests' ? 'All Focus Areas' : 'All Tags'}
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  vibrateLight();
                  setActiveTag(activeTag === tag ? null : tag);
                }}
                className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                  activeTag === tag
                    ? 'bg-[#2F6FED] text-white border-[#2F6FED] font-black'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Posts Stream / Empty State */}
        {filteredPosts.length > 0 ? (
          <div className="space-y-4 pt-1">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onToggleLike={onToggleLike}
                onOpenComments={onOpenComments}
                onToggleFollow={onToggleFollow}
                onSendDM={onSendDM}
                onTagClick={(tag) => {
                  setActiveTag(tag);
                }}
                onViewUser={onViewUser}
                isSaved={savedPostIds.includes(post.id)}
                onToggleSave={onToggleSave}
                onReportPost={onReportPost}
                isReported={reportedPostIds.includes(post.id)}
                onSharePost={onSharePost}
                onOpenInsights={onOpenInsights}
                onDeletePost={onDeletePost}
                isFocusMode={isFocusMode}
                onOpenAddToCollection={onOpenAddToCollection}
              />
            ))}
          </div>
        ) : (
          /* Tailored Empty States with Professional Visuals and CTAs */
          <div className="pt-2">
            {searchQuery ? (
              <EmptyStateIllustration
                type="search"
                title={`No proofs matching "${searchQuery}"`}
                description="Try searching with a broader keyword, different habit name, or clear the search query."
                primaryAction={{
                  label: 'Clear Search Query',
                  onClick: () => setSearchQuery(''),
                }}
              />
            ) : feedFilter === 'following' ? (
              <EmptyStateIllustration
                type="following"
                title="No updates from creators you follow"
                description="Creators you follow haven't posted their daily proof yet today, or you haven't followed any creators yet. Explore active builders to grow your circle!"
                primaryAction={{
                  label: 'Explore Active Creators',
                  onClick: () => onSelectTab('discover'),
                  icon: <Compass className="w-4 h-4" />,
                }}
                secondaryAction={{
                  label: 'Switch to All Feed',
                  onClick: () => setFeedFilter('all'),
                }}
              />
            ) : feedFilter === 'interests' ? (
              <EmptyStateIllustration
                type="interests"
                title="No proofs found for your focus areas"
                description={`No recent posts matched your profile focus areas (${(currentUser.interests || []).join(', ')}). Be the first to share a proof in these categories!`}
                primaryAction={{
                  label: 'Share Proof in Your Interest',
                  onClick: onOpenCreate,
                  icon: <PlusCircle className="w-4 h-4" />,
                }}
                secondaryAction={{
                  label: 'View All Feed',
                  onClick: () => setFeedFilter('all'),
                }}
              />
            ) : (
              <EmptyStateIllustration
                type="feed"
                title="No proofs published today"
                description="Start the momentum! Share your first workout, code commit, study session, or project milestone."
                primaryAction={{
                  label: 'Post Proof of Work',
                  onClick: onOpenCreate,
                  icon: <Flame className="w-4 h-4 fill-black" />,
                }}
                secondaryAction={{
                  label: 'Discover Communities',
                  onClick: () => onSelectTab('discover'),
                }}
              />
            )}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};
