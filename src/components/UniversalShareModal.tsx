import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Check,
  Share2,
  Users,
  Search,
  Send,
  Globe,
  Trophy,
  User as UserIcon,
  ExternalLink,
  MessageSquare,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Post, User, Group, Community, Challenge } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

export interface UniversalShareItem {
  type: 'post' | 'community' | 'challenge' | 'user';
  post?: Post;
  community?: Community;
  challenge?: Challenge;
  user?: User;
}

interface UniversalShareModalProps {
  isOpen: boolean;
  item: UniversalShareItem | null;
  currentUser: User;
  allUsers: User[];
  allGroups: Group[];
  allCommunities?: Community[];
  onClose: () => void;
  onSendToUser: (userId: string, note?: string) => void;
  onSendToGroup: (groupId: string, note?: string) => void;
  onOpenDirectChat?: (userId: string) => void;
  onOpenGroupChat?: (groupId: string) => void;
}

export const UniversalShareModal: React.FC<UniversalShareModalProps> = ({
  isOpen,
  item,
  currentUser,
  allUsers,
  allGroups,
  allCommunities = [],
  onClose,
  onSendToUser,
  onSendToGroup,
  onOpenDirectChat,
  onOpenGroupChat,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'groups'>('all');
  const [sentRecipientIds, setSentRecipientIds] = useState<string[]>([]);

  if (!isOpen || !item) return null;

  // Derive title, subtitle, link, and preview metadata based on item type
  let title = 'Share';
  let shareUrl = window.location.href;
  let shareText = '';

  if (item.type === 'community' && item.community) {
    title = `Share Community: ${item.community.name}`;
    shareUrl = `${window.location.origin}/#community/${item.community.id}`;
    shareText = `Check out the "${item.community.name}" community on Daily! ${item.community.description || ''}`;
  } else if (item.type === 'challenge' && item.challenge) {
    title = `Share Challenge: ${item.challenge.title}`;
    shareUrl = `${window.location.origin}/#challenge/${item.challenge.id}`;
    shareText = `Join me in the "${item.challenge.title}" challenge on Daily! Goal: ${item.challenge.durationDays} days of proof.`;
  } else if (item.type === 'user' && item.user) {
    title = `Share @${item.user.username}'s Profile`;
    shareUrl = `${window.location.origin}/#profile/${item.user.username}`;
    shareText = `Check out @${item.user.username} on Daily!`;
  } else if (item.type === 'post' && item.post) {
    title = `Share Proof by @${item.post.username}`;
    shareUrl = `${window.location.origin}/#post/${item.post.id}`;
    shareText = `Check out this proof by @${item.post.username} on Daily! "${item.post.content.slice(0, 80)}"`;
  }

  const handleCopyLink = async () => {
    vibrateLight();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch {
      // Fallback
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = async () => {
    vibrateLight();
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendToUserDirect = (userId: string) => {
    vibrateStreakMilestone();
    onSendToUser(userId, shareNote.trim() || undefined);
    setSentRecipientIds((prev) => [...prev, userId]);
  };

  const handleSendToGroupDirect = (groupId: string) => {
    vibrateStreakMilestone();
    onSendToGroup(groupId, shareNote.trim() || undefined);
    setSentRecipientIds((prev) => [...prev, groupId]);
  };

  // Filter friends & groups
  const availableFriends = allUsers.filter((u) => u.id !== currentUser.id);

  const filteredFriends = availableFriends.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.interests || []).some((h) => h.toLowerCase().includes(q))
    );
  });

  const filteredGroups = allGroups.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0d0f17] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2F6FED]/20 flex items-center justify-center text-[#2F6FED]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{title}</h3>
              <p className="text-[10px] text-white/50">Send in DMs or copy link to share</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Preview Card */}
        <div className="p-3 bg-white/[0.03] border-b border-white/10">
          {item.type === 'community' && item.community && (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2F6FED]/20 to-sky-500/20 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                {item.community.avatar || '🌐'}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[#5B8DEF] uppercase tracking-wider block">
                  Community
                </span>
                <h4 className="text-xs font-black text-white truncate">{item.community.name}</h4>
                <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">
                  {item.community.description || `${item.community.memberCount || 1} members`}
                </p>
              </div>
            </div>
          )}

          {item.type === 'challenge' && item.challenge && (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
                {item.challenge.icon || '🏆'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    {item.challenge.durationDays} Days Goal
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">#{item.challenge.tag}</span>
                </div>
                <h4 className="text-xs font-black text-white truncate">{item.challenge.title}</h4>
                <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">
                  {item.challenge.description || 'Commit to daily proof receipts'}
                </p>
              </div>
            </div>
          )}

          {item.type === 'user' && item.user && (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10">
              <img
                src={item.user.avatar}
                alt={item.user.name}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border border-white/15 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-white truncate">{item.user.name}</h4>
                  <span className="text-[10px] text-[#5B8DEF] font-mono">@{item.user.username}</span>
                </div>
                {item.user.interests?.[0] && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-white/40 truncate">
                      #{item.user.interests[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {item.type === 'post' && item.post && (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10">
              {item.post.imageUrl ? (
                <img
                  src={item.post.imageUrl}
                  alt="Proof preview"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                  💬
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-sky-400 font-mono block">
                  @{item.post.username} • Day {item.post.userStreak}
                </span>
                <p className="text-[11px] text-white/80 line-clamp-2 mt-0.5 leading-snug">
                  {item.post.content}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Row: Copy Link & Native Share */}
        <div className="p-3 grid grid-cols-2 gap-2 border-b border-white/10">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5 text-[#2F6FED]" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#2F6FED]/20 hover:bg-[#2F6FED]/30 border border-[#2F6FED]/40 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <span>More Options</span>
          </button>
        </div>

        {/* Optional Note to include in DM */}
        <div className="px-3 pt-2.5">
          <input
            type="text"
            value={shareNote}
            onChange={(e) => setShareNote(e.target.value)}
            placeholder="Add an optional message with this share..."
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs font-medium focus:outline-none focus:border-[#2F6FED] transition-colors"
          />
        </div>

        {/* Recipients Search & Filter */}
        <div className="p-3 space-y-2 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-white/50">
              Share in DMs
            </span>
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  activeTab === 'all' ? 'bg-[#2F6FED] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('friends')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  activeTab === 'friends' ? 'bg-[#2F6FED] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                Friends ({availableFriends.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  activeTab === 'groups' ? 'bg-[#2F6FED] text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                Squads ({allGroups.length})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends or squads..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-xs font-medium focus:outline-none focus:border-[#2F6FED] transition-colors"
            />
          </div>

          {/* List of Recipients */}
          <div className="overflow-y-auto space-y-1.5 flex-1 pr-1 max-h-[300px]">
            {/* Friends */}
            {(activeTab === 'all' || activeTab === 'friends') && (
              <>
                {activeTab === 'all' && filteredFriends.length > 0 && (
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block pt-1">
                    Friends & Creators
                  </span>
                )}
                {filteredFriends.map((friend) => {
                  const isSent = sentRecipientIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {friend.name}
                          </span>
                          <span className="text-[10px] text-white/40 font-mono block truncate">
                            @{friend.username}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendToUserDirect(friend.id)}
                        disabled={isSent}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isSent
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-[#2F6FED] hover:bg-[#255bd1] text-white active:scale-95 shadow-sm'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Sent</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {/* Squads / Groups */}
            {(activeTab === 'all' || activeTab === 'groups') && (
              <>
                {activeTab === 'all' && filteredGroups.length > 0 && (
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block pt-2">
                    Squads & Chat Groups
                  </span>
                )}
                {filteredGroups.map((group) => {
                  const isSent = sentRecipientIds.includes(group.id);
                  return (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={group.avatar}
                          alt={group.name}
                          className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {group.name}
                          </span>
                          <span className="text-[10px] text-white/40 block truncate">
                            {group.memberCount} members • {group.category}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendToGroupDirect(group.id)}
                        disabled={isSent}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isSent
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 shadow-sm'
                        }`}
                      >
                        {isSent ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Sent</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {filteredFriends.length === 0 && filteredGroups.length === 0 && (
              <div className="p-4 text-center text-xs text-white/40">
                No matching friends or squads found.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 flex items-center justify-between bg-black/40">
          <span className="text-[11px] text-white/50">
            {sentRecipientIds.length > 0 ? `${sentRecipientIds.length} shared in DMs` : 'Choose recipients'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
