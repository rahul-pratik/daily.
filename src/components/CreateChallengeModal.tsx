import React, { useState } from 'react';
import {
  X,
  Trophy,
  Calendar as CalendarIcon,
  Flame,
  Target,
  Sparkles,
  Clock,
  Check,
  Plus,
} from 'lucide-react';
import { User, Challenge } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onChallengeCreated: (challenge: Challenge) => void;
}

const EMOJI_OPTIONS = ['💻', '🏋️‍♂️', '🏃‍♂️', '📚', '🌅', '🧘‍♂️', '🎨', '✍️', '🌱', '🎵', '⚡', '🔥'];

const DURATION_PRESETS = [7, 14, 21, 30, 60, 90, 100];

const CATEGORIES = [
  'Coding',
  'Fitness',
  'Running',
  'Learning',
  'Mindset',
  'Design',
  'Writing',
  'Discipline',
];

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onChallengeCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🔥');
  const [category, setCategory] = useState('Coding');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [deadlineDate, setDeadlineDate] = useState(() => {
    // Default deadline: today + 30 days
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [tag, setTag] = useState('');

  if (!isOpen) return null;

  const handleDurationSelect = (days: number) => {
    vibrateLight();
    setDurationDays(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    return setDeadlineDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    vibrateStreakMilestone();
    const newChallenge = DailyStorageService.createChallenge({
      title: title.trim(),
      description: description.trim(),
      icon,
      category,
      durationDays,
      deadlineDate,
      tag: tag.trim() || category,
    });

    onChallengeCreated(newChallenge);
    onClose();
  };

  return (
    <div
      id="create-challenge-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0D0D0D] border border-white/15 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-xl shrink-0">
              {icon}
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                Create Grounded Challenge
              </h3>
              <p className="text-[10px] text-white/50">Set duration, standard & deadline</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-1">
          {/* Icon Selector */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
              Challenge Icon / Emoji
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setIcon(emoji);
                  }}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center shrink-0 transition-all ${
                    icon === emoji
                      ? 'bg-[#D4AF37] border-2 border-white scale-110 shadow-md'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
              Challenge Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 30 Days of Rust & Backend, 60-Day Strength"
              className="w-full bg-[#141414] border border-white/15 focus:border-[#D4AF37] rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setCategory(cat);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all min-h-[30px] ${
                    category === cat
                      ? 'bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/25'
                      : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Duration in Days */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Duration (Days)</span>
              <span className="text-blue-400 font-bold">{durationDays} Days Window</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_PRESETS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleDurationSelect(days)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all min-h-[32px] ${
                    durationDays === days
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>

          {/* Deadline Date */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Deadline Date</span>
              <span className="text-white/40 text-[10px]">Posting closes on deadline</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={deadlineDate}
                min={getTodayDateString()}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full bg-[#141414] border border-white/15 focus:border-[#D4AF37] rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Goal Description */}
          <div>
            <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
              Challenge Standard & Goal
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What must participants execute every single day? (e.g., Code for at least 45 minutes and insert photo proof receipt)."
              rows={3}
              className="w-full bg-[#141414] border border-white/15 focus:border-[#D4AF37] rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors resize-none leading-relaxed"
              required
            />
          </div>

          {/* Submit (Golden Theme) */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!title.trim() || !description.trim()}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 min-h-[44px] ${
                title.trim() && description.trim()
                  ? 'bg-[#D4AF37] hover:bg-[#e5c158] text-black shadow-[#D4AF37]/25 hover:scale-[1.01]'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <Trophy className="w-4 h-4 text-black" />
              <span>Launch {durationDays}-Day Challenge</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
