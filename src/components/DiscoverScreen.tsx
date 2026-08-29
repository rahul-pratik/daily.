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
  Users2,
  PlusCircle,
  Tag,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { User, Group, AVAILABLE_INTERESTS, AVAILABLE_HABITS } from '../types';
import { PullToRefresh } from './PullToRefresh';
import { handleHorizontalWheelScroll } from '../utils/scroll';

interface DiscoverScreenProps {
  users: User[];
  currentUser: User;
  groups?: Group[];
  onToggleFollow: (userId: string) => void;
  onSendDM: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onViewUser?: (user: User) => void;
  onOpenGroupChat?: (groupId: string) => void;
  onToggleJoinGroup?: (groupId: string) => void;
  onCreateGroup?: () => void;
  onRefresh?: () => Promise<void> | void;
}

type EntityTypeFilter = 'all' | 'people' | 'groups';

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  users,
  currentUser,
  groups = [],
  onToggleFollow,
  onSendDM,
  onViewUser,
  onOpenGroupChat,
  onToggleJoinGroup,
  onCreateGroup,
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

    // Normalize to 60% - 98% range for realistic match aesthetics
    const rawRatio = Math.min(1, totalMatches / maxPossible);
    const score = Math.round(55 + rawRatio * 43);
    return Math.min(99, Math.max(50, score));
  };

  // Filter out current user from creators
  const otherUsers = users.filter((u) => u.id !== currentUser.id && !u.isCurrentUser);

  // Filter Users
  const filteredUsers = otherUsers.filter((user) => {
    // Search query match
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

    // Tag match
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

  // Sort filtered users by match score descending
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return calculateMatchScore(b) - calculateMatchScore(a);
  });

  // Filter Groups
  const filteredGroups = groups.filter((group) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = group.name.toLowerCase().includes(q);
      const matchDesc = (group.description || '').toLowerCase().includes(q);
      const matchCat = (group.category || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) {
        return false;
      }
    }

    // Tag match
    if (activeFilterTag) {
      const tagLower = activeFilterTag.toLowerCase();
      const catLower = (group.category || '').toLowerCase();
      const nameLower = group.name.toLowerCase();
      const descLower = (group.description || '').toLowerCase();

      const matchCat = catLower === tagLower || catLower.includes(tagLower) || tagLower.includes(catLower);
      const matchName = nameLower.includes(tagLower);
      const matchDesc = descLower.includes(tagLower);

      if (!matchCat && !matchName && !matchDesc) return false;
    }

    return true;
  });

  // Build Filter Chips List (Interests + Habits)
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

  const totalMatches = filteredUsers.length + filteredGroups.length;

  return (
    <PullToRefresh
      onRefresh={handleDiscoverRefresh}
      pullText="Pull down to refresh creators & groups"
      releaseText="Release to reload suggestions"
      refreshingText="Discovering active community..."
      completedText="Discoveries updated • Just now"
    >
      <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#FF4D00]" />
              Discover Community
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Find like-minded creators and accountability groups by specific interests.
            </p>
          </div>

          {onCreateGroup && (
            <button
              onClick={onCreateGroup}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0"
              title="Create a new accountability group"
            >
              <PlusCircle className="w-4 h-4 text-[#FF4D00]" />
              <span className="hidden sm:inline">New Group</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators & groups by name, #tag, habit..."
            className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors"
          />
          {searchQuery.trim().length > 0 && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Chip Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#FF4D00]" />
              Filter by Interest & Habit Tags
            </span>
            {activeFilterTag && (
              <button
                onClick={() => setActiveFilterTag(null)}
                className="text-[10px] text-[#FF4D00] hover:underline font-bold flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear filter
              </button>
            )}
          </div>

          <div 
            onWheel={handleHorizontalWheelScroll}
            className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap flex-nowrap pb-1 no-scrollbar touch-pan-x overscroll-x-contain py-0.5"
          >
            {allFilterChips.map((chip) => {
              const isSelected =
                chip.value === null
                  ? activeFilterTag === null
                  : activeFilterTag?.toLowerCase() === chip.value.toLowerCase();

              return (
                <button
                  key={chip.label}
                  onClick={() => setActiveFilterTag(chip.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border min-h-[36px] flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#FF4D00] text-black border-[#FF4D00] shadow-md shadow-[#FF4D00]/20 scale-105'
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

        {/* Entity Segment Tabs (All / People / Groups) */}
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
              onClick={() => setEntityFilter('people')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                entityFilter === 'people'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>People ({filteredUsers.length})</span>
            </button>
            <button
              onClick={() => setEntityFilter('groups')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                entityFilter === 'groups'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Users2 className="w-3 h-3" />
              <span>Groups ({filteredGroups.length})</span>
            </button>
          </div>

          {activeFilterTag && (
            <span className="text-[11px] text-[#FF4D00] font-bold hidden sm:inline-block">
              Tag: #{activeFilterTag}
            </span>
          )}
        </div>

        {/* Active Tag Filter Summary Banner */}
        {activeFilterTag && (
          <div className="bg-[#FF4D00]/10 border border-[#FF4D00]/25 rounded-2xl p-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF4D00] shrink-0" />
              <span>
                Filtering by <strong className="text-[#FF4D00]">#{activeFilterTag}</strong>: Found{' '}
                <strong>{filteredUsers.length}</strong> people and{' '}
                <strong>{filteredGroups.length}</strong> groups
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
        <div className="space-y-5">
          {/* SECTION 1: GROUPS */}
          {(entityFilter === 'all' || entityFilter === 'groups') && filteredGroups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                  <Users2 className="w-3.5 h-3.5 text-[#FF4D00]" />
                  Accountability Groups & Clubs ({filteredGroups.length})
                </h2>
                {entityFilter === 'all' && filteredGroups.length > 2 && (
                  <button
                    onClick={() => setEntityFilter('groups')}
                    className="text-[11px] text-[#FF4D00] hover:underline font-bold"
                  >
                    View all {filteredGroups.length}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {filteredGroups.map((group) => {
                  const isMember = (group.memberIds || []).includes(currentUser.id);

                  return (
                    <div
                      key={group.id}
                      className="bg-white/5 border border-white/5 hover:border-white/10 rounded-[24px] p-4 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                          <img
                            src={group.avatar}
                            alt={group.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-bold text-sm text-white truncate">{group.name}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF4D00]/15 text-[#FF4D00] border border-[#FF4D00]/30 font-bold uppercase tracking-wider shrink-0">
                              #{group.category}
                            </span>
                          </div>

                          <p className="text-xs text-white/70 mt-1 line-clamp-2 leading-relaxed">
                            {group.description}
                          </p>

                          <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-semibold">
                              <Users className="w-3.5 h-3.5" />
                              <span>{group.memberCount} members</span>
                              {group.lastActivity && (
                                <>
                                  <span>•</span>
                                  <span>Active {group.lastActivity}</span>
                                </>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {onToggleJoinGroup && (
                                <button
                                  onClick={() => onToggleJoinGroup(group.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                    isMember
                                      ? 'bg-white/10 text-white/80 hover:bg-white/15 border border-white/10'
                                      : 'bg-white text-black hover:bg-white/90 shadow-sm'
                                  }`}
                                >
                                  {isMember ? 'Joined ✓' : 'Join Club'}
                                </button>
                              )}

                              {onOpenGroupChat && (
                                <button
                                  onClick={() => onOpenGroupChat(group.id)}
                                  className="p-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl border border-white/10 transition-colors"
                                  title="Open Group Chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}
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

          {/* SECTION 2: PEOPLE / CREATORS */}
          {(entityFilter === 'all' || entityFilter === 'people') && sortedUsers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs uppercase font-bold tracking-wider text-white/50 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#FF4D00]" />
                  Matching Creators ({sortedUsers.length})
                </h2>
                {entityFilter === 'all' && sortedUsers.length > 3 && (
                  <button
                    onClick={() => setEntityFilter('people')}
                    className="text-[11px] text-[#FF4D00] hover:underline font-bold"
                  >
                    View all {sortedUsers.length}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {sortedUsers.map((user) => {
                  const matchScore = calculateMatchScore(user);
                  const isFollowing = currentUser.followedUserIds.includes(user.id);

                  // Find overlapping interests & habits
                  const myInterestsSet = new Set(currentUser.interests || []);
                  const myHabitsSet = new Set(currentUser.habits || []);

                  return (
                    <div
                      key={user.id}
                      className="bg-white/5 border border-white/5 hover:border-white/10 rounded-[28px] p-4 sm:p-5 transition-all"
                    >
                      {/* Top Row: Avatar, Name, Match Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => onViewUser && onViewUser(user)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="relative">
                            <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 group-hover:border-[#FF4D00]/50 transition-colors">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {user.currentStreak > 0 && (
                              <span className="absolute -bottom-1 -right-1 bg-black text-[#FF4D00] text-[9px] font-black px-1.5 rounded-full border border-[#FF4D00]/60 shadow">
                                🔥{user.currentStreak}
                              </span>
                            )}
                          </div>

                          <div>
                            <h3 className="font-bold text-sm text-white group-hover:text-[#FF4D00] transition-colors">
                              {user.name}
                            </h3>
                            <p className="text-xs text-white/40">@{user.username}</p>
                          </div>
                        </div>

                        {/* Match Percentage Badge */}
                        <div className="flex flex-col items-end gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#FF4D00]/10 border border-[#FF4D00]/30 text-[#FF4D00]">
                            <Sparkles className="w-3 h-3 text-[#FF4D00]" />
                            {matchScore}% Match
                          </span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-white/80 mt-2.5 leading-relaxed">
                        {user.bio}
                      </p>

                      {/* Shared & Distinct Tags */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {/* Interests */}
                        {user.interests?.map((interest) => {
                          const isShared = myInterestsSet.has(interest);
                          const isCurrentActive =
                            activeFilterTag?.toLowerCase() === interest.toLowerCase();

                          return (
                            <button
                              key={interest}
                              onClick={() => setActiveFilterTag(interest)}
                              className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider transition-colors ${
                                isCurrentActive
                                  ? 'bg-[#FF4D00] text-black border-[#FF4D00]'
                                  : isShared
                                  ? 'bg-[#FF4D00]/15 text-[#FF4D00] border-[#FF4D00]/30'
                                  : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                              }`}
                            >
                              {isShared ? `✓ #${interest}` : `#${interest}`}
                            </button>
                          );
                        })}

                        {/* Habits */}
                        {user.habits?.map((habit) => {
                          const isShared = myHabitsSet.has(habit);
                          const isCurrentActive =
                            activeFilterTag?.toLowerCase() === habit.toLowerCase();

                          return (
                            <button
                              key={habit}
                              onClick={() => setActiveFilterTag(habit)}
                              className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider transition-colors ${
                                isCurrentActive
                                  ? 'bg-[#FF4D00] text-black border-[#FF4D00]'
                                  : isShared
                                  ? 'bg-white/15 text-white border-white/30'
                                  : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                              }`}
                            >
                              {isShared ? `⚡ ${habit}` : habit}
                            </button>
                          );
                        })}
                      </div>

                      {/* Actions Footer */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <div className="text-[10px] uppercase tracking-wider text-white/40 flex items-center gap-2 font-semibold">
                          <span>🔥 {user.currentStreak}d Streak</span>
                          <span>•</span>
                          <span>{user.followersCount} Followers</span>
                        </div>

                        <div className="flex items-center gap-2">
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
                            className="p-2.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-xl border border-white/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                            title="Send Direct Message"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onToggleFollow(user.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[40px] ${
                              isFollowing
                                ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                                : 'bg-white text-black hover:bg-white/90 shadow-md shadow-white/5'
                            }`}
                          >
                            {isFollowing ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Following</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Follow</span>
                              </>
                            )}
                          </button>
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
            <div className="text-center py-12 bg-white/5 rounded-[28px] border border-white/10 p-6">
              <Search className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <h3 className="font-bold text-white text-sm">No creators or groups found</h3>
              <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
                {activeFilterTag
                  ? `No matches found for #${activeFilterTag}. Try choosing a different tag or clear the filter.`
                  : 'Try searching for different keywords or clear the search field.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilterTag(null);
                  setEntityFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl"
              >
                Reset Search & All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
};
