import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowLeft,
  Send,
  Search,
  Flame,
  MessageSquare,
  Sparkles,
  Users,
  Image as ImageIcon,
  Plus,
  ExternalLink,
  Camera,
  Trash2,
} from 'lucide-react';
import { User, Message, Group, Post } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

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
    streak: number;
  }) => void;
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
}) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(initialChatUserId || null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(initialGroupId || null);
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    if (msg.groupId) return; // Skip group messages for direct inbox
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

  // Make sure users in following list are also available in inbox even without past messages
  currentUser.followedUserIds.forEach((followedId) => {
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
            text: 'Started following each other ✨',
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
            text: grp.description,
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
      group.description.toLowerCase().includes(q) ||
      group.category.toLowerCase().includes(q)
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
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetPhoto = (url: string) => {
    vibrateLight();
    setAttachedImage(url);
    setShowPhotoPicker(false);
  };

  const isInsideChat = !!activeUserId || !!activeGroupId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0A0A0A] sm:border border-white/10 h-full sm:h-[85vh] sm:rounded-[32px] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* INBOX VIEW */}
        {!isInsideChat ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Inbox Header */}
            <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center text-[#FF4D00]">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <h2 className="font-black text-base text-white">Direct & Group Messages</h2>
              </div>
              <div className="flex items-center gap-1">
                {onOpenCreateGroup && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateGroup();
                    }}
                    className="p-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-[#FF4D00] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Group</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Close messages"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-3 border-b border-white/5 space-y-2.5 bg-black/40">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'all' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                  }`}
                >
                  All ({directConversations.length + groupConversations.length})
                </button>
                <button
                  onClick={() => setActiveTab('direct')}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'direct' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Friends ({directConversations.length})
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'groups' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Groups ({groupConversations.length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations, friends, or groups..."
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Conversation List Stream */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-1">
              {/* Groups section if tab is all or groups */}
              {(activeTab === 'all' || activeTab === 'groups') && groupConversations.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-[#FF4D00]" />
                      <span>Groups</span>
                    </span>
                    {onOpenCreateGroup && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenCreateGroup();
                        }}
                        className="text-[10px] font-bold text-[#FF4D00] hover:underline"
                      >
                        + Create
                      </button>
                    )}
                  </div>
                  {groupConversations.map(({ group, lastMessage }) => (
                    <div
                      key={group.id}
                      onClick={() => {
                        vibrateLight();
                        setActiveGroupId(group.id);
                        setActiveUserId(null);
                      }}
                      className="p-3 flex items-center gap-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors"
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden border border-white/10">
                          <img
                            src={group.avatar}
                            alt={group.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-black text-[#FF4D00] text-[8px] font-black px-1 rounded-md border border-[#FF4D00]/50">
                          {group.category}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-xs text-white truncate">
                            {group.name}
                          </span>
                          <span className="text-[10px] text-white/40 whitespace-nowrap">
                            {lastMessage.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 truncate leading-tight flex items-center gap-1">
                          {lastMessage.imageUrl && <ImageIcon className="w-3 h-3 text-[#FF4D00] shrink-0" />}
                          <span>{lastMessage.text}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Direct Messages section */}
              {(activeTab === 'all' || activeTab === 'direct') && directConversations.length > 0 && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#FF4D00]" />
                      <span>Direct Messages</span>
                    </span>
                  </div>
                  {directConversations.map(({ user, lastMessage, unreadCount }) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        vibrateLight();
                        setActiveUserId(user.id);
                        setActiveGroupId(null);
                      }}
                      className="p-3 flex items-center gap-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors"
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {user.currentStreak > 0 && (
                          <span className="absolute -bottom-1 -right-1 bg-black text-[#FF4D00] text-[9px] font-black px-1 rounded-full border border-[#FF4D00]/60">
                            🔥{user.currentStreak}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-xs text-white truncate">
                            {user.name}
                          </span>
                          <span className="text-[10px] text-white/40 whitespace-nowrap">
                            {lastMessage.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 truncate leading-tight flex items-center gap-1">
                          {lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                          {lastMessage.imageUrl && <ImageIcon className="w-3 h-3 text-[#FF4D00] shrink-0" />}
                          <span>{lastMessage.text}</span>
                        </p>
                      </div>

                      {unreadCount > 0 && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D00] shrink-0 shadow-md shadow-[#FF4D00]/50" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {directConversations.length === 0 && groupConversations.length === 0 && (
                <div className="text-center py-16 px-4 text-white/40">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-white/30" />
                  <p className="text-xs font-bold text-white/70">No conversations found</p>
                  <p className="text-[11px] text-white/40 mt-1">
                    Discover creators or create a group to start chatting!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE CHAT VIEW (1:1 or Group) */
          <div className="flex-1 flex flex-col h-full bg-[#050505]">
            {/* Header */}
            <div className="px-3 py-3 border-b border-white/5 flex items-center justify-between bg-black">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setActiveUserId(null);
                    setActiveGroupId(null);
                  }}
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {activeGroup ? (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={activeGroup.avatar}
                      alt={activeGroup.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{activeGroup.name}</span>
                        <span className="text-[9px] text-[#FF4D00] font-black bg-[#FF4D00]/10 px-1.5 py-0.5 rounded border border-[#FF4D00]/30">
                          {activeGroup.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 block">
                        {activeGroup.memberCount} members
                      </span>
                    </div>
                  </div>
                ) : activeUser ? (
                  <div
                    onClick={() => {
                      if (onViewUser) {
                        onViewUser({
                          id: activeUser.id,
                          name: activeUser.name,
                          username: activeUser.username,
                          avatar: activeUser.avatar,
                          streak: activeUser.currentStreak,
                        });
                      }
                    }}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={activeUser.avatar}
                        alt={activeUser.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-white/10 group-hover:border-[#FF4D00]/50 transition-colors"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0A0A0A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white group-hover:text-[#FF4D00] transition-colors">
                          {activeUser.name}
                        </span>
                        <span className="text-[9px] text-[#FF4D00] font-black bg-[#FF4D00]/10 px-1.5 py-0.5 rounded-full border border-[#FF4D00]/30">
                          🔥 {activeUser.currentStreak}d
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 block">@{activeUser.username}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <button
                onClick={onClose}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close messages"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {currentChatMessages.length > 0 ? (
                currentChatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const senderUser = allUsers.find((u) => u.id === msg.senderId);

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <div className="shrink-0 mb-1">
                          <img
                            src={senderUser?.avatar || activeUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                            alt="Sender"
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                          />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] space-y-2 px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-white text-black font-medium rounded-br-none shadow-md'
                            : 'bg-white/10 text-white rounded-bl-none border border-white/5'
                        }`}
                      >
                        {/* Group sender name tag */}
                        {activeGroup && !isMe && senderUser && (
                          <div className="flex items-center gap-1 pb-0.5 border-b border-white/10">
                            <span className="font-bold text-[10px] text-[#FF4D00]">
                              {senderUser.name}
                            </span>
                            <span className="text-[9px] text-white/40">🔥{senderUser.currentStreak}d</span>
                          </div>
                        )}

                        {/* Shared Post Card inside message */}
                        {msg.sharedPost && (
                          <div
                            onClick={() => {
                              if (onViewPost && msg.sharedPost?.id) {
                                onViewPost(msg.sharedPost.id);
                              }
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isMe
                                ? 'bg-black/5 border-black/10 hover:bg-black/10'
                                : 'bg-black/40 border-white/10 hover:border-[#FF4D00]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <img
                                src={msg.sharedPost.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                                alt={msg.sharedPost.authorName || 'Author'}
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full object-cover border border-white/10"
                              />
                              <span className={`font-bold text-[11px] ${isMe ? 'text-black' : 'text-white'}`}>
                                @{msg.sharedPost.authorUsername}
                              </span>
                              <span className="text-[9px] text-[#FF4D00] font-black">
                                🔥{msg.sharedPost.authorStreak}d
                              </span>
                            </div>

                            {msg.sharedPost.imageUrl && (
                              <img
                                src={msg.sharedPost.imageUrl}
                                alt="Shared attachment"
                                referrerPolicy="no-referrer"
                                className="w-full h-28 object-cover rounded-lg mb-1.5 border border-white/10"
                              />
                            )}

                            <p className={`text-[11px] line-clamp-2 leading-relaxed ${isMe ? 'text-black/80 font-medium' : 'text-white/85'}`}>
                              {msg.sharedPost.content}
                            </p>

                            {msg.sharedPost.tags && msg.sharedPost.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {msg.sharedPost.tags.slice(0, 3).map((t) => (
                                  <span
                                    key={t}
                                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                      isMe ? 'bg-black/10 text-black/70' : 'bg-white/10 text-white/60'
                                    }`}
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-1.5 flex items-center justify-end text-[10px] font-bold text-[#FF4D00] gap-0.5">
                              <span>View Post</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </div>
                          </div>
                        )}

                        {/* Attached Photo in message */}
                        {msg.imageUrl && (
                          <div className="rounded-xl overflow-hidden border border-white/10">
                            <img
                              src={msg.imageUrl}
                              alt="Photo attachment"
                              referrerPolicy="no-referrer"
                              className="w-full max-h-56 object-cover rounded-xl"
                            />
                          </div>
                        )}

                        {/* Text Content */}
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                        {/* Timestamp */}
                        <span
                          className={`text-[9px] block text-right font-mono ${
                            isMe ? 'text-black/60' : 'text-white/40'
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-white/40 text-xs">
                  <Flame className="w-6 h-6 text-[#FF4D00]/60 mx-auto mb-1.5" />
                  <span>
                    {activeGroup
                      ? `Welcome to ${activeGroup.name}! Send photos and habit updates.`
                      : 'No messages yet. Say hello and share your daily progress!'}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Photo preset picker dropdown */}
            {showPhotoPicker && (
              <div className="p-3 bg-[#0E0E0E] border-t border-white/10 animate-in slide-in-from-bottom-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Attach Photo or Progress Shot</span>
                  </span>
                  <button
                    onClick={() => setShowPhotoPicker(false)}
                    className="p-1 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-xl border border-dashed border-white/20 hover:border-[#FF4D00] flex flex-col items-center justify-center gap-1 shrink-0 text-white/60 hover:text-white transition-colors"
                  >
                    <Camera className="w-4 h-4 text-[#FF4D00]" />
                    <span className="text-[9px] font-bold">Upload</span>
                  </button>

                  {PRESET_CHAT_PHOTOS.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectPresetPhoto(url)}
                      className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 hover:border-[#FF4D00] cursor-pointer shrink-0 transition-all hover:scale-105"
                    >
                      <img
                        src={url}
                        alt="Preset photo"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Image Preview above input */}
            {attachedImage && (
              <div className="px-3 py-2 bg-[#0E0E0E] border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={attachedImage}
                    alt="Attached"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-white/10"
                  />
                  <span className="text-xs text-white/70 font-medium">Photo attached</span>
                </div>
                <button
                  onClick={() => setAttachedImage(null)}
                  className="p-1.5 text-red-400 hover:text-red-300 rounded-lg hover:bg-white/5"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Chat Input */}
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-white/5 bg-[#0A0A0A] flex items-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  attachedImage || showPhotoPicker
                    ? 'bg-[#FF4D00]/20 border-[#FF4D00]/50 text-[#FF4D00]'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
                title="Attach photo"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  activeGroup
                    ? `Message ${activeGroup.name}...`
                    : `Message @${activeUser?.username || 'user'}...`
                }
                className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                autoFocus
              />

              <button
                type="submit"
                disabled={!inputText.trim() && !attachedImage}
                className="p-2.5 bg-[#FF4D00] hover:bg-[#FF4D00]/90 disabled:opacity-30 text-black font-bold rounded-xl transition-all shadow-md shadow-[#FF4D00]/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
