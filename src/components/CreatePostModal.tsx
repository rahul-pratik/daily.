import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, Flame, Check, Upload, Trash2 } from 'lucide-react';
import { User, AVAILABLE_HABITS, AVAILABLE_INTERESTS } from '../types';
import { getTodayDateString } from '../services/storage';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSubmitPost: (payload: { content: string; imageUrl?: string; tags: string[] }) => void;
}

const PHOTO_PRESETS = [
  {
    name: 'Workspace',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Gym Workout',
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
    name: 'Code IDE',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
  },
  {
    name: 'Minimal Design',
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
  onSubmitPost,
}) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Build Projects']);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  if (!isOpen) return null;

  const today = getTodayDateString();
  const alreadyPostedToday = currentUser.lastPostedDate === today;

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
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Daily Update</h3>
              <p className="text-[11px] text-white/40">@{currentUser.username}</p>
            </div>
          </div>

          {/* Streak Status Pill */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                alreadyPostedToday
                  ? 'bg-white/5 border-white/10 text-white/40'
                  : 'bg-[#FF4D00]/10 border-[#FF4D00]/30 text-[#FF4D00]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-[#FF4D00] text-[#FF4D00]" />
              {alreadyPostedToday ? 'Extra post today' : 'Streak check-in'}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Headline prompt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5 flex items-center justify-between">
              <span>What did you do today?</span>
              <span className="text-[10px] font-mono text-white/30">
                {content.length}/300
              </span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what you learned, built, or accomplished today..."
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

          {/* Image preview or selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#FF4D00]" />
                Optional Photo
              </span>
              {!imageUrl && (
                <button
                  type="button"
                  onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                  className="text-xs text-[#FF4D00] hover:underline font-bold"
                >
                  {showPhotoPicker ? 'Hide presets' : 'Browse photo presets'}
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[16/9] bg-black">
                <img
                  src={imageUrl}
                  alt="Post Attachment"
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
                {/* Upload or Choose from presets */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-colors text-xs font-bold text-white/80">
                    <Upload className="w-4 h-4 text-[#FF4D00]" />
                    Upload from device
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
              <span className="text-xs font-bold uppercase tracking-wider text-white/60">Select tags (max 5)</span>
              <span className="text-[10px] font-mono text-white/40">{selectedTags.length}/5 selected</span>
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
              className="w-full py-3.5 rounded-2xl bg-[#FF4D00] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FF4D00]/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#FF4D00]/20"
            >
              <Flame className="w-4 h-4 fill-black" />
              <span>Post Today’s Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
