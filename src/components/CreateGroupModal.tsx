import React, { useState, useRef } from 'react';
import { X, Users, Check, Image as ImageIcon, Lock, Pin, Shield, Search, Upload, Globe, CheckCircle2 } from 'lucide-react';
import { User, AVAILABLE_INTERESTS } from '../types';
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

const PRESET_GROUP_GALLERY = [
  {
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
    title: 'Team Collab',
  },
  {
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
    title: 'Code & Terminal',
  },
  {
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=80',
    title: 'Athletics & Run',
  },
  {
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    title: 'Reading & Study',
  },
  {
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
    title: 'Startup & Tech',
  },
  {
    url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&auto=format&fit=crop&q=80',
    title: 'Zen & Focus',
  },
  {
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
    title: 'Strength & Iron',
  },
  {
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&auto=format&fit=crop&q=80',
    title: 'Creator Studio',
  },
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
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_GROUP_GALLERY[0].url);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Filter global members across the world
  const availableMembers = allUsers.filter((u) => u.id !== currentUser.id && !u.isCurrentUser);

  const filteredMembers = availableMembers.filter((user) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    const matchesName = user.name.toLowerCase().includes(q);
    const matchesUsername = user.username.toLowerCase().includes(q);
    const matchesBio = user.bio ? user.bio.toLowerCase().includes(q) : false;
    const matchesHabits = user.habits ? user.habits.some((h) => h.toLowerCase().includes(q)) : false;
    const matchesInterests = user.interests ? user.interests.some((i) => i.toLowerCase().includes(q)) : false;
    return matchesName || matchesUsername || matchesBio || matchesHabits || matchesInterests;
  });

  const toggleMember = (id: string) => {
    vibrateLight();
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSelectImageFromGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSelectedAvatar(reader.result);
          vibrateLight();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    vibrateStreakMilestone();
    onCreateGroup({
      name: name.trim(),
      description: description.trim() || 'Private group chat for accountability & updates',
      avatar: selectedAvatar,
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
    setMemberSearchQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[92vh] flex flex-col">
        {/* Hidden gallery file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleSelectImageFromGallery}
        />

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-white">Create Private Group Chat</h2>
              <span className="text-[10px] text-white/40">
                Direct invite-only squad • All invited members will receive an invite
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

        {/* Notice */}
        <div className="px-5 py-2.5 bg-blue-500/5 border-b border-blue-500/15 flex items-center justify-between text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0 text-blue-400" />
            <span className="text-[11px] leading-tight">
              Each invited member will automatically receive a group invitation.
            </span>
          </div>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
            Private & Secure
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group Icon Preview & Selection */}
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col gap-3">
            <label className="text-xs font-bold text-white/80 block">Group Icon</label>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={selectedAvatar}
                  alt="Selected Group Icon"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/50 shadow-md shadow-blue-500/10"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold"
                >
                  <Upload className="w-4 h-4 mb-0.5" />
                  <span>Change</span>
                </button>
              </div>

              <div className="flex-1 space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 rounded-xl text-blue-300 hover:text-blue-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span>Select group icon from gallery</span>
                </button>

                <div className="flex items-center justify-between text-[11px] text-white/50">
                  <span>Or choose from curated icons:</span>
                  <button
                    type="button"
                    onClick={() => setShowGalleryPicker(!showGalleryPicker)}
                    className="text-blue-400 hover:text-blue-300 text-[10px] font-bold"
                  >
                    {showGalleryPicker ? 'Hide presets' : 'View presets'}
                  </button>
                </div>
              </div>
            </div>

            {/* Presets Grid */}
            {showGalleryPicker && (
              <div className="pt-2 border-t border-white/5 grid grid-cols-4 gap-2">
                {PRESET_GROUP_GALLERY.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      setSelectedAvatar(item.url);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                      selectedAvatar === item.url
                        ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/30'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {selectedAvatar === item.url && (
                      <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Group Purpose */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Purpose & Goal</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Daily check-ins, sprint planning & private sync"
              maxLength={120}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
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
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
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
              <Pin className="w-3.5 h-3.5 text-blue-400" />
              <span>Pinned Group Goal (Optional)</span>
            </label>
            <input
              type="text"
              value={pinnedTopic}
              onChange={(e) => setPinnedTopic(e.target.value)}
              placeholder="e.g. Ship v1.0 together by Friday night!"
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Add Members with Search Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/80 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Add Members ({selectedMemberIds.length + 1} total)</span>
              </label>
              <span className="text-[10px] text-white/40">You are added as admin</span>
            </div>

            {/* Worldwide Member Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Search members all across the world..."
                className="w-full pl-9 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:border-blue-500 outline-none transition-colors"
              />
              {memberSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMemberSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Member List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar border border-white/5 rounded-2xl p-2 bg-black/40">
              {filteredMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-white/40">
                  No members found matching "{memberSearchQuery}".
                </div>
              ) : (
                filteredMembers.map((friend) => {
                  const isSelected = selectedMemberIds.includes(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleMember(friend.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-500/10 border border-blue-500/30'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white truncate leading-tight">
                              {friend.name}
                            </p>
                            <span className="text-[9px] bg-white/5 text-white/50 px-1.5 py-0.2 rounded-full border border-white/5 shrink-0">
                              🌍 Member
                            </span>
                          </div>
                          <p className="text-[10px] text-white/40 truncate">
                            @{friend.username} • <span className="text-[#2F6FED]">🔥 {friend.currentStreak || 1}d</span>
                            {friend.habits && friend.habits.length > 0 ? ` • ${friend.habits[0]}` : ''}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'border-white/20 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedMemberIds.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-medium px-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {selectedMemberIds.length} member{selectedMemberIds.length !== 1 ? 's' : ''} will receive a group invite immediately upon creation.
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 min-h-[44px]"
            >
              <Users className="w-4 h-4" />
              <span>Create Private Group & Send Invites</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
