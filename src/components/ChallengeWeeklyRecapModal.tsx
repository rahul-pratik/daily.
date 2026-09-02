import React, { useState } from 'react';
import {
  X,
  Trophy,
  Crown,
  Sparkles,
  Share2,
  Users,
  Flame,
  CheckCircle2,
  Send,
  Copy,
  Check,
  MessageCircle,
  TrendingUp,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { Challenge, ChallengeWeeklyRecap, User } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface ChallengeWeeklyRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  currentUser: User;
  onRecapPublished?: (recap: ChallengeWeeklyRecap) => void;
  onGoToTeamChat?: () => void;
}

export const ChallengeWeeklyRecapModal: React.FC<ChallengeWeeklyRecapModalProps> = ({
  isOpen,
  onClose,
  challenge,
  currentUser,
  onRecapPublished,
  onGoToTeamChat,
}) => {
  const [recap, setRecap] = useState<ChallengeWeeklyRecap>(() => {
    return DailyStorageService.generateWeeklyChallengeRecap(challenge.id);
  });
  const [customCommentary, setCustomCommentary] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublished, setIsPublished] = useState(Boolean(recap.isPublished));

  if (!isOpen) return null;

  const handlePublish = () => {
    vibrateStreakMilestone();
    setIsPublishing(true);

    try {
      const result = DailyStorageService.publishChallengeRecapPost(
        challenge.id,
        recap,
        customCommentary
      );
      setIsPublished(true);
      if (onRecapPublished) {
        onRecapPublished(recap);
      }
    } catch (err) {
      console.error('Failed to publish challenge recap', err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopySummary = () => {
    vibrateLight();
    const squadInfo = recap.topSquad
      ? `\n🏆 Top Squad: ${recap.topSquad.name} (${recap.topSquad.checkinsCount} receipts)`
      : '';

    const textToCopy = `📊 WEEK ${recap.weekNumber} CHALLENGE RECAP: ${recap.challengeIcon} ${recap.challengeTitle}

🔥 Collective Progress:
• ${recap.totalCollectiveCheckins} Verified Receipts Logged
• ${recap.cohortConsistencyRate}% Consistency Rate
• ${recap.activeSquadsCount} Competing Squads${squadInfo}

👑 Week ${recap.weekNumber} MVP: ${recap.mvpContributor.userName} (@${recap.mvpContributor.userUsername})
${recap.mvpContributor.mvpTitle} — ${recap.mvpContributor.accolade}

Highlights:
${recap.highlights.map((h) => `• ${h}`).join('\n')}
${customCommentary ? `\n"${customCommentary}"` : ''}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0A0A0A] border border-[#D4AF37]/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] text-white">
        {/* Header with Gold Ribbon */}
        <div className="relative p-5 bg-gradient-to-b from-[#D4AF37]/20 via-[#D4AF37]/5 to-transparent border-b border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Week {recap.weekNumber} Summary</span>
                </span>
                <span className="text-[10px] text-white/40 flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3 text-white/40" />
                  <span>
                    {recap.startDate} — {recap.endDate}
                  </span>
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-1.5">
                <span>{recap.challengeIcon}</span>
                <span>{recap.challengeTitle}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Collective Progress Metric Badges */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                Total Receipts
              </span>
              <p className="text-lg font-black text-amber-400 font-mono">
                {recap.totalCollectiveCheckins}
              </p>
              <span className="text-[9px] text-emerald-400 flex items-center justify-center gap-0.5 font-bold">
                <TrendingUp className="w-2.5 h-2.5" />
                Verified
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                Consistency
              </span>
              <p className="text-lg font-black text-white font-mono">
                {recap.cohortConsistencyRate}%
              </p>
              <span className="text-[9px] text-white/40 font-bold">On-Time Pace</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">
                Active Squads
              </span>
              <p className="text-lg font-black text-white font-mono">
                {recap.activeSquadsCount}
              </p>
              <span className="text-[9px] text-amber-300 font-bold">
                {recap.topSquad ? 'Competing' : 'Solo Group'}
              </span>
            </div>
          </div>

          {/* MVP CONTRIBUTOR SPOTLIGHT CARD */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 relative overflow-hidden space-y-3">
            <div className="absolute top-2 right-3 text-amber-400/20 font-black text-5xl select-none pointer-events-none">
              MVP
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>MVP Contributor of the Week</span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <img
                  src={recap.mvpContributor.userAvatar}
                  alt={recap.mvpContributor.userName}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-md shadow-amber-500/20"
                />
                <div className="w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center absolute -top-1.5 -right-1.5 shadow-md">
                  👑
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-sm text-white truncate">
                    {recap.mvpContributor.userName}
                  </h3>
                  <span className="text-xs text-white/50">
                    @{recap.mvpContributor.userUsername}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    {recap.mvpContributor.mvpTitle}
                  </span>
                  {recap.mvpContributor.teamName && (
                    <span className="text-[10px] text-white/60">
                      Squad: {recap.mvpContributor.teamName}
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/80 mt-1 leading-snug">
                  {recap.mvpContributor.accolade}
                </p>
              </div>
            </div>

            {/* MVP Quick Stats Pill */}
            <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold">
                  {recap.mvpContributor.userStreak} Day Streak
                </span>
              </div>
              <span className="text-white/60 text-[11px]">
                {recap.mvpContributor.weeklyCheckins} check-ins • {recap.mvpContributor.cheersReceived} cheers received
              </span>
            </div>
          </div>

          {/* Top Squad Highlight (if squads exist) */}
          {recap.topSquad && (
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 font-black text-sm shrink-0">
                  #1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-white">
                      Top Squad: {recap.topSquad.name}
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full font-bold">
                      Leader
                    </span>
                  </div>
                  {recap.topSquad.motto && (
                    <p className="text-[11px] text-white/50 italic">
                      "{recap.topSquad.motto}"
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-black text-amber-400 text-sm">
                  {recap.topSquad.checkinsCount}
                </span>
                <p className="text-[9px] text-white/40 uppercase">Receipts</p>
              </div>
            </div>
          )}

          {/* Key Highlights Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-white/80 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Weekly Accomplishments</span>
            </h4>
            <div className="space-y-1.5">
              {recap.highlights.map((h, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs text-white/70"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Leader Commentary */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white/70 flex items-center justify-between">
              <span>Squad Leader Commentary (Optional)</span>
              <span className="text-[10px] text-white/40">Included in feed post</span>
            </label>
            <textarea
              value={customCommentary}
              onChange={(e) => setCustomCommentary(e.target.value)}
              placeholder="Add motivational notes or personal shoutouts to the cohort..."
              rows={2}
              className="w-full bg-[#111111] border border-white/15 focus:border-amber-400 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0F0F0F] border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              title="Copy Summary Text"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-white/60" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {onGoToTeamChat && (
              <button
                onClick={() => {
                  vibrateLight();
                  onClose();
                  onGoToTeamChat();
                }}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 hover:text-amber-200 font-bold text-xs flex items-center gap-1.5 transition-all"
                title="Go to Team Chat"
              >
                <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Go to Team Chat</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs text-white/60 hover:text-white font-bold transition-colors"
            >
              Close
            </button>

            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md ${
                isPublished
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-amber-400 to-[#D4AF37] hover:from-amber-300 hover:to-amber-400 text-black shadow-amber-500/20 active:scale-95'
              }`}
            >
              {isPublished ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Published to Feed</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-black" />
                  <span>{isPublishing ? 'Publishing...' : 'Publish Recap Post'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
