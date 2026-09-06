import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  Hash,
  Globe,
  Flame,
  ArrowRight,
  TrendingUp,
  Sparkles,
  FileText,
  UserPlus,
  UserCheck,
  Heart,
  MessageSquare,
  Compass,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { User, Community, Post } from '../types';
import { vibrateLight } from '../services/haptics';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  communities: Community[];
  posts: Post[];
  currentUser?: User;
  onToggleFollow?: (userId: string) => void;
  onSelectUser: (user: User) => void;
  onSelectCommunity: (community: Community) => void;
  onSelectPost?: (post: Post) => void;
  onSelectTag: (tag: string) => void;
}

type SearchWish = 'all' | 'users' | 'posts' | 'tags' | 'communities';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  users,
  communities,
  posts,
  currentUser,
  onToggleFollow,
  onSelectUser,
  onSelectCommunity,
  onSelectPost,
  onSelectTag,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchWish>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract all unique popular tags with post counts
  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      p.tags?.forEach((t) => {
        const clean = t.replace(/^#/, '').trim();
        if (clean) {
          counts[clean] = (counts[clean] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  // Featured inspiring accounts (sorted by streak or activity)
  const featuredAccounts = useMemo(() => {
    return [...users]
      .filter((u) => u.id !== currentUser?.id)
      .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))
      .slice(0, 5);
  }, [users, currentUser?.id]);

  // Trending photo proof posts
  const trendingProofs = useMemo(() => {
    return [...posts]
      .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
      .slice(0, 4);
  }, [posts]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveTab('all');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();
  const rawTagQuery = cleanQuery.replace(/^#/, '');

  // Filter Communities
  const filteredCommunities = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(cleanQuery) ||
      c.category.toLowerCase().includes(cleanQuery) ||
      c.description?.toLowerCase().includes(cleanQuery) ||
      c.tags?.some((t) => t.toLowerCase().includes(rawTagQuery))
  );

  // Filter Users (Accounts)
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(cleanQuery) ||
      u.username.toLowerCase().includes(cleanQuery) ||
      u.bio?.toLowerCase().includes(cleanQuery) ||
      u.interests?.some((i) => i.toLowerCase().includes(cleanQuery)) ||
      u.habits?.some((h) => h.toLowerCase().includes(cleanQuery))
  );

  // Filter Tags
  const filteredTags = popularTags.filter((t) =>
    t.tag.toLowerCase().includes(rawTagQuery)
  );

  // Filter Posts (by content, author name, username, or tag)
  const filteredPosts = posts.filter(
    (p) =>
      p.content.toLowerCase().includes(cleanQuery) ||
      p.name.toLowerCase().includes(cleanQuery) ||
      p.username.toLowerCase().includes(cleanQuery) ||
      p.communityName?.toLowerCase().includes(cleanQuery) ||
      p.tags?.some((t) => t.toLowerCase().includes(rawTagQuery))
  );

  const totalResults =
    (activeTab === 'all' || activeTab === 'posts' ? filteredPosts.length : 0) +
    (activeTab === 'all' || activeTab === 'communities' ? filteredCommunities.length : 0) +
    (activeTab === 'all' || activeTab === 'users' ? filteredUsers.length : 0) +
    (activeTab === 'all' || activeTab === 'tags' ? filteredTags.length : 0);

  const placeholderText =
    activeTab === 'users'
      ? 'Search accounts, creators, handles, or skills...'
      : activeTab === 'posts'
      ? 'Search daily proofs, habits, keywords, or receipts...'
      : activeTab === 'tags'
      ? 'Search discipline tags (e.g. #deepwork, #running)...'
      : activeTab === 'communities'
      ? 'Search squads and accountability groups...'
      : 'Search accounts, proofs, #tags, squads...';

  const isFollowingUser = (targetId: string) => {
    return currentUser?.followedUserIds?.includes(targetId) ?? false;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 sm:pt-10 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0C1017] border border-white/15 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2F6FED]/15 border border-[#2F6FED]/30 flex items-center justify-center text-[#2F6FED]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                  Search & Discover
                </h2>
                <p className="text-[11px] text-white/50">Explore accounts, proofs, tags, and squads</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholderText}
              className="w-full pl-10 pr-20 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 text-sm font-medium focus:outline-none focus:border-[#2F6FED] focus:bg-white/[0.08] transition-all"
            />
            {query && (
              <button
                onClick={() => {
                  vibrateLight();
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-12 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="absolute right-3 hidden sm:flex items-center pointer-events-none">
              <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                ESC
              </span>
            </div>
          </div>

          {/* User Search Wish Switcher Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {[
              {
                id: 'all' as SearchWish,
                label: 'All',
                icon: <Compass className="w-3.5 h-3.5" />,
                count: filteredPosts.length + filteredUsers.length + filteredCommunities.length + filteredTags.length,
              },
              {
                id: 'users' as SearchWish,
                label: 'Accounts',
                icon: <Users className="w-3.5 h-3.5" />,
                count: filteredUsers.length,
                badgeColor: 'text-[#2F6FED]',
              },
              {
                id: 'posts' as SearchWish,
                label: 'Posts',
                icon: <FileText className="w-3.5 h-3.5" />,
                count: filteredPosts.length,
                badgeColor: 'text-emerald-400',
              },
              {
                id: 'tags' as SearchWish,
                label: 'Tags',
                icon: <Hash className="w-3.5 h-3.5" />,
                count: filteredTags.length,
                badgeColor: 'text-purple-400',
              },
              {
                id: 'communities' as SearchWish,
                label: 'Squads',
                icon: <Globe className="w-3.5 h-3.5" />,
                count: filteredCommunities.length,
                badgeColor: 'text-blue-400',
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    vibrateLight();
                    setActiveTab(tab.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 min-h-[36px] ${
                    isActive
                      ? 'bg-[#2F6FED] text-white shadow-md shadow-[#2F6FED]/20'
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {cleanQuery && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* EMPTY QUERY: High-energy Discovery Screen */}
          {!cleanQuery && (
            <div className="space-y-6">
              {/* Creator Spotlight (Accounts to Follow) */}
              {(activeTab === 'all' || activeTab === 'users') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#2F6FED]" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        Inspiring Accounts to Follow
                      </h3>
                    </div>
                    <span className="text-[11px] text-white/40 font-medium">Top Streakers</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {featuredAccounts.map((creator) => {
                      const isFollowing = isFollowingUser(creator.id);
                      return (
                        <div
                          key={creator.id}
                          className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#2F6FED]/40 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() => {
                              vibrateLight();
                              onSelectUser(creator);
                              onClose();
                            }}
                          >
                            <div className="relative shrink-0">
                              <img
                                src={creator.avatar}
                                alt={creator.name}
                                referrerPolicy="no-referrer"
                                className="w-11 h-11 rounded-full object-cover border border-white/15 group-hover:border-[#2F6FED]/50 transition-colors"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-[#2F6FED] text-white rounded-full p-0.5 border border-[#0C1017]">
                                <Flame className="w-2.5 h-2.5 fill-white" />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-xs font-bold text-white truncate group-hover:text-[#2F6FED] transition-colors">
                                  {creator.name}
                                </h4>
                              </div>
                              <p className="text-[11px] text-white/40 truncate">@{creator.username}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold text-[#2F6FED] flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5 fill-[#2F6FED]" />
                                  {creator.currentStreak}d streak
                                </span>
                                {creator.interests && creator.interests[0] && (
                                  <span className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.2 rounded border border-white/5 truncate max-w-[90px]">
                                    {creator.interests[0]}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {onToggleFollow && (
                            <button
                              onClick={() => {
                                vibrateLight();
                                onToggleFollow(creator.id);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                                isFollowing
                                  ? 'bg-white/10 text-white/70 hover:bg-white/15'
                                  : 'bg-[#2F6FED] text-white hover:bg-blue-600 shadow-sm'
                              }`}
                            >
                              {isFollowing ? (
                                <>
                                  <UserCheck className="w-3 h-3 text-emerald-400" />
                                  <span>Following</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3" />
                                  <span>Follow</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trending Daily Proofs (Recent Posts) */}
              {(activeTab === 'all' || activeTab === 'posts') && trendingProofs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        Trending Daily Proofs
                      </h3>
                    </div>
                    <span className="text-[11px] text-white/40 font-medium">Verified Receipts</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trendingProofs.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          vibrateLight();
                          if (onSelectPost) onSelectPost(post);
                          onClose();
                        }}
                        className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer space-y-2.5 group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={post.userAvatar}
                              alt={post.name}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                            />
                            <div className="min-w-0 truncate">
                              <p className="text-xs font-bold text-white truncate">{post.name}</p>
                              <p className="text-[10px] text-white/40 truncate">@{post.username}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Flame className="w-2.5 h-2.5 fill-emerald-400" />
                            {post.userStreak}d
                          </span>
                        </div>

                        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed font-normal">
                          {post.content}
                        </p>

                        {post.imageUrl && (
                          <div className="w-full h-32 rounded-xl overflow-hidden border border-white/10 bg-black/40 relative">
                            <img
                              src={post.imageUrl}
                              alt="Proof Receipt"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 text-red-400/70" />
                              {post.likesCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-blue-400/70" />
                              {post.comments?.length || 0}
                            </span>
                          </div>
                          <span className="text-[#2F6FED] font-bold group-hover:underline flex items-center gap-1">
                            View Proof <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Discipline Tags */}
              {(activeTab === 'all' || activeTab === 'tags') && popularTags.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        Popular Discipline Tags
                      </h3>
                    </div>
                    <span className="text-[11px] text-white/40 font-medium">Tap to explore</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {popularTags.slice(0, 10).map((t) => (
                      <button
                        key={t.tag}
                        onClick={() => {
                          vibrateLight();
                          onSelectTag(t.tag);
                          onClose();
                        }}
                        className="px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-purple-600/15 border border-white/10 hover:border-purple-500/40 text-xs font-bold text-white transition-all flex items-center gap-2 group active:scale-95"
                      >
                        <span className="text-purple-400 font-black">#</span>
                        <span>{t.tag}</span>
                        <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.2 rounded font-mono">
                          {t.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Accountability Squads */}
              {(activeTab === 'all' || activeTab === 'communities') && communities.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        Featured Squads
                      </h3>
                    </div>
                    <span className="text-[11px] text-white/40 font-medium">Join groups</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {communities.slice(0, 4).map((comm) => (
                      <div
                        key={comm.id}
                        onClick={() => {
                          vibrateLight();
                          onSelectCommunity(comm);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-white/[0.03] hover:bg-blue-600/10 border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xl shrink-0">
                          {comm.avatar || '🌐'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-white truncate group-hover:text-blue-400 transition-colors">
                            {comm.name}
                          </h4>
                          <p className="text-[10px] text-white/50 truncate mt-0.5">
                            {comm.memberCount || 1} members • {comm.category}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE SEARCH RESULTS */}
          {cleanQuery && (
            <div className="space-y-6">
              {/* Empty Results State */}
              {totalResults === 0 && (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                    <Search className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No matches for "{query}"</h4>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    Try searching with another keyword, check for spelling errors, or switch to the{' '}
                    <button
                      onClick={() => setActiveTab('all')}
                      className="text-[#2F6FED] font-bold underline"
                    >
                      All tab
                    </button>
                    .
                  </p>
                </div>
              )}

              {/* ACCOUNTS (USERS) RESULTS */}
              {(activeTab === 'all' || activeTab === 'users') && filteredUsers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#2F6FED]">
                      <Users className="w-3.5 h-3.5" />
                      <span>Accounts ({filteredUsers.length})</span>
                    </div>
                    {activeTab === 'all' && filteredUsers.length > 4 && (
                      <button
                        onClick={() => setActiveTab('users')}
                        className="text-[11px] text-[#2F6FED] font-bold hover:underline flex items-center gap-1"
                      >
                        View all {filteredUsers.length} accounts <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredUsers.slice(0, activeTab === 'all' ? 4 : 30).map((user) => {
                      const isFollowing = isFollowingUser(user.id);
                      return (
                        <div
                          key={user.id}
                          className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#2F6FED]/40 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            onClick={() => {
                              vibrateLight();
                              onSelectUser(user);
                              onClose();
                            }}
                          >
                            <img
                              src={user.avatar}
                              alt={user.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-white/15 group-hover:border-[#2F6FED]/50 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-black text-white truncate group-hover:text-[#2F6FED] transition-colors">
                                {user.name}
                              </h4>
                              <p className="text-[10px] text-white/50 truncate">@{user.username}</p>
                              {user.bio && (
                                <p className="text-[10px] text-white/70 truncate mt-0.5">{user.bio}</p>
                              )}
                              <div className="flex items-center gap-1 mt-1 text-[10px] text-[#2F6FED] font-bold">
                                <Flame className="w-2.5 h-2.5 fill-[#2F6FED]" />
                                <span>{user.currentStreak}d streak</span>
                              </div>
                            </div>
                          </div>

                          {onToggleFollow && user.id !== currentUser?.id && (
                            <button
                              onClick={() => {
                                vibrateLight();
                                onToggleFollow(user.id);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                                isFollowing
                                  ? 'bg-white/10 text-white/70 hover:bg-white/15'
                                  : 'bg-[#2F6FED] text-white hover:bg-blue-600 shadow-sm'
                              }`}
                            >
                              {isFollowing ? (
                                <>
                                  <UserCheck className="w-3 h-3 text-emerald-400" />
                                  <span>Following</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3" />
                                  <span>Follow</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* POSTS (PROOFS) RESULTS */}
              {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Posts & Receipts ({filteredPosts.length})</span>
                    </div>
                    {activeTab === 'all' && filteredPosts.length > 4 && (
                      <button
                        onClick={() => setActiveTab('posts')}
                        className="text-[11px] text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        View all {filteredPosts.length} posts <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {filteredPosts.slice(0, activeTab === 'all' ? 4 : 25).map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          vibrateLight();
                          if (onSelectPost) onSelectPost(post);
                          onClose();
                        }}
                        className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex gap-3.5 group"
                      >
                        <img
                          src={post.userAvatar}
                          alt={post.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-bold text-white truncate">{post.name}</span>
                              <span className="text-[10px] text-white/40 truncate">@{post.username}</span>
                            </div>
                            <span className="text-[10px] text-[#2F6FED] font-bold shrink-0 flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 fill-[#2F6FED]" />
                              {post.userStreak}d streak
                            </span>
                          </div>

                          <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                            {post.content}
                          </p>

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {post.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/5 text-blue-400 border border-white/5"
                                >
                                  #{t.replace(/^#/, '')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {post.imageUrl && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/40">
                            <img
                              src={post.imageUrl}
                              alt="Receipt"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAGS RESULTS */}
              {(activeTab === 'all' || activeTab === 'tags') && filteredTags.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-purple-400">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" />
                      Discipline Tags ({filteredTags.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {filteredTags.slice(0, activeTab === 'all' ? 8 : 30).map((t) => (
                      <button
                        key={t.tag}
                        onClick={() => {
                          vibrateLight();
                          onSelectTag(t.tag);
                          onClose();
                        }}
                        className="p-2.5 rounded-2xl bg-white/[0.03] hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/40 text-xs font-bold text-white transition-all flex items-center gap-2 group"
                      >
                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black text-xs">
                          #
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-white group-hover:text-purple-300">#{t.tag}</p>
                          <p className="text-[9px] text-white/40">{t.count} posts logged</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* COMMUNITIES RESULTS */}
              {(activeTab === 'all' || activeTab === 'communities') && filteredCommunities.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-blue-400">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Communities & Squads ({filteredCommunities.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {filteredCommunities.slice(0, activeTab === 'all' ? 4 : 20).map((comm) => (
                      <div
                        key={comm.id}
                        onClick={() => {
                          vibrateLight();
                          onSelectCommunity(comm);
                          onClose();
                        }}
                        className="p-3 rounded-2xl bg-white/[0.03] hover:bg-blue-600/10 border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-xl shrink-0">
                          {comm.avatar || '🌐'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-black text-white truncate group-hover:text-blue-400 transition-colors">
                              {comm.name}
                            </h4>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/70">
                              {comm.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-white/50 truncate mt-0.5">
                            {comm.description || `${comm.memberCount || 1} active members`}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/50">
          <div className="flex items-center gap-2">
            <span>Filter by:</span>
            <span className="text-[#2F6FED] font-bold">Accounts</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">Posts</span>
            <span>•</span>
            <span className="text-purple-400 font-bold">Tags</span>
          </div>
          <span className="hidden sm:inline">Press Esc to exit</span>
        </div>
      </div>
    </div>
  );
};
