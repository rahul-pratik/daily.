import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Lightbulb,
  CornerDownLeft,
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

const CATEGORY_REFLECTION_PROMPTS: Record<string, string[]> = {
  Coding: [
    'Shipped new feature and fixed state sync bugs.',
    'Refactored API caching layer; cut latency in half.',
    'Closed 3 core GitHub pull requests and deployed build.',
    'Built custom UI components and tested responsiveness.',
  ],
  Fitness: [
    'Completed 45m strength training session. Felt energized!',
    'Hit personal record on deadlifts today. Good form throughout.',
    'Completed 30m core conditioning circuit. No excuses.',
    'Stretched and worked on mobility exercises after session.',
  ],
  Run: [
    'Ran 5km at 5:20 pace. Felt great on the hill climb!',
    'Morning 6-mile aerobic base run. Crisp weather.',
    'Completed 8 interval sprint repeats at the local track.',
    'Steady progression run; heart rate stayed in zone 2.',
  ],
  Reading: [
    'Read 25 pages of deep work principles. No phone notifications.',
    'Finished chapter on distributed consensus algorithms.',
    'Took detailed summary notes on productivity frameworks.',
    'Morning 30-minute reading session with black coffee.',
  ],
  Building: [
    'Completed product sprint deliverables before deadline.',
    'Interviewed 2 target users and validated our core thesis.',
    'Polished high-fidelity Figma components and design tokens.',
    'Shipped v1 MVP update to beta testers today.',
  ],
  Design: [
    'Designed 4 mobile screens with clean typographic scale.',
    'Refined dark theme color tokens and contrast ratios.',
    'Created vector iconography set for primary actions.',
  ],
  Writing: [
    'Drafted 1,200 words for the upcoming weekly essay.',
    'Outlined chapter structure and completed first review.',
    'Refined opening hooks and removed unnecessary fluff.',
  ],
  Study: [
    'Completed 2 full practice exam modules under timed conditions.',
    'Reviewed 45 Anki spaced repetition cards with zero errors.',
    'Mastered key algorithmic concepts for upcoming interview.',
  ],
  Default: [
    'Stayed disciplined and showed up for my daily standard.',
    'Focused uninterrupted for 90 minutes on the top priority.',
    'Eliminated distractions early and executed the main task.',
    'Made steady 1% compounding progress today.',
  ],
};

const REFLECTION_STARTERS = [
  'Built ',
  'Ran ',
  'Shipped ',
  'Completed ',
  'Learned ',
  'Hit daily goal: ',
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
  initialContent,
  initialImageUrl,
  initialTags,
}) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Building']);
  const [showPresets, setShowPresets] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [promptCategory, setPromptCategory] = useState<string>('All');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitializedRef = useRef(false);

  // Initialize form state ONLY ONCE when modal is opened
  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        
        if (initialContent !== undefined || initialImageUrl !== undefined) {
          setContent(initialContent || '');
          setImageUrl(initialImageUrl || '');
          if (initialTags && initialTags.length > 0) {
            setSelectedTags(initialTags);
          } else {
            setSelectedTags(['Building']);
          }
          setDraftRestored(false);
        } else {
          // Check local draft
          const savedDraft = DailyStorageService.getPostDraft(currentUser.id);
          if (savedDraft && (savedDraft.content?.trim() || savedDraft.imageUrl?.trim())) {
            setContent(savedDraft.content || '');
            setImageUrl(savedDraft.imageUrl || '');
            if (savedDraft.tags && savedDraft.tags.length > 0) {
              setSelectedTags(savedDraft.tags);
            } else {
              setSelectedTags(['Building']);
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
    } else {
      hasInitializedRef.current = false;
      setDraftSavedToast(false);
    }
  }, [isOpen, currentUser.id, initialContent, initialImageUrl, initialTags]);

  // Debounced auto-save draft whenever user makes changes while modal is open
  useEffect(() => {
    if (!isOpen || !hasInitializedRef.current) return;

    const timer = setTimeout(() => {
      if (content.trim() || imageUrl.trim()) {
        DailyStorageService.savePostDraft(currentUser.id, {
          content,
          imageUrl,
          tags: selectedTags,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
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
      if (selectedTags.length > 1) {
        setSelectedTags(selectedTags.filter((t) => t !== tag));
      }
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
    setTimeout(() => setDraftSavedToast(false), 2200);
  };

  const handleDiscardDraft = () => {
    vibrateLight();
    DailyStorageService.clearPostDraft(currentUser.id);
    setContent('');
    setImageUrl('');
    setSelectedTags(['Building']);
    setDraftRestored(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
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

  const handleInsertPrompt = (promptText: string) => {
    vibrateLight();
    setContent(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleInsertStarter = (starterText: string) => {
    vibrateLight();
    if (!content.trim()) {
      setContent(starterText);
    } else {
      setContent((prev) => `${prev.trim()} ${starterText}`);
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
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

  // Get dynamic prompts based on currently active/selected tag
  const primaryTag = selectedTags[0] || 'Building';
  const tagPrompts =
    CATEGORY_REFLECTION_PROMPTS[primaryTag] || CATEGORY_REFLECTION_PROMPTS['Default'];

  return (
    <div
      id="create-proof-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={handleSafeClose}
    >
      <div
        className="w-full max-w-lg bg-[#0D0D0D] border border-white/15 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
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
                Log Proof of Work
              </h3>
              <p className="text-[10px] text-white/50">Receipt • Reflection • Habit Link</p>
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
                  1. Proof Receipt (Photo)
                </span>
                {!imageUrl && (
                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="text-xs text-[#D4AF37] hover:underline font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    {showPresets ? 'Hide presets' : 'Preset ideas'}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reflection-textarea"
                  className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5"
                >
                  <PenTool className="w-4 h-4 text-[#D4AF37]" />
                  2. Add Reflection (Short Thought)
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      content.length >= 280
                        ? 'text-red-400'
                        : content.length >= 200
                        ? 'text-amber-400'
                        : 'text-white/40'
                    }`}
                  >
                    {content.length}/300
                  </span>
                </div>
              </div>

              {/* Reflection Textarea */}
              <div className="relative">
                <textarea
                  id="reflection-textarea"
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What did you actually accomplish today? What was hard? (e.g., 'Shipped database migration. Took 2 hours to fix edge cases.')"
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-[#D4AF37] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-all resize-none leading-relaxed focus:bg-white/[0.07]"
                />
              </div>

              {/* Quick Reflection Starters */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-[#D4AF37]" /> Quick Starters & Prompts ({primaryTag})
                  </span>
                </div>

                {/* Reflection Starters Pills */}
                <div className="flex flex-wrap gap-1">
                  {REFLECTION_STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => handleInsertStarter(starter)}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 hover:border-[#D4AF37]/50 text-white/70 hover:text-white border border-white/5 transition-all flex items-center gap-1 active:scale-95"
                    >
                      <CornerDownLeft className="w-2.5 h-2.5 text-[#D4AF37]" />
                      <span>{starter}</span>
                    </button>
                  ))}
                </div>

                {/* Specific prompts for selected tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {tagPrompts.slice(0, 4).map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertPrompt(prompt)}
                      className="text-[10px] p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-white/70 hover:text-white border border-white/5 hover:border-[#D4AF37]/40 transition-all text-left line-clamp-2 leading-tight group flex items-start gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-[#D4AF37] shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
                      <span>"{prompt}"</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 3: LINK HABIT / CHALLENGE / GOAL 🎯 */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#D4AF37]" />
                  3. Link Habit / Focus Area
                </span>
                <span className="text-[10px] text-white/40">Select 1-4 tags</span>
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
                          ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-sm scale-105 font-black'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span className="text-white/30 text-xs">#</span>
                      )}
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DRAFT ACTIONS & AUTO-SAVE INDICATOR */}
            <div className="flex items-center justify-between pt-1 text-[11px] text-white/40 px-1 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {draftSavedToast ? 'Draft saved locally ✓' : 'Auto-saving draft'}
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
                    Clear All
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
