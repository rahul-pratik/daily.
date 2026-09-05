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
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { User, Community, Post } from '../types';
import { vibrateLight } from '../services/haptics';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  communities: Community[];
  posts: Post[];
  onSelectUser: (user: User) => void;
  onSelectCommunity: (community: Community) => void;
  onSelectPost?: (post: Post) => void;
  onSelectTag: (tag: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  users,
  communities,
  posts,
  onSelectUser,
  onSelectCommunity,
  onSelectPost,
  onSelectTag,
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'communities' | 'users' | 'tags'>('all');
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

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveTab('all');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
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

  // Filter Users
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-14 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#0A0A0A] border border-white/15 rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[88vh] text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center gap-3 bg-white/[0.02]">
          <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, communities, people, #tags..."
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-white placeholder-white/40 focus:outline-none"
          />

          {query && (
            <button
              onClick={() => {
                vibrateLight();
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="text-xs font-bold text-white/50 hover:text-white px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Tab Filters */}
        <div className="px-4 py-2 border-b border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar bg-black/40">
          {[
            { id: 'all', label: 'All', count: filteredPosts.length + filteredCommunities.length + filteredUsers.length + filteredTags.length },
            { id: 'posts', label: 'Posts', count: filteredPosts.length },
            { id: 'communities', label: 'Communities', count: filteredCommunities.length },
            { id: 'users', label: 'People', count: filteredUsers.length },
            { id: 'tags', label: 'Tags', count: filteredTags.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                vibrateLight();
                setActiveTab(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-70 bg-black/30 px-1.5 py-0.2 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 no-scrollbar">
          {/* Quick Trending Suggestions if query is empty */}
          {!cleanQuery && (
            <div className="space-y-4">
              {/* Popular Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#2F6FED]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Popular Daily Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularTags.slice(0, 8).map((t) => (
                    <button
                      key={t.tag}
                      onClick={() => {
                        vibrateLight();
                        onSelectTag(t.tag);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/40 text-xs font-bold text-white transition-all flex items-center gap-1.5 group"
                    >
                      <Hash className="w-3 h-3 text-[#2F6FED]" />
                      <span>{t.tag}</span>
                      <span className="text-[10px] text-white/40 group-hover:text-white/70">
                        ({t.count})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured Communities */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-blue-400">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Featured Communities</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {communities.slice(0, 4).map((comm) => (
                    <div
                      key={comm.id}
                      onClick={() => {
                        vibrateLight();
                        onSelectCommunity(comm);
                        onClose();
                      }}
                      className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-lg shrink-0">
                        {comm.avatar || '🌐'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-blue-400 transition-colors">
                          {comm.name}
                        </h4>
                        <p className="text-[10px] text-white/50 truncate">
                          {comm.memberCount || 1} members • {comm.category}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Search Empty Results */}
          {cleanQuery && totalResults === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/40">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">No results found for "{query}"</p>
              <p className="text-xs text-white/40">Try searching for a different habit, tag, post content, or username</p>
            </div>
          )}

          {/* Posts Results */}
          {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-400">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Posts & Receipts ({filteredPosts.length})
                </span>
              </div>
              <div className="space-y-2">
                {filteredPosts.slice(0, activeTab === 'all' ? 4 : 20).map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      vibrateLight();
                      if (onSelectPost) {
                        onSelectPost(post);
                      }
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex gap-3 group"
                  >
                    <img
                      src={post.userAvatar}
                      alt={post.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-white truncate">{post.name}</span>
                          <span className="text-[10px] text-white/40 truncate">@{post.username}</span>
                        </div>
                        <span className="text-[10px] text-[#2F6FED] font-bold shrink-0">
                          {post.userStreak}d streak
                        </span>
                      </div>
                      <p className="text-xs text-white/80 line-clamp-2 mt-1 leading-relaxed">
                        {post.content}
                      </p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
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
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0">
                        <img
                          src={post.imageUrl}
                          alt="Receipt"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Communities Results */}
          {(activeTab === 'all' || activeTab === 'communities') && filteredCommunities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-blue-400">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  Communities ({filteredCommunities.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

          {/* Users Results */}
          {(activeTab === 'all' || activeTab === 'users') && filteredUsers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-[#2F6FED]">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  People ({filteredUsers.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredUsers.slice(0, activeTab === 'all' ? 4 : 20).map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      vibrateLight();
                      onSelectUser(user);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-[#2F6FED]/10 border border-white/10 hover:border-[#2F6FED]/40 transition-all cursor-pointer flex items-center gap-3 group"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-black text-white truncate group-hover:text-[#2F6FED] transition-colors">
                          {user.name}
                        </h4>
                        <span className="text-[10px] font-bold text-[#2F6FED] flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5 fill-[#2F6FED]" />
                          {user.currentStreak}d
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate">@{user.username}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white transition-all" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Results */}
          {(activeTab === 'all' || activeTab === 'tags') && filteredTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-purple-400">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" />
                  Post Tags ({filteredTags.length})
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
                    <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-black">
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
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-black/60 flex items-center justify-between text-[11px] text-white/40">
          <span>Search posts, communities, people, and discipline tags</span>
          <span className="hidden sm:inline">Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};
