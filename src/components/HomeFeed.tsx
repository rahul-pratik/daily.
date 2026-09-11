import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Flame,
  Sparkles,
  Users,
  Compass,
  PlusCircle,
  Globe,
  ArrowUp,
  Trophy,
  ArrowUpDown,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Post, User, Challenge } from '../types';
import { PostCard } from './PostCard';
import { PullToRefresh } from './PullToRefresh';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { handleHorizontalWheelScroll } from '../utils/scroll';
import { vibrateLight } from '../services/haptics';
import { DailyStorageService } from '../services/storage';

interface HomeFeedProps {
  posts: Post[];
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onToggleFollow: (userId: string) => void;
  onSendDM: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onOpenCreate: () => void;
  onSelectTab: (tab: any) => void;
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak?: number }) => void;
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

type FeedCategoryFilter = 'all' | 'following' | 'interests' | 'community' | 'challenges';

const SORT_OPTIONS: {
  value: FeedCategoryFilter;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: 'all', label: 'All', icon: Sparkles },
  { value: 'following', label: 'Following', icon: Users },
  { value: 'interests', label: 'Interests', icon: Flame },
  { value: 'community', label: 'Community', icon: Globe },
  { value: 'challenges', label: 'Challenges', icon: Trophy },
];

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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [feedRevision, setFeedRevision] = useState(0);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen]);

  // Monitor scroll position: button appears whenever user scrolls down more than one full viewport height
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      setShowScrollTop(scrolled > viewportHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    vibrateLight();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter out blocked users & reported posts
  const unblockedPosts = posts.filter(
    (post) => !currentUser.blockedUserIds?.includes(post.userId)
  );

  // Joined communities of current user
  const joinedCommunities = useMemo(() => {
    return DailyStorageService.getAllCommunities().filter((c) =>
      (c.memberIds || []).includes(currentUser.id)
    );
  }, [currentUser.id, feedRevision]);

  const joinedCommunityIds = useMemo(
    () => new Set(joinedCommunities.map((c) => c.id)),
    [joinedCommunities]
  );

  // Joined challenges of current user
  const joinedChallenges = useMemo(() => {
    return DailyStorageService.getAllChallenges().filter((c) =>
      (c.participantIds || []).includes(currentUser.id)
    );
  }, [currentUser.id, feedRevision]);

  const joinedChallengeIds = useMemo(
    () => new Set(joinedChallenges.map((c) => c.id)),
    [joinedChallenges]
  );

  // Community Feed: All proofs (photos) and texts of all communities the user joined
  const communityPostsAndTexts = useMemo(() => {
    const list: Post[] = [];
    const seenIds = new Set<string>();

    // 1. Existing posts created in or tagged with joined communities
    unblockedPosts.forEach((post) => {
      const matchJoinedCommunity =
        (post.communityId && joinedCommunityIds.has(post.communityId)) ||
        (post.communityName &&
          joinedCommunities.some(
            (jc) => jc.name.toLowerCase() === post.communityName?.toLowerCase()
          ));
      if (matchJoinedCommunity && !seenIds.has(post.id)) {
        seenIds.add(post.id);
        list.push(post);
      }
    });

    // 2. Community discussion threads (all texts and photos/receipts from joined communities)
    joinedCommunities.forEach((comm) => {
      const threads = DailyStorageService.getCommunityDiscussions(comm.id);
      threads.forEach((t) => {
        const syntheticId = `comm_thread_${t.id}`;
        const authorFlair = t.authorFlair || '';
        if (!seenIds.has(syntheticId)) {
          seenIds.add(syntheticId);
          list.push({
            id: syntheticId,
            userId: t.authorId,
            name: t.authorName,
            username: t.authorUsername,
            userAvatar: t.authorAvatar,
            userStreak: authorFlair.includes('Streak')
              ? parseInt(authorFlair.replace(/\D/g, '')) || 7
              : 7,
            content: t.title ? `${t.title}\n\n${t.content}` : t.content,
            imageUrl: t.imageUrl,
            tags: [comm.name, ...(t.tags || []), t.flair || 'Discussion'].filter(Boolean),
            likesCount: t.upvotes || 0,
            likedByMe: t.userVote === 'up',
            viewsCount: (t.upvotes || 0) * 4 + 25,
            sharesCount: Math.floor((t.upvotes || 0) / 3),
            comments: (t.comments || []).map((c) => ({
              id: c.id,
              postId: syntheticId,
              userId: c.authorId,
              username: c.authorUsername,
              userAvatar: c.authorAvatar,
              userStreak: 5,
              content: c.content,
              createdAt: c.createdAt,
            })),
            createdAt: t.createdAt,
            isDailyStreakPost: false,
            communityId: comm.id,
            communityName: comm.name,
          });
        }
      });
    });

    return list;
  }, [unblockedPosts, joinedCommunities, joinedCommunityIds, feedRevision]);

  // Challenges Feed: All updates — text or photos — of all challenges user is participating in
  const challengeUpdatesAndProofs = useMemo(() => {
    const list: Post[] = [];
    const seenIds = new Set<string>();
    const challengeMap = new Map<string, Challenge>(joinedChallenges.map((c) => [c.id, c]));

    // 1. Challenge progress posts (daily photos, receipts, captions, cheers)
    const allProgressPosts = DailyStorageService.getAllChallengeProgressPosts();
    const relevantProgress = allProgressPosts.filter((p) =>
      joinedChallengeIds.has(p.challengeId)
    );

    relevantProgress.forEach((p) => {
      const ch = challengeMap.get(p.challengeId);
      const syntheticId = `ch_proof_${p.id}`;
      if (!seenIds.has(syntheticId)) {
        seenIds.add(syntheticId);
        const reflectionText = p.text || (p.teamName ? `Logged receipt for ${p.teamName}` : 'Completed daily protocol');
        list.push({
          id: syntheticId,
          userId: p.userId,
          name: p.userName,
          username: p.userUsername || p.userName.toLowerCase().replace(/\s+/g, ''),
          userAvatar: p.userAvatar,
          userStreak: p.userStreak || p.dayNumber,
          content: `Day ${p.dayNumber} Proof • ${ch?.title || 'Challenge'}\n${reflectionText}`,
          imageUrl: p.imageUrl,
          tags: [
            ch?.tag || ch?.category || 'Challenge',
            `Day ${p.dayNumber}`,
            ch?.title || 'Challenge',
          ].filter(Boolean),
          likesCount: p.cheersCount || 0,
          likedByMe: Boolean(p.cheeredByMe),
          viewsCount: (p.cheersCount || 0) * 3 + 30,
          sharesCount: Math.floor((p.cheersCount || 0) / 4),
          comments: [],
          createdAt: p.createdAt,
          isDailyStreakPost: true,
          challengeId: p.challengeId,
          challengeName: ch?.title,
        });
      }
    });

    // 2. Existing posts tagged or assigned to joined challenges
    unblockedPosts.forEach((post) => {
      const matchChallenge =
        (post.challengeId && joinedChallengeIds.has(post.challengeId)) ||
        (post.challengeName &&
          joinedChallenges.some(
            (jc) => jc.title.toLowerCase() === post.challengeName?.toLowerCase()
          ));
      if (matchChallenge && !seenIds.has(post.id)) {
        seenIds.add(post.id);
        list.push(post);
      }
    });

    // 3. Challenge cohort updates and text discussions
    joinedChallenges.forEach((ch) => {
      const messages = DailyStorageService.getChallengeMessages(ch.id);
      messages.forEach((msg) => {
        if (msg.text && msg.text.trim().length > 10) {
          const syntheticMsgId = `ch_msg_${msg.id}`;
          if (!seenIds.has(syntheticMsgId)) {
            seenIds.add(syntheticMsgId);
            const sender = DailyStorageService.getUserById(msg.senderId) || (msg.senderId === currentUser.id ? currentUser : null);
            const authorName = sender?.name || 'Cohort Participant';
            const authorUsername = sender?.username || 'participant';
            const authorAvatar = sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';
            const authorStreak = sender?.currentStreak || 5;

            list.push({
              id: syntheticMsgId,
              userId: msg.senderId,
              name: authorName,
              username: authorUsername,
              userAvatar: authorAvatar,
              userStreak: authorStreak,
              content: `💬 [${ch.title} Cohort Update]\n${msg.text}`,
              tags: [ch.title, ch.tag || ch.category || 'Challenge', 'Cohort Update'].filter(Boolean),
              likesCount: 5,
              likedByMe: false,
              viewsCount: 24,
              sharesCount: 1,
              comments: [],
              createdAt: msg.timestamp || 'Today',
              isDailyStreakPost: false,
              challengeId: ch.id,
              challengeName: ch.title,
            });
          }
        }
      });
    });

    return list;
  }, [unblockedPosts, joinedChallenges, joinedChallengeIds, feedRevision, currentUser]);

  // Apply Primary Feed Filter ('all' vs 'following' vs 'interests' vs 'community' vs 'challenges')
  const categoryFilteredPosts = useMemo(() => {
    if (feedFilter === 'following') {
      return unblockedPosts.filter((post) => {
        const isSelf = post.userId === currentUser.id || post.userId === 'user_me';
        const isFollowing = currentUser.followedUserIds.includes(post.userId);
        return isSelf || isFollowing;
      });
    }

    if (feedFilter === 'interests') {
      const userInterests = (currentUser.interests || []).map((i) => i.toLowerCase());
      return unblockedPosts.filter((post) => {
        const postTags = (post.tags || []).map((t) => t.toLowerCase());
        return postTags.some((tag) =>
          userInterests.some((interest) => tag.includes(interest) || interest.includes(tag))
        );
      });
    }

    if (feedFilter === 'community') {
      return communityPostsAndTexts;
    }

    if (feedFilter === 'challenges') {
      return challengeUpdatesAndProofs;
    }

    return unblockedPosts;
  }, [feedFilter, unblockedPosts, currentUser, communityPostsAndTexts, challengeUpdatesAndProofs]);

  // Apply Search and Tag Filters
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

    return true;
  });

  // Extract available tags adaptively based on current feed tab
  const availableTags = useMemo(() => {
    if (feedFilter === 'interests' && currentUser.interests && currentUser.interests.length > 0) {
      return currentUser.interests;
    }
    if (feedFilter === 'community') {
      const commTags = Array.from(
        new Set(joinedCommunities.flatMap((c) => [c.name, ...(c.tags || [])]).filter(Boolean))
      );
      return commTags.slice(0, 10);
    }
    if (feedFilter === 'challenges') {
      const challengeTags = Array.from(
        new Set(joinedChallenges.flatMap((c) => [c.tag, c.category, c.title]).filter(Boolean))
      );
      return challengeTags.slice(0, 10);
    }
    return Array.from(new Set(unblockedPosts.flatMap((p) => p.tags || []))).slice(0, 12);
  }, [feedFilter, currentUser.interests, joinedCommunities, joinedChallenges, unblockedPosts]);

  const handleFeedRefresh = async () => {
    setFeedRevision((r) => r + 1);
    if (onRefresh) {
      await onRefresh();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const handlePostLike = (postId: string) => {
    if (postId.startsWith('ch_proof_')) {
      const rawId = postId.replace('ch_proof_', '');
      DailyStorageService.toggleCheerChallengePost(rawId);
      setFeedRevision((r) => r + 1);
    } else if (postId.startsWith('comm_thread_')) {
      const rawThreadId = postId.replace('comm_thread_', '');
      const thread = communityPostsAndTexts.find((p) => p.id === postId);
      if (thread?.communityId) {
        DailyStorageService.voteCommunityDiscussion(
          thread.communityId,
          rawThreadId,
          thread.likedByMe ? 'down' : 'up'
        );
        setFeedRevision((r) => r + 1);
      }
    }
    onToggleLike(postId);
  };

  const currentSortOption =
    SORT_OPTIONS.find((opt) => opt.value === feedFilter) || SORT_OPTIONS[0];
  const CurrentSortIcon = currentSortOption.icon;

  return (
    <PullToRefresh
      onRefresh={handleFeedRefresh}
      pullText="Pull down to refresh feed"
      releaseText="Release to refresh feed"
      refreshingText="Refreshing daily stream..."
      completedText="Feed updated • Just now"
    >
      <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-3">
        {/* Sort By Option Button (replaces horizontal category tabs & removes proof counter) */}
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
          <div className="relative" ref={sortDropdownRef}>
            <button
              id="feed-sort-by-button"
              type="button"
              onClick={() => {
                vibrateLight();
                setIsSortOpen((prev) => !prev);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 transition-all shadow-sm active:scale-95 cursor-pointer"
              aria-expanded={isSortOpen}
              aria-haspopup="listbox"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#2F6FED]" />
              <span className="text-white/50 font-normal">Sort by:</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <CurrentSortIcon className="w-3.5 h-3.5 text-[#2F6FED]" />
                <span>{currentSortOption.label}</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 ${
                  isSortOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isSortOpen && (
              <div
                id="feed-sort-by-menu"
                className="absolute left-0 top-full mt-2 w-48 bg-[#141721] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Sort By
                </div>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = feedFilter === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      id={`feed-sort-option-${opt.value}`}
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setFeedFilter(opt.value);
                        setActiveTag(null);
                        setIsSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[#2F6FED] text-white shadow-md shadow-[#2F6FED]/30'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-white/50'}`} />
                        <span>{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tag filter pills (Horizontally Scrollable) */}
        {availableTags.length > 0 && (
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
              {feedFilter === 'interests'
                ? 'All Focus Areas'
                : feedFilter === 'community'
                ? 'All Communities'
                : feedFilter === 'challenges'
                ? 'All Challenges'
                : 'All Tags'}
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
                onToggleLike={handlePostLike}
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
            ) : feedFilter === 'community' ? (
              <EmptyStateIllustration
                type="community"
                title="No updates from your communities"
                description={
                  joinedCommunities.length === 0
                    ? "You haven't joined any communities yet. Discover topics and habits that match your goals to see proofs, updates, and discussions here."
                    : "Members of your joined communities haven't posted any proofs or discussions yet today. Start the momentum by posting your proof!"
                }
                primaryAction={{
                  label: joinedCommunities.length === 0 ? 'Discover Communities' : 'Post Proof to Community',
                  onClick: joinedCommunities.length === 0 ? () => onSelectTab('discover') : onOpenCreate,
                  icon: joinedCommunities.length === 0 ? <Compass className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />,
                }}
                secondaryAction={
                  joinedCommunities.length === 0
                    ? {
                        label: 'View All Feed',
                        onClick: () => setFeedFilter('all'),
                      }
                    : {
                        label: 'Discover More Communities',
                        onClick: () => onSelectTab('discover'),
                      }
                }
              />
            ) : feedFilter === 'challenges' ? (
              <EmptyStateIllustration
                type="challenges"
                title="No challenge updates yet"
                description={
                  joinedChallenges.length === 0
                    ? "You're not currently participating in any active challenges. Join a sprint or habit streak to unlock daily cohort updates, receipts, and proofs."
                    : "No participants have submitted proofs or updates for your joined challenges today yet. Submit your proof of work to lead the board!"
                }
                primaryAction={{
                  label: joinedChallenges.length === 0 ? 'Browse Challenges' : 'Log Daily Proof',
                  onClick: joinedChallenges.length === 0 ? () => onSelectTab('challenges') : onOpenCreate,
                  icon: joinedChallenges.length === 0 ? <Trophy className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />,
                }}
                secondaryAction={
                  joinedChallenges.length === 0
                    ? {
                        label: 'View All Feed',
                        onClick: () => setFeedFilter('all'),
                      }
                    : {
                        label: 'Explore Challenges',
                        onClick: () => onSelectTab('challenges'),
                      }
                }
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

      {/* Scroll-to-Top Floating Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          id="homefeed-scroll-to-top"
          className="fixed bottom-20 right-4 sm:right-6 z-40 p-3 rounded-full bg-[#2F6FED] hover:bg-blue-600 text-white shadow-2xl shadow-[#2F6FED]/40 border border-white/20 transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center animate-in fade-in slide-in-from-bottom-3"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </PullToRefresh>
  );
};
