import React, { useState } from 'react';
import {
  X,
  Trophy,
  Users,
  Target,
  Send,
  Sparkles,
  Check,
  Flame,
  Clock,
  Crown,
  ChevronRight,
  PlusCircle,
  AlertCircle,
} from 'lucide-react';
import { User, Group, Challenge, ChallengeTeam } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface DirectChallengeInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  initialChallengeId?: string;
  targetUser?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    streak: number;
  } | null;
  targetGroup?: Group | null;
  onInviteSent?: (challenge: Challenge) => void;
  onOpenCreateChallenge?: () => void;
}

const QUICK_NOTES = [
  "Let's crush this streak together! 🔥",
  "No zero days! You in for this challenge? 🚀",
  "Join my squad and let's top the leaderboard! 👑",
  "Dare you to complete every single day! ⚡️",
];

export const DirectChallengeInviteModal: React.FC<DirectChallengeInviteModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialChallengeId,
  targetUser,
  targetGroup,
  onInviteSent,
  onOpenCreateChallenge,
}) => {
  const [allChallenges] = useState<Challenge[]>(() => DailyStorageService.getAllChallenges());
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(() => {
    // Default to first joined challenge or first challenge
    const joined = allChallenges.find((c) => (c.participantIds || []).includes(currentUser.id));
    return initialChallengeId || joined?.id || allChallenges[0]?.id || '';
  });
  const [selectedTeamId, setSelectedTeamId] = useState<string | undefined>();
  const [noteText, setNoteText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedChallenge = allChallenges.find((c) => c.id === selectedChallengeId);
  const isGroup = selectedChallenge?.challengeType === 'group';
  const myTeam = selectedChallenge ? DailyStorageService.getUserChallengeTeam(selectedChallenge.id, currentUser.id) : undefined;

  const handleSelectChallenge = (c: Challenge) => {
    vibrateLight();
    setSelectedChallengeId(c.id);
    const userTeam = DailyStorageService.getUserChallengeTeam(c.id, currentUser.id);
    if (userTeam) {
      setSelectedTeamId(userTeam.id);
    } else {
      setSelectedTeamId(undefined);
    }
  };

  const handleSend = () => {
    if (!selectedChallenge) {
      setError('Please select a challenge to send an invite.');
      return;
    }

    if (!targetUser && !targetGroup) {
      setError('No target recipient selected.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      DailyStorageService.sendChallengeInvite({
        challengeId: selectedChallenge.id,
        targetUserId: targetUser?.id,
        targetGroupId: targetGroup?.id,
        teamId: selectedTeamId,
        note: noteText.trim() || undefined,
      });

      vibrateStreakMilestone();
      setSentSuccess(true);
      if (onInviteSent) {
        onInviteSent(selectedChallenge);
      }

      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to send challenge invite');
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0D0D0D] border border-amber-500/30 rounded-[32px] overflow-hidden shadow-2xl text-white flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60 sticky top-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/20 shrink-0">
              <Trophy className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 truncate">
                <span>Direct Challenge Invite</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </h2>
              {targetUser ? (
                <p className="text-[11px] text-white/60 truncate flex items-center gap-1 mt-0.5">
                  <span>Inviting</span>
                  <strong className="text-amber-300">@{targetUser.username}</strong>
                  <span>({targetUser.name})</span>
                </p>
              ) : targetGroup ? (
                <p className="text-[11px] text-white/60 truncate flex items-center gap-1 mt-0.5">
                  <span>Inviting group</span>
                  <strong className="text-amber-300">{targetGroup.name}</strong>
                </p>
              ) : null}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {sentSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl shadow-xl shadow-emerald-500/10">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-lg font-black text-white">Challenge Invite Sent!</h3>
              <p className="text-xs text-white/60 max-w-xs">
                {targetUser ? `@${targetUser.username}` : targetGroup?.name} will receive your direct invite card and notification to join {selectedChallenge?.title}.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Select Challenge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>1. Select Challenge</span>
                  </label>
                  {onOpenCreateChallenge && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCreateChallenge();
                      }}
                      className="text-[10px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Create New</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {allChallenges.map((ch) => {
                    const isSelected = ch.id === selectedChallengeId;
                    const isJoined = (ch.participantIds || []).includes(currentUser.id);
                    const isGroupCh = ch.challengeType === 'group';

                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleSelectChallenge(ch)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-xl shrink-0">
                            {ch.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-white truncate">
                                {ch.title}
                              </span>
                              {isGroupCh ? (
                                <span className="text-[9px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                                  Squad
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-blue-300 bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-500/30">
                                  Solo
                                </span>
                              )}
                              {isJoined && (
                                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/25">
                                  Joined
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-white/50 mt-0.5">
                              <span>{ch.durationDays} Days</span>
                              <span>•</span>
                              <span>{ch.participantsCount || 1} members</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-amber-400 border-amber-400 text-black'
                                : 'border-white/30'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: If Group Challenge, Squad Selection */}
              {isGroup && selectedChallenge && (
                <div className="p-3.5 rounded-2xl bg-[#141414] border border-amber-500/20 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Squad Assignment</span>
                    </label>
                    <span className="text-[10px] text-white/40">Max {selectedChallenge.teamSize || 3} members</span>
                  </div>

                  {myTeam ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">Invite to your squad: {myTeam.name}</p>
                          <p className="text-[10px] text-white/50">
                            {myTeam.memberIds.length}/{myTeam.maxMembers} members active
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                        Selected
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-white/60 leading-relaxed">
                      Invitee can join an existing squad or team up with you inside the challenge hub.
                    </p>
                  )}
                </div>
              )}

              {/* Step 3: Optional Personal Note / Dare */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-white/70 flex items-center justify-between">
                  <span>2. Add a Personal Note / Challenge Dare</span>
                  <span className="text-[10px] text-white/40">Optional</span>
                </label>

                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Let's stay locked in and post our photo proofs daily! 🔥"
                  rows={2}
                  maxLength={160}
                  className="w-full bg-[#141414] border border-white/15 focus:border-amber-400 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors resize-none"
                />

                {/* Quick Note Presets */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {QUICK_NOTES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNoteText(preset)}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-[10px] whitespace-nowrap transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Action */}
        {!sentSuccess && (
          <div className="p-4 border-t border-white/10 bg-black/60 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || !selectedChallenge}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Sending...' : 'Send Challenge Invite'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
