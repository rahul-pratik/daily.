import React, { useState } from 'react';
import {
  Compass,
  UserPlus,
  Check,
  MessageSquare,
  Sparkles,
  X,
  Users,
  Globe2,
  ShieldCheck,
  PlusCircle,
  Clock,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { User, Community, AVAILABLE_INTERESTS, AVAILABLE_HABITS } from '../types';
import { PullToRefresh } from './PullToRefresh';
import { handleHorizontalWheelScroll } from '../utils/scroll';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { DailyStorageService } from '../services/storage';

interface DiscoverScreenProps {
  users: User[];
  currentUser: User;
  communities?: Community[];
  onToggleFollow: (userId: string) => void;
  onSendDM: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onViewUser?: (user: User) => void;
  onOpenCommunity?: (community: Community) => void;
  onToggleJoinCommunity?: (communityId: string) => void;
  onCreateCommunity?: () => void;
  onRefresh?: () => Promise<void> | void;
}

type EntityTypeFilter = 'all' | 'people' | 'communities';

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  users,
  currentUser,
  communities = [],
  onToggleFollow,
  onSendDM,
  onViewUser,
  onOpenCommunity,
  onToggleJoinCommunity,
  onCreateCommunity,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<EntityTypeFilter>('all');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [showJoinedCommunities, setShowJoinedCommunities] = useState(false);

  // Calculate match percentage for a user based on overlapping interests and habits
  const calculateMatchScore = (otherUser: User): number => {
    const myInterests = new Set(currentUser.interests || []);
    const myHabits = new Set(currentUser.habits || []);

    const commonInterests = (otherUser.interests || []).filter((i) => myInterests.has(i));
    const commonHabits = (otherUser.habits || []).filter((h) => myHabits.has(h));

    const totalMatches = commonInterests.length * 1.5 + commonHabits.length * 1.5;
    const maxPossible = (myInterests.size + myHabits.size) * 1.2 || 1;

    const rawRatio = Math.min(1, totalMatches / maxPossible);
    const score = Math.round(55 + rawRatio * 43);
    return Math.min(99, Math.max(50, score));
  };

  // Filter out current user from creators
  const otherUsers = users.filter((u) => u.id !== currentUser.id && !u.isCurrentUser);

  // Filter Users
  const filteredUsers = otherUsers.filter((user) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = user.name.toLowerCase().includes(q);
      const matchUser = user.username.toLowerCase().includes(q);
      const matchBio = (user.bio || '').toLowerCase().includes(q);
      const matchInterests = user.interests?.some((i) => i.toLowerCase().includes(q));
      const matchHabits = user.habits?.some((h) => h.toLowerCase().includes(q));
      if (!matchName && !matchUser && !matchBio && !matchInterests && !matchHabits) {
        return false;
      }
    }

    if (activeFilterTag) {
      const tagLower = activeFilterTag.toLowerCase();
      const hasInterest = user.interests?.some(
        (i) => i.toLowerCase() === tagLower || tagLower.includes(i.toLowerCase())
      );
      const hasHabit = user.habits?.some(
        (h) => h.toLowerCase() === tagLower || tagLower.includes(h.toLowerCase())
      );
      if (!hasInterest && !hasHabit) return false;
    }

    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return calculateMatchScore(b) - calculateMatchScore(a);
  });

  // Filter Communities
  const filteredCommunities = communities.filter((comm) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = comm.name.toLowerCase().includes(q);
      const matchDesc = (comm.description || '').toLowerCase().includes(q);
      const matchCat = (comm.category || '').toLowerCase().includes(q);
      const matchMod = (comm.moderatorName || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat && !matchMod) {
        return false;
      }
    }

    if (activeFilterTag) {
      const tagLower = activeFilterTag.toLowerCase();
      const catLower = (comm.category || '').toLowerCase();
      const nameLower = comm.name.toLowerCase();
      const descLower = (comm.description || '').toLowerCase();
      const tagsMatch = (comm.tags || []).some((t) => t.toLowerCase() === tagLower);

      const matchCat = catLower === tagLower || catLower.includes(tagLower) || tagLower.includes(catLower);
      const matchName = nameLower.includes(tagLower);
      const matchDesc = descLower.includes(tagLower);

      if (!matchCat && !matchName && !matchDesc && !tagsMatch) return false;
    }

    return true;
  });

  // Communities joined by the current user
  const myJoinedCommunities = communities.filter((c) =>
    (c.memberIds || []).includes(currentUser.id)
  );

  // Filter Chips List
  const allFilterChips = [
    { label: 'All', value: null, icon: '🔥' },
    ...AVAILABLE_INTERESTS.map((interest) => ({
      label: `#${interest}`,
      value: interest,
      icon: '🏷️',
    })),
    ...AVAILABLE_HABITS.map((habit) => ({
      label: habit,
      value: habit,
      icon: '⚡',
    })),
  ];

  const handleDiscoverRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  // If user opened the "Joined Communities" view, render chat-like list of joined communities
  if (showJoinedCommunities) {
    return (
      <PullToRefresh onRefresh={handleDiscoverRefresh}>
        <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 space-y-4 text-white animate-in fade-in duration-200">
          {/* Back header */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                setShowJoinedCommunities(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-blue-400" />
              <span>Back to Explore</span>
            </button>

            <div className="text-right">
              <h2 className="text-sm font-bold text-white">Joined Communities</h2>
              <p className="text-[10px] text-white/40">{myJoinedCommunities.length} Active spaces</p>
            </div>
          </div>

          {myJoinedCommunities.length === 0 ? (
            <div className="text-center py-14 px-4 space-y-4 bg-white/[0.02] border border-white/5 rounded-3xl">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 mx-auto flex items-center justify-center text-blue-400">
                <Globe2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No joined communities yet</h3>
                <p className="text-xs text-white/50 max-w-xs mx-auto mt-1">
                  Explore open communities or request access to moderated groups to receive discussions and chat-style updates here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowJoinedCommunities(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                Browse Communities
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                  Community Chats & Updates
                </span>
                <span className="text-[10px] text-white/40">Tap to open updates</span>
              </div>

              <div className="divide-y divide-white/5 bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                {myJoinedCommunities.map((comm) => {
                  const threads = DailyStorageService.getCommunityDiscussions(comm.id);
                  const latestThread = threads.length > 0 ? threads[0] : null;

                  return (
                    <div
                      key={comm.id}
                      onClick={() => {
                        vibrateLight();
                        onOpenCommunity && onOpenCommunity(comm);
                      }}
                      className="p-3.5 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-3.5 group active:bg-white/10"
                    >
                      {/* Avatar with theme indicator */}
                      <div className="relative shrink-0">
                        <img
                          src={comm.avatar}
                          alt={comm.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover ring-2"
                          style={{ '--tw-ring-color': comm.themeColor || '#2F6FED' } as React.CSSProperties}
                        />
                        <div
                          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center"
                          style={{ backgroundColor: comm.themeColor || '#2F6FED' }}
                        >
                          <Globe2 className="w-2 h-2 text-white" />
                        </div>
                      </div>

                      {/* Chat Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="font-bold text-xs sm:text-sm text-white truncate group-hover:text-blue-300 transition-colors">
                              {comm.name}
                            </h3>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/60 font-semibold border border-white/10 shrink-0">
                              #{comm.category}
                            </span>
                          </div>

                          <span className="text-[10px] text-white/40 shrink-0">
                            {latestThread?.createdAt || comm.lastActivity || 'Active'}
                          </span>
                        </div>

                        {/* Latest update preview line (formatted like a chat message) */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-white/60 truncate flex items-center gap-1">
                            {latestThread ? (
                              <>
                                <span className="font-semibold text-blue-400 shrink-0">
                                  {latestThread.authorName}:
                                </span>
                                <span className="truncate">{latestThread.title}</span>
                              </>
                            ) : (
                              <span className="text-white/40 italic">
                                No updates yet • Tap to start a discussion
                              </span>
                            )}
                          </p>

                          {threads.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
                              {threads.length} updates
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={handleDiscoverRefresh}>
      <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 space-y-4 text-white">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-black text-lg text-white">Explore</h1>
              <p className="text-[11px] text-white/50">Discover communities & fellow builders</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort by Option (No numbers mentioned beside options) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setIsSortMenuOpen(!isSortMenuOpen);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/80 hover:text-white transition-all shadow-sm"
                title="Sort / filter by category"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#2F6FED]" />
                <span>
                  {entityFilter === 'all'
                    ? 'All'
                    : entityFilter === 'communities'
                    ? 'Communities'
                    : 'Creators'}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-white/40 transition-transform duration-200 ${
                    isSortMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isSortMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsSortMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-[#141418] border border-white/10 shadow-2xl p-1.5 z-40 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setEntityFilter('all');
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        entityFilter === 'all'
                          ? 'bg-[#2F6FED] text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Compass className="w-3.5 h-3.5" />
                        <span>All</span>
                      </div>
                      {entityFilter === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setEntityFilter('communities');
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        entityFilter === 'communities'
                          ? 'bg-[#2F6FED] text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe2 className="w-3.5 h-3.5" />
                        <span>Communities</span>
                      </div>
                      {entityFilter === 'communities' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setEntityFilter('people');
                        setIsSortMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                        entityFilter === 'people'
                          ? 'bg-[#2F6FED] text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>Creators</span>
                      </div>
                      {entityFilter === 'people' && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </>
              )}
            </div>

            {onCreateCommunity && (
              <button
                onClick={onCreateCommunity}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-md shadow-blue-500/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create Community</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Chips Carousel */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3 h-3 text-blue-400" />
              <span>Filter by Topic / Habit</span>
            </span>
            {activeFilterTag && (
              <button
                onClick={() => setActiveFilterTag(null)}
                className="text-[10px] text-blue-400 hover:underline font-semibold"
              >
                Clear filter
              </button>
            )}
          </div>

          <div
            onWheel={handleHorizontalWheelScroll}
            className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap flex-nowrap pb-1 no-scrollbar touch-pan-x overscroll-x-contain"
          >
            {allFilterChips.map((chip, idx) => {
              const isActive = activeFilterTag === chip.value;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    vibrateLight();
                    setActiveFilterTag(isActive ? null : chip.value);
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5 text-white/70'
                  }`}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BUTTON: My Joined Communities (Replaces previous All / Communities / Creators bar) */}
        <div>
          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setShowJoinedCommunities(true);
            }}
            className="w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/15 via-blue-500/10 to-indigo-600/15 border border-blue-500/25 hover:border-blue-500/40 text-white transition-all group shadow-sm active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2F6FED] flex items-center justify-center text-white shadow-md shadow-[#2F6FED]/30 shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    My Joined Communities
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {myJoinedCommunities.length}
                  </span>
                </div>
                <p className="text-[11px] text-white/50">
                  View chat-style updates, discussions & announcements
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform">
              <span className="hidden sm:inline">View Chats</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Active Tag Filter Summary Banner */}
        {activeFilterTag && (
          <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl p-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Showing results filtered by <strong>#{activeFilterTag}</strong>
              </span>
            </div>
            <button
              onClick={() => setActiveFilterTag(null)}
              className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Lists */}
        <div className="space-y-6">
          {/* SECTION 1: COMMUNITIES (Both Public & Moderated Spaces) */}
          {(entityFilter === 'all' || entityFilter === 'communities') && filteredCommunities.length > 0 && (
            <div className="space-y-3">
              {/* Header without count or view-all text */}
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                  Communities
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredCommunities.map((comm) => {
                  const isMember = (comm.memberIds || []).includes(currentUser.id);
                  const isPending = (comm.pendingRequestUserIds || []).includes(currentUser.id);
                  const isModerator = comm.moderatorId === currentUser.id;

                  return (
                    <div
                      key={comm.id}
                      className="bg-white/5 border border-white/5 hover:border-blue-500/20 rounded-[24px] overflow-hidden transition-all group"
                    >
                      {/* Banner / Visual Theme Header (No default banner fallback) */}
                      <div
                        onClick={() => onOpenCommunity && onOpenCommunity(comm)}
                        className="relative h-24 w-full cursor-pointer overflow-hidden"
                        style={
                          comm.coverImage
                            ? undefined
                            : {
                                background: `linear-gradient(135deg, ${comm.themeColor || '#2F6FED'}33 0%, rgba(15, 15, 22, 0.95) 100%)`,
                              }
                        }
                      >
                        {comm.coverImage ? (
                          <img
                            src={comm.coverImage}
                            alt={comm.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full relative overflow-hidden">
                            <div
                              className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-2xl opacity-25 pointer-events-none"
                              style={{ backgroundColor: comm.themeColor || '#2F6FED' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/30 to-transparent" />

                        {/* Badge: Access Model */}
                        <div className="absolute top-2.5 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-blue-300">
                          {comm.accessType === 'public' ? (
                            <>
                              <Globe2 className="w-3 h-3 text-blue-400" />
                              <span>Public Community</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3 text-blue-400" />
                              <span>Moderated (Request)</span>
                            </>
                          )}
                        </div>

                        {/* Category tag */}
                        <div className="absolute top-2.5 right-3 text-[10px] px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/80 font-semibold border border-white/10">
                          #{comm.category}
                        </div>
                      </div>

                      {/* Info & Actions */}
                      <div className="p-4 pt-2 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div
                            onClick={() => onOpenCommunity && onOpenCommunity(comm)}
                            className="flex items-center gap-3 min-w-0 cursor-pointer"
                          >
                            <div
                              className="w-11 h-11 rounded-2xl overflow-hidden border -mt-6 shadow-lg bg-black shrink-0 ring-2"
                              style={{ '--tw-ring-color': comm.themeColor || '#2F6FED' } as React.CSSProperties}
                            >
                              <img
                                src={comm.avatar}
                                alt={comm.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 pt-0.5">
                              <h3 className="font-bold text-sm text-white truncate hover:text-blue-400 transition-colors">
                                {comm.name}
                              </h3>
                              <p className="text-[10px] text-white/40 truncate">
                                Mod: @{comm.moderatorUsername}
                              </p>
                            </div>
                          </div>

                          {/* Join / Request / View Button */}
                          <div className="shrink-0">
                            {isMember ? (
                              <button
                                type="button"
                                onClick={() => onOpenCommunity && onOpenCommunity(comm)}
                                className="px-3 py-1 rounded-xl bg-white/10 text-white/90 hover:bg-white/15 border border-white/10 text-xs font-bold transition-all flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Joined</span>
                              </button>
                            ) : comm.accessType === 'moderated' ? (
                              isPending ? (
                                <button
                                  type="button"
                                  onClick={() => onToggleJoinCommunity && onToggleJoinCommunity(comm.id)}
                                  className="px-3 py-1 rounded-xl bg-blue-500/15 hover:bg-red-500/20 text-blue-400 hover:text-red-400 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1"
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>Pending</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    vibrateLight();
                                    onToggleJoinCommunity && onToggleJoinCommunity(comm.id);
                                  }}
                                  className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-sm flex items-center gap-1 shadow-blue-500/20"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Request Access</span>
                                </button>
                              )
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  vibrateStreakMilestone();
                                  onToggleJoinCommunity && onToggleJoinCommunity(comm.id);
                                }}
                                className="px-3.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-sm flex items-center gap-1 shadow-blue-500/20"
                              >
                                <span>Join Community</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">
                          {comm.description}
                        </p>

                        {/* Footer Metadata */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <Users className="w-3 h-3 text-blue-400" />
                            <span>{comm.memberCount || comm.memberIds?.length || 1} members</span>
                            <span>•</span>
                            <span>{comm.accessType === 'public' ? 'Open Access' : 'Moderator Approval'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenCommunity && onOpenCommunity(comm)}
                            className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-0.5"
                          >
                            <span>Explore Hub</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: CREATORS / BUILDERS (No streak displayed, no count/view all in header) */}
          {(entityFilter === 'all' || entityFilter === 'people') && sortedUsers.length > 0 && (
            <div className="space-y-3">
              {/* Header without count or view-all text */}
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#2F6FED]" />
                  Matching Creators
                </h2>
              </div>

              <div className="space-y-3">
                {sortedUsers.map((user) => {
                  const matchScore = calculateMatchScore(user);
                  const isFollowing = currentUser.followedUserIds.includes(user.id);

                  const myInterestsSet = new Set(currentUser.interests || []);
                  const myHabitsSet = new Set(currentUser.habits || []);
                  const commonInterests = (user.interests || []).filter((i) => myInterestsSet.has(i));
                  const commonHabits = (user.habits || []).filter((h) => myHabitsSet.has(h));

                  return (
                    <div
                      key={user.id}
                      className="bg-white/5 border border-white/5 hover:border-white/10 rounded-[24px] p-4 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          onClick={() => onViewUser && onViewUser(user)}
                          className="w-12 h-12 rounded-full overflow-hidden border border-white/10 shrink-0 cursor-pointer"
                        >
                          <img
                            src={user.avatar}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div
                              onClick={() => onViewUser && onViewUser(user)}
                              className="cursor-pointer min-w-0 truncate"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <h3 className="font-bold text-sm text-white truncate hover:underline">
                                  {user.name}
                                </h3>
                              </div>
                              <p className="text-[10px] text-white/40 truncate">@{user.username}</p>
                            </div>

                            {/* Streaks removed from cards per user instruction */}
                          </div>

                          {user.bio && (
                            <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                              {user.bio}
                            </p>
                          )}

                          {/* Common Tags */}
                          {(commonInterests.length > 0 || commonHabits.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {commonInterests.slice(0, 2).map((i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20"
                                >
                                  #{i}
                                </span>
                              ))}
                              {commonHabits.slice(0, 2).map((h) => (
                                <span
                                  key={h}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20"
                                >
                                  ⚡ {h}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                              <span className="text-blue-400 font-bold">{matchScore}%</span>
                              <span>match</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  onSendDM({
                                    id: user.id,
                                    name: user.name,
                                    username: user.username,
                                    avatar: user.avatar,
                                    streak: user.currentStreak,
                                  })
                                }
                                className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3 text-[#2F6FED]" />
                                <span>Message</span>
                              </button>

                              <button
                                onClick={() => {
                                  vibrateLight();
                                  onToggleFollow(user.id);
                                }}
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                  isFollowing
                                    ? 'bg-white/10 text-white/80 hover:bg-red-500/20 hover:text-red-400'
                                    : 'bg-[#2F6FED] hover:bg-[#2F6FED]/90 text-white shadow-md shadow-[#2F6FED]/20'
                                }`}
                              >
                                {isFollowing ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Following</span>
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3 h-3" />
                                    <span>Follow</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredCommunities.length === 0 && filteredUsers.length === 0 && (
            <div className="py-12">
              <EmptyStateIllustration
                type="search"
                title="No matching communities or creators"
                description={
                  searchQuery
                    ? `We couldn't find anything matching "${searchQuery}". Try different keywords or reset filters.`
                    : 'Try clearing the active filter or searching for other interests.'
                }
                primaryAction={{
                  label: 'Clear Filters',
                  onClick: () => {
                    setSearchQuery('');
                    setActiveFilterTag(null);
                    setEntityFilter('all');
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
};
