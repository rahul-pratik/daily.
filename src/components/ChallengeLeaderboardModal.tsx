import React from 'react';
import { X, Trophy } from 'lucide-react';
import { Challenge, User } from '../types';
import { ChallengeLeaderboardView } from './ChallengeLeaderboardView';

interface ChallengeLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  currentUser: User;
  onOpenInvite?: () => void;
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
}

export const ChallengeLeaderboardModal: React.FC<ChallengeLeaderboardModalProps> = ({
  isOpen,
  onClose,
  challenge,
  currentUser,
  onOpenInvite,
  onViewUser,
}) => {
  if (!isOpen || !challenge) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
              {challenge.icon || '🏆'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Challenge Leaderboard
                </span>
                <span className="text-xs text-white/50">{challenge.durationDays} Days</span>
              </div>
              <h2 className="text-base font-black text-white truncate mt-0.5">
                {challenge.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close leaderboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <ChallengeLeaderboardView
            challenge={challenge}
            currentUser={currentUser}
            onOpenInvite={onOpenInvite}
            onViewUser={onViewUser}
          />
        </div>
      </div>
    </div>
  );
};
