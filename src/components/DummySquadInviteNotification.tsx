import React, { useState } from 'react';
import { Users, Check, X, Shield, Flame, Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { vibrateLight, vibrateSuccess } from '../services/haptics';

interface DummySquadInviteNotificationProps {
  onAccept?: () => void;
  onDecline?: () => void;
  onOpenChallenge?: (challengeId: string) => void;
  challengeId?: string;
  challengeTitle?: string;
  squadName?: string;
  inviterName?: string;
  inviterUsername?: string;
  inviterAvatar?: string;
  inviterStreak?: number;
}

export const DummySquadInviteNotification: React.FC<DummySquadInviteNotificationProps> = ({
  onAccept,
  onDecline,
  onOpenChallenge,
  challengeId = 'challenge_trio_spartan',
  challengeTitle = 'Trio 21-Day Spartan Conditioning',
  squadName = 'Spartan Strike Force',
  inviterName = 'Sarah Chen',
  inviterUsername = 'sarahcodes',
  inviterAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  inviterStreak = 21,
}) => {
  const [inviteState, setInviteState] = useState<'pending' | 'accepted' | 'declined'>('pending');

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrateSuccess();
    setInviteState('accepted');
    if (onAccept) {
      onAccept();
    }
  };

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrateLight();
    setInviteState('declined');
    if (onDecline) {
      onDecline();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    vibrateLight();
    setInviteState('pending');
  };

  return (
    <div
      id="dummy-squad-invite-notification"
      className="p-3.5 sm:p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-[#121212] to-[#0D0D0D] text-white shadow-xl relative overflow-hidden transition-all duration-200 hover:border-amber-500/50 group"
    >
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
            Squad Invitation Preview
          </span>
        </div>
        <span className="text-[10px] font-mono text-white/40">Interactive Demo</span>
      </div>

      <div className="flex items-start gap-3">
        {/* Inviter Avatar with Squad Badge */}
        <div className="relative shrink-0">
          <img
            src={inviterAvatar}
            alt={inviterName}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border border-amber-400/40 ring-2 ring-amber-500/20"
          />
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500/30 border border-amber-500/60 flex items-center justify-center text-amber-300 backdrop-blur-xs"
            title="Squad Invitation"
          >
            <Users className="w-3 h-3 text-amber-400" />
          </div>
        </div>

        {/* Invite Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-xs text-white leading-snug">
              <span className="font-black text-white hover:text-amber-400 transition-colors mr-1">
                {inviterName}
              </span>
              <span className="text-white/40 text-[11px] mr-1.5">@{inviterUsername}</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[9px] mr-1.5 align-middle">
                <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {inviterStreak}d
              </span>
            </div>
            <span className="text-[10px] text-white/40 whitespace-nowrap shrink-0">Just now</span>
          </div>

          <p className="text-xs text-white/80 mt-1 leading-relaxed">
            invited you to join squad{' '}
            <span className="font-bold text-amber-300">"{squadName}"</span> in{' '}
            <span className="font-semibold text-white">"{challengeTitle}"</span> 🛡️
          </p>

          {/* Squad Details Card Snippet */}
          <div className="mt-2 p-2 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-2 flex-wrap text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-bold text-white truncate">{squadName}</span>
              <span className="text-white/30">•</span>
              <span className="text-white/60 text-[10px]">Team Accountability</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <Sparkles className="w-3 h-3" />
              <span>3/3 Daily Streak</span>
            </div>
          </div>

          {/* Actions: Accept, Decline, or Status Confirmation */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {inviteState === 'pending' && (
              <>
                {/* Accept Button */}
                <button
                  id="dummy-invite-accept-btn"
                  type="button"
                  onClick={handleAccept}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Accept</span>
                </button>

                {/* Decline Button */}
                <button
                  id="dummy-invite-decline-btn"
                  type="button"
                  onClick={handleDecline}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/15 text-white/70 hover:text-red-400 border border-white/10 hover:border-red-500/30 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Decline</span>
                </button>

                {/* View Challenge Button */}
                {onOpenChallenge && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      vibrateLight();
                      onOpenChallenge(challengeId);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-bold transition-colors ml-auto flex items-center gap-1"
                  >
                    <span>View Challenge</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </>
            )}

            {inviteState === 'accepted' && (
              <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>You accepted the invite & joined {squadName}! 🎉</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[10px] text-white/40 hover:text-white underline transition-colors"
                >
                  Reset Preview
                </button>
              </div>
            )}

            {inviteState === 'declined' && (
              <div className="flex items-center justify-between w-full gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>Invitation declined</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[10px] text-white/40 hover:text-white underline transition-colors"
                >
                  Reset Preview
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
