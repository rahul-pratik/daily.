import React, { useState } from 'react';
import {
  X,
  Globe2,
  ShieldCheck,
  Sparkles,
  Users,
  Check,
  BookOpen,
  Image as ImageIcon,
  Tag,
  Flame,
  Plus,
} from 'lucide-react';
import { User, Community, AVAILABLE_INTERESTS } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { handleHorizontalWheelScroll } from '../utils/scroll';

interface CreateCommunityModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onCreateCommunity: (params: {
    name: string;
    description: string;
    category: string;
    accessType: 'public' | 'moderated';
    avatar: string;
    coverImage?: string;
    rules?: string[];
    tags?: string[];
  }) => void;
}

const COMMUNITY_COVER_PRESETS = [
  {
    name: 'Tech & Code',
    avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fitness & Run',
    avatar: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Reading & Growth',
    avatar: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Indie Builders',
    avatar: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
    cover: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
  },
];

export const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onCreateCommunity,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Coding');
  const [accessType, setAccessType] = useState<'public' | 'moderated'>('public');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [rulesText, setRulesText] = useState(
    '1. Post daily proof of progress\n2. Give constructive feedback\n3. Keep conversations respectful'
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    vibrateStreakMilestone();
    const parsedRules = rulesText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const preset = COMMUNITY_COVER_PRESETS[selectedPreset] || COMMUNITY_COVER_PRESETS[0];

    onCreateCommunity({
      name: name.trim(),
      description: description.trim() || `Daily community for ${category} enthusiasts`,
      category,
      accessType,
      avatar: preset.avatar,
      coverImage: preset.cover,
      rules: parsedRules.length > 0 ? parsedRules : ['Be respectful and post daily progress'],
      tags: [category, accessType === 'public' ? 'Open' : 'Moderated'],
    });

    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-white">Create Explore Community</h2>
              <span className="text-[10px] text-white/40">
                Public or moderated open hub for builders & creators
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
          {/* ACCESS TYPE SELECTOR: Public vs Moderated */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/80 block">Access Model *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setAccessType('public');
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  accessType === 'public'
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/10'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#D4AF37] mb-1">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Public Community</span>
                </div>
                <p className="text-[10px] text-white/50 leading-tight">
                  Anyone can join instantly and participate in discussions.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setAccessType('moderated');
                }}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  accessType === 'moderated'
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/10'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#D4AF37] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Moderated Community</span>
                </div>
                <p className="text-[10px] text-white/50 leading-tight">
                  Members request access; you approve or grant membership.
                </p>
              </button>
            </div>
          </div>

          {/* Community Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Community Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 100 Days of Code 💻 or 5 AM Club 🌅"
              maxLength={40}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#D4AF37] outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Description & Mission</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Daily accountability for engineers shipping side projects"
              maxLength={120}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#D4AF37] outline-none transition-colors"
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
                      ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5 text-white/60'
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Visuals */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block">Visual Theme & Banner</label>
            <div className="grid grid-cols-2 gap-2">
              {COMMUNITY_COVER_PRESETS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPreset(idx)}
                  className={`p-2 rounded-2xl border cursor-pointer flex items-center gap-2 transition-all ${
                    selectedPreset === idx
                      ? 'bg-[#D4AF37]/10 border-[#D4AF37]'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <img
                    src={preset.avatar}
                    alt={preset.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{preset.name}</p>
                    <p className="text-[9px] text-white/40">Theme {idx + 1}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block flex items-center justify-between">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Community Guidelines & Rules</span>
              </span>
              <span className="text-[10px] text-white/40">One per line</span>
            </label>
            <textarea
              rows={3}
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              placeholder="1. Post daily progress..."
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#D4AF37] outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Moderator Info Note */}
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-2.5 text-xs text-white/60">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover border border-[#D4AF37]/40"
            />
            <p className="text-[11px] leading-tight">
              You (<strong className="text-white">@{currentUser.username}</strong>) will be listed as the Community Moderator with full permissions to grant access and manage rules.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3.5 rounded-2xl bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#D4AF37]/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#D4AF37]/20 min-h-[44px]"
            >
              <Globe2 className="w-4 h-4" />
              <span>Launch Community</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
