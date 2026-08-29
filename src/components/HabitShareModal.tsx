import React, { useRef, useState } from 'react';
import {
  X,
  Share2,
  Twitter,
  Download,
  Copy,
  Check,
  Flame,
  Sparkles,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';
import { PersonalHabit, User } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { getTodayDateString } from '../services/storage';

interface HabitShareModalProps {
  isOpen: boolean;
  habit: PersonalHabit | null;
  currentUser: User;
  onClose: () => void;
  onPostToFeed: (payload: { content: string; imageUrl?: string; tags: string[] }) => void;
  onSendToChat?: (text: string) => void;
}

const CARD_THEMES = [
  {
    id: 'lava',
    name: 'Prestige Gold',
    bg: 'from-[#1C1708] via-[#0D0D0D] to-[#050505]',
    border: 'border-[#D4AF37]/50',
    accent: '#D4AF37',
    glow: 'rgba(212, 175, 55, 0.20)',
  },
  {
    id: 'emerald',
    name: 'Emerald Discipline',
    bg: 'from-[#001A0E] via-[#0D0D0D] to-[#050505]',
    border: 'border-emerald-500/40',
    accent: '#10B981',
    glow: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'cyber',
    name: 'Cyber Blue',
    bg: 'from-[#001428] via-[#0D0D0D] to-[#050505]',
    border: 'border-blue-500/40',
    accent: '#3B82F6',
    glow: 'rgba(59, 130, 246, 0.15)',
  },
  {
    id: 'purple',
    name: 'Deep Violet',
    bg: 'from-[#140026] via-[#0D0D0D] to-[#050505]',
    border: 'border-purple-500/40',
    accent: '#A855F7',
    glow: 'rgba(168, 85, 247, 0.15)',
  },
];

export const HabitShareModal: React.FC<HabitShareModalProps> = ({
  isOpen,
  habit,
  currentUser,
  onClose,
  onPostToFeed,
  onSendToChat,
}) => {
  const [selectedTheme, setSelectedTheme] = useState(CARD_THEMES[0]);
  const [copiedTweet, setCopiedTweet] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !habit) return null;

  const today = getTodayDateString();
  const isCompletedToday = habit.completedDates.includes(today);
  const streakCount = habit.streak || (isCompletedToday ? 1 : 0);

  // Generate Tweet text
  const tweetText = `🔥 Checked in my daily habit: ${habit.icon} ${habit.title}! Currently on a ${streakCount}-day streak on Daily Social. Consistency is compounding! 🚀 #DailyHabits #${habit.category || 'Discipline'} #Streak`;

  const handleCopyTweet = () => {
    vibrateLight();
    navigator.clipboard?.writeText(tweetText);
    setCopiedTweet(true);
    setTimeout(() => setCopiedTweet(false), 2200);
  };

  const handleTweetToX = () => {
    vibrateLight();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  // Publish directly to Daily App community feed as a tweet/photo
  const handlePublishToFeed = () => {
    vibrateStreakMilestone();
    onPostToFeed({
      content: `🔥 Checked in my habit: ${habit.icon} ${habit.title}! Completed ${habit.completedDates.length} total sessions with a ${streakCount}-day active streak. Let's keep building! 💪`,
      imageUrl: habit.category === 'Fitness'
        ? 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80'
        : habit.category === 'Productivity'
        ? 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80'
        : habit.category === 'Learning' || habit.category === 'Mindfulness'
        ? 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1502224562085-639556652f33?w=1000&auto=format&fit=crop&q=80',
      tags: [habit.category || 'Habit', 'DailyHabits', 'Streak'],
    });
    onClose();
  };

  // Generate and download habit card as PNG image
  const handleDownloadCard = () => {
    vibrateLight();
    setDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 1200, 700);
        grad.addColorStop(0, '#0D0D0D');
        grad.addColorStop(0.5, '#141414');
        grad.addColorStop(1, '#050505');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 700);

        // Accent glow
        ctx.save();
        ctx.fillStyle = selectedTheme.accent;
        ctx.filter = 'blur(90px)';
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(600, 200, 300, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Card Frame Border
        ctx.strokeStyle = selectedTheme.accent;
        ctx.lineWidth = 4;
        ctx.strokeRect(40, 40, 1120, 620);

        // Header: DAILY.
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText('DAILY.', 80, 110);
        ctx.fillStyle = selectedTheme.accent;
        ctx.fillText('HABIT MILESTONE', 220, 110);

        // User name
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '28px sans-serif';
        ctx.fillText(`@${currentUser.username} • ${currentUser.name}`, 80, 160);

        // Habit title & icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 56px sans-serif';
        ctx.fillText(`${habit.icon} ${habit.title}`, 80, 290);

        // Category pill
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(80, 340, 260, 50);
        ctx.fillStyle = selectedTheme.accent;
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`CATEGORY: ${habit.category.toUpperCase()}`, 100, 375);

        // Streak box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(80, 430, 450, 160);
        ctx.strokeStyle = selectedTheme.accent;
        ctx.lineWidth = 2;
        ctx.strokeRect(80, 430, 450, 160);

        ctx.fillStyle = selectedTheme.accent;
        ctx.font = 'bold 64px sans-serif';
        ctx.fillText(`🔥 ${streakCount} DAYS`, 110, 515);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '22px sans-serif';
        ctx.fillText(`Active daily streak • Target: ${habit.targetDaysPerWeek}x/week`, 110, 560);

        // Total Sessions box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(570, 430, 550, 160);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeRect(570, 430, 550, 160);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 64px sans-serif';
        ctx.fillText(`⚡ ${habit.completedDates.length} CHECK-INS`, 600, 515);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '22px sans-serif';
        ctx.fillText('Total habit sessions logged on Daily Social', 600, 560);

        // Download link
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `daily-habit-${habit.title.toLowerCase().replace(/\s+/g, '-')}-streak.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to export image canvas:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      id="habit-share-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0D0D0D] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Share Habit as Photo or Tweet
              </h2>
              <p className="text-[11px] text-white/50">Celebrate your consistency across platforms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
          {/* Card Theme Picker */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
              Card Theme:
            </span>
            <div className="flex items-center gap-1.5">
              {CARD_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                    selectedTheme.id === theme.id
                      ? `${theme.border} bg-white/10 text-white scale-105 shadow-md`
                      : 'border-white/10 text-white/40 hover:text-white'
                  }`}
                  style={{ color: selectedTheme.id === theme.id ? theme.accent : undefined }}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Habit Visual Share Card (The Photo preview) */}
          <div
            ref={cardRef}
            className={`p-6 rounded-3xl bg-gradient-to-br ${selectedTheme.bg} border ${selectedTheme.border} shadow-2xl relative overflow-hidden space-y-4`}
          >
            {/* Glow orb */}
            <div
              className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl pointer-events-none"
              style={{ backgroundColor: selectedTheme.glow }}
            />

            {/* Card Brand Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {currentUser.name}
                  </h4>
                  <span className="text-[10px] text-white/50">@{currentUser.username}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-black/60 border border-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-white/80">
                <span>DAILY</span>
                <span style={{ color: selectedTheme.accent }}>.</span>
              </div>
            </div>

            {/* Card Habit Title & Icon */}
            <div className="space-y-1 relative z-10 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl shadow-inner">
                  {habit.icon}
                </div>
                <div>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border bg-white/5"
                    style={{ color: selectedTheme.accent, borderColor: `${selectedTheme.accent}40` }}
                  >
                    {habit.category}
                  </span>
                  <h3 className="text-lg font-black text-white leading-snug mt-1">
                    {habit.title}
                  </h3>
                </div>
              </div>
            </div>

            {/* Streak Counter & Milestone Box */}
            <div className="grid grid-cols-2 gap-2.5 relative z-10 pt-1">
              <div className="p-3 bg-black/40 rounded-2xl border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] text-white/50 uppercase font-semibold">
                  Habit Streak
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span
                    className="text-2xl font-black tracking-tight"
                    style={{ color: selectedTheme.accent }}
                  >
                    🔥 {streakCount}d
                  </span>
                </div>
                <span className="text-[9px] text-white/40 mt-0.5">Consecutive check-ins</span>
              </div>

              <div className="p-3 bg-black/40 rounded-2xl border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] text-white/50 uppercase font-semibold">
                  Total Completed
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-white tracking-tight">
                    ⚡ {habit.completedDates.length}
                  </span>
                </div>
                <span className="text-[9px] text-white/40 mt-0.5">Target {habit.targetDaysPerWeek}x/week</span>
              </div>
            </div>

            {/* Card Footer Badge */}
            <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5 relative z-10">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Verified Daily Streak
              </span>
              <span>{today}</span>
            </div>
          </div>

          {/* Tweet Preview Box */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-[#1DA1F2]" />
                Tweet / Post Caption
              </span>
              <button
                onClick={handleCopyTweet}
                className="text-[10px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
              >
                {copiedTweet ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-white/80 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed font-mono select-all">
              {tweetText}
            </p>
          </div>

          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Share to X (Twitter) */}
            <button
              onClick={handleTweetToX}
              className="p-3.5 rounded-2xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-white flex items-center gap-3 transition-all min-h-[48px] active:scale-95 group text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-[#1DA1F2] text-white flex items-center justify-center shrink-0">
                <Twitter className="w-4 h-4 fill-white" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">Tweet on X</span>
                <span className="text-[10px] text-white/50">Open in Twitter</span>
              </div>
            </button>

            {/* Download Card as Photo */}
            <button
              onClick={handleDownloadCard}
              disabled={downloading}
              className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-3 transition-all min-h-[48px] active:scale-95 text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight">Save Photo Card</span>
                <span className="text-[10px] text-white/50">PNG Image format</span>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Footer: Post directly to Daily Feed */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 min-h-[42px]"
          >
            Cancel
          </button>

          <button
            onClick={handlePublishToFeed}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/25 min-h-[42px] active:scale-95"
          >
            <ImageIcon className="w-4 h-4 text-black" />
            <span>Post to Community Feed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
