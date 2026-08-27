import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Sparkles,
  Flame,
  Check,
  Upload,
  Trash2,
  Lock,
  CalendarCheck,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { User, Post, AVAILABLE_HABITS, AVAILABLE_INTERESTS } from '../types';
import { getTodayDateString, DailyStorageService } from '../services/storage';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  posts?: Post[];
  onSubmitPost: (payload: { content: string; imageUrl?: string; tags: string[] }) => void;
  onViewMyPost?: (postId: string) => void;
}

const PHOTO_PRESETS = [
  {
    name: 'Workspace Code',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gym & Fitness',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Morning Run',
    url: 'https://images.unsplash.com/photo-1502224562085-639556652f33?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Book & Coffee',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Real-time IDE',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Design Flow',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
  },
];

const SUGGESTION_PROMPTS = [
  'Crushed a 5km morning run 🏃‍♂️',
  'Shipped new core feature to production 🚀',
  'Read 30 pages of my book today 📖',
  'Hit a new personal record in the gym 🏋️',
  'Worked on UI components and design system 🎨',
  '30 minutes of deep focus meditation 🧘‍♂️',
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  posts = [],
  onSubmitPost,
  onViewMyPost,
}) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Build Projects']);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [attemptedExtraPost, setAttemptedExtraPost] = useState(false);

  if (!isOpen) return null;

  const today = getTodayDateString();
  // Strictly check if user has already posted today
  const hasPostedToday = DailyStorageService.hasUserPostedToday(currentUser.id);
  const todayUserPost = DailyStorageService.getTodayPostForUser(currentUser.id) || posts.find(
    (p) => p.userId === currentUser.id && (p.postDate === today || p.createdAt.toLowerCase().includes('today') || p.createdAt.toLowerCase().includes('just now'))
  );

  const allTagOptions = Array.from(new Set([...AVAILABLE_HABITS, ...AVAILABLE_INTERESTS]));

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < 5) {
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
          setShowPhotoPicker(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPostedToday) {
      setAttemptedExtraPost(true);
      return;
    }
    if (!content.trim()) return;

    onSubmitPost({
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      tags: selectedTags,
    });

    setContent('');
    setImageUrl('');
    setSelectedTags(['Build Projects']);
    setShowPhotoPicker(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white">Photo of the Day</h3>
                <span className="text-[10px] bg-white/10 text-white/70 font-semibold px-2 py-0.5 rounded-full border border-white/10">
                  1/day rule
                </span>
              </div>
              <p className="text-[11px] text-white/40">@{currentUser.username}</p>
            </div>
          </div>

          {/* Close / Streak Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#FF4D00] bg-[#FF4D00]/10 px-2.5 py-1 rounded-full border border-[#FF4D00]/20">
              <Flame className="w-3.5 h-3.5 fill-[#FF4D00]" />
              <span>{currentUser.currentStreak}d Streak</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ALREADY POSTED TODAY VIEW: Strict 1-photo/post-per-day notice */}
        {hasPostedToday ? (
          <div className="py-6 px-2 flex-1 flex flex-col items-center justify-center text-center space-y-5">
            {/* Lock / Check Icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-[#FF4D00]/10 border border-[#FF4D00]/30 flex items-center justify-center shadow-lg shadow-[#FF4D00]/10 animate-pulse">
                <CalendarCheck className="w-10 h-10 text-[#FF4D00]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            {/* Exact Requested Write-up */}
            <div className="space-y-2 max-w-sm">
              <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                You have already uploaded today
              </h4>
              <p className="text-sm font-semibold text-[#FF4D00] bg-[#FF4D00]/10 py-2 px-3.5 rounded-xl border border-[#FF4D00]/20">
                Please upload tomorrow
              </p>
              <p className="text-xs text-white/50 leading-relaxed pt-1">
                To maintain authentic daily habit accountability, each creator is limited to strictly{' '}
                <strong className="text-white">one photo of the day</strong>. No extra posts or tweets can be uploaded today.
              </p>
            </div>

            {/* Preview of Today's Uploaded Photo / Post */}
            {todayUserPost && (
              <div className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-3.5 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FF4D00] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Today’s Active Photo of the Day
                  </span>
                  <span className="text-[10px] text-white/40">{todayUserPost.createdAt}</span>
                </div>

                <div className="flex gap-3">
                  {todayUserPost.imageUrl && (
                    <img
                      src={todayUserPost.imageUrl}
                      alt="Today's uploaded photo"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 line-clamp-2 leading-snug">
                      {todayUserPost.content}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {todayUserPost.tags?.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/5"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer buttons */}
            <div className="w-full pt-2 flex flex-col sm:flex-row gap-2.5">
              {todayUserPost && onViewMyPost && (
                <button
                  type="button"
                  onClick={() => {
                    onViewMyPost(todayUserPost.id);
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#FF4D00]" />
                  <span>View Post Details</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-black font-black text-xs transition-all shadow-md shadow-[#FF4D00]/20 flex items-center justify-center gap-1.5"
              >
                <span>Understood</span>
              </button>
            </div>
          </div>
        ) : (
          /* FORM BODY: Only shown if user has not yet uploaded today */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
            {/* Headline prompt */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5 flex items-center justify-between">
                <span>Today's Photo & Habit Tweet</span>
                <span className="text-[10px] font-mono text-white/30">
                  {content.length}/300
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your photo of the day and what you accomplished today..."
                rows={4}
                maxLength={300}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-[#FF4D00] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-all resize-none leading-relaxed"
                autoFocus
              />
            </div>

            {/* Quick Idea Prompts */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
                Quick inspiration prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTION_PROMPTS.slice(0, 4).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setContent(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 text-white/70 hover:text-white transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo of the Day Upload & Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#FF4D00]" />
                  Photo of the Day (1/day)
                </span>
                {!imageUrl && (
                  <button
                    type="button"
                    onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                    className="text-xs text-[#FF4D00] hover:underline font-bold"
                  >
                    {showPhotoPicker ? 'Hide presets' : 'Browse presets'}
                  </button>
                )}
              </div>

              {imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] bg-black">
                  <img
                    src={imageUrl}
                    alt="Photo of the day"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-black text-red-400 rounded-full border border-white/10 shadow-md transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <label className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-colors text-xs font-bold text-white/80">
                      <Upload className="w-4 h-4 text-[#FF4D00]" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                      className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors text-xs font-bold text-white/80"
                    >
                      <Sparkles className="w-4 h-4 text-[#FF4D00]" />
                      Preset Photos
                    </button>
                  </div>

                  {showPhotoPicker && (
                    <div className="grid grid-cols-3 gap-2 p-2 bg-white/[0.03] rounded-2xl border border-white/10">
                      {PHOTO_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setImageUrl(preset.url);
                            setShowPhotoPicker(false);
                          }}
                          className="group relative rounded-xl overflow-hidden aspect-video border border-white/10 hover:border-[#FF4D00] transition-all text-left"
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
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

            {/* Select Tags */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-white/60">Habit Tags (max 5)</span>
                <span className="text-[10px] font-mono text-white/40">{selectedTags.length}/5</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
                {allTagOptions.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-[#FF4D00] text-black border-[#FF4D00] shadow-sm'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!content.trim()}
                className="w-full py-3.5 rounded-2xl bg-[#FF4D00] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FF4D00]/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#FF4D00]/20 min-h-[46px]"
              >
                <Flame className="w-4 h-4 fill-black" />
                <span>Upload Photo of the Day 🔥</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
