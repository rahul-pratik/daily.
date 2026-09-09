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
} from 'lucide-react';
import { User, Message, Group } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { DailyStorageService } from '../services/storage';
import { GroupDetailsScreen } from './GroupDetailsScreen';

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
    audioUrl?: string;
    audioDuration?: number;
  }) => void;
  onGroupsUpdated?: () => void;
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

// Generate fallback playable audio WAV in case microphone access is blocked
const createSyntheticAudioDataUrl = (durationSec: number = 3): string => {
  try {
    const sampleRate = 8000;
    const numSamples = Math.floor(sampleRate * durationSec);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = 420 + Math.sin(t * 3) * 40;
      const envelope = Math.min(1, Math.min(t * 4, (durationSec - t) * 4));
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.25 * envelope;
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch {
    return '';
  }
};

// Component for rendering an individual voice message with playback & animated waveform
const VoiceMessageBubble: React.FC<{
  audioUrl?: string;
  duration?: number;
  isCurrentUser: boolean;
}> = ({ audioUrl, duration = 4, isCurrentUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    vibrateLight();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
  };

  const totalDuration = duration || 4;
  const progressRatio = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  // Waveform bars with pseudo-random aesthetic heights
  const bars = [35, 60, 45, 90, 75, 40, 65, 80, 50, 70, 95, 60, 40, 85, 55, 75, 45, 30];

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex items-center gap-3 py-1.5 px-2 min-w-[210px] max-w-[280px]">
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
          isCurrentUser
            ? 'bg-white text-[#2F6FED] hover:bg-white/90 shadow-md'
            : 'bg-[#2F6FED] text-white hover:bg-blue-600 shadow-md'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 space-y-1">
        {/* Waveform Visualization */}
        <div className="flex items-center gap-0.5 h-6">
          {bars.map((barHeight, idx) => {
            const barRatio = idx / bars.length;
            const isPassed = barRatio <= progressRatio;
            return (
              <div
                key={idx}
                style={{ height: `${barHeight}%` }}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isPassed
                    ? isCurrentUser
                      ? 'bg-white'
                      : 'bg-[#2F6FED]'
                    : isCurrentUser
                    ? 'bg-white/40'
                    : 'bg-white/20'
                } ${isPlaying && isPassed ? 'scale-y-110' : ''}`}
              />
            );
          })}
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[10px] font-mono leading-none">
          <span className={isCurrentUser ? 'text-white/80' : 'text-white/60'}>
            {isPlaying ? formatSeconds(currentTime) : formatSeconds(totalDuration)}
          </span>
          <span className={`flex items-center gap-1 ${isCurrentUser ? 'text-white/70' : 'text-white/40'}`}>
            <Volume2 className="w-2.5 h-2.5" />
            <span>Voice</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export const DirectMessagesScreen: React.FC<DirectMessagesScreenProps> = ({
  currentUser,
  allUsers,
  allGroups,
  messages,
  onSendMessage,
  onGroupsUpdated,
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

  // Group Details & Management Screen State
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);

  // Voice Recording State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Sync initial targets
  useEffect(() => {
    if (initialChatUserId) {
      setActiveUserId(initialChatUserId);
      setActiveGroupId(null);
      setIsGroupDetailsOpen(false);
    } else if (initialGroupId) {
      setActiveGroupId(initialGroupId);
      setActiveUserId(null);
      setIsGroupDetailsOpen(false);
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

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Scroll to bottom when messages change inside active chat
  useEffect(() => {
    if ((activeUserId || activeGroupId) && !isGroupDetailsOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeUserId, activeGroupId, isGroupDetailsOpen]);

  const activeUser = allUsers.find((u) => u.id === activeUserId);
  const activeGroup = allGroups.find((g) => g.id === activeGroupId);

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
    };

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive' &&
      audioChunksRef.current.length > 0
    ) {
      try {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = typeof reader.result === 'string' ? reader.result : '';
            deliverVoiceMessage(dataUrl || createSyntheticAudioDataUrl(duration));
          };
          reader.readAsDataURL(blob);
          mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
        };
        mediaRecorderRef.current.stop();
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
                  placeholder="Search chats, groups, messages..."
                  className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:border-[#2F6FED] outline-none transition-colors"
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

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
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
                    setIsGroupDetailsOpen(false);
                  }}
                  className="w-full p-3.5 flex items-center gap-3.5 text-left hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors"
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
                        {item.lastMessage.audioUrl
                          ? '🎤 Voice message'
                          : item.lastMessage.text || 'Photo attachment'}
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
          onViewUser={onViewUser}
        />
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
                  setIsGroupDetailsOpen(false);
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

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {currentChatMessages.length === 0 ? (
              <div className="py-16 text-center space-y-2 text-white/40">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-white/70">
                  No messages yet. Send a message, photo, or voice note to get started!
                </p>
              </div>
            ) : (
              currentChatMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                const sender = allUsers.find((u) => u.id === msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
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

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-md ${
                        isMe
                          ? 'bg-[#2F6FED] text-white rounded-br-xs'
                          : 'bg-[#141418] border border-white/10 text-white rounded-bl-xs'
                      }`}
                    >
                      {/* Attached Photo */}
                      {msg.imageUrl && (
                        <div
                          className="mb-2 rounded-xl overflow-hidden cursor-pointer border border-white/10 relative group"
                          onClick={() => {
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

                      {/* Attached Voice Message */}
                      {msg.audioUrl ? (
                        <VoiceMessageBubble
                          audioUrl={msg.audioUrl}
                          duration={msg.audioDuration}
                          isCurrentUser={isMe}
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
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Photo Preview Bar */}
          {attachedImage && (
            <div className="px-4 py-2 bg-[#121216] border-t border-white/10 flex items-center gap-3">
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
            <div className="p-3 bg-[#111116] border-t border-blue-500/30 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-mono font-bold text-rose-400">
                  Recording {Math.floor(recordingSeconds / 60)}:
                  {recordingSeconds % 60 < 10 ? '0' : ''}
                  {recordingSeconds % 60}
                </span>
                <span className="text-[11px] text-white/40 hidden sm:inline">
                  • Speak now
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelVoiceRecording}
                  className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 transition-colors"
                  title="Cancel voice message"
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
            /* Bottom Chat Composer Bar */
            <form
              onSubmit={handleSend}
              className="p-3 bg-[#0a0a0a] border-t border-white/10 flex items-center gap-2"
            >
              {/* Photo Upload Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
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

              {/* Voice Message Trigger */}
              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-blue-400 transition-colors"
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
                className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-xl text-xs text-white placeholder-white/40 outline-none transition-colors"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputText.trim() && !attachedImage}
                className="p-2.5 bg-[#2F6FED] hover:bg-[#255bd1] disabled:opacity-30 text-white font-bold rounded-xl transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
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
