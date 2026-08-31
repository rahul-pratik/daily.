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
  Users,
  Globe,
  Layers,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { User, Post, Community } from '../types';
import { getTodayDateString, DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { CollabCollageStudio } from './CollabCollageStudio';

interface CreatePostModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  posts?: Post[];
  communities?: Community[];
  initialCommunityId?: string;
  onSubmitPost: (payload: {
    content: string;
    imageUrl?: string;
    tags: string[];
    isMainPost?: boolean;
    communityId?: string;
    communityName?: string;
    isCollage?: boolean;
  }) => void;
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
    name: 'Garden / Plants',
    category: 'Gardening',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=1000&auto=format&fit=crop&q=80',
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
  Gardening: [
    'Tended to soil, pruned vegetable rows, and watered garden beds.',
    'Planted new seasonal seedlings and checked hydroponic roots.',
    'Harvested fresh organic produce and maintained garden beds.',
  ],
  Singing: [
    'Completed 30m vocal scales, pitch training, and breath control exercises.',
    'Practiced acoustic set with metronome; refined high resonance.',
  ],
  Dancing: [
    'Practiced 45m choreography routine and rhythm synchronization.',
    'Worked on footwork drills and body movement flow.',
  ],
  Storytelling: [
    'Wrote 1,000 words for the chapter narrative and character arc.',
    'Structured dialogue rhythm and refined the plot hook.',
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
  'Planted ',
  'Singing ',
  'Learned ',
  'Hit daily goal: ',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  posts = [],
  communities = [],
  initialCommunityId,
  onSubmitPost,
  onViewMyPost,
  initialContent,
  initialImageUrl,
  initialTags,
}) => {
  const [postDestination, setPostDestination] = useState<'main' | 'community'>('main');
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Building']);
  const [showPresets, setShowPresets] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [isCollageGenerated, setIsCollageGenerated] = useState(false);
  const [isCollageStudioOpen, setIsCollageStudioOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitializedRef = useRef(false);

  // Available user communities
  const availableCommunities = communities.length > 0
    ? communities
    : DailyStorageService.getAllCommunities();

  const today = getTodayDateString();
  const hasPostedMainToday = DailyStorageService.hasUserPostedMainToday(currentUser.id);
  const todayMainPost = DailyStorageService.getTodayPostForUser(currentUser.id);
  const todayCommunityPosts = DailyStorageService.getTodayCommunityPostsForUser(currentUser.id);

  // Initialize form state
  useEffect(() => {
    if (isOpen) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        
        if (initialCommunityId) {
          setPostDestination('community');
          setSelectedCommunityId(initialCommunityId);
        } else if (hasPostedMainToday) {
          // If already posted main, default to community mode
          setPostDestination('community');
          if (availableCommunities.length > 0) {
            setSelectedCommunityId(availableCommunities[0].id);
          }
        } else {
          setPostDestination('main');
        }

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
      setIsCollageGenerated(false);
    }
  }, [isOpen, currentUser.id, initialContent, initialImageUrl, initialTags, initialCommunityId, hasPostedMainToday]);

  // Debounced auto-save draft
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
          setIsCollageGenerated(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDiscardDraft = () => {
    vibrateLight();
    DailyStorageService.clearPostDraft(currentUser.id);
    setContent('');
    setImageUrl('');
    setSelectedTags(['Building']);
    setDraftRestored(false);
    setIsCollageGenerated(false);
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

  const handleApplyStitchedCollage = (stitchedDataUrl: string) => {
    setImageUrl(stitchedDataUrl);
    setIsCollageGenerated(true);
    setShowPresets(false);
    if (!content.trim()) {
      setContent('Daily proof collage: Combined progress receipts for today’s main post!');
    }
    setSelectedTags(['DailyProof', 'Collab']);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const isMain = postDestination === 'main';

    if (isMain && hasPostedMainToday) {
      return;
    }

    const selectedComm = availableCommunities.find((c) => c.id === selectedCommunityId);

    vibrateStreakMilestone();
    onSubmitPost({
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : ['DailyProof'],
      isMainPost: isMain,
      communityId: !isMain && selectedComm ? selectedComm.id : undefined,
      communityName: !isMain && selectedComm ? selectedComm.name : undefined,
      isCollage: isCollageGenerated,
    });

    DailyStorageService.clearPostDraft(currentUser.id);
    setContent('');
    setImageUrl('');
    setSelectedTags(['Building']);
    setShowPresets(false);
    setDraftRestored(false);
    setIsCollageGenerated(false);
    onClose();
  };

  const isMainPostBlocked = postDestination === 'main' && hasPostedMainToday;

  return (
    <>
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
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* DESTINATION SELECTOR: 1 Main Post (Feed) vs Community (Unlimited) */}
          <div className="pt-3 pb-2">
            <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setPostDestination('main');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                  postDestination === 'main'
                    ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Main Post (1/day)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setPostDestination('community');
                  if (!selectedCommunityId && availableCommunities.length > 0) {
                    setSelectedCommunityId(availableCommunities[0].id);
                  }
                }}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                  postDestination === 'community'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Community (Unlimited)</span>
              </button>
            </div>

            {/* Community selector dropdown if in community mode */}
            {postDestination === 'community' && (
              <div className="mt-2 flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-[11px] font-bold text-white/80 shrink-0">Community:</span>
                <select
                  value={selectedCommunityId}
                  onChange={(e) => setSelectedCommunityId(e.target.value)}
                  className="bg-black/60 border border-white/20 rounded-lg px-2 py-1 text-xs text-white flex-1 focus:outline-none focus:border-blue-400"
                >
                  {availableCommunities.map((comm) => (
                    <option key={comm.id} value={comm.id} className="bg-[#121212] text-white">
                      {comm.name} ({comm.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* MAIN POST ALREADY SUBMITTED NOTIFICATION BANNER */}
          {isMainPostBlocked ? (
            <div className="py-4 px-2 flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] shadow-lg">
                <CalendarCheck className="w-8 h-8" />
              </div>

              <div className="space-y-1 max-w-sm">
                <h4 className="text-base sm:text-lg font-black text-white">
                  You have already submitted proof as the main post for today
                </h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  Main post is strictly limited to 1 per day for unbroken streak integrity. However, you can post unlimited proofs in communities!
                </p>
              </div>

              {/* Action: Switch to Community */}
              <div className="w-full pt-1 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setPostDestination('community');
                    if (availableCommunities.length > 0) {
                      setSelectedCommunityId(availableCommunities[0].id);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>Post in a Community instead (Unlimited)</span>
                </button>

                {todayMainPost && onViewMyPost && (
                  <button
                    type="button"
                    onClick={() => {
                      onViewMyPost(todayMainPost.id);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>View Today's Main Post</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ACTIVE POST FORM */
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-2 space-y-4 pr-1 no-scrollbar">
              {/* UNPOSTED MAIN POST PROMPT / COLLAB CALLOUT */}
              {postDestination === 'main' && !hasPostedMainToday && (
                <div className="p-3 bg-gradient-to-r from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent border border-[#D4AF37]/30 rounded-2xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#D4AF37]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Today's 1 Main Daily Post Pending</span>
                    </div>
                    <p className="text-[10px] text-white/60 mt-0.5">
                      Submit single proof or merge multiple receipts into 1 photo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      setIsCollageStudioOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5B842] text-black font-black text-[11px] shrink-0 active:scale-95 transition-all shadow-md shadow-[#D4AF37]/20 flex items-center gap-1 min-h-[34px]"
                  >
                    <Layers className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Collab Collage</span>
                  </button>
                </div>
              )}

              {/* DRAFT BANNER OR STATUS */}
              {draftRestored && (
                <div className="p-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#D4AF37] min-w-0">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate font-semibold text-[11px]">Draft restored from local device</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    Discard
                  </button>
                </div>
              )}

              {/* STEP 1: ADD PROOF 📸 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-400" />
                    1. Proof Receipt (Photo)
                  </span>
                  <div className="flex items-center gap-2">
                    {postDestination === 'main' && !hasPostedMainToday && (
                      <button
                        type="button"
                        onClick={() => {
                          vibrateLight();
                          setIsCollageStudioOpen(true);
                        }}
                        className="text-xs text-[#D4AF37] hover:underline font-black flex items-center gap-1"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Collab Collage
                      </button>
                    )}
                    {!imageUrl && (
                      <button
                        type="button"
                        onClick={() => setShowPresets(!showPresets)}
                        className="text-xs text-blue-400 hover:underline font-bold flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        {showPresets ? 'Hide presets' : 'Preset ideas'}
                      </button>
                    )}
                  </div>
                </div>

                {imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 aspect-video group max-h-[180px] bg-black">
                    <img
                      src={imageUrl}
                      alt="Proof preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {isCollageGenerated && (
                      <div className="absolute top-2 left-2 bg-[#D4AF37] text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Collab Photo Stitch
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setIsCollageGenerated(false);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-red-400 transition-colors"
                      aria-label="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-white/20 hover:border-[#D4AF37]/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all min-h-[90px]">
                      <Upload className="w-5 h-5 text-[#D4AF37]" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-white">Upload receipt photo</span>
                        <span className="text-[10px] text-white/40 block mt-0.5">JPG, PNG, WebP</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Presets Grid */}
                    {showPresets && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-2.5 bg-black/40 rounded-2xl border border-white/10">
                        {PROOF_PHOTO_PRESETS.map((preset) => (
                          <div
                            key={preset.url}
                            onClick={() => {
                              vibrateLight();
                              setImageUrl(preset.url);
                              setShowPresets(false);
                            }}
                            className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-[#D4AF37] cursor-pointer relative group transition-all"
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white p-0.5 text-center truncate">
                              {preset.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* STEP 2: WRITE REFLECTION ✍️ */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-emerald-400" />
                    2. Daily Reflection / Proof Note
                  </span>
                  <span className="text-[10px] text-white/40">{content.length}/280</span>
                </div>

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    postDestination === 'main'
                      ? "What hard work did you execute today? Log your 1 main proof..."
                      : `Share proof and discuss with ${availableCommunities.find(c => c.id === selectedCommunityId)?.name || 'the community'}...`
                  }
                  maxLength={280}
                  rows={3}
                  className="w-full bg-white/[0.04] border border-white/15 focus:border-[#D4AF37] rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-all resize-none leading-relaxed"
                />

                {/* Quick Starters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-[10px] font-bold text-white/40 shrink-0">Quick start:</span>
                  {REFLECTION_STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => handleInsertStarter(starter)}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] text-white/70 hover:text-white shrink-0 transition-colors"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 3: TAGS & CATEGORIES 🎯 */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-purple-400" />
                  3. Discipline Tag
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Coding',
                    'Fitness',
                    'Run',
                    'Reading',
                    'Building',
                    'Design',
                    'Gardening',
                    'Singing',
                    'Dancing',
                    'Storytelling',
                    'Meditation',
                    'EarlyRise',
                  ].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-sm font-black'
                            : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 border-t border-white/10">
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg min-h-[46px] ${
                    !content.trim()
                      ? 'bg-white/10 text-white/30 cursor-not-allowed border border-white/5'
                      : postDestination === 'main'
                      ? 'bg-[#D4AF37] hover:bg-[#E5B842] text-black shadow-[#D4AF37]/25 active:scale-[0.99]'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 active:scale-[0.99]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {postDestination === 'main'
                      ? 'Submit 1 Main Daily Proof'
                      : `Post to ${availableCommunities.find(c => c.id === selectedCommunityId)?.name || 'Community'}`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Collab Collage Studio Modal */}
      <CollabCollageStudio
        isOpen={isCollageStudioOpen}
        onClose={() => setIsCollageStudioOpen(false)}
        currentUser={currentUser}
        todayCommunityPosts={todayCommunityPosts}
        onApplyCollage={handleApplyStitchedCollage}
      />
    </>
  );
};
