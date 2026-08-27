import React, { useState } from 'react';
import { Compass, Search, Flame, UserPlus, Check, MessageSquare, Sparkles, X } from 'lucide-react';
import { User, AVAILABLE_INTERESTS, AVAILABLE_HABITS } from '../types';

interface DiscoverScreenProps {
  users: User[];
  currentUser: User;
  onToggleFollow: (userId: string) => void;
  onSendDM: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onViewUser?: (user: User) => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  users,
  currentUser,
  onToggleFollow,
  onSendDM,
  onViewUser,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState<string | null>(null);

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

  // Filter out current user
  const otherUsers = users.filter((u) => u.id !== currentUser.id && !u.isCurrentUser);

  // Filter by search & tags
  const filteredUsers = otherUsers.filter((user) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = user.name.toLowerCase().includes(q);
      const matchUser = user.username.toLowerCase().includes(q);
      const matchBio = user.bio.toLowerCase().includes(q);
      const matchInterests = user.interests?.some((i) => i.toLowerCase().includes(q));
      const matchHabits = user.habits?.some((h) => h.toLowerCase().includes(q));
      if (!matchName && !matchUser && !matchBio && !matchInterests && !matchHabits) {
        return false;
      }
    }

    // Tag match
    if (activeFilterTag) {
      const hasInterest = user.interests?.includes(activeFilterTag);
      const hasHabit = user.habits?.includes(activeFilterTag);
      if (!hasInterest && !hasHabit) return false;
    }

    return true;
  });

  // Sort by match score descending
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    return calculateMatchScore(b) - calculateMatchScore(a);
  });

  const popularTags = Array.from(
    new Set(['All', ...AVAILABLE_INTERESTS.slice(0, 5), ...AVAILABLE_HABITS.slice(0, 4)])
  );

  return (
    <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#FF4D00]" />
          Discover Creators
        </h1>
        <p className="text-xs text-white/50 mt-1">
          Matched based on your shared passions, daily habits, and active streaks.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, #interest, or habit..."
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

      {/* Filter Tags */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {popularTags.map((tag) => {
          const isSelected = tag === 'All' ? activeFilterTag === null : activeFilterTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setActiveFilterTag(tag === 'All' ? null : tag)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border min-h-[36px] ${
                isSelected
                  ? 'bg-[#FF4D00] text-black border-[#FF4D00] shadow-sm shadow-[#FF4D00]/20'
                  : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              {tag === 'All' ? '🔥 Top Matches' : `#${tag}`}
            </button>
          );
        })}
      </div>

      {/* Recommended User Cards */}
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
              {/* Top Row: Avatar, Name, Match Badge, Follow button */}
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
                  return (
                    <button
                      key={interest}
                      onClick={() => setActiveFilterTag(interest)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider transition-colors ${
                        isShared
                          ? 'bg-[#FF4D00]/15 text-[#FF4D00] border-[#FF4D00]/30'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {isShared ? `✓ ${interest}` : interest}
                    </button>
                  );
                })}

                {/* Habits */}
                {user.habits?.map((habit) => {
                  const isShared = myHabitsSet.has(habit);
                  return (
                    <button
                      key={habit}
                      onClick={() => setActiveFilterTag(habit)}
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider transition-colors ${
                        isShared
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

        {sortedUsers.length === 0 && (
          <div className="text-center py-12 bg-white/5 rounded-[28px] border border-white/10 p-6">
            <Search className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <h3 className="font-bold text-white text-sm">No creators found</h3>
            <p className="text-xs text-white/40 mt-1">
              Try searching for different keywords or clear the filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilterTag(null);
              }}
              className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
