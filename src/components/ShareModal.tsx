import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Check,
  Share2,
  Users,
  Search,
  Send,
  Flame,
  Plus,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Post, User, Group } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface ShareModalProps {
  isOpen: boolean;
  post: Post | null;
  currentUser: User;
  allUsers: User[];
  allGroups: Group[];
  onClose: () => void;
  onSendShare: (
    post: Post,
    recipientUserIds: string[],
    recipientGroupIds: string[],
    note?: string
  ) => void;
  onOpenCreateGroup?: () => void;
  onCreateGroup?: () => void;
  onOpenDirectChat?: (userId: string) => void;
  onOpenGroupChat?: (groupId: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  post,
  currentUser,
  allUsers,
  allGroups,
  onClose,
  onSendShare,
  onOpenCreateGroup,
  onCreateGroup,
  onOpenDirectChat,
  onOpenGroupChat,
}) => {
  const triggerCreateGroup = onOpenCreateGroup || onCreateGroup;
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [shareNote, setShareNote] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'groups'>('all');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [lastSentRecipient, setLastSentRecipient] = useState<{
    type: 'user' | 'group';
    id: string;
    name: string;
  } | null>(null);

  if (!isOpen || !post) return null;

  const postUrl = `${window.location.origin}/post/${post.id}`;

  const handleCopyLink = async () => {
    vibrateLight();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
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
          title: `Daily update by ${post.name} (@${post.username})`,
          text: `Check out ${post.name}'s day ${post.userStreak} streak on Daily: "${post.content.slice(0, 100)}..."`,
          url: postUrl,
        });
      } catch {
        // User cancelled or failed
      }
    } else {
      handleCopyLink();
    }
  };

  // Filter available friends (excluding current user)
  const availableFriends = allUsers.filter((u) => u.id !== currentUser.id);

  const filteredFriends = availableFriends.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.habits.some((h) => h.toLowerCase().includes(q))
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

  const toggleUserSelection = (userId: string) => {
    vibrateLight();
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleGroupSelection = (groupId: string) => {
    vibrateLight();
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const totalSelected = selectedUserIds.length + selectedGroupIds.length;

  const handleSend = () => {
    if (totalSelected === 0) return;
    setIsSending(true);
    vibrateStreakMilestone();

    // Remember recipient for quick-jump to chat
    if (selectedUserIds.length === 1 && selectedGroupIds.length === 0) {
      const u = allUsers.find((user) => user.id === selectedUserIds[0]);
      if (u) setLastSentRecipient({ type: 'user', id: u.id, name: u.name });
    } else if (selectedGroupIds.length === 1 && selectedUserIds.length === 0) {
      const g = allGroups.find((grp) => grp.id === selectedGroupIds[0]);
      if (g) setLastSentRecipient({ type: 'group', id: g.id, name: g.name });
    } else {
      setLastSentRecipient(null);
    }

    onSendShare(post, selectedUserIds, selectedGroupIds, shareNote);

    setSentSuccess(true);
    setIsSending(false);
  };

  const handleSendAndOpenChat = (type: 'user' | 'group', id: string, name: string) => {
    vibrateStreakMilestone();
    if (type === 'user') {
      onSendShare(post, [id], [], shareNote);
      if (onOpenDirectChat) {
        onClose();
        onOpenDirectChat(id);
      }
    } else {
      onSendShare(post, [], [id], shareNote);
      if (onOpenGroupChat) {
        onClose();
        onOpenGroupChat(id);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Share Post</h2>
              <span className="text-[10px] text-white/40 font-mono">
                Post by @{post.username} • <span className="text-[#D4AF37]">🔥{post.userStreak}d streak</span>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close share modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sentSuccess ? (
          <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-lg text-white">Shared to Chat!</h3>
              <p className="text-xs text-white/60 max-w-xs mx-auto">
                The post has been delivered to your selected friends & groups and is now visible in their chat.
              </p>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-2.5 max-w-xs mx-auto">
              {lastSentRecipient && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (lastSentRecipient.type === 'user' && onOpenDirectChat) {
                      onOpenDirectChat(lastSentRecipient.id);
                    } else if (lastSentRecipient.type === 'group' && onOpenGroupChat) {
                      onOpenGroupChat(lastSentRecipient.id);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Open Chat Now</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Quick Post Preview Strip */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
              {post.imageUrl ? (
                <img
                  src={post.imageUrl}
                  alt="Post preview"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-bold text-xs text-white truncate">{post.name}</span>
                  <span className="text-[10px] text-[#D4AF37] font-black shrink-0">
                    🔥{post.userStreak}d
                  </span>
                </div>
                <p className="text-[11px] text-white/60 line-clamp-2 leading-tight">
                  {post.content}
                </p>
              </div>
            </div>

            {/* Quick Actions (Share via Device) */}
            <div>
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 text-xs font-bold text-white transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4 text-blue-400" />
                <span>Share to External Apps via Device</span>
              </button>
            </div>

            {/* Search filter for friends and groups */}
            <div className="relative">
              <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends or groups to send..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-xs text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            {/* Tabs Filter */}
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  All ({availableFriends.length + allGroups.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('friends')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'friends'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Friends ({availableFriends.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('groups')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'groups'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Groups ({allGroups.length})
                </button>
              </div>

              {triggerCreateGroup && (
                <button
                  type="button"
                  onClick={triggerCreateGroup}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Group</span>
                </button>
              )}
            </div>

            {/* Friends Section */}
            {(activeTab === 'all' || activeTab === 'friends') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Direct Friends ({filteredFriends.length})
                  </span>
                  {selectedUserIds.length > 0 && (
                    <span className="text-[10px] text-blue-400 font-bold">
                      {selectedUserIds.length} selected
                    </span>
                  )}
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {filteredFriends.length === 0 ? (
                    <p className="text-xs text-white/30 py-2 text-center">No friends match search</p>
                  ) : (
                    filteredFriends.map((friend) => {
                      const isSelected = selectedUserIds.includes(friend.id);
                      return (
                        <div
                          key={friend.id}
                          className={`w-full p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-blue-500/10 border-blue-500/50'
                              : 'bg-white/5 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div
                            onClick={() => toggleUserSelection(friend.id)}
                            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                          >
                            <div className="relative">
                              <img
                                src={friend.avatar}
                                alt={friend.name}
                                referrerPolicy="no-referrer"
                                className="w-9 h-9 rounded-full object-cover border border-white/10"
                              />
                              <span className="absolute -bottom-1 -right-1 text-[8px] bg-[#D4AF37] text-black font-black px-1 rounded-full">
                                🔥{friend.currentStreak}d
                              </span>
                            </div>
                            <div className="text-left min-w-0">
                              <h4 className="font-bold text-xs text-white truncate">{friend.name}</h4>
                              <p className="text-[10px] text-white/40 truncate">@{friend.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSendAndOpenChat('user', friend.id, friend.name)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-bold flex items-center gap-1 border border-white/5"
                              title="Send and open chat"
                            >
                              <Send className="w-3 h-3 text-blue-400" />
                              <span className="hidden sm:inline">Send & Chat</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleUserSelection(friend.id)}
                              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-500 text-white'
                                  : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Groups Section */}
            {(activeTab === 'all' || activeTab === 'groups') && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                    Streak Groups ({filteredGroups.length})
                  </span>
                  {selectedGroupIds.length > 0 && (
                    <span className="text-[10px] text-blue-400 font-bold">
                      {selectedGroupIds.length} selected
                    </span>
                  )}
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {filteredGroups.length === 0 ? (
                    <p className="text-xs text-white/30 py-2 text-center">No groups found</p>
                  ) : (
                    filteredGroups.map((grp) => {
                      const isSelected = selectedGroupIds.includes(grp.id);
                      return (
                        <div
                          key={grp.id}
                          className={`w-full p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                            isSelected
                              ? 'bg-blue-500/10 border-blue-500/50'
                              : 'bg-white/5 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div
                            onClick={() => toggleGroupSelection(grp.id)}
                            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer select-none"
                          >
                            <img
                              src={grp.avatar}
                              alt={grp.name}
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-2xl object-cover border border-white/10"
                            />
                            <div className="text-left min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-bold text-xs text-white truncate">{grp.name}</h4>
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/10 text-white/60">
                                  {grp.category}
                                </span>
                              </div>
                              <p className="text-[10px] text-white/40 truncate">
                                {grp.memberCount} members
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleSendAndOpenChat('group', grp.id, grp.name)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-bold flex items-center gap-1 border border-white/5"
                              title="Send and open group chat"
                            >
                              <Send className="w-3 h-3 text-blue-400" />
                              <span className="hidden sm:inline">Send & Chat</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleGroupSelection(grp.id)}
                              className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-500 text-white'
                                  : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Optional message input */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={shareNote}
                onChange={(e) => setShareNote(e.target.value)}
                placeholder="Add a message note (optional)..."
                maxLength={140}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {/* Footer actions */}
        {!sentSuccess && (
          <div className="p-4 border-t border-white/5 bg-[#080808] flex items-center justify-between gap-3">
            <span className="text-xs text-white/50">
              {totalSelected > 0 ? (
                <span className="text-white font-bold">
                  {totalSelected} recipient{totalSelected > 1 ? 's' : ''} selected
                </span>
              ) : (
                'Select friends or groups to send'
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={totalSelected === 0 || isSending}
                onClick={handleSend}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 min-h-[40px]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send {totalSelected > 0 ? `(${totalSelected})` : ''}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
