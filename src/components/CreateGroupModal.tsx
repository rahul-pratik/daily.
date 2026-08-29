import React, { useState } from 'react';
import { X, Users, Check, Sparkles, Image as ImageIcon, Plus, ShieldCheck, Pin, Hash } from 'lucide-react';
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

const PRESET_AVATARS = [
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
  const [rulesText, setRulesText] = useState('Be supportive and share genuine daily progress\nNo spam or off-topic links');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  if (!isOpen) return null;

  const availableFriends = allUsers.filter((u) => u.id !== currentUser.id);

  const toggleMember = (id: string) => {
    vibrateLight();
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedRules = rulesText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    vibrateStreakMilestone();
    onCreateGroup({
      name: name.trim(),
      description: description.trim() || 'Daily accountability & habit sharing community',
      avatar: customAvatarUrl.trim() || selectedAvatar,
      category,
      memberIds: selectedMemberIds,
      rules: parsedRules.length > 0 ? parsedRules : ['Be supportive and share daily progress'],
      pinnedTopic: pinnedTopic.trim() || `Welcome to ${name.trim()}! Introduce yourself and share your streak.`,
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center text-[#FF4D00]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">Build a Community</h2>
              <span className="text-[10px] text-white/40">
                Create rankings, host discussions & chat with members
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Community Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Community Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 100 Days of Code 💻 or 5 AM Runners 🏃‍♂️"
              maxLength={40}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#FF4D00] outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Mission & Topic</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Daily coding updates, tips, rankings & live chatter"
              maxLength={120}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#FF4D00] outline-none transition-colors"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block flex items-center justify-between">
              <span>Category / Interest</span>
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
                      ? 'bg-[#FF4D00] text-black shadow-md shadow-[#FF4D00]/20'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5 text-white/60'
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Pinned Discussion Topic */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 flex items-center gap-1">
              <Pin className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>Pinned Discussion Topic</span>
            </label>
            <input
              type="text"
              value={pinnedTopic}
              onChange={(e) => setPinnedTopic(e.target.value)}
              placeholder="e.g. What is your #1 goal this week? Drop your updates below!"
              maxLength={100}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#FF4D00] outline-none transition-colors"
            />
          </div>

          {/* Community Rules */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Community Guidelines (1 per line)</span>
            </label>
            <textarea
              rows={2}
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              placeholder="1 rule per line"
              className="w-full px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#FF4D00] outline-none transition-colors resize-none"
            />
          </div>

          {/* Group Avatar Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Cover Avatar Badge</label>
            <div 
              onWheel={handleHorizontalWheelScroll}
              className="flex items-center gap-2 overflow-x-auto whitespace-nowrap flex-nowrap pb-1 no-scrollbar touch-pan-x overscroll-x-contain py-1"
            >
              {PRESET_AVATARS.map((url, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedAvatar(url);
                    setCustomAvatarUrl('');
                  }}
                  className={`relative w-12 h-12 rounded-xl overflow-hidden cursor-pointer shrink-0 border-2 transition-all ${
                    selectedAvatar === url && !customAvatarUrl
                      ? 'border-[#FF4D00] scale-105 shadow-md shadow-[#FF4D00]/20'
                      : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt="Preset"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {selectedAvatar === url && !customAvatarUrl && (
                    <div className="absolute inset-0 bg-[#FF4D00]/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invite Initial Members */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-white/80 flex items-center justify-between">
              <span>Invite Members ({selectedMemberIds.length} selected)</span>
              <span className="text-[10px] text-white/40">Optional</span>
            </label>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {availableFriends.map((u) => {
                const isSelected = selectedMemberIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF4D00]/10 border-[#FF4D00]/50 text-white'
                        : 'bg-white/5 border-white/5 hover:border-white/15 text-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-white block truncate">{u.name}</span>
                        <span className="text-[10px] text-white/40">@{u.username} • 🔥{u.currentStreak}d</span>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-[#FF4D00] border-[#FF4D00] text-black font-bold' : 'border-white/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/5 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#FF4D00] hover:bg-[#FF4D00]/90 disabled:opacity-30 text-black font-black text-xs transition-all shadow-lg shadow-[#FF4D00]/20 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Build Community</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
