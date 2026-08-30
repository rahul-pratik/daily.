import React, { useState } from 'react';
import { X, Users, Check, Sparkles, Image as ImageIcon, Plus, Lock, Pin, Shield } from 'lucide-react';
import { User, Group, AVAILABLE_INTERESTS } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { handleHorizontalWheelScroll } from '../utils/scroll';

interface CreateGroupModalProps {
  isOpen: boolean;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onCreateGroup: (params: {
    name: string;
    description: string;
    avatar: string;
    category: string;
    memberIds: string[];
    rules?: string[];
    pinnedTopic?: string;
    coverImage?: string;
  }) => void;
}

const PRESET_GROUP_AVATARS = [
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  currentUser,
  allUsers,
  onClose,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Coding');
  const [pinnedTopic, setPinnedTopic] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_GROUP_AVATARS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  if (!isOpen) return null;

  const availableFriends = allUsers.filter((u) => u.id !== currentUser.id && !u.isCurrentUser);

  const toggleMember = (id: string) => {
    vibrateLight();
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    vibrateStreakMilestone();
    onCreateGroup({
      name: name.trim(),
      description: description.trim() || 'Private group chat for accountability & updates',
      avatar: customAvatarUrl.trim() || selectedAvatar,
      category,
      memberIds: [currentUser.id, ...selectedMemberIds],
      rules: ['Private group chat - keep discussions focused and respectful'],
      pinnedTopic: pinnedTopic.trim() || `Welcome to ${name.trim()}! Let's crush our goals together.`,
      coverImage: selectedAvatar,
    });

    setName('');
    setDescription('');
    setPinnedTopic('');
    setSelectedMemberIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-white">Create Private Group Chat</h2>
              <span className="text-[10px] text-white/40">
                Multi-person private chat • Only invited members can view & message
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Private Chat Notice */}
        <div className="px-5 py-2.5 bg-[#D4AF37]/5 border-b border-[#D4AF37]/15 flex items-center gap-2 text-xs text-[#D4AF37]">
          <Shield className="w-4 h-4 shrink-0" />
          <span className="text-[11px] leading-tight">
            Groups are closed, invite-only chats inside DMs for you and your friends.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Group Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Grind Squad ☕ or Sprint Review Team 🚀"
              maxLength={40}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#D4AF37] outline-none transition-colors"
            />
          </div>

          {/* Group Topic / Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Purpose & Goal</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Daily check-ins, sprint planning & private sync"
              maxLength={120}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#D4AF37] outline-none transition-colors"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block flex items-center justify-between">
              <span>Primary Tag</span>
              <span className="text-[10px] text-white/40">Scroll horizontally</span>
            </label>
            <div 
              onWheel={handleHorizontalWheelScroll}
              className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap flex-nowrap pb-1 no-scrollbar touch-pan-x overscroll-x-contain py-1"
            >
              {AVAILABLE_INTERESTS.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    category === cat
                      ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5 text-white/60'
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pinned Goal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 flex items-center gap-1">
              <Pin className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Pinned Chat Goal (Optional)</span>
            </label>
            <input
              type="text"
              value={pinnedTopic}
              onChange={(e) => setPinnedTopic(e.target.value)}
              placeholder="e.g. Ship v1.0 together by Friday night!"
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#D4AF37] outline-none transition-colors"
            />
          </div>

          {/* Select Members */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/80 block">
                Add Members ({selectedMemberIds.length + 1} total)
              </label>
              <span className="text-[10px] text-white/40">You are added automatically</span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar border border-white/5 rounded-2xl p-2 bg-black/40">
              {availableFriends.map((friend) => {
                const isSelected = selectedMemberIds.includes(friend.id);
                return (
                  <div
                    key={friend.id}
                    onClick={() => toggleMember(friend.id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/30'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate leading-tight">
                          {friend.name}
                        </p>
                        <p className="text-[10px] text-white/40 truncate">
                          @{friend.username} • {friend.currentStreak}d streak
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-black'
                          : 'border-white/20 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Icon Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/80 block">Group Icon</label>
            <div className="flex items-center gap-2">
              {PRESET_GROUP_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setSelectedAvatar(url);
                    setCustomAvatarUrl('');
                  }}
                  className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedAvatar === url && !customAvatarUrl
                      ? 'border-[#D4AF37] scale-105 shadow-md shadow-[#D4AF37]/20'
                      : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt="Preset avatar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3.5 rounded-2xl bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#D4AF37]/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#D4AF37]/20 min-h-[44px]"
            >
              <Users className="w-4 h-4" />
              <span>Create Private Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
