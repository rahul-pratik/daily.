import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Upload,
  Sparkles,
  Camera,
  Check,
  CalendarCheck,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Target,
  PenTool,
  CheckCircle2,
  ShieldCheck,
  Save,
  Clock,
} from 'lucide-react';
import { User, Post } from '../types';
import { getTodayDateString, DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface CreatePostModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  posts?: Post[];
  onSubmitPost: (payload: { content: string; imageUrl?: string; tags: string[] }) => void;
  onViewMyPost?: (postId: string) => void;
  initialContent?: string;
  initialImageUrl?: string;
  initialTags?: string[];
}

const PROOF_PHOTO_PRESETS = [
  {
    name: 'Laptop / Code',
    category: 'Coding',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gym / Fitness',
    category: 'Fitness',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Book / Reading',
    category: 'Reading',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Desk Setup',
    category: 'Building',
    url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Running Track',
    category: 'Run',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Outdoor Nature',
    category: 'Outdoors',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
  },
];

const REFLECTION_PROMPTS = [
  'Shipped new feature and fixed state sync bugs.',
  'Ran 5km at 5:30 pace. Felt great on the hill climb!',
  'Read 20 pages of deep work principles. No phone notifications.',
  'Finished mockups for mobile navigation tokens.',
  'Completed 45m strength training session.',
];

const HABIT_LINK_OPTIONS = [
  'Building',
  'Coding',
  'Fitness',
  'Reading',
  'Run',
  'Study',
  'Design',
  'Writing',
  'Meditate',
  'Early Rise',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  posts = [],
  onSubmitPost,
  onViewMyPost,
  initialContent = '',
  initialImageUrl = '',
  initialTags = ['Building'],
}) => {
  const [content, setContent] = useState(initialContent);
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [showPresets, setShowPresets] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  // Restore draft or initial props on open
  useEffect(() => {
    if (isOpen) {
      if (initialContent || initialImageUrl) {
        setContent(initialContent);
        setImageUrl(initialImageUrl);
        if (initialTags && initialTags.length > 0) setSelectedTags(initialTags);
      } else {
        const savedDraft = DailyStorageService.getPostDraft(currentUser.id);
        if (savedDraft && (savedDraft.content || savedDraft.imageUrl)) {
          setContent(savedDraft.content || '');
          setImageUrl(savedDraft.imageUrl || '');
          if (savedDraft.tags && savedDraft.tags.length > 0) {
            setSelectedTags(savedDraft.tags);
          }
          setDraftRestored(true);
        } else {
          setContent('');
          setImageUrl('');
          setSelectedTags(['Building']);
          setDraftRestored(false);
        }
      }
    }
  }, [isOpen, currentUser.id, initialContent, initialImageUrl, initialTags]);

  // Auto-save draft whenever user makes changes
  useEffect(() => {
    if (!isOpen) return;
    if (content.trim() || imageUrl.trim()) {
      DailyStorageService.savePostDraft(currentUser.id, {
        content,
        imageUrl,
        tags: selectedTags,
      });
    }
  }, [isOpen, content, imageUrl, selectedTags, currentUser.id]);

  if (!isOpen) return null;

  const today = getTodayDateString();
  const todayUserPost = posts.find(
    (p) =>
      (p.userId === currentUser.id || p.userId === 'user_me') &&
      ((p.postDate && p.postDate === today) || (p.createdAt && p.createdAt.includes('Today')))
  );
  const hasPostedToday = currentUser.lastPostedDate === today || !!todayUserPost;

  const toggleTag = (tag: string) => {
    vibrateLight();
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 4) {
        setSelectedTags([...selectedTags, tag]);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          setShowPresets(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualSaveDraft = () => {
    vibrateLight();
    DailyStorageService.savePostDraft(currentUser.id, {
      content,
      imageUrl,
      tags: selectedTags,
    });
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2500);
  };

  const handleDiscardDraft = () => {
    vibrateLight();
    DailyStorageService.clearPostDraft(currentUser.id);
    setContent('');
    setImageUrl('');
    setSelectedTags(['Building']);
    setDraftRestored(false);
  };

  const handleSafeClose = () => {
    if (content.trim() || imageUrl.trim()) {
      DailyStorageService.savePostDraft(currentUser.id, {
        content,
        imageUrl,
        tags: selectedTags,
      });
    }
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPostedToday) return;
    if (!content.trim()) return;

    vibrateStreakMilestone();
    onSubmitPost({
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : ['DailyProof'],
    });

    // Clear draft upon successful submission
    DailyStorageService.clearPostDraft(currentUser.id);
    setContent('');
    setImageUrl('');
    setSelectedTags(['Building']);
    setShowPresets(false);
    setDraftRestored(false);
    onClose();
  };

  return (
    <div
      id="create-proof-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={handleSafeClose}
    >
      <div
        className="w-full max-w-lg bg-[#0D0D0D] border border-white/15 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white my-6 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                What did you do today?
              </h3>
              <p className="text-[10px] text-white/50">Action • Proof • Reflection</p>
            </div>
          </div>

          {/* Close & Streak Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/20">
              <Flame className="w-3.5 h-3.5 fill-[#D4AF37]" />
              <span>{currentUser.currentStreak}d Streak</span>
            </div>
            <button
              onClick={handleSafeClose}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close modal"
              title="Close (auto-saved as draft)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ALREADY POSTED TODAY VIEW */}
        {hasPostedToday ? (
          <div className="py-6 px-2 flex-1 flex flex-col items-center justify-center text-center space-y-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center shadow-lg shadow-[#D4AF37]/10">
                <CalendarCheck className="w-10 h-10 text-[#D4AF37]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                You showed up today!
              </h4>
              <p className="text-sm font-semibold text-[#D4AF37] bg-[#D4AF37]/10 py-2 px-3.5 rounded-xl border border-[#D4AF37]/20">
                Daily Proof Logged • Streak Active 🔥
              </p>
              <p className="text-xs text-white/50 leading-relaxed pt-1">
                To keep content authentic and focused on real action, each member documents strictly{' '}
                <strong className="text-white">one proof-of-work receipt</strong> per day.
              </p>
            </div>

            {/* Preview of today's post */}
            {todayUserPost && (
              <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Today’s Proof Receipt
                  </span>
                  <span className="text-[10px] text-white/40">{todayUserPost.createdAt}</span>
                </div>

                <div className="flex gap-3">
                  {todayUserPost.imageUrl && (
                    <img
                      src={todayUserPost.imageUrl}
                      alt="Today's proof"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 line-clamp-2 leading-snug">
                      {todayUserPost.content}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {todayUserPost.tags?.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-[#D4AF37] border border-white/5 font-semibold"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full pt-2 flex gap-2.5">
              {todayUserPost && onViewMyPost && (
                <button
                  type="button"
                  onClick={() => {
                    onViewMyPost(todayUserPost.id);
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>View Post</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black font-black text-xs transition-all shadow-md shadow-[#D4AF37]/20 flex items-center justify-center"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* HIERARCHY FORM: 1. Add Proof 📸 -> 2. Write Reflection ✍️ -> 3. Link Habit/Goal 🎯 -> POST TODAY 🔥 */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1 no-scrollbar">
            {/* DRAFT BANNER OR STATUS */}
            {draftRestored && (
              <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-[#D4AF37] min-w-0">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-semibold text-[11px]">Draft restored from local device</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* STEP 1: ADD PROOF 📸 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#D4AF37]" />
                  1. Add Proof (Photo Receipt)
                </span>
                {!imageUrl && (
                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="text-xs text-[#D4AF37] hover:underline font-bold"
                  >
                    {showPresets ? 'Hide presets' : 'Proof presets'}
                  </button>
                )}
              </div>

              {imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/15 aspect-[16/9] bg-black group">
                  <img
                    src={imageUrl}
                    alt="Proof preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Proof Attached
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-red-400 rounded-full border border-white/15 shadow-md transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl cursor-pointer transition-all text-xs font-bold text-white min-h-[44px]">
                      <Upload className="w-4 h-4 text-[#D4AF37]" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPresets(!showPresets)}
                      className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/40 rounded-2xl transition-all text-xs font-bold text-white min-h-[44px]"
                    >
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>Proof Presets</span>
                    </button>
                  </div>

                  {showPresets && (
                    <div className="grid grid-cols-3 gap-2 p-2 bg-white/[0.03] rounded-2xl border border-white/10">
                      {PROOF_PHOTO_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            vibrateLight();
                            setImageUrl(preset.url);
                            if (!selectedTags.includes(preset.category)) {
                              setSelectedTags([preset.category, ...selectedTags.slice(0, 2)]);
                            }
                            setShowPresets(false);
                          }}
                          className="group relative rounded-xl overflow-hidden aspect-video border border-white/10 hover:border-[#D4AF37] transition-all text-left"
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-white leading-none truncate">
                              {preset.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* STEP 2: WRITE REFLECTION ✍️ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-white/80 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-[#D4AF37]" />
                  2. Add Reflection (Short Thought)
                </span>
                <span className="text-[10px] font-mono text-white/30">
                  {content.length}/300
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you actually do today? (e.g., 'Built authentication. Took 4 hours longer than expected.')"
                rows={3}
                maxLength={300}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-[#D4AF37] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-all resize-none leading-relaxed"
                autoFocus
              />

              {/* Quick reflection examples */}
              <div className="flex flex-wrap gap-1 pt-1">
                {REFLECTION_PROMPTS.slice(0, 3).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      setContent(prompt);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5 transition-colors text-left truncate max-w-full"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 3: LINK HABIT / CHALLENGE / GOAL 🎯 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#D4AF37]" />
                  3. Link Habit / Goal
                </span>
                <span className="text-[10px] text-white/40">Connect your action</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {HABIT_LINK_OPTIONS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border min-h-[34px] ${
                        isSelected
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-sm scale-105'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="text-white/30 text-xs">☑</span>
                      )}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DRAFT ACTIONS & AUTO-SAVE INDICATOR */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-white/40 px-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {draftSavedToast ? 'Draft saved to local storage ✓' : 'Auto-saving draft locally'}
              </span>
              <div className="flex items-center gap-2">
                {(content.trim() || imageUrl.trim()) && (
                  <button
                    type="button"
                    onClick={handleManualSaveDraft}
                    className="text-[10px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save Draft
                  </button>
                )}
                {(content.trim() || imageUrl.trim()) && (
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-[10px] text-white/40 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* SUBMIT BUTTON: POST TODAY 🔥 */}
            <div className="pt-1">
              <button
                id="submit-proof-post-btn"
                type="submit"
                disabled={!content.trim()}
                className="w-full py-4 rounded-2xl bg-[#D4AF37] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#D4AF37]/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#D4AF37]/25 min-h-[48px]"
              >
                <Flame className="w-5 h-5 fill-black" />
                <span>POST TODAY 🔥</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
