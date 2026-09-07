import React, { useState, useEffect, useRef } from 'react';
import {
  X,
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
  ArrowBigUp,
  Share2,
  Trophy,
} from 'lucide-react';
import { User, Message, Group, Post } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { DailyStorageService } from '../services/storage';
import { DirectMessageNotesBar } from './DirectMessageNotesBar';

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

const PRESET_CHAT_PHOTOS = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
];

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({
  isOpen,
  onClose,
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
}) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(initialChatUserId || null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(initialGroupId || null);
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');
  const [showPinnedInfo, setShowPinnedInfo] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  // Local upvotes tracking for reddit discussion mode in groups
  const [messageUpvotes, setMessageUpvotes] = useState<{ [msgId: string]: { count: number; voted: boolean } }>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial chat targets
  useEffect(() => {
    if (initialChatUserId) {
      setActiveUserId(initialChatUserId);
      setActiveGroupId(null);
    } else if (initialGroupId) {
      setActiveGroupId(initialGroupId);
      setActiveUserId(null);
    }
  }, [initialChatUserId, initialGroupId]);

  // Scroll to bottom when conversation messages change
  useEffect(() => {
    if (activeUserId || activeGroupId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeUserId, activeGroupId]);

  if (!isOpen) return null;

  const activeUser = allUsers.find((u) => u.id === activeUserId);
  const activeGroup = allGroups.find((g) => g.id === activeGroupId);

  // Group direct messages into conversations
  const directConversationsMap = new Map<
    string,
    { user: User; lastMessage: Message; unreadCount: number }
  >();

  messages.forEach((msg) => {
    if (msg.groupId) return;
    const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
    if (!otherUserId) return;
    const otherUser = allUsers.find((u) => u.id === otherUserId);
    if (!otherUser) return;

    const existing = directConversationsMap.get(otherUserId);
    if (!existing) {
      directConversationsMap.set(otherUserId, {
        user: otherUser,
        lastMessage: msg,
        unreadCount: !msg.isRead && msg.receiverId === currentUser.id ? 1 : 0,
      });
    } else {
      existing.lastMessage = msg;
      if (!msg.isRead && msg.receiverId === currentUser.id) {
        existing.unreadCount += 1;
      }
    }
  });

  // Make sure users in followed list are accessible even without past messages
  (currentUser.followedUserIds || []).forEach((followedId) => {
    if (!directConversationsMap.has(followedId)) {
      const u = allUsers.find((user) => user.id === followedId);
      if (u) {
        directConversationsMap.set(followedId, {
          user: u,
          lastMessage: {
            id: `temp_${u.id}`,
            conversationId: `conv_${u.id}`,
            senderId: u.id,
            receiverId: currentUser.id,
            text: 'Connected • Send a message',
            timestamp: 'Recently',
            isRead: true,
          },
          unreadCount: 0,
        });
      }
    }
  });

  const directConversations = Array.from(directConversationsMap.values()).filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.user.name.toLowerCase().includes(q) || conv.user.username.toLowerCase().includes(q)
    );
  });

  // Group conversations
  const groupConversations = allGroups.map((grp) => {
    const groupMsgs = messages.filter((m) => m.groupId === grp.id);
    const lastMsg =
      groupMsgs.length > 0
        ? groupMsgs[groupMsgs.length - 1]
        : {
            id: `init_${grp.id}`,
            conversationId: `conv_${grp.id}`,
            senderId: grp.createdBy,
            groupId: grp.id,
            text: grp.description || 'Welcome to the live discussion!',
            timestamp: grp.lastActivity || 'Active',
            isRead: true,
          };
    return {
      group: grp,
      lastMessage: lastMsg,
      messageCount: groupMsgs.length,
    };
  }).filter(({ group }) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(q) ||
      (group.description || '').toLowerCase().includes(q) ||
      (group.category || '').toLowerCase().includes(q)
    );
  });

  // Messages in active conversation
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

  const handleToggleUpvote = (msgId: string) => {
    vibrateLight();
    setMessageUpvotes((prev) => {
      const current = prev[msgId] || { count: Math.floor(Math.random() * 5) + 1, voted: false };
      return {
        ...prev,
        [msgId]: {
          count: current.voted ? current.count - 1 : current.count + 1,
          voted: !current.voted,
        },
      };
    });
  };

  const isInsideChat = !!activeUserId || !!activeGroupId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-[#0A0A0A] sm:border border-slate-200 dark:border-white/10 h-full sm:h-[85vh] sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-white">
        {/* INBOX VIEW */}
        {!isInsideChat ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Inbox Header */}
            <div className="px-4 py-3.5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0A0A0A]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2F6FED]/10 border border-[#2F6FED]/20 flex items-center justify-center text-[#2F6FED]">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white">Messages & Groups</h2>
              </div>
              <div className="flex items-center gap-1">
                {onOpenCreateGroup && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateGroup();
                    }}
                    className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-[#2F6FED] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Group</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="Close messages"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-3 border-b border-slate-200 dark:border-white/10 space-y-2.5 bg-slate-50 dark:bg-black/30">
              <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All ({directConversations.length + groupConversations.length})
                </button>
                <button
                  onClick={() => setActiveTab('direct')}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'direct'
                      ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Direct ({directConversations.length})
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'groups'
                      ? 'bg-white dark:bg-white/20 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Groups ({groupConversations.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations or groups..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 focus:border-[#2F6FED] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 outline-none transition-colors shadow-sm"
                />
              </div>
            </div>

            {/* Notes Carousel */}
            <DirectMessageNotesBar
              currentUser={currentUser}
              allUsers={allUsers}
              onOpenChatWithUser={(targetUserId, initialMsg) => {
                setActiveUserId(targetUserId);
                setActiveGroupId(null);
                if (initialMsg) {
                  setInputText(initialMsg);
                }
              }}
            />

            {/* Conversation List Stream */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 p-1">
              {/* Groups section if tab is all or groups */}
              {(activeTab === 'all' || activeTab === 'groups') && groupConversations.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-[#2F6FED]" />
                      <span>Groups & Communities</span>
                    </span>
                  </div>

                  {groupConversations.map(({ group, lastMessage, messageCount }) => (
                    <button
                      key={group.id}
                      onClick={() => {
                        vibrateLight();
                        setActiveGroupId(group.id);
                        setActiveUserId(null);
                      }}
                      className="w-full p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-3 text-left group"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={group.avatar}
                          alt={group.name}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-white/10"
                        />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#2F6FED] text-white flex items-center justify-center text-[9px]">
                          💬
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {group.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-white/40">
                            {lastMessage.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-white/60 truncate">
                          {lastMessage.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Direct Messages Section */}
              {(activeTab === 'all' || activeTab === 'direct') && (
                <div className="p-2 space-y-1">
                  {(activeTab === 'all' && groupConversations.length > 0) && (
                    <div className="px-2 py-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">
                        Direct Messages
                      </span>
                    </div>
                  )}

                  {directConversations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 dark:text-white/40 space-y-1">
                      <p className="font-semibold text-slate-600 dark:text-white/60">No conversations found</p>
                      <p className="text-[11px]">Follow other users or start a conversation above.</p>
                    </div>
                  ) : (
                    directConversations.map(({ user, lastMessage, unreadCount }) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          vibrateLight();
                          setActiveUserId(user.id);
                          setActiveGroupId(null);
                        }}
                        className="w-full p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-3 text-left"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-white/10"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {user.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 dark:text-white/40">
                              {lastMessage.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-white/60 truncate">
                            {lastMessage.text}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-[#2F6FED] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE CONVERSATION OR REDDIT-STYLE LIVE DISCUSSION ROOM */
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#0A0A0A]">
            {/* Conversation Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#0A0A0A] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => {
                    setActiveUserId(null);
                    setActiveGroupId(null);
                  }}
                  className="p-1.5 -ml-1 text-slate-400 hover:text-slate-800 dark:text-white/60 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="Back to inbox"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {activeGroup ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={activeGroup.avatar}
                      alt={activeGroup.name}
                      className="w-8 h-8 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          r/{activeGroup.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                        </h3>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-bold border border-sky-200 dark:border-sky-800/40">
                          Live Room
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block">
                        {(activeGroup.memberIds || []).length} active members
                      </span>
                    </div>
                  </div>
                ) : activeUser ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={activeUser.avatar}
                      alt={activeUser.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {activeUser.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 dark:text-white/40 block">
                        @{activeUser.username}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center gap-1.5">
                {activeGroup && (
                  <button
                    onClick={() => setShowPinnedInfo(!showPinnedInfo)}
                    className={`p-2 rounded-xl border transition-colors ${
                      showPinnedInfo
                        ? 'bg-[#2F6FED]/15 border-[#2F6FED]/30 text-[#2F6FED]'
                        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Community Guidelines & Pinned Topic"
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                )}
                {activeGroup?.challengeId && onOpenChallenge && (
                  <button
                    onClick={() => {
                      vibrateLight();
                      onClose();
                      onOpenChallenge(activeGroup.challengeId!);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Hub</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  aria-label="Close messages"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Pinned Topic & Guidelines Drawer for active group */}
            {activeGroup && showPinnedInfo && (
              <div className="bg-slate-50 dark:bg-[#0E0E0E] p-3.5 border-b border-slate-200 dark:border-white/10 animate-in slide-in-from-top-2 space-y-2">
                {activeGroup.pinnedTopic && (
                  <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-[#2F6FED]/10 border border-sky-200 dark:border-[#2F6FED]/25 flex items-start gap-2">
                    <Pin className="w-4 h-4 text-[#2F6FED] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-[#2F6FED] uppercase tracking-wider block">
                        Pinned Discussion Prompt
                      </span>
                      <p className="text-xs text-slate-800 dark:text-white font-medium mt-0.5">
                        {activeGroup.pinnedTopic}
                      </p>
                    </div>
                  </div>
                )}

                {activeGroup.rules && activeGroup.rules.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      Community Rules
                    </span>
                    <ul className="text-xs text-slate-600 dark:text-white/70 space-y-0.5 list-disc list-inside">
                      {activeGroup.rules.map((rule, rIdx) => (
                        <li key={rIdx}>{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* MESSAGES VIEW: REDDIT-STYLE FOR GROUPS, BUBBLES FOR DIRECT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentChatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300 dark:text-white/20" />
                  <p className="text-xs font-bold text-slate-700 dark:text-white/80">
                    {activeGroup ? 'No discussions yet' : 'No messages yet'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-white/50">
                    {activeGroup
                      ? 'Drop a question, receipt photo, or start the daily thread below!'
                      : 'Say hi and check in on daily progress!'}
                  </p>
                </div>
              ) : activeGroup ? (
                /* REDDIT-STYLE DISCUSSION THREADS */
                currentChatMessages.map((msg) => {
                  const sender = allUsers.find((u) => u.id === msg.senderId) || currentUser;
                  const isMe = msg.senderId === currentUser.id;
                  const voteState = messageUpvotes[msg.id] || { count: 3, voted: false };

                  return (
                    <div
                      key={msg.id}
                      className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 flex items-start gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                    >
                      {/* Reddit Upvote Column */}
                      <div className="flex flex-col items-center justify-center shrink-0 pt-0.5">
                        <button
                          onClick={() => handleToggleUpvote(msg.id)}
                          className={`p-1 rounded-md transition-colors ${
                            voteState.voted
                              ? 'text-orange-500 bg-orange-500/10'
                              : 'text-slate-400 hover:text-orange-500'
                          }`}
                          title="Upvote comment"
                        >
                          <ArrowBigUp className="w-5 h-5 fill-current" />
                        </button>
                        <span
                          className={`text-xs font-bold ${
                            voteState.voted ? 'text-orange-500' : 'text-slate-700 dark:text-white/80'
                          }`}
                        >
                          {voteState.count}
                        </span>
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={sender.avatar}
                            alt={sender.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            u/{sender.username}
                          </span>
                          {isMe && (
                            <span className="text-[9px] bg-[#2F6FED] text-white px-1.5 py-0.2 rounded font-bold">
                              OP
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 dark:text-white/40">
                            • {msg.timestamp}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-white/90 leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>

                        {/* Attached Image with click-to-zoom */}
                        {msg.imageUrl && (
                          <div
                            className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 max-h-48 max-w-xs cursor-pointer bg-black"
                            onClick={() => setExpandedPhoto(msg.imageUrl || null)}
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Attachment"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* DIRECT MESSAGES BUBBLE STREAM */
                currentChatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#2F6FED] text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5'
                        }`}
                      >
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                        {msg.imageUrl && (
                          <div
                            className="mt-1.5 rounded-xl overflow-hidden cursor-pointer"
                            onClick={() => setExpandedPhoto(msg.imageUrl || null)}
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Chat attachment"
                              className="max-h-48 w-auto object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-white/40 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Photo preset picker */}
            {showPhotoPicker && (
              <div className="p-3 bg-slate-50 dark:bg-white/5 border-t border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-white/60">
                  <span>Attach receipt or photo:</span>
                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_CHAT_PHOTOS.map((url, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setAttachedImage(url);
                        setShowPhotoPicker(false);
                      }}
                      className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-[#2F6FED] transition-colors"
                    >
                      <img src={url} alt={`Preset ${pIdx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-1.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload from device</span>
                </button>
              </div>
            )}

            {/* Attached image preview */}
            {attachedImage && (
              <div className="p-2 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center gap-2">
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
                <span className="text-[11px] text-slate-500 dark:text-white/50">Photo attached</span>
              </div>
            )}

            {/* Input Composer */}
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-2 bg-white dark:bg-[#0A0A0A]"
            >
              <button
                type="button"
                onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-colors"
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
                    ? `Comment or discuss in ${activeGroup.name}...`
                    : `Message @${activeUser?.username || 'user'}...`
                }
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-[#2F6FED] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 outline-none transition-colors"
              />

              <button
                type="submit"
                disabled={!inputText.trim() && !attachedImage}
                className="p-2.5 bg-[#2F6FED] hover:bg-[#255bd1] disabled:opacity-30 text-white font-bold rounded-xl transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* LIGHTBOX PHOTO MODAL */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setExpandedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={expandedPhoto}
              alt="Expanded preview"
              className="w-full h-full object-contain"
            />
            <button
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
