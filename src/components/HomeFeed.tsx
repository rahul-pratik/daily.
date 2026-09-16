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
  Camera,
  MessageSquare,
  X,
  CheckSquare,
  Square,
  Layers,
  Search,
  Plus,
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
  onOpenCreateCommunity?: (tag?: string) => void;
}

export type FeedContentType = 'proofs' | 'tweets';
export type FeedCategory = 'all' | 'following' | 'interests' | 'communities' | 'challenges';

export const FEED_CATEGORIES: {
  id: FeedCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'following', label: 'Following', icon: Users },
  { id: 'interests', label: 'Interests', icon: Flame },
  { id: 'communities', label: 'Communities', icon: Globe },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
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
  onOpenCreateCommunity,
}) => {
  // Multi-option Sort/Filter: each filter key is "type:category" (e.g. 'proofs:all', 'tweets:interests')
  const [selectedSortFilters, setSelectedSortFilters] = useState<string[]>([
    'proofs:all',
    'tweets:all',
  ]);
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

  // 1. Photo Proof check (contains photo)
  const isPostProof = (post: Post): boolean => {
    return Boolean(
      (post.imageUrl && post.imageUrl.trim().length > 0) ||
      (post.imageUrls && post.imageUrls.length > 0)
    );
  };

  // 2. Text Tweet check (has no photo)
  const isPostTweet = (post: Post): boolean => {
    return !isPostProof(post);
  };

  // Check following/me
  const isFollowingOrMe = (post: Post): boolean => {
    return (
      post.userId === currentUser.id ||
      post.userId === 'user_me' ||
      (currentUser.followedUserIds || []).includes(post.userId)
    );
  };

  // Check interests
  const matchesInterests = (post: Post): boolean => {
    const userInterests = (currentUser.interests || []).map((i) => i.toLowerCase());
    if (userInterests.length === 0) return true;
    const postTags = (post.tags || []).map((t) => t.toLowerCase());
    return postTags.some((tag) =>
      userInterests.some((interest) => tag.includes(interest) || interest.includes(tag))
    );
  };

  // Check communities
  const matchesCommunities = (post: Post): boolean => {
    if (post.id.startsWith('comm_thread_')) return true;
    if (post.communityId && joinedCommunityIds.has(post.communityId)) return true;
    if (
      post.communityName &&
      joinedCommunities.some(
        (jc) => jc.name.toLowerCase() === post.communityName?.toLowerCase()
      )
    ) {
      return true;
    }
    return false;
  };

  // Check challenges
  const matchesChallenges = (post: Post): boolean => {
    if (post.id.startsWith('ch_proof_') || post.id.startsWith('ch_msg_')) return true;
    if (post.challengeId && joinedChallengeIds.has(post.challengeId)) return true;
    if (
      post.challengeName &&
      joinedChallenges.some(
        (jc) => jc.title.toLowerCase() === post.challengeName?.toLowerCase()
      )
    ) {
      return true;
    }
    return false;
  };

  // Combined pool of all potential posts without duplicates
  const allCandidatePosts = useMemo(() => {
    const map = new Map<string, Post>();
    unblockedPosts.forEach((p) => map.set(p.id, p));
    communityPostsAndTexts.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    challengeUpdatesAndProofs.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values());
  }, [unblockedPosts, communityPostsAndTexts, challengeUpdatesAndProofs]);

  // Test single post against a filter key like 'proofs:all', 'tweets:interests'
  const doesPostMatchFilter = (post: Post, filterKey: string): boolean => {
    const [type, category] = filterKey.split(':');

    // Content type check
    if (type === 'proofs' && !isPostProof(post)) return false;
    if (type === 'tweets' && !isPostTweet(post)) return false;

    // Category check
    switch (category) {
      case 'all':
        return true;
      case 'following':
        return isFollowingOrMe(post);
      case 'interests':
        return matchesInterests(post);
      case 'communities':
        return matchesCommunities(post);
      case 'challenges':
        return matchesChallenges(post);
      default:
        return false;
    }
  };

  // Multi-option filtering: post is kept if it matches ANY of the selected sort/filter options
  const multiFilteredPosts = useMemo(() => {
    if (selectedSortFilters.length === 0) {
      return allCandidatePosts;
    }
    return allCandidatePosts.filter((post) =>
      selectedSortFilters.some((key) => doesPostMatchFilter(post, key))
    );
  }, [
    allCandidatePosts,
    selectedSortFilters,
    currentUser,
    joinedCommunityIds,
    joinedCommunities,
    joinedChallengeIds,
    joinedChallenges,
  ]);

  // Apply Search and Tag Filters
  const filteredPosts = useMemo(() => {
    return multiFilteredPosts.filter((post) => {
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
  }, [multiFilteredPosts, searchQuery, activeTag]);

  // Derive available tags directly from unblockedPosts, including user-made hashtags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    unblockedPosts.forEach((p) => {
      (p.tags || []).forEach((t) => {
        const clean = t.replace(/^#/, '').trim();
        if (clean) tags.add(clean);
      });
      const matches = p.content.match(/#[a-zA-Z0-9_\u0080-\uFFFF]+/g);
      if (matches) {
        matches.forEach((m) => {
          const clean = m.replace(/^#/, '').trim();
          if (clean) tags.add(clean);
        });
      }
    });
    return Array.from(tags).filter(Boolean).slice(0, 24);
  }, [unblockedPosts]);

  // All communities for statistics
  const allCommunities = useMemo(() => {
    return DailyStorageService.getAllCommunities();
  }, [feedRevision]);

  // Active hashtag for insight computation
  const activeSearchOrTag = searchQuery.trim() || (activeTag ? `#${activeTag}` : '');
  const cleanTagQuery = activeSearchOrTag.replace(/^#/, '').trim().toLowerCase();

  const hashtagStats = useMemo(() => {
    if (!cleanTagQuery) return null;
    const matchingCommunities = allCommunities.filter(
      (c) =>
        c.name.toLowerCase().includes(cleanTagQuery) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(cleanTagQuery)) ||
        c.category.toLowerCase().includes(cleanTagQuery)
    );

    const matchingProofs = unblockedPosts.filter(
      (p) =>
        isPostProof(p) &&
        ((p.tags || []).some((t) => t.toLowerCase().includes(cleanTagQuery)) ||
          p.content.toLowerCase().includes(cleanTagQuery))
    );

    const matchingTweets = unblockedPosts.filter(
      (p) =>
        isPostTweet(p) &&
        ((p.tags || []).some((t) => t.toLowerCase().includes(cleanTagQuery)) ||
          p.content.toLowerCase().includes(cleanTagQuery))
    );

    return {
      tag: cleanTagQuery,
      communityCount: matchingCommunities.length,
      proofsCount: matchingProofs.length,
      tweetsCount: matchingTweets.length,
    };
  }, [cleanTagQuery, allCommunities, unblockedPosts]);

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

  const toggleSortFilter = (filterKey: string) => {
    vibrateLight();
    setSelectedSortFilters((prev) => {
      if (prev.includes(filterKey)) {
        const next = prev.filter((k) => k !== filterKey);
        return next.length > 0 ? next : ['proofs:all', 'tweets:all'];
      } else {
        return [...prev, filterKey];
      }
    });
  };

  const applyPreset = (preset: string[]) => {
    vibrateLight();
    setSelectedSortFilters(preset);
  };

  const resetFilters = () => {
    vibrateLight();
    setSelectedSortFilters(['proofs:all', 'tweets:all']);
    setActiveTag(null);
  };

  const getSortButtonSummary = () => {
    const hasProofsAll = selectedSortFilters.includes('proofs:all');
    const hasTweetsAll = selectedSortFilters.includes('tweets:all');

    if (selectedSortFilters.length === 2 && hasProofsAll && hasTweetsAll) {
      return 'All Feed';
    }
    if (selectedSortFilters.length === 1 && hasProofsAll) {
      return 'Proofs Only';
    }
    if (selectedSortFilters.length === 1 && hasTweetsAll) {
      return 'Tweets Only';
    }
    if (selectedSortFilters.length === 1) {
      const [t, c] = selectedSortFilters[0].split(':');
      const tLabel = t === 'proofs' ? 'Proofs' : 'Tweets';
      const cLabel = c.charAt(0).toUpperCase() + c.slice(1);
      return `${tLabel}: ${cLabel}`;
    }
    if (selectedSortFilters.length <= 2) {
      return selectedSortFilters
        .map((k) => {
          const [t, c] = k.split(':');
          return `${t === 'proofs' ? 'Proofs' : 'Tweets'} (${c})`;
        })
        .join(' + ');
    }
    return `${selectedSortFilters.length} Filters`;
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
        {/* Search Bar & Sort By Option beside each other */}
        <div className="flex flex-col gap-2 border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            {/* Search Input Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                id="feed-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feed, proofs, tweets, #tags..."
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-white/5 hover:bg-white/[0.08] focus:bg-black/50 border border-white/10 text-white placeholder-white/40 text-xs font-medium focus:outline-none focus:border-[#2F6FED] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort / Filter Option Beside Search Bar */}
            <div className="relative shrink-0" ref={sortDropdownRef}>
              <button
                id="feed-sort-by-button"
                type="button"
                onClick={() => {
                  vibrateLight();
                  setIsSortOpen((prev) => !prev);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 transition-all shadow-sm active:scale-95 cursor-pointer"
                aria-expanded={isSortOpen}
                aria-haspopup="dialog"
                title="Sort & Filter Feed"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#2F6FED]" />
                <span className="hidden sm:inline text-white/50 font-normal">Sort:</span>
                <span className="font-bold text-white max-w-[110px] truncate">
                  {getSortButtonSummary()}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-white/50 transition-transform duration-200 shrink-0 ${
                    isSortOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {/* Dropdown / Multi-Select Popover */}
              {isSortOpen && (
                <div
                  id="feed-sort-by-menu"
                  className="absolute right-0 sm:left-auto top-full mt-2 w-[340px] sm:w-[400px] max-w-[calc(100vw-24px)] bg-[#12141c] border border-white/10 rounded-2xl shadow-2xl shadow-black/90 backdrop-blur-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3 max-h-[85vh] overflow-y-auto no-scrollbar"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div>
                      <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#2F6FED]" />
                        <span>Filter & Sort Stream</span>
                      </h4>
                      <p className="text-[10px] text-white/50">
                        Select multiple options for Proofs & Tweets
                      </p>
                    </div>
                    <button
                      onClick={resetFilters}
                      className="text-[11px] font-bold text-white/60 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Reset to All Feed
                    </button>
                  </div>

                  {/* Quick Filters: Proofs Only & Tweets Only */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                      Quick Filter
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => applyPreset(['proofs:all'])}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                          selectedSortFilters.length === 1 && selectedSortFilters.includes('proofs:all')
                            ? 'bg-[#2F6FED] text-white border-[#2F6FED]'
                            : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Camera className="w-3 h-3 text-white" />
                        <span>Proofs Only</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPreset(['tweets:all'])}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                          selectedSortFilters.length === 1 && selectedSortFilters.includes('tweets:all')
                            ? 'bg-sky-500 text-black border-sky-500'
                            : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3 text-sky-300" />
                        <span>Tweets Only</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPreset(['proofs:all', 'tweets:all'])}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                          selectedSortFilters.length === 2 &&
                          selectedSortFilters.includes('proofs:all') &&
                          selectedSortFilters.includes('tweets:all')
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <span>All (Default)</span>
                      </button>
                    </div>
                  </div>

                  {/* Two Sections: Proofs (With Photo) and Tweets (No Photo) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* SECTION 1: PROOFS */}
                    <div className="space-y-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between pb-1 border-b border-white/5">
                        <div className="flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#2F6FED]" />
                          <span className="text-xs font-black text-white">Proofs</span>
                        </div>
                        <span className="text-[9px] text-white/40 font-mono">With photo</span>
                      </div>

                      <div className="space-y-1">
                        {FEED_CATEGORIES.map((cat) => {
                          const key = `proofs:${cat.id}`;
                          const isSelected = selectedSortFilters.includes(key);
                          const Icon = cat.icon;
                          return (
                            <button
                              key={key}
                              id={`feed-sort-${key}`}
                              type="button"
                              onClick={() => toggleSortFilter(key)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-[#2F6FED]/20 border-[#2F6FED] text-white shadow-sm'
                                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#2F6FED]' : 'text-white/40'}`} />
                                <span className="truncate">{cat.label}</span>
                              </div>
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-[#2F6FED] shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-white/20 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECTION 2: TWEETS */}
                    <div className="space-y-1.5 p-2 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center justify-between pb-1 border-b border-white/5">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                          <span className="text-xs font-black text-white">Tweets</span>
                        </div>
                        <span className="text-[9px] text-white/40 font-mono">No photo</span>
                      </div>

                      <div className="space-y-1">
                        {FEED_CATEGORIES.map((cat) => {
                          const key = `tweets:${cat.id}`;
                          const isSelected = selectedSortFilters.includes(key);
                          const Icon = cat.icon;
                          return (
                            <button
                              key={key}
                              id={`feed-sort-${key}`}
                              type="button"
                              onClick={() => toggleSortFilter(key)}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-500/20 border-sky-400 text-white shadow-sm'
                                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-white/40'}`} />
                                <span className="truncate">{cat.label}</span>
                              </div>
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-white/20 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-[11px] text-white/60 font-medium">
                      {selectedSortFilters.length} {selectedSortFilters.length === 1 ? 'filter' : 'filters'} active
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setIsSortOpen(false);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-black font-black text-xs hover:bg-white/90 transition-colors shadow-sm cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Badges */}
          {!(
            selectedSortFilters.length === 2 &&
            selectedSortFilters.includes('proofs:all') &&
            selectedSortFilters.includes('tweets:all')
          ) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Active:</span>
              {selectedSortFilters.map((key) => {
                const [type, cat] = key.split(':');
                const isProof = type === 'proofs';
                return (
                  <span
                    key={key}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors ${
                      isProof
                        ? 'bg-[#2F6FED]/15 border-[#2F6FED]/40 text-[#5B8DEF]'
                        : 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                    }`}
                  >
                    <span>{isProof ? '📸 Proofs' : '💬 Tweets'}:</span>
                    <span className="text-white capitalize">{cat}</span>
                    <button
                      type="button"
                      onClick={() => toggleSortFilter(key)}
                      className="hover:text-white ml-0.5 p-0.5 rounded hover:bg-white/10 cursor-pointer"
                      title={`Remove ${key}`}
                      aria-label={`Remove ${key}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Hashtag Insights Banner */}
          {hashtagStats && (
            <div
              id="feed-hashtag-insights"
              className="p-3 rounded-2xl bg-[#2F6FED]/10 border border-[#2F6FED]/25 space-y-2 mt-1 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#2F6FED] animate-pulse shrink-0" />
                  <span className="font-mono text-xs font-black text-[#5B8DEF] truncate">
                    #{hashtagStats.tag}
                  </span>
                  <span className="text-[10px] text-white/50 font-medium">Activity Stats</span>
                </div>

                {onOpenCreateCommunity && (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      onOpenCreateCommunity(hashtagStats.tag);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#2F6FED] hover:bg-blue-600 active:scale-95 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
                    title={`Create squad from #${hashtagStats.tag}`}
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>Create Squad from #{hashtagStats.tag}</span>
                  </button>
                )}
              </div>

              {/* Counts: Communities, Proofs, and Tweets */}
              <div className="grid grid-cols-3 gap-2 bg-black/40 p-2 rounded-xl border border-white/5 text-center">
                <div className="py-1">
                  <span className="text-sm font-black font-mono text-white block">
                    {hashtagStats.communityCount}
                  </span>
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider block">
                    Communities Made
                  </span>
                </div>
                <div className="py-1 border-x border-white/5">
                  <span className="text-sm font-black font-mono text-[#5B8DEF] block">
                    {hashtagStats.proofsCount}
                  </span>
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider block">
                    Proofs Made
                  </span>
                </div>
                <div className="py-1">
                  <span className="text-sm font-black font-mono text-sky-400 block">
                    {hashtagStats.tweetsCount}
                  </span>
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider block">
                    Tweets Made
                  </span>
                </div>
              </div>
            </div>
          )}
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
              All Tags
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
            {activeTag ? (
              <EmptyStateIllustration
                type="search"
                title={`No posts found with tag #${activeTag}`}
                description="Try selecting a different tag or clear the tag filter to see all matching stream posts."
                primaryAction={{
                  label: 'Clear Tag Filter',
                  onClick: () => setActiveTag(null),
                }}
              />
            ) : searchQuery ? (
              <EmptyStateIllustration
                type="search"
                title={`No posts matching "${searchQuery}"`}
                description="Try searching with a broader keyword, different habit name, or clear the search query."
                primaryAction={{
                  label: 'Clear Search Query',
                  onClick: () => setSearchQuery(''),
                }}
              />
            ) : (
              <EmptyStateIllustration
                type="feed"
                title="No posts match your selected filters"
                description={`No posts match the current filter selection (${getSortButtonSummary()}). Try adjusting your Proofs or Tweets options, or reset to view all posts.`}
                primaryAction={{
                  label: 'Reset Filters to All',
                  onClick: resetFilters,
                  icon: <Sparkles className="w-4 h-4" />,
                }}
                secondaryAction={{
                  label: 'Create New Post',
                  onClick: onOpenCreate,
                  icon: <PlusCircle className="w-4 h-4" />,
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
