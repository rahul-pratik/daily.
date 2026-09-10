import React, { useState, useRef } from 'react';
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
  Plus,
  Upload,
  Palette,
  Trash2,
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
    themeColor?: string;
    rules?: string[];
    tags?: string[];
  }) => void;
}

const THEME_COLOR_PRESETS = [
  { name: 'Electric Blue', hex: '#2F6FED' },
  { name: 'Emerald Peak', hex: '#10B981' },
  { name: 'Neon Violet', hex: '#8B5CF6' },
  { name: 'Sunset Amber', hex: '#F59E0B' },
  { name: 'Crimson Rose', hex: '#F43F5E' },
  { name: 'Cyber Cyan', hex: '#06B6D4' },
  { name: 'Indigo Aura', hex: '#6366F1' },
  { name: 'Obsidian Slate', hex: '#475569' },
];

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
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

  // Custom Visual Theme
  const [themeColor, setThemeColor] = useState<string>('#2F6FED');
  const [isCustomColorPickerOpen, setIsCustomColorPickerOpen] = useState(false);

  // Custom Banner (No default banner allowed)
  const [customBanner, setCustomBanner] = useState<string>('');
  const [bannerUrlInput, setBannerUrlInput] = useState<string>('');
  const [isUrlInputMode, setIsUrlInputMode] = useState<boolean>(false);

  // Avatar / Icon
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATARS[0]);

  const [rulesText, setRulesText] = useState(
    '1. Post daily proof of progress\n2. Give constructive feedback\n3. Keep conversations respectful'
  );

  const bannerFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle banner upload from user device
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomBanner(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle avatar upload from user device
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    vibrateStreakMilestone();
    const parsedRules = rulesText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    onCreateCommunity({
      name: name.trim(),
      description: description.trim() || `Daily community for ${category} enthusiasts`,
      category,
      accessType,
      avatar,
      coverImage: customBanner.trim() ? customBanner.trim() : undefined,
      themeColor,
      rules: parsedRules.length > 0 ? parsedRules : ['Be respectful and post daily progress'],
      tags: [category, accessType === 'public' ? 'Open' : 'Moderated'],
    });

    setName('');
    setDescription('');
    setCustomBanner('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md transition-colors"
              style={{ backgroundColor: themeColor }}
            >
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-black text-sm text-white">Create Community</h2>
              <span className="text-[10px] text-white/40">
                Custom visual theme & banner for your community
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
                    ? 'bg-blue-500/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-400 mb-1">
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
                    ? 'bg-blue-500/15 border-blue-500 text-white shadow-md shadow-blue-500/10'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-400 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Moderated Community</span>
                </div>
                <p className="text-[10px] text-white/50 leading-tight">
                  Members submit join requests; you review and grant access.
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
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
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
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors"
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
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white/5 hover:bg-white/10 border border-white/5 text-white/60'
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>
          </div>

          {/* VISUAL THEME SELECTOR */}
          <div className="space-y-2 p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>Community Visual Theme</span>
              </label>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: themeColor }}
                />
                <span className="text-[10px] font-mono text-white/60">{themeColor}</span>
              </div>
            </div>

            <p className="text-[11px] text-white/50">
              Pick an accent color that sets the tone for your community cards and badges.
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1">
              {THEME_COLOR_PRESETS.map((t) => {
                const isSelected = themeColor.toLowerCase() === t.hex.toLowerCase();
                return (
                  <button
                    key={t.hex}
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      setThemeColor(t.hex);
                    }}
                    title={t.name}
                    className={`h-9 rounded-xl flex items-center justify-center transition-all relative ${
                      isSelected
                        ? 'ring-2 ring-white scale-105 shadow-md'
                        : 'hover:scale-95 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: t.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Hex / Color Input */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                title="Choose custom color"
              />
              <input
                type="text"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                placeholder="#2F6FED"
                maxLength={7}
                className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white w-28 outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-white/40">Custom hex theme</span>
            </div>
          </div>

          {/* CUSTOM BANNER SUBMISSION (NO DEFAULT BANNERS) */}
          <div className="space-y-2 p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Custom Community Banner</span>
              </label>
              {customBanner ? (
                <button
                  type="button"
                  onClick={() => {
                    setCustomBanner('');
                    setBannerUrlInput('');
                  }}
                  className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Banner</span>
                </button>
              ) : (
                <span className="text-[10px] text-white/40">Optional</span>
              )}
            </div>

            <p className="text-[11px] text-white/50">
              Submit your own banner image. There are no default stock banners; if left empty, your community will feature a clean gradient powered by your visual theme.
            </p>

            {/* Banner Preview or Theme Gradient Preview */}
            <div
              className="relative h-28 w-full rounded-xl overflow-hidden border border-white/10 flex items-center justify-center transition-all"
              style={
                customBanner
                  ? undefined
                  : {
                      background: `linear-gradient(135deg, ${themeColor}33 0%, rgba(10, 10, 15, 0.95) 100%)`,
                    }
              }
            >
              {customBanner ? (
                <>
                  <img
                    src={customBanner}
                    alt="Custom Community Banner Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/20">
                      Custom Banner Active
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-3">
                  <div
                    className="w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center opacity-70"
                    style={{ backgroundColor: `${themeColor}22`, border: `1px solid ${themeColor}44` }}
                  >
                    <Palette className="w-4 h-4" style={{ color: themeColor }} />
                  </div>
                  <p className="text-xs font-bold text-white/80">Visual Theme Gradient Active</p>
                  <p className="text-[10px] text-white/40">No stock banner assigned</p>
                </div>
              )}
            </div>

            {/* Banner Controls: Upload file or URL */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="file"
                ref={bannerFileRef}
                accept="image/*"
                onChange={handleBannerFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bannerFileRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Upload From Device</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUrlInputMode(!isUrlInputMode)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-semibold text-white/70 flex items-center gap-1.5 transition-colors"
              >
                <span>{isUrlInputMode ? 'Hide URL' : 'Use Image URL'}</span>
              </button>
            </div>

            {isUrlInputMode && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="url"
                  value={bannerUrlInput}
                  onChange={(e) => setBannerUrlInput(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (bannerUrlInput.trim()) {
                      setCustomBanner(bannerUrlInput.trim());
                    }
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold rounded-xl text-white transition-colors"
                >
                  Set
                </button>
              </div>
            )}
          </div>

          {/* COMMUNITY AVATAR / ICON */}
          <div className="space-y-2 p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Community Avatar / Logo</span>
              </label>
              <input
                type="file"
                ref={avatarFileRef}
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Custom Logo</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt="Community Avatar"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/20 shrink-0"
              />
              <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {DEFAULT_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(preset)}
                    className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 border transition-all ${
                      avatar === preset
                        ? 'ring-2 ring-blue-500 border-transparent scale-105'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset}
                      alt="Preset"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/80 block flex items-center justify-between">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Community Guidelines & Rules</span>
              </span>
              <span className="text-[10px] text-white/40">One per line</span>
            </label>
            <textarea
              rows={3}
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              placeholder="1. Post daily progress..."
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-blue-500 outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Moderator Info Note */}
          <div className="p-3 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center gap-2.5 text-xs text-white/60">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-full object-cover border border-blue-500/40"
            />
            <p className="text-[11px] leading-tight">
              You (<strong className="text-white">@{currentUser.username}</strong>) will be listed as Community Moderator with permissions to review join requests and manage discussions.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full py-3.5 rounded-2xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg min-h-[44px]"
              style={{ backgroundColor: themeColor, boxShadow: `0 4px 14px ${themeColor}40` }}
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
