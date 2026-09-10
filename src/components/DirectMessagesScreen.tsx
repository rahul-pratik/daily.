import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Send,
  Search,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Plus,
  Pin,
  Upload,
  X,
  ArrowUpDown,
  Check,
  Trophy,
  ExternalLink,
  ChevronDown,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Volume2,
  Smile,
} from 'lucide-react';
import { User, Message, Group } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { DailyStorageService } from '../services/storage';
import { GroupDetailsScreen } from './GroupDetailsScreen';
import { VoiceMessageWaveformVisualizer } from './VoiceMessageWaveformVisualizer';
import { createSyntheticAudioDataUrl } from '../utils/audio';

export type MessageSortOption = 'all' | 'groups' | 'direct';

export const EMOJI_REACTIONS = ['❤️', '👍', '🔥', '😂', '👏', '😮', '🎉', '💪'];

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
    audioUrl?: string;
    audioDuration?: number;
  }) => void;
  onToggleReaction?: (messageId: string, emoji: string) => void;
  onTogglePinMessage?: (messageId: string) => void;
  onGroupsUpdated?: () => void;
  initialChatUserId?: string | null;
  initialGroupId?: string | null;
  onActiveChatChange?: (userId: string | null, groupId: string | null) => void;
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
  matchingSnippet?: string;
}

export const DirectMessagesScreen: React.FC<DirectMessagesScreenProps> = ({
  currentUser,
  allUsers,
  allGroups,
  messages,
  onSendMessage,
  onToggleReaction,
  onTogglePinMessage,
  onGroupsUpdated,
  initialChatUserId,
  initialGroupId,
  onActiveChatChange,
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
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // In-Chat Search & Filter State
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Long-press and Emoji Reaction State
  const [reactingMessageId, setReactingMessageId] = useState<string | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Group Details & Management Screen State
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);

  // Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Scroll smoothly or instantly to the bottom of the active conversation
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  const handleScrollMessages = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    setShowScrollBottom(distanceToBottom > 90);
  };

  // Sync initial targets
  useEffect(() => {
    if (initialChatUserId) {
      setActiveUserId(initialChatUserId);
      setActiveGroupId(null);
      setIsGroupDetailsOpen(false);
      onActiveChatChange?.(initialChatUserId, null);
    } else if (initialGroupId) {
      setActiveGroupId(initialGroupId);
      setActiveUserId(null);
      setIsGroupDetailsOpen(false);
      onActiveChatChange?.(null, initialGroupId);
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

  // Clean up recording timer and long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Immediate and responsive scrolling to bottom when entering active chat or receiving messages
  useEffect(() => {
    if ((activeUserId || activeGroupId) && !isGroupDetailsOpen) {
      const timer = setTimeout(() => {
        scrollToBottom(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeUserId, activeGroupId, isGroupDetailsOpen, scrollToBottom]);

  useEffect(() => {
    if ((activeUserId || activeGroupId) && !isGroupDetailsOpen) {
      scrollToBottom(true);
    }
  }, [messages.length, activeUserId, activeGroupId, isGroupDetailsOpen, scrollToBottom]);

  const activeUser = allUsers.find((u) => u.id === activeUserId);
  const activeGroup = allGroups.find((g) => g.id === activeGroupId);

  // Group admin check: for groups, only admins can pin messages/photos; for 1-on-1 DMs, anyone can pin
  const isGroupAdmin = activeGroup
    ? Boolean(
        (activeGroup.adminIds && activeGroup.adminIds.includes(currentUser.id)) ||
        activeGroup.createdBy === currentUser.id
      )
    : false;
  const canPinInCurrentChat = activeGroup ? isGroupAdmin : true;

  // Pinned chats management (persisted in storage)
  const [pinnedChatIds, setPinnedChatIds] = useState<string[]>(() =>
    DailyStorageService.getPinnedChatIds()
  );

  const handleTogglePinChat = (chatId: string) => {
    vibrateLight();
    const updated = DailyStorageService.togglePinChat(chatId);
    setPinnedChatIds(updated);
  };

  // Pinned banner navigation & scroll-to-message
  const [activePinnedIndex, setActivePinnedIndex] = useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [pinPermissionToast, setPinPermissionToast] = useState<string | null>(null);

  const handleTogglePinMessage = (msg: Message) => {
    vibrateLight();
    if (activeGroup && !isGroupAdmin) {
      setPinPermissionToast('Only group admins can pin messages or photos in this group.');
      setTimeout(() => setPinPermissionToast(null), 3500);
      return;
    }
    if (onTogglePinMessage) {
      onTogglePinMessage(msg.id);
    } else {
      DailyStorageService.togglePinMessage(msg.id, currentUser.id);
    }
    setReactingMessageId(null);
  };

  const scrollToMessage = (messageId: string) => {
    vibrateLight();
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId((curr) => (curr === messageId ? null : curr));
      }, 2500);
    }
  };

  // Helper to extract numeric sorting timestamp from a message
  const getMessageTimestampScore = (msg: Message | undefined, defaultOrder: number = 0): number => {
    if (!msg) return defaultOrder;
    const match = msg.id.match(/^msg_(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
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
    let filtered = items;
    if (sortOption === 'groups') {
      filtered = items.filter((item) => item.type === 'group');
    } else if (sortOption === 'direct') {
      filtered = items.filter((item) => item.type === 'direct');
    }

    // Filter by search query if active (filter by keyword or contact name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((item) => {
        const contactMatch =
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q);

        const lastMsgMatch = item.lastMessage.text?.toLowerCase().includes(q);

        // Check entire conversation history for keyword match
        let matchingSnippet: string | undefined = undefined;
        if (item.type === 'direct' && item.user) {
          const directMsgs = directMap.get(item.user.id)?.msgs || [];
          const found = directMsgs.find((m) => m.text?.toLowerCase().includes(q));
          if (found) {
            matchingSnippet = found.text;
          }
        } else if (item.group) {
          const grpMsgs = messages.filter((m) => m.groupId === item.group?.id);
          const found = grpMsgs.find((m) => m.text?.toLowerCase().includes(q));
          if (found) {
            matchingSnippet = found.text;
          }
        }

        if (matchingSnippet) {
          item.matchingSnippet = matchingSnippet;
        }

        return contactMatch || lastMsgMatch || !!matchingSnippet;
      });
    }

    // Sort pinned chats first, then descending by the time the most recent message was sent
    return filtered.sort((a, b) => {
      const aPinned = pinnedChatIds.includes(a.id);
      const bPinned = pinnedChatIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return b.sortTimestamp - a.sortTimestamp;
    });
  }, [messages, allUsers, allGroups, currentUser, sortOption, searchQuery, pinnedChatIds]);

  // Active chat message stream
  const currentChatMessages = useMemo(() => {
    return messages.filter((m) => {
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
  }, [messages, activeGroupId, activeUserId, currentUser.id]);

  // Pinned messages & photos in the active chat
  const pinnedMessages = useMemo(() => {
    return currentChatMessages.filter((m) => m.isPinned);
  }, [currentChatMessages]);

  const currentPinnedMsg = pinnedMessages[activePinnedIndex] || pinnedMessages[0];

  useEffect(() => {
    if (activePinnedIndex >= pinnedMessages.length && pinnedMessages.length > 0) {
      setActivePinnedIndex(0);
    }
  }, [pinnedMessages.length, activePinnedIndex]);

  // Messages filtered by in-chat keyword/sender search query
  const displayedChatMessages = useMemo(() => {
    if (!chatSearchQuery.trim()) return currentChatMessages;
    const q = chatSearchQuery.toLowerCase().trim();
    return currentChatMessages.filter((m) => {
      const textMatches = m.text?.toLowerCase().includes(q);
      const sender = allUsers.find((u) => u.id === m.senderId);
      const senderMatches =
        sender?.name.toLowerCase().includes(q) ||
        sender?.username.toLowerCase().includes(q);
      const voiceMatches = (q === 'voice' || q === 'audio') && !!m.audioUrl;
      const photoMatches = (q === 'photo' || q === 'image') && !!m.imageUrl;
      return textMatches || senderMatches || voiceMatches || photoMatches;
    });
  }, [currentChatMessages, chatSearchQuery, allUsers]);

  // Toggle emoji reaction on message
  const handleToggleReaction = (msgId: string, emoji: string) => {
    vibrateLight();
    setReactingMessageId(null);
    if (onToggleReaction) {
      onToggleReaction(msgId, emoji);
    } else {
      DailyStorageService.toggleMessageReaction(msgId, emoji, currentUser.id);
    }
  };

  // Long press event handlers for mobile touch
  const handleTouchStart = (msgId: string, e: React.TouchEvent) => {
    isLongPressTriggeredRef.current = false;
    touchStartPosRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      vibrateStreakMilestone();
      setReactingMessageId(msgId);
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!longPressTimerRef.current) return;
    const curX = e.touches[0].clientX;
    const curY = e.touches[0].clientY;
    if (
      Math.abs(curX - touchStartPosRef.current.x) > 10 ||
      Math.abs(curY - touchStartPosRef.current.y) > 10
    ) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Mouse hold long press for desktop
  const handleMouseDown = (msgId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      vibrateLight();
      setReactingMessageId(msgId);
    }, 450);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (msgId: string, e: React.MouseEvent) => {
    e.preventDefault();
    vibrateLight();
    setReactingMessageId(msgId);
  };

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

  // Voice Message Recording Methods
  const startVoiceRecording = async () => {
    vibrateLight();
    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(100);
      }
    } catch {
      // Microphone not available / permission blocked: graceful simulated audio recording
    }
  };

  const cancelVoiceRecording = () => {
    vibrateLight();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const finishAndSendVoiceRecording = () => {
    vibrateStreakMilestone();
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const duration = Math.max(1, recordingSeconds);

    const deliverVoiceMessage = (audioUrl: string) => {
      if (activeGroupId) {
        onSendMessage({
          groupId: activeGroupId,
          text: '🎤 Voice message',
          audioUrl,
          audioDuration: duration,
        });
      } else if (activeUserId) {
        onSendMessage({
          receiverId: activeUserId,
          text: '🎤 Voice message',
          audioUrl,
          audioDuration: duration,
        });
      }
      setTimeout(() => scrollToBottom(true), 150);
    };

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, {
              type: recorder.mimeType || 'audio/webm',
            });
            const reader = new FileReader();
            reader.onloadend = () => {
              const dataUrl =
                typeof reader.result === 'string' && reader.result.startsWith('data:audio')
                  ? reader.result
                  : createSyntheticAudioDataUrl(duration);
              deliverVoiceMessage(dataUrl);
            };
            reader.readAsDataURL(blob);
          } else {
            deliverVoiceMessage(createSyntheticAudioDataUrl(duration));
          }
          try {
            recorder.stream.getTracks().forEach((t) => t.stop());
          } catch {}
        };
        recorder.stop();
      } catch {
        deliverVoiceMessage(createSyntheticAudioDataUrl(duration));
      }
    } else {
      // Fallback synthetic voice recording
      deliverVoiceMessage(createSyntheticAudioDataUrl(duration));
    }

    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // Group Management Handlers (Admin controls & Member actions)
  const handleAddMembersToGroup = (newMemberIds: string[]) => {
    if (!activeGroupId) return;
    DailyStorageService.addMembersToGroup(activeGroupId, newMemberIds);
    if (onGroupsUpdated) onGroupsUpdated();
  };

  const handleRemoveMemberFromGroup = (memberId: string) => {
    if (!activeGroupId) return;
    DailyStorageService.removeMemberFromGroup(activeGroupId, memberId);
    if (onGroupsUpdated) onGroupsUpdated();
  };

  const handleToggleAdminInGroup = (memberId: string) => {
    if (!activeGroupId) return;
    DailyStorageService.toggleGroupAdmin(activeGroupId, memberId);
    if (onGroupsUpdated) onGroupsUpdated();
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
    <div className="flex-1 min-h-0 flex flex-col h-[100dvh] max-h-[100dvh] w-full bg-[#050505] text-white overflow-hidden relative">
      {!isInsideChat ? (
        /* CONVERSATION INBOX VIEW */
        <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
          {/* Main Top Header */}
          <div className="shrink-0 z-20 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-2">
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
                  Messages
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
                      Sort By Message Sent
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

          {/* Permanent Search Bar - Filter messages by keyword or contact name */}
          <div className="px-4 py-2.5 bg-[#0a0a0d] border-b border-white/10">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter messages by keyword or contact name..."
                className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:border-[#2F6FED] outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-0.5 rounded-full"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/5">
            {unifiedConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-64 text-white/40 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white/80">No conversations found</p>
                  <p className="text-xs text-white/40 max-w-xs">
                    {searchQuery
                      ? `No conversations match "${searchQuery}".`
                      : 'Connect with members or create a private group to start messaging.'}
                  </p>
                </div>
                {onOpenCreateGroup && (
                  <button
                    type="button"
                    onClick={onOpenCreateGroup}
                    className="px-4 py-2 bg-[#2F6FED] text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-md mt-2"
                  >
                    Create a Group Chat
                  </button>
                )}
              </div>
            ) : (
              unifiedConversations.map((item) => {
                const isPinned = pinnedChatIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`relative flex items-center group transition-colors ${
                      isPinned ? 'bg-amber-500/[0.04]' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        if (item.type === 'group' && item.group) {
                          setActiveGroupId(item.group.id);
                          setActiveUserId(null);
                          onActiveChatChange?.(null, item.group.id);
                        } else if (item.user) {
                          setActiveUserId(item.user.id);
                          setActiveGroupId(null);
                          onActiveChatChange?.(item.user.id, null);
                        }
                        setIsGroupDetailsOpen(false);
                      }}
                      className="flex-1 p-3.5 flex items-center gap-3.5 text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors min-w-0"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={item.avatar}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className={`w-12 h-12 object-cover border border-white/10 ${
                            item.type === 'group' ? 'rounded-2xl' : 'rounded-full'
                          }`}
                        />
                        {item.type === 'group' && (
                          <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-lg text-black">
                            <Users className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                              {item.title}
                            </h4>
                            {isPinned && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5 shrink-0 font-bold">
                                <Pin className="w-2 h-2 fill-amber-300" />
                                Pinned
                              </span>
                            )}
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ${
                                item.type === 'group'
                                  ? 'bg-emerald-500/20 text-emerald-300'
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
                            {item.matchingSnippet ? (
                              <span className="text-[#2F6FED]">
                                Keyword match: &ldquo;{item.matchingSnippet}&rdquo;
                              </span>
                            ) : item.lastMessage.audioUrl ? (
                              '🎤 Voice message'
                            ) : (
                              item.lastMessage.text || 'Photo attachment'
                            )}
                          </p>
                          {item.unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#2F6FED] text-white font-black text-[10px] shrink-0 shadow-md">
                              {item.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Quick Pin / Unpin Chat Action Button */}
                    <div className="pr-3 pl-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePinChat(item.id);
                        }}
                        className={`p-1.5 rounded-xl border transition-all ${
                          isPinned
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'opacity-40 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white/10 border-white/10 text-white/50 hover:text-white'
                        }`}
                        title={isPinned ? 'Unpin chat from top' : 'Pin chat to top'}
                        aria-label={isPinned ? 'Unpin chat from top' : 'Pin chat to top'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-300' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : isGroupDetailsOpen && activeGroup ? (
        /* DEDICATED GROUP DETAILS & MEMBER MANAGEMENT SCREEN */
        <GroupDetailsScreen
          group={activeGroup}
          currentUser={currentUser}
          allUsers={allUsers}
          messages={messages}
          onBack={() => setIsGroupDetailsOpen(false)}
          onAddMembers={handleAddMembersToGroup}
          onRemoveMember={handleRemoveMemberFromGroup}
          onToggleAdmin={handleToggleAdminInGroup}
          onExpandPhoto={(photoUrl: string) => setExpandedPhoto(photoUrl)}
          onTogglePinMessage={(msgId) => {
            const targetMsg = messages.find((m) => m.id === msgId);
            if (targetMsg) handleTogglePinMessage(targetMsg);
          }}
          onViewUser={onViewUser}
        />
      ) : (
        /* DEDICATED CHAT VIEW: CHAT IS THE MOST IMPORTANT THING */
        <div className="flex-1 min-h-0 flex flex-col h-full bg-[#070709] overflow-hidden relative">
          {/* Active Chat Header */}
          <div className="shrink-0 z-20 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setActiveUserId(null);
                  setActiveGroupId(null);
                  setIsGroupDetailsOpen(false);
                  onActiveChatChange?.(null, null);
                }}
                className="p-2 -ml-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Messages</span>
              </button>

              {activeGroup ? (
                /* Clickable Group Header: Opens Group Management & Photos Screen */
                <div
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer group/hdr hover:opacity-90 transition-opacity"
                  onClick={() => {
                    vibrateLight();
                    setIsGroupDetailsOpen(true);
                  }}
                  title="Click to view group details, members, and shared photos"
                >
                  <img
                    src={activeGroup.avatar}
                    alt={activeGroup.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-2xl object-cover shrink-0 border border-white/10 group-hover/hdr:border-blue-500/50 transition-colors"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-white truncate flex items-center gap-1.5 group-hover/hdr:text-blue-400 transition-colors">
                      <span>{activeGroup.name}</span>
                      <ChevronDown className="w-3 h-3 text-white/40 group-hover/hdr:text-blue-400 transition-colors" />
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-medium block truncate">
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
                    referrerPolicy="no-referrer"
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
              {/* In-Chat Filter / Search Toggle */}
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setIsChatSearchOpen(!isChatSearchOpen);
                  if (isChatSearchOpen) setChatSearchQuery('');
                }}
                className={`p-2 rounded-xl border transition-all ${
                  isChatSearchOpen
                    ? 'bg-[#2F6FED] border-[#2F6FED] text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
                }`}
                title={isChatSearchOpen ? 'Close in-chat search' : 'Filter messages by keyword or sender'}
                aria-label="Filter messages by keyword or sender"
              >
                <Search className="w-4 h-4" />
              </button>

              {activeGroup && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setIsGroupDetailsOpen(true);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1 text-xs"
                  title="Group details & photos"
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline text-[11px] font-bold">Manage</span>
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

          {/* In-Chat Search Bar */}
          {isChatSearchOpen && (
            <div className="shrink-0 z-20 px-4 py-2 bg-[#0d0d11] border-b border-white/10 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Filter messages in this chat by keyword or sender..."
                  className="w-full pl-9 pr-8 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:border-[#2F6FED] outline-none transition-colors"
                  autoFocus
                />
                {chatSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setChatSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {chatSearchQuery && (
                <span className="text-[10px] font-mono text-white/50 shrink-0">
                  {displayedChatMessages.length} {displayedChatMessages.length === 1 ? 'match' : 'matches'}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsChatSearchOpen(false);
                  setChatSearchQuery('');
                }}
                className="text-xs text-white/60 hover:text-white font-semibold px-1 py-1 shrink-0"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Sticky Pinned Messages & Photos Banner */}
          {pinnedMessages.length > 0 && currentPinnedMsg && (
            <div className="shrink-0 z-10 px-4 py-2 bg-[#121218] border-b border-amber-500/20 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-1 duration-150">
              <div
                onClick={() => scrollToMessage(currentPinnedMsg.id)}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group select-none"
                title="Click to jump to pinned item"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Pin className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                {currentPinnedMsg.imageUrl ? (
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-amber-500/30">
                    <img
                      src={currentPinnedMsg.imageUrl}
                      alt="Pinned photo"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                      Pinned {currentPinnedMsg.imageUrl ? 'Photo' : 'Message'}
                    </span>
                    {pinnedMessages.length > 1 && (
                      <span className="text-[10px] font-mono text-white/40">
                        ({activePinnedIndex + 1}/{pinnedMessages.length})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/70 truncate">
                    {currentPinnedMsg.imageUrl
                      ? currentPinnedMsg.text || '📷 Photo attachment'
                      : currentPinnedMsg.text || (currentPinnedMsg.audioUrl ? '🎤 Voice message' : 'Message')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {pinnedMessages.length > 1 && (
                  <div className="flex items-center gap-0.5 mr-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        vibrateLight();
                        setActivePinnedIndex((prev) =>
                          prev > 0 ? prev - 1 : pinnedMessages.length - 1
                        );
                      }}
                      className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Previous pinned item"
                    >
                      <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        vibrateLight();
                        setActivePinnedIndex((prev) =>
                          prev < pinnedMessages.length - 1 ? prev + 1 : 0
                        );
                      }}
                      className="p-1 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Next pinned item"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {canPinInCurrentChat && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePinMessage(currentPinnedMsg);
                    }}
                    className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-amber-300 transition-colors"
                    title={currentPinnedMsg.imageUrl ? 'Unpin photo' : 'Unpin message'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Admin restriction toast if non-admin attempts to pin */}
          {pinPermissionToast && (
            <div className="shrink-0 z-20 px-4 py-2 bg-amber-500/15 border-b border-amber-500/30 text-amber-200 text-xs flex items-center justify-between animate-in fade-in duration-150">
              <span className="font-semibold flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 fill-amber-300" />
                {pinPermissionToast}
              </span>
              <button
                type="button"
                onClick={() => setPinPermissionToast(null)}
                className="text-amber-300 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Messages Stream with Constrained Scrolling */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScrollMessages}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3.5 scroll-smooth"
          >
            {displayedChatMessages.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-white/40">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
                  {chatSearchQuery ? <Search className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                </div>
                <p className="text-xs font-semibold text-white/70">
                  {chatSearchQuery
                    ? `No messages matching "${chatSearchQuery}"`
                    : 'No messages yet. Send a message, photo, or voice note to get started!'}
                </p>
                {chatSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setChatSearchQuery('')}
                    className="text-xs text-[#2F6FED] hover:underline font-bold"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            ) : (
              displayedChatMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const sender = allUsers.find((u) => u.id === msg.senderId);
                const isReacting = reactingMessageId === msg.id;

                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`flex flex-col relative group/msg transition-all duration-300 rounded-2xl ${
                      isMe ? 'items-end' : 'items-start'
                    } ${
                      highlightedMessageId === msg.id
                        ? 'ring-2 ring-amber-400 bg-amber-500/10 p-1.5'
                        : ''
                    }`}
                  >
                    {/* In group chat, show sender info if not current user */}
                    {!isMe && activeGroup && sender && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <img
                          src={sender.avatar}
                          alt={sender.name}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover border border-white/20"
                        />
                        <span className="text-[10px] text-white/50 font-bold">
                          {sender.name}
                        </span>
                      </div>
                    )}

                    {/* Floating Emoji Reaction & Pin Popover */}
                    {isReacting && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReactingMessageId(null);
                          }}
                        />
                        <div
                          className={`absolute -top-11 ${
                            isMe ? 'right-0' : 'left-0'
                          } z-50 flex items-center gap-1 p-1 bg-[#16161c] border border-white/20 rounded-full shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-90 duration-150`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {EMOJI_REACTIONS.map((emoji) => {
                            const reaction = msg.reactions?.find((r) => r.emoji === emoji);
                            const hasReacted = reaction?.userIds.includes(currentUser.id);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleReaction(msg.id, emoji);
                                }}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-base hover:scale-125 transition-transform active:scale-95 ${
                                  hasReacted ? 'bg-[#2F6FED]/30 scale-110' : 'hover:bg-white/10'
                                }`}
                                title={`React ${emoji}`}
                              >
                                {emoji}
                              </button>
                            );
                          })}

                          {/* Pin / Unpin Button inside popover */}
                          <div className="h-4 w-px bg-white/20 mx-0.5" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePinMessage(msg);
                            }}
                            className={`px-2 py-1 rounded-full flex items-center gap-1 text-[11px] font-bold transition-all ${
                              msg.isPinned
                                ? 'bg-amber-500/25 text-amber-300'
                                : 'hover:bg-white/10 text-white/70 hover:text-white'
                            }`}
                            title={
                              !canPinInCurrentChat
                                ? 'Only group admins can pin messages or photos'
                                : msg.isPinned
                                ? (msg.imageUrl ? 'Unpin photo' : 'Unpin message')
                                : (msg.imageUrl ? 'Pin photo' : 'Pin message')
                            }
                          >
                            <Pin className={`w-3.5 h-3.5 ${msg.isPinned ? 'fill-amber-300 text-amber-300' : ''}`} />
                            <span className="hidden sm:inline">
                              {msg.isPinned ? 'Unpin' : msg.imageUrl ? 'Pin Photo' : 'Pin'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setReactingMessageId(null)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 ml-0.5"
                            title="Close"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}

                    {/* Message Row with Bubble and Action Button */}
                    <div
                      className={`flex items-center gap-1.5 max-w-[88%] sm:max-w-[78%] ${
                        isMe ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        onTouchStart={(e) => handleTouchStart(msg.id, e)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        onMouseDown={(e) => handleMouseDown(msg.id, e)}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onContextMenu={(e) => handleContextMenu(msg.id, e)}
                        className={`rounded-2xl p-3 shadow-md select-none transition-transform active:scale-[0.99] cursor-pointer ${
                          isMe
                            ? 'bg-[#2F6FED] text-white rounded-br-xs'
                            : 'bg-[#141418] border border-white/10 text-white rounded-bl-xs'
                        } ${msg.isPinned ? 'border border-amber-500/40 shadow-amber-500/10' : ''}`}
                        title="Long-press to add emoji reaction or pin message/photo"
                      >
                        {/* Pinned Indicator on Message Bubble */}
                        {msg.isPinned && (
                          <div className="flex items-center gap-1 pb-1.5 mb-1.5 border-b border-amber-500/30 text-amber-300 text-[10px] font-bold">
                            <Pin className="w-2.5 h-2.5 fill-amber-300 shrink-0" />
                            <span>Pinned {msg.imageUrl ? 'Photo' : 'Message'}</span>
                          </div>
                        )}

                        {/* Attached Photo */}
                        {msg.imageUrl && (
                          <div
                            className="mb-2 rounded-xl overflow-hidden cursor-pointer border border-white/10 relative group"
                            onClick={(e) => {
                              e.stopPropagation();
                              vibrateLight();
                              setExpandedPhoto(msg.imageUrl!);
                            }}
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Chat attachment"
                              referrerPolicy="no-referrer"
                              className="w-full max-h-64 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}

                        {/* Attached Voice Message with Interactive Waveform Visualizer */}
                        {msg.audioUrl ? (
                          <VoiceMessageWaveformVisualizer
                            audioUrl={msg.audioUrl}
                            duration={msg.audioDuration}
                            isCurrentUser={isMe}
                            messageId={msg.id}
                          />
                        ) : (
                          msg.text && (
                            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {msg.text}
                            </p>
                          )
                        )}

                        <div
                          className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-mono ${
                            isMe ? 'text-white/70' : 'text-white/40'
                          }`}
                        >
                          <span>{msg.timestamp}</span>
                          {isMe && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Message Action Triggers: Reaction & Pin */}
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrateLight();
                            setReactingMessageId(isReacting ? null : msg.id);
                          }}
                          className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white shrink-0 active:scale-95"
                          title="Add emoji reaction"
                          aria-label="Add reaction"
                        >
                          <Smile className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePinMessage(msg);
                          }}
                          className={`p-1.5 rounded-full transition-opacity shrink-0 active:scale-95 ${
                            msg.isPinned
                              ? 'text-amber-300 bg-amber-500/20 opacity-100 hover:bg-amber-500/30'
                              : 'opacity-0 group-hover/msg:opacity-100 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white'
                          }`}
                          title={
                            !canPinInCurrentChat
                              ? 'Only group admins can pin messages or photos'
                              : msg.isPinned
                              ? (msg.imageUrl ? 'Unpin photo' : 'Unpin message')
                              : (msg.imageUrl ? 'Pin photo' : 'Pin message')
                          }
                          aria-label={msg.isPinned ? 'Unpin item' : 'Pin item'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${msg.isPinned ? 'fill-amber-300' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Persisted Emoji Reactions Display */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div
                        className={`flex flex-wrap items-center gap-1 mt-1 px-1 z-10 ${
                          isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.reactions.map((reaction) => {
                          const hasReacted = reaction.userIds.includes(currentUser.id);
                          const names = reaction.userIds.map((uid) => {
                            if (uid === currentUser.id) return 'You';
                            const u = allUsers.find((user) => user.id === uid);
                            return u ? u.name : 'Someone';
                          });
                          const title = `${names.join(', ')} reacted with ${reaction.emoji}`;

                          return (
                            <button
                              key={reaction.emoji}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReaction(msg.id, reaction.emoji);
                              }}
                              title={title}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-all active:scale-95 border ${
                                hasReacted
                                  ? 'bg-[#2F6FED]/25 border-[#2F6FED]/60 text-blue-200 shadow-xs ring-1 ring-[#2F6FED]/30'
                                  : 'bg-white/10 hover:bg-white/15 border-white/15 text-white/80'
                              }`}
                            >
                              <span className="leading-none">{reaction.emoji}</span>
                              <span className="text-[10px] font-mono font-bold leading-none">
                                {reaction.userIds.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Jump to bottom button when scrolled up */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-20 right-4 z-30 p-2.5 rounded-full bg-[#2F6FED] hover:bg-blue-600 text-white shadow-xl flex items-center justify-center transition-all animate-in fade-in zoom-in-90 hover:scale-105 active:scale-95"
              title="Jump to latest messages"
              aria-label="Jump to latest messages"
            >
              <ChevronDown className="w-4 h-4 stroke-[3]" />
            </button>
          )}

          {/* Attached Photo Preview Bar */}
          {attachedImage && (
            <div className="shrink-0 z-20 px-4 py-2 bg-[#121216] border-t border-white/10 flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/20">
                <img
                  src={attachedImage}
                  alt="Attached"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute top-0.5 right-0.5 p-0.5 bg-black/70 rounded-full text-white hover:bg-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[11px] text-white/60">Photo attached to message</span>
            </div>
          )}

          {/* Live Voice Recording Status Bar */}
          {isRecordingVoice ? (
            <div className="shrink-0 z-20 p-3 bg-[#111116] border-t border-blue-500/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <span className="text-xs font-mono font-bold text-rose-400 shrink-0">
                  {Math.floor(recordingSeconds / 60)}:
                  {recordingSeconds % 60 < 10 ? '0' : ''}
                  {recordingSeconds % 60}
                </span>

                {/* Animated real-time voice recording visualizer */}
                <div className="flex items-center gap-[2.5px] h-6 px-2 py-1 bg-black/50 rounded-lg border border-white/10 overflow-hidden">
                  {[40, 70, 55, 95, 80, 45, 90, 65, 100, 70, 50, 85, 60, 90, 45, 75].map((baseHeight, i) => {
                    const wave = Math.sin(recordingSeconds * 8 + i * 0.75);
                    const dynamicH = Math.max(18, Math.min(100, baseHeight * (0.5 + 0.5 * wave)));
                    return (
                      <div
                        key={i}
                        style={{ height: `${dynamicH}%` }}
                        className="w-1 rounded-full bg-rose-500/90 transition-[height] duration-75 shrink-0"
                      />
                    );
                  })}
                </div>

                <span className="text-[11px] text-white/40 hidden md:inline truncate">
                  Recording voice note...
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 transition-colors"
                  title="Cancel voice message"
                  aria-label="Cancel voice message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={finishAndSendVoiceRecording}
                  className="px-3.5 py-2 rounded-xl bg-[#2F6FED] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Voice</span>
                </button>
              </div>
            </div>
          ) : (
            /* Bottom Chat Composer Bar - Pinned cleanly to bottom */
            <div className="shrink-0 z-20 bg-[#0a0a0a] border-t border-white/10 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              <form
                onSubmit={handleSend}
                className="p-3 flex items-center gap-2"
              >
                {/* Photo Upload Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors shrink-0"
                  title="Attach photo"
                  aria-label="Attach photo"
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

                {/* Voice Message Trigger */}
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-500/20 border border-white/10 text-white/70 hover:text-[#2F6FED] transition-colors shrink-0"
                  title="Record voice message"
                  aria-label="Record voice message"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    activeGroup
                      ? `Message in ${activeGroup.name}...`
                      : `Message @${activeUser?.username || 'user'}...`
                  }
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-xl text-xs text-white placeholder-white/40 outline-none transition-colors"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() && !attachedImage}
                  className="p-2.5 bg-[#2F6FED] hover:bg-[#255bd1] disabled:opacity-30 text-white font-bold rounded-xl transition-all shadow-md shrink-0 active:scale-95"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
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
              referrerPolicy="no-referrer"
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
