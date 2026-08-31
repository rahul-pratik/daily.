import React, { useState } from 'react';
import {
  Compass,
  Search,
  Flame,
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
  Filter,
} from 'lucide-react';
import { User, Community, AVAILABLE_INTERESTS, AVAILABLE_HABITS } from '../types';
import { PullToRefresh } from './PullToRefresh';
import { handleHorizontalWheelScroll } from '../utils/scroll';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { EmptyStateIllustration } from './EmptyStateIllustration';

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

  const totalMatches = filteredUsers.length + filteredCommunities.length;

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
              <p className="text-[11px] text-white/50">Discover open communities & fellow builders</p>
            </div>
          </div>

          {onCreateCommunity && (
            <button
              onClick={onCreateCommunity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-md shadow-blue-500/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Community</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities, builders, habits, or tags..."
            className="w-full pl-10 pr-9 py-2.5 bg-white/5 border border-white/10 focus:border-blue-500 rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Filter Chips */}
        <div className="space-y-1.5">
          <div
            onWheel={handleHorizontalWheelScroll}
            className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap flex-nowrap pb-1 no-scrollbar touch-pan-x overscroll-x-contain py-1"
          >
            {allFilterChips.map((chip, idx) => {
              const isSelected = activeFilterTag === chip.value;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    vibrateLight();
                    setActiveFilterTag(isSelected ? null : chip.value);
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-md shadow-[#D4AF37]/20 scale-105'
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span className="text-xs">{chip.icon}</span>
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Entity Segment Tabs (All / Creators / Communities) */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setEntityFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                entityFilter === 'all'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              All ({totalMatches})
            </button>
            <button
              onClick={() => setEntityFilter('communities')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                entityFilter === 'communities'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Globe2 className="w-3 h-3 text-blue-400" />
              <span>Communities ({filteredCommunities.length})</span>
            </button>
            <button
              onClick={() => setEntityFilter('people')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                entityFilter === 'people'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3 text-[#D4AF37]" />
              <span>Creators ({filteredUsers.length})</span>
            </button>
          </div>

          {activeFilterTag && (
            <span className="text-[11px] text-blue-400 font-bold hidden sm:inline-block">
              Tag: #{activeFilterTag}
            </span>
          )}
        </div>

        {/* Active Tag Filter Summary Banner */}
        {activeFilterTag && (
          <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl p-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Filtering by <strong className="text-blue-400">#{activeFilterTag}</strong>: Found{' '}
                <strong>{filteredCommunities.length}</strong> communities and{' '}
                <strong>{filteredUsers.length}</strong> creators
              </span>
            </div>
            <button
              onClick={() => setActiveFilterTag(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              title="Remove filter tag"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Lists */}
        <div className="space-y-6">
          {/* SECTION 1: COMMUNITIES (Public & Moderated Explore Spaces) */}
          {(entityFilter === 'all' || entityFilter === 'communities') && filteredCommunities.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                  Open Communities ({filteredCommunities.length})
                </h2>
                {entityFilter === 'all' && filteredCommunities.length > 2 && (
                  <button
                    onClick={() => setEntityFilter('communities')}
                    className="text-[11px] text-blue-400 hover:underline font-bold"
                  >
                    View all {filteredCommunities.length}
                  </button>
                )}
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
                      {/* Banner / Cover */}
                      <div
                        onClick={() => onOpenCommunity && onOpenCommunity(comm)}
                        className="relative h-24 w-full bg-black cursor-pointer overflow-hidden"
                      >
                        <img
                          src={comm.coverImage || comm.avatar}
                          alt={comm.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-transparent" />

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
                            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-blue-500/40 -mt-6 shadow-lg bg-black shrink-0">
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

          {/* SECTION 2: CREATORS / BUILDERS */}
          {(entityFilter === 'all' || entityFilter === 'people') && sortedUsers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Matching Creators ({sortedUsers.length})
                </h2>
                {entityFilter === 'all' && sortedUsers.length > 3 && (
                  <button
                    onClick={() => setEntityFilter('people')}
                    className="text-[11px] text-[#D4AF37] hover:underline font-bold"
                  >
                    View all {sortedUsers.length}
                  </button>
                )}
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
                                {user.verified && (
                                  <span className="w-3.5 h-3.5 rounded-full bg-[#D4AF37] text-black text-[9px] flex items-center justify-center font-bold">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-white/40 truncate">@{user.username}</p>
                            </div>

                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold">
                              <Flame className="w-3 h-3 fill-[#D4AF37]" />
                              <span>{user.currentStreak}d</span>
                            </div>
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
                                  className="text-[9px] px-2 py-0.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 font-semibold"
                                >
                                  #{i}
                                </span>
                              ))}
                              {commonHabits.slice(0, 2).map((h) => (
                                <span
                                  key={h}
                                  className="text-[9px] px-2 py-0.5 rounded-lg bg-white/5 text-white/60 border border-white/5 font-semibold"
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-white/40">
                              <strong className="text-white/80">{matchScore}%</strong> alignment
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  vibrateLight();
                                  onToggleFollow(user.id);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                  isFollowing
                                    ? 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/10'
                                    : 'bg-white text-black hover:bg-white/90 shadow-sm'
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
                                className="p-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl border border-white/10 transition-colors"
                                title={`Message ${user.name}`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
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
          {totalMatches === 0 && (
            <div className="pt-2">
              <EmptyStateIllustration
                type="search"
                title="No matching creators or communities"
                description={
                  searchQuery
                    ? `No creators, habits, or communities matched "${searchQuery}".`
                    : 'Try selecting a different focus filter tag or explore all categories.'
                }
                primaryAction={{
                  label: 'Clear Search & Filters',
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
