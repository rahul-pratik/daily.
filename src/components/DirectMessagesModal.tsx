import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Send, Search, Flame, MessageSquare, Sparkles } from 'lucide-react';
import { User, Message } from '../types';

interface DirectMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  messages: Message[];
  onSendMessage: (receiverId: string, text: string) => void;
  initialChatUserId?: string | null;
}

export const DirectMessagesModal: React.FC<DirectMessagesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  messages,
  onSendMessage,
  initialChatUserId,
}) => {
  const [activeUserId, setActiveUserId] = useState<string | null>(initialChatUserId || null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync initial chat user if changed
  useEffect(() => {
    if (initialChatUserId) {
      setActiveUserId(initialChatUserId);
    }
  }, [initialChatUserId]);

  // Scroll to bottom when conversation messages change
  useEffect(() => {
    if (activeUserId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeUserId]);

  if (!isOpen) return null;

  const activeUser = allUsers.find((u) => u.id === activeUserId);

  // Group messages into conversations
  const conversationsMap = new Map<string, { user: User; lastMessage: Message; unreadCount: number }>();

  // Filter messages for current user
  messages.forEach((msg) => {
    const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
    const otherUser = allUsers.find((u) => u.id === otherUserId);
    if (!otherUser) return;

    const existing = conversationsMap.get(otherUserId);
    if (!existing) {
      conversationsMap.set(otherUserId, {
        user: otherUser,
        lastMessage: msg,
        unreadCount: !msg.isRead && msg.receiverId === currentUser.id ? 1 : 0,
      });
    } else {
      // Update with latest message if newer
      existing.lastMessage = msg;
      if (!msg.isRead && msg.receiverId === currentUser.id) {
        existing.unreadCount += 1;
      }
    }
  });

  // Make sure users in following list are also available in inbox even without past messages
  currentUser.followedUserIds.forEach((followedId) => {
    if (!conversationsMap.has(followedId)) {
      const u = allUsers.find((user) => user.id === followedId);
      if (u) {
        conversationsMap.set(followedId, {
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

  const conversations = Array.from(conversationsMap.values()).filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      conv.user.name.toLowerCase().includes(q) ||
      conv.user.username.toLowerCase().includes(q)
    );
  });

  // Messages in active conversation
  const currentChatMessages = messages.filter((m) => {
    if (!activeUserId) return false;
    return (
      (m.senderId === currentUser.id && m.receiverId === activeUserId) ||
      (m.senderId === activeUserId && m.receiverId === currentUser.id)
    );
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUserId) return;
    const textToSend = inputText.trim();
    onSendMessage(activeUserId, textToSend);
    setInputText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#0A0A0A] sm:border border-white/10 h-full sm:h-[85vh] sm:rounded-[32px] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* INBOX VIEW */}
        {!activeUserId ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Inbox Header */}
            <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#FF4D00]" />
                <h2 className="font-black text-base text-white">Direct Messages</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close direct messages"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search conversations */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-1">
              {conversations.length > 0 ? (
                conversations.map(({ user, lastMessage, unreadCount }) => (
                  <div
                    key={user.id}
                    onClick={() => setActiveUserId(user.id)}
                    className="p-3.5 flex items-center gap-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors"
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
                      <p className="text-xs text-white/60 truncate leading-tight">
                        {lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                        {lastMessage.text}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D00] shrink-0 shadow-md shadow-[#FF4D00]/50" />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-16 px-4 text-white/40">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-white/30" />
                  <p className="text-xs font-bold text-white/70">No conversations yet</p>
                  <p className="text-[11px] text-white/40 mt-1">
                    Discover creators and send them a DM!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE CHAT VIEW */
          <div className="flex-1 flex flex-col h-full">
            {/* Active Chat Header */}
            <div className="px-3 py-3 border-b border-white/5 flex items-center justify-between bg-black">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveUserId(null)}
                  className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Back to inbox"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                {activeUser && (
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img
                        src={activeUser.avatar}
                        alt={activeUser.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-white/10"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0A0A0A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{activeUser.name}</span>
                        <span className="text-[9px] text-[#FF4D00] font-black bg-[#FF4D00]/10 px-1.5 py-0.5 rounded-full border border-[#FF4D00]/30">
                          🔥 {activeUser.currentStreak}d
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40 block">@{activeUser.username}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close direct messages"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#050505]">
              {currentChatMessages.length > 0 ? (
                currentChatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && activeUser && (
                        <img
                          src={activeUser.avatar}
                          alt={activeUser.name}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover mb-1 border border-white/10"
                        />
                      )}
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-white text-black font-medium rounded-br-none shadow-md'
                            : 'bg-white/10 text-white rounded-bl-none border border-white/5'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span
                          className={`text-[9px] block text-right mt-1 ${
                            isMe ? 'text-black/60 font-mono' : 'text-white/40 font-mono'
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
                  <span>No messages yet. Say hello and share your daily progress!</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-[#0A0A0A] flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
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
