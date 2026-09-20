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
  selectedSortFilters?: string[];
  onSelectSortFilters?: (filters: string[]) => void;
  onOpenSearchWithTag?: (tag: string, tab?: string) => void;
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
  selectedSortFilters: externalSortFilters,
  onSelectSortFilters: externalOnSelectSortFilters,
  onOpenSearchWithTag,
}) => {
  // Multi-option Sort/Filter: can be passed from parent (TopHeader) or managed locally
  const [internalSortFilters, setInternalSortFilters] = useState<string[]>([
    'proofs:all',
    'tweets:all',
  ]);
  const selectedSortFilters = externalSortFilters || internalSortFilters;

  const setSelectedSortFilters = (next: string[] | ((prev: string[]) => string[])) => {
    if (externalOnSelectSortFilters) {
      const resolved = typeof next === 'function' ? next(selectedSortFilters) : next;
      externalOnSelectSortFilters(resolved);
      return;
    }

    setInternalSortFilters((prev) => (typeof next === 'function' ? next(prev) : next));
  };

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [feedRevision, setFeedRevision] = useState(0);

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

  // Filter out blocked & muted users & reported posts
  const unblockedPosts = useMemo(() => {
    return DailyStorageService.filterPostsForHomeFeed(posts);
  }, [posts, currentUser.blockedUserIds, currentUser.mutedUserIds, feedRevision]);

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
        if (DailyStorageService.isUserBlocked(t.authorId) || DailyStorageService.isUserMuted(t.authorId)) {
          return;
        }
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
      joinedChallengeIds.has(p.challengeId) &&
      !DailyStorageService.isUserBlocked(p.userId) &&
      !DailyStorageService.isUserMuted(p.userId)
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
        if (DailyStorageService.isUserBlocked(msg.senderId) || DailyStorageService.isUserMuted(msg.senderId)) {
          return;
        }
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

  // Apply Tag Filters to candidate posts
  const filteredPosts = useMemo(() => {
    return multiFilteredPosts.filter((post) => {
      // Active tag filter
      if (activeTag) {
        const cleanTag = activeTag.replace(/^#/, '').toLowerCase();
        const hasTagInArray = (post.tags || []).some(
          (t) => t.replace(/^#/, '').toLowerCase() === cleanTag
        );
        const hasTagInContent = post.content
          .toLowerCase()
          .includes(`#${cleanTag}`);
        if (!hasTagInArray && !hasTagInContent) {
          return false;
        }
      }

      return true;
    });
  }, [multiFilteredPosts, activeTag]);

  // Derive available tags directly from unblockedPosts, including user-made hashtags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    // First, include user-created custom hashtags
    const customTags = DailyStorageService.getCustomHashtags();
    customTags.forEach((t) => tags.add(t));

    // Then extract all hashtags from candidate posts
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
    return Array.from(tags).filter(Boolean);
  }, [unblockedPosts, feedRevision]);

  const handleCreateCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagInput.replace(/^#/, '').trim().toLowerCase();
    if (!clean) return;
    vibrateLight();
    DailyStorageService.addCustomHashtag(clean);
    setNewTagInput('');
    setIsCreatingTag(false);
    setActiveTag(clean);
    setFeedRevision((r) => r + 1);
  };

  // All communities for statistics
  const allCommunities = useMemo(() => {
    return DailyStorageService.getAllCommunities();
  }, [feedRevision]);

  // Active hashtag for insight computation
  const cleanTagQuery = activeTag ? activeTag.replace(/^#/, '').trim().toLowerCase() : '';

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

    const allChallenges = DailyStorageService.getAllChallenges();
    const matchingChallenges = allChallenges.filter(
      (c) =>
        c.tag.toLowerCase() === cleanTagQuery ||
        c.tag.toLowerCase().includes(cleanTagQuery) ||
        c.title.toLowerCase().includes(cleanTagQuery) ||
        c.category.toLowerCase().includes(cleanTagQuery) ||
        c.description?.toLowerCase().includes(cleanTagQuery)
    );

    return {
      tag: cleanTagQuery,
      communityCount: matchingCommunities.length,
      proofsCount: matchingProofs.length,
      tweetsCount: matchingTweets.length,
      challengesCount: matchingChallenges.length,
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
        {/* Active Filter Badges */}
        {!(
          selectedSortFilters.length === 2 &&
          selectedSortFilters.includes('proofs:all') &&
          selectedSortFilters.includes('tweets:all')
        ) && (
          <div className="flex items-center gap-1.5 flex-wrap pb-1">
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
            className="p-3.5 rounded-2xl bg-[#2F6FED]/10 border border-[#2F6FED]/25 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
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
                  title={`Create community from #${hashtagStats.tag}`}
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>Create Community from #{hashtagStats.tag}</span>
                </button>
              )}
            </div>

            {/* Counts: Communities, Proofs, Tweets, and Challenges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 p-2 rounded-xl border border-white/5 text-center">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  onOpenSearchWithTag?.(hashtagStats.tag, 'communities');
                }}
                className="py-1.5 px-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-blue-500/30 text-center group"
                title={`View all communities for #${hashtagStats.tag}`}
              >
                <span className="text-sm font-black font-mono text-blue-400 block group-hover:scale-105 transition-transform">
                  {hashtagStats.communityCount}
                </span>
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider block mt-0.5">
                  Communities
                </span>
                <span className="text-[8px] text-blue-300/50 block font-medium">Click to view</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  if (onOpenSearchWithTag) {
                    onOpenSearchWithTag(hashtagStats.tag, 'proofs');
                  } else {
                    setSelectedSortFilters(['proofs:all']);
                  }
                }}
                className="py-1.5 px-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-emerald-500/30 text-center group"
                title={`View all proofs for #${hashtagStats.tag}`}
              >
                <span className="text-sm font-black font-mono text-emerald-400 block group-hover:scale-105 transition-transform">
                  {hashtagStats.proofsCount}
                </span>
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider block mt-0.5">
                  Proofs
                </span>
                <span className="text-[8px] text-emerald-300/50 block font-medium">Click to view</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  if (onOpenSearchWithTag) {
                    onOpenSearchWithTag(hashtagStats.tag, 'tweets');
                  } else {
                    setSelectedSortFilters(['tweets:all']);
                  }
                }}
                className="py-1.5 px-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-sky-500/30 text-center group"
                title={`View all tweets for #${hashtagStats.tag}`}
              >
                <span className="text-sm font-black font-mono text-sky-400 block group-hover:scale-105 transition-transform">
                  {hashtagStats.tweetsCount}
                </span>
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider block mt-0.5">
                  Tweets
                </span>
                <span className="text-[8px] text-sky-300/50 block font-medium">Click to view</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  onOpenSearchWithTag?.(hashtagStats.tag, 'challenges');
                }}
                className="py-1.5 px-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-amber-500/30 text-center group"
                title={`View all challenges for #${hashtagStats.tag}`}
              >
                <span className="text-sm font-black font-mono text-amber-400 block group-hover:scale-105 transition-transform">
                  {hashtagStats.challengesCount}
                </span>
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider block mt-0.5">
                  Challenges
                </span>
                <span className="text-[8px] text-amber-300/50 block font-medium">Click to view</span>
              </button>
            </div>

            {onOpenSearchWithTag && (
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  onOpenSearchWithTag(hashtagStats.tag, 'all');
                }}
                className="w-full text-center text-[10px] text-[#5B8DEF] hover:text-white font-bold py-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span>Search all results for #{hashtagStats.tag}</span>
                <Search className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Tag filter pills (Horizontally Scrollable) */}
        <div className="space-y-1.5">
          <div
            onWheel={handleHorizontalWheelScroll}
            className="w-full flex items-center gap-1.5 overflow-x-auto whitespace-nowrap flex-nowrap pb-1 no-scrollbar touch-pan-x overscroll-x-contain py-1"
          >
            <button
              onClick={() => {
                vibrateLight();
                setActiveTag(null);
              }}
              className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                activeTag === null
                  ? 'bg-white text-black border-white font-black'
                  : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              All Tags
            </button>

            {/* Make Custom Hashtag Button */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                setIsCreatingTag(!isCreatingTag);
              }}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1 ${
                isCreatingTag
                  ? 'bg-[#2F6FED] text-white border-[#2F6FED]'
                  : 'bg-white/5 text-[#5B8DEF] border-[#2F6FED]/30 hover:bg-[#2F6FED]/10'
              }`}
              title="Create your own hashtag"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Make Tag</span>
            </button>

            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  vibrateLight();
                  setActiveTag(activeTag === tag ? null : tag);
                }}
                className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer ${
                  activeTag === tag
                    ? 'bg-[#2F6FED] text-white border-[#2F6FED] font-black shadow-sm'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Inline Custom Hashtag Creator */}
          {isCreatingTag && (
            <form
              onSubmit={handleCreateCustomTag}
              className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-xl animate-in fade-in"
            >
              <span className="text-xs font-mono font-bold text-[#5B8DEF] pl-1">#</span>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="type-new-hashtag (e.g. morningrun, indiehacker)..."
                autoFocus
                className="flex-1 bg-transparent text-xs text-white placeholder-white/40 focus:outline-none font-mono"
              />
              <button
                type="submit"
                disabled={!newTagInput.trim()}
                className="px-3 py-1 rounded-lg bg-[#2F6FED] text-white text-[11px] font-bold hover:bg-blue-600 disabled:opacity-40 transition-all cursor-pointer"
              >
                Add Tag
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingTag(false);
                  setNewTagInput('');
                }}
                className="p-1 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

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
