import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Send,
  Search,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Plus,
  Pin,
  ShieldCheck,
  Upload,
  X,
  ArrowUpDown,
  Check,
  Trophy,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import { User, Message, Group, SharedPostPreview, ChallengeInvitePreview } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

export type MessageSortOption = 'all' | 'groups' | 'direct';

interface DirectMessagesScreenProps {
  currentUser: User;
  allUsers: User[];
  allGroups: Group[];
  messages: Message[];
  onSendMessage: (params: {
    receiverId?: string;
    groupId?: string;
    text: string;
    imageUrl?: string;
  }) => void;
  initialChatUserId?: string | null;
  initialGroupId?: string | null;
  onOpenCreateGroup?: () => void;
  onViewPost?: (postId: string) => void;
  onViewUser?: (user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    currentStreak: number;
  }) => void;
  onOpenChallenge?: (challengeId: string) => void;
  onBack: () => void;
}

const PRESET_CHAT_PHOTOS = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
];

interface UnifiedConversationItem {
  id: string;
  type: 'direct' | 'group';
  user?: User;
  group?: Group;
  title: string;
  subtitle: string;
  avatar: string;
  lastMessage: Message;
  sortTimestamp: number;
  unreadCount: number;
}

export const DirectMessagesScreen: React.FC<DirectMessagesScreenProps> = ({
  currentUser,
  allUsers,
  allGroups,
  messages,
  onSendMessage,
  initialChatUserId,
  initialGroupId,
  onOpenCreateGroup,
  onViewPost,
  onViewUser,
  onOpenChallenge,
  onBack,
}) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(initialChatUserId || null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(initialGroupId || null);
  const [sortOption, setSortOption] = useState<MessageSortOption>('all');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPinnedInfo, setShowPinnedInfo] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Sync initial targets
  useEffect(() => {
    if (initialChatUserId) {
      setActiveUserId(initialChatUserId);
      setActiveGroupId(null);
    } else if (initialGroupId) {
      setActiveGroupId(initialGroupId);
      setActiveUserId(null);
    }
  }, [initialChatUserId, initialGroupId]);

  // Focus search input when activated
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to bottom when messages change inside active chat
  useEffect(() => {
    if (activeUserId || activeGroupId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeUserId, activeGroupId]);

  const activeUser = allUsers.find((u) => u.id === activeUserId);
  const activeGroup = allGroups.find((g) => g.id === activeGroupId);

  // Helper to extract numeric sorting timestamp from a message
  const getMessageTimestampScore = (msg: Message | undefined, defaultOrder: number = 0): number => {
    if (!msg) return defaultOrder;
    // Check if ID has embedded timestamp
    const match = msg.id.match(/^msg_(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    // Check if index in messages array
    const idx = messages.indexOf(msg);
    if (idx !== -1) {
      return 1700000000000 + idx * 1000;
    }
    return defaultOrder;
  };

  // Build unified list of conversations: both direct messages & groups
  const unifiedConversations = useMemo(() => {
    const items: UnifiedConversationItem[] = [];

    // 1. Direct Conversations
    const directMap = new Map<string, { user: User; msgs: Message[]; unread: number }>();

    messages.forEach((msg) => {
      if (msg.groupId) return;
      const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
      if (!otherUserId) return;
      const otherUser = allUsers.find((u) => u.id === otherUserId);
      if (!otherUser) return;

      const existing = directMap.get(otherUserId);
      if (!existing) {
        directMap.set(otherUserId, {
          user: otherUser,
          msgs: [msg],
          unread: !msg.isRead && msg.receiverId === currentUser.id ? 1 : 0,
        });
      } else {
        existing.msgs.push(msg);
        if (!msg.isRead && msg.receiverId === currentUser.id) {
          existing.unread += 1;
        }
      }
    });

    // Also include followed users if not yet messaged
    (currentUser.followedUserIds || []).forEach((followedId) => {
      if (!directMap.has(followedId)) {
        const u = allUsers.find((user) => user.id === followedId);
        if (u) {
          directMap.set(followedId, {
            user: u,
            msgs: [],
            unread: 0,
          });
        }
      }
    });

    directMap.forEach(({ user, msgs, unread }, userId) => {
      const lastMsg = msgs[msgs.length - 1] || {
        id: `temp_${userId}`,
        conversationId: `conv_${userId}`,
        senderId: userId,
        receiverId: currentUser.id,
        text: 'Connected • Tap to message',
        timestamp: 'New',
        isRead: true,
      };

      const sortTime = msgs.length > 0
        ? getMessageTimestampScore(msgs[msgs.length - 1], 1000)
        : 500;

      items.push({
        id: `direct_${user.id}`,
        type: 'direct',
        user,
        title: user.name,
        subtitle: `@${user.username}`,
        avatar: user.avatar,
        lastMessage: lastMsg,
        sortTimestamp: sortTime,
        unreadCount: unread,
      });
    });

    // 2. Group Conversations
    allGroups.forEach((grp) => {
      const grpMsgs = messages.filter((m) => m.groupId === grp.id);
      const lastMsg = grpMsgs[grpMsgs.length - 1] || {
        id: `init_${grp.id}`,
        conversationId: `conv_${grp.id}`,
        senderId: grp.createdBy,
        groupId: grp.id,
        text: grp.description || 'Welcome to the group chat!',
        timestamp: grp.lastActivity || 'Active',
        isRead: true,
      };

      const sortTime = grpMsgs.length > 0
        ? getMessageTimestampScore(grpMsgs[grpMsgs.length - 1], 1000)
        : 600;

      items.push({
        id: `group_${grp.id}`,
        type: 'group',
        group: grp,
        title: grp.name,
        subtitle: `${grp.memberCount || grp.memberIds?.length || 1} members • #${grp.category || 'General'}`,
        avatar: grp.avatar,
        lastMessage: lastMsg,
        sortTimestamp: sortTime,
        unreadCount: 0,
      });
    });

    // Filter by Sort Option:
    // 'all' includes both groups and direct messages
    // 'groups' includes only groups
    // 'direct' includes only direct messages
    let filtered = items;
    if (sortOption === 'groups') {
      filtered = items.filter((item) => item.type === 'group');
    } else if (sortOption === 'direct') {
      filtered = items.filter((item) => item.type === 'direct');
    }

    // Filter by search query if active
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.lastMessage.text.toLowerCase().includes(q)
        );
      });
    }

    // Sort strictly by the time the most recent message was sent (descending)
    return filtered.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
  }, [messages, allUsers, allGroups, currentUser, sortOption, searchQuery]);

  // Active chat message stream
  const currentChatMessages = messages.filter((m) => {
    if (activeGroupId) {
      return m.groupId === activeGroupId;
    }
    if (activeUserId) {
      return (
        !m.groupId &&
        ((m.senderId === currentUser.id && m.receiverId === activeUserId) ||
          (m.senderId === activeUserId && m.receiverId === currentUser.id))
      );
    }
    return false;
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    vibrateLight();
    if (activeGroupId) {
      onSendMessage({
        groupId: activeGroupId,
        text: inputText.trim(),
        imageUrl: attachedImage || undefined,
      });
    } else if (activeUserId) {
      onSendMessage({
        receiverId: activeUserId,
        text: inputText.trim(),
        imageUrl: attachedImage || undefined,
      });
    }

    setInputText('');
    setAttachedImage(null);
    setShowPhotoPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAttachedImage(reader.result);
          setShowPhotoPicker(false);
          vibrateLight();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isInsideChat = Boolean(activeUserId || activeGroupId);

  const getSortOptionLabel = (option: MessageSortOption) => {
    switch (option) {
      case 'all':
        return 'All';
      case 'groups':
        return 'Groups';
      case 'direct':
        return 'Direct Messages';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] text-white min-h-[calc(100vh-3.5rem)] select-none">
      {!isInsideChat ? (
        /* CONVERSATION INBOX VIEW */
        <div className="flex-1 flex flex-col h-full">
          {/* Main Top Header */}
          <div className="sticky top-0 z-20 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-2">
            {/* Left: Back Button to previous screen & Screen Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onBack}
                className="p-2 -ml-1 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold"
                aria-label="Back to main feed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2F6FED]/20 border border-[#2F6FED]/40 flex items-center justify-center text-[#2F6FED] shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-black text-base tracking-tight text-white truncate">
                  Messages & Groups
                </h2>
              </div>
            </div>

            {/* Right Controls: Sort By Menu, Search Button, Create Group Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Sort By Dropdown Option */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSortDropdownOpen
                      ? 'bg-[#2F6FED]/20 border-[#2F6FED] text-white'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                  }`}
                  title="Sort conversations"
                  aria-label="Sort conversations"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#2F6FED]" />
                  <span className="hidden xs:inline text-[11px]">Sort:</span>
                  <span className="text-[11px] font-semibold text-white">
                    {getSortOptionLabel(sortOption)}
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/50" />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#121216] border border-white/15 rounded-2xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold text-white/40 border-b border-white/5 mb-1">
                      Sort & Filter By Sent Time
                    </div>
                    {(['all', 'groups', 'direct'] as MessageSortOption[]).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          vibrateLight();
                          setSortOption(opt);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-semibold flex items-center justify-between hover:bg-white/5 transition-colors ${
                          sortOption === opt ? 'text-[#2F6FED] bg-[#2F6FED]/10 font-bold' : 'text-white/80'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {opt === 'all' && <MessageSquare className="w-3.5 h-3.5 text-[#2F6FED]" />}
                          {opt === 'groups' && <Users className="w-3.5 h-3.5 text-emerald-400" />}
                          {opt === 'direct' && <MessageSquare className="w-3.5 h-3.5 text-sky-400" />}
                          <span>{getSortOptionLabel(opt)}</span>
                        </div>
                        {sortOption === opt && <Check className="w-3.5 h-3.5 text-[#2F6FED]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Toggle Button (Beside Create Group) */}
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setIsSearchActive(!isSearchActive);
                  if (isSearchActive) setSearchQuery('');
                }}
                className={`p-2 rounded-xl border transition-all ${
                  isSearchActive
                    ? 'bg-[#2F6FED] border-[#2F6FED] text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
                }`}
                title={isSearchActive ? 'Close search' : 'Search conversations'}
                aria-label="Search conversations"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Create Group Button */}
              {onOpenCreateGroup && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    onOpenCreateGroup();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#2F6FED]/15 hover:bg-[#2F6FED]/25 border border-[#2F6FED]/40 text-xs font-bold text-[#2F6FED] flex items-center gap-1.5 transition-all shadow-sm"
                  title="Create new group"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Group</span>
                  <span className="sm:hidden">Group</span>
                </button>
              )}
            </div>
          </div>

          {/* Toggleable Search Bar */}
          {isSearchActive && (
            <div className="px-4 py-2.5 bg-[#0e0e12] border-b border-white/10 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages, users, groups..."
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-xl text-xs text-white placeholder-white/40 outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSearchActive(false);
                  setSearchQuery('');
                }}
                className="text-xs text-white/60 hover:text-white font-semibold px-1 py-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Active Sort Bar Summary */}
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-[11px] text-white/50 font-medium">
            <div className="flex items-center gap-1.5">
              <span>Sorted by latest message sent:</span>
              <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md text-[10px]">
                {sortOption === 'all'
                  ? 'All (Mixed by Time)'
                  : sortOption === 'groups'
                  ? 'Groups Only'
                  : 'Direct Messages Only'}
              </span>
            </div>
            <span className="text-white/40 font-mono text-[10px]">
              {unifiedConversations.length} conversation{unifiedConversations.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Chronologically Sorted Conversation Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
            {unifiedConversations.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 text-white/50">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/30">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/80">No conversations found</p>
                  <p className="text-xs text-white/40 mt-1 max-w-xs">
                    {searchQuery
                      ? 'No direct messages or groups match your search.'
                      : sortOption === 'groups'
                      ? 'No groups yet. Tap "+ New Group" above to start one!'
                      : 'Follow people or start a new message to chat.'}
                  </p>
                </div>
                {onOpenCreateGroup && sortOption === 'groups' && (
                  <button
                    type="button"
                    onClick={onOpenCreateGroup}
                    className="px-3.5 py-2 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Your First Group</span>
                  </button>
                )}
              </div>
            ) : (
              unifiedConversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    if (item.type === 'group' && item.group) {
                      setActiveGroupId(item.group.id);
                      setActiveUserId(null);
                    } else if (item.user) {
                      setActiveUserId(item.user.id);
                      setActiveGroupId(null);
                    }
                  }}
                  className="w-full p-3 rounded-2xl hover:bg-white/5 transition-all flex items-center gap-3.5 text-left group"
                >
                  {/* Avatar with Type Marker */}
                  <div className="relative shrink-0">
                    <img
                      src={item.avatar}
                      alt={item.title}
                      className={`w-12 h-12 object-cover border border-white/10 ${
                        item.type === 'group' ? 'rounded-2xl' : 'rounded-full'
                      }`}
                    />
                    {item.type === 'group' ? (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] shadow-md">
                        <Users className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#2F6FED] border-2 border-[#050505]" />
                    )}
                  </div>

                  {/* Main Details: Title, Message preview, Timestamp, Unread Badge */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                          {item.title}
                        </h4>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                            item.type === 'group'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                              : 'bg-white/10 text-white/60'
                          }`}
                        >
                          {item.type === 'group' ? 'Group' : 'Direct'}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 font-mono shrink-0">
                        {item.lastMessage.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs truncate ${
                          item.unreadCount > 0 ? 'text-white font-semibold' : 'text-white/50'
                        }`}
                      >
                        {item.lastMessage.text || 'Photo attachment'}
                      </p>
                      {item.unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#2F6FED] text-white font-black text-[10px] shrink-0 shadow-md">
                          {item.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        /* DEDICATED CHAT VIEW: CHAT IS THE MOST IMPORTANT THING */
        <div className="flex-1 flex flex-col h-full bg-[#070709]">
          {/* Active Chat Header */}
          <div className="sticky top-0 z-20 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setActiveUserId(null);
                  setActiveGroupId(null);
                }}
                className="p-2 -ml-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Messages</span>
              </button>

              {activeGroup ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={activeGroup.avatar}
                    alt={activeGroup.name}
                    className="w-9 h-9 rounded-2xl object-cover shrink-0 border border-white/10"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                      {activeGroup.name}
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-medium block">
                      {activeGroup.memberCount || activeGroup.memberIds?.length || 1} members • #{activeGroup.category || 'General'}
                    </span>
                  </div>
                </div>
              ) : activeUser ? (
                <div
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (onViewUser) {
                      onViewUser({
                        id: activeUser.id,
                        name: activeUser.name,
                        username: activeUser.username,
                        avatar: activeUser.avatar,
                        currentStreak: activeUser.currentStreak || 0,
                      });
                    }
                  }}
                >
                  <img
                    src={activeUser.avatar}
                    alt={activeUser.name}
                    className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5">
                      <span>{activeUser.name}</span>
                      <ExternalLink className="w-3 h-3 text-white/40" />
                    </h3>
                    <span className="text-[10px] text-white/50 block font-mono">
                      @{activeUser.username}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {activeGroup && (
                <button
                  type="button"
                  onClick={() => setShowPinnedInfo(!showPinnedInfo)}
                  className={`p-2 rounded-xl border transition-colors ${
                    showPinnedInfo
                      ? 'bg-[#2F6FED]/20 border-[#2F6FED] text-[#2F6FED]'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                  title="Group Guidelines & Pinned Topic"
                >
                  <Pin className="w-4 h-4" />
                </button>
              )}

              {activeGroup?.challengeId && onOpenChallenge && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    onOpenChallenge(activeGroup.challengeId!);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Challenge</span>
                </button>
              )}
            </div>
          </div>

          {/* Pinned Info Banner for Groups */}
          {activeGroup && showPinnedInfo && (
            <div className="bg-[#101014] p-3.5 border-b border-white/10 animate-in slide-in-from-top-2 space-y-2">
              {activeGroup.pinnedTopic && (
                <div className="p-2.5 rounded-xl bg-[#2F6FED]/10 border border-[#2F6FED]/25 flex items-start gap-2">
                  <Pin className="w-4 h-4 text-[#2F6FED] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#2F6FED] uppercase tracking-wider block">
                      Pinned Discussion Topic
                    </span>
                    <p className="text-xs text-white/90 font-medium mt-0.5">
                      {activeGroup.pinnedTopic}
                    </p>
                  </div>
                </div>
              )}

              {activeGroup.rules && activeGroup.rules.length > 0 && (
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Group Rules
                  </span>
                  <ul className="text-xs text-white/70 space-y-0.5 list-disc list-inside">
                    {activeGroup.rules.map((rule, rIdx) => (
                      <li key={rIdx}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Main Chat Message Timeline */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {currentChatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-white/40">
                <MessageSquare className="w-10 h-10 text-white/20" />
                <p className="text-xs font-bold text-white/80">
                  {activeGroup ? 'No messages in this group yet' : 'No messages yet'}
                </p>
                <p className="text-[11px] text-white/50 max-w-xs">
                  {activeGroup
                    ? 'Start the discussion or post today’s progress update!'
                    : 'Say hi and check in on daily progress!'}
                </p>
              </div>
            ) : (
              currentChatMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const sender = allUsers.find((u) => u.id === msg.senderId) || currentUser;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {/* In groups: show sender avatar & name on incoming messages */}
                    {activeGroup && !isMe && (
                      <div className="flex items-center gap-1.5 ml-1 mb-0.5">
                        <img
                          src={sender.avatar}
                          alt={sender.name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="text-[10px] font-bold text-white/60">
                          {sender.name}
                        </span>
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] sm:max-w-md rounded-2xl p-3 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#2F6FED] text-white shadow-md rounded-tr-sm'
                          : 'bg-white/10 text-white border border-white/5 rounded-tl-sm'
                      }`}
                    >
                      {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                      {/* Photo Attachment with Lightbox Zoom */}
                      {msg.imageUrl && (
                        <div
                          className="mt-2 rounded-xl overflow-hidden cursor-pointer border border-white/10 bg-black/40"
                          onClick={() => setExpandedPhoto(msg.imageUrl || null)}
                        >
                          <img
                            src={msg.imageUrl}
                            alt="Chat attachment"
                            className="max-h-56 w-auto object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Shared Post Card Preview */}
                      {msg.sharedPost && (
                        <div className="mt-2 p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1.5 text-left">
                          <div className="flex items-center gap-1.5">
                            <img
                              src={msg.sharedPost.authorAvatar}
                              alt={msg.sharedPost.authorName}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="text-[10px] font-bold text-white/80">
                              @{msg.sharedPost.authorUsername}
                            </span>
                          </div>
                          {msg.sharedPost.imageUrl && (
                            <img
                              src={msg.sharedPost.imageUrl}
                              alt="Shared preview"
                              className="w-full h-28 object-cover rounded-lg"
                            />
                          )}
                          <p className="text-[11px] text-white/90 line-clamp-2">
                            {msg.sharedPost.content}
                          </p>
                          {onViewPost && (
                            <button
                              type="button"
                              onClick={() => onViewPost(msg.sharedPost!.id)}
                              className="w-full py-1 text-center text-[10px] font-bold text-[#2F6FED] hover:underline"
                            >
                              View Post
                            </button>
                          )}
                        </div>
                      )}

                      {/* Challenge Invite Preview */}
                      {msg.challengeInvite && (
                        <div className="mt-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 space-y-1.5 text-left">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px]">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Challenge Invite</span>
                          </div>
                          <h5 className="font-bold text-xs text-white">
                            {msg.challengeInvite.challengeTitle}
                          </h5>
                          <p className="text-[10px] text-white/70">
                            {msg.challengeInvite.durationDays} Days • #{msg.challengeInvite.category}
                          </p>
                          {onOpenChallenge && (
                            <button
                              type="button"
                              onClick={() => onOpenChallenge(msg.challengeInvite!.challengeId)}
                              className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition-colors"
                            >
                              Join Challenge
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-white/50">
                        <span>{msg.timestamp}</span>
                        {isMe && <span>✓✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Photo Picker Drawer */}
          {showPhotoPicker && (
            <div className="p-3 bg-[#111116] border-t border-white/10 space-y-2 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-white/70">
                <span>Select a photo</span>
                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(false)}
                  className="text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_CHAT_PHOTOS.map((url, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      setAttachedImage(url);
                      setShowPhotoPicker(false);
                    }}
                    className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-[#2F6FED] transition-colors"
                  >
                    <img src={url} alt={`Preset ${pIdx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload photo from device</span>
              </button>
            </div>
          )}

          {/* Attached image preview */}
          {attachedImage && (
            <div className="p-2 border-t border-white/10 bg-[#121216] flex items-center gap-2">
              <div className="relative inline-block rounded-xl overflow-hidden border border-[#2F6FED] h-16 w-16">
                <img src={attachedImage} alt="Ready" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[11px] text-white/60">Photo attached to message</span>
            </div>
          )}

          {/* Bottom Chat Composer Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-[#0a0a0a] border-t border-white/10 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowPhotoPicker(!showPhotoPicker)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
              title="Attach photo"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeGroup
                  ? `Message in ${activeGroup.name}...`
                  : `Message @${activeUser?.username || 'user'}...`
              }
              className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-xl text-xs text-white placeholder-white/40 outline-none transition-colors"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !attachedImage}
              className="p-2.5 bg-[#2F6FED] hover:bg-[#255bd1] disabled:opacity-30 text-white font-bold rounded-xl transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Lightbox photo viewer */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setExpandedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={expandedPhoto}
              alt="Expanded preview"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setExpandedPhoto(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
