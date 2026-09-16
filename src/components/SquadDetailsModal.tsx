import React, { useState } from 'react';
import {
  X,
  Users,
  Flame,
  CheckCircle2,
  Clock,
  Crown,
  MessageSquare,
  UserPlus,
  Heart,
  Calendar,
  ExternalLink,
  ChevronRight,
  Shield,
  Sparkles,
  Layers,
  Filter,
} from 'lucide-react';
import { Challenge, ChallengeTeam, ChallengeTeamMember, ChallengeProgressPost, User } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface SquadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  squad: ChallengeTeam | null;
  challenge: Challenge | null;
  currentUser: User;
  onOpenSquadChat?: (squadId: string) => void;
  onJoinSquad?: (squadId: string) => void;
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak?: number }) => void;
}

export const SquadDetailsModal: React.FC<SquadDetailsModalProps> = ({
  isOpen,
  onClose,
  squad,
  challenge,
  currentUser,
  onOpenSquadChat,
  onJoinSquad,
  onViewUser,
}) => {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; caption?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'activity' | 'members'>('activity');

  if (!isOpen || !squad || !challenge) return null;

  const todayStr = getTodayDateString();
  const isCurrentUserMember = squad.members.some((m) => m.userId === currentUser.id);
  const isSquadFull = squad.members.length >= (squad.maxMembers || 3);
  const squadStreak = DailyStorageService.getSquadCollectiveStreak(challenge.id, squad.id);

  // Fetch all challenge progress posts for this challenge
  const allChallengePosts = DailyStorageService.getAllChallengeProgressPosts(challenge.id) || [];
  
  // Teammate user IDs
  const memberIds = squad.members.map((m) => m.userId);

  // Filter posts belonging to this squad (by teamId or memberIds)
  const squadProofs = allChallengePosts.filter(
    (p) => (p.teamId && p.teamId === squad.id) || memberIds.includes(p.userId)
  );

  // Filter by selected member if applied
  const displayedProofs = selectedMemberFilter
    ? squadProofs.filter((p) => p.userId === selectedMemberFilter)
    : squadProofs;

  // Track who submitted proof today
  const submittedTodayUserIds = new Set(
    squadProofs.filter((p) => p.postDate === todayStr).map((p) => p.userId)
  );

  const handleToggleCheer = (postId: string) => {
    vibrateLight();
    DailyStorageService.toggleCheerChallengePost(postId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#0A0A0A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative p-5 sm:p-6 border-b border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer z-10"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Active Squad</span>
            </span>
            <span className="text-[11px] text-white/50 font-medium">
              in {challenge.title}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>{squad.name}</span>
          </h2>

          {squad.motto && (
            <p className="text-xs sm:text-sm text-white/70 italic mt-1 font-medium">
              "{squad.motto}"
            </p>
          )}

          {/* Squad Metrics Row */}
          <div className="flex items-center gap-3 sm:gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{squadStreak}-Day Streak</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>{squad.totalCheckinsCount || squadProofs.length} Total Receipts</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/80 font-bold text-xs">
              <Users className="w-4 h-4 text-white/60" />
              <span>
                {squad.members.length}/{squad.maxMembers} Members
              </span>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                vibrateLight();
                setActiveTab('activity');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-white text-black shadow-sm font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Proof Activity ({squadProofs.length})</span>
            </button>

            <button
              onClick={() => {
                vibrateLight();
                setActiveTab('members');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-white text-black shadow-sm font-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Team Members ({squad.members.length})</span>
            </button>
          </div>

          {isCurrentUserMember && onOpenSquadChat && (
            <button
              onClick={() => {
                vibrateLight();
                onOpenSquadChat(squad.id);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Squad Chat</span>
            </button>
          )}

          {!isCurrentUserMember && !isSquadFull && onJoinSquad && (
            <button
              onClick={() => {
                vibrateStreakMilestone();
                onJoinSquad(squad.id);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Join Squad</span>
            </button>
          )}
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: SQUAD ACTIVITY & PROOFS ("STUFFS WHAT THEY DID") */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Teammates filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedMemberFilter(null)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedMemberFilter === null
                      ? 'bg-white/20 text-white font-black border border-white/30'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  All Teammates ({squadProofs.length})
                </button>

                {squad.members.map((m) => {
                  const memberProofCount = squadProofs.filter((p) => p.userId === m.userId).length;
                  const isSelected = selectedMemberFilter === m.userId;
                  return (
                    <button
                      key={m.userId}
                      onClick={() => setSelectedMemberFilter(isSelected ? null : m.userId)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-black font-black'
                          : 'bg-white/5 text-white/70 hover:text-white border border-white/10'
                      }`}
                    >
                      <img
                        src={m.userAvatar}
                        alt={m.userName}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>{m.userName.split(' ')[0]}</span>
                      <span className={isSelected ? 'text-black/70' : 'text-white/40'}>
                        ({memberProofCount})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Feed of Proofs and Activities */}
              {displayedProofs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {displayedProofs.map((post) => {
                    const isLiked = Boolean(post.cheeredByMe);
                    return (
                      <div
                        key={post.id}
                        className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl overflow-hidden transition-all flex flex-col group"
                      >
                        {/* Member Header */}
                        <div className="p-3 flex items-center justify-between gap-2 border-b border-white/5">
                          <div
                            onClick={() => {
                              if (onViewUser) {
                                onViewUser({
                                  id: post.userId,
                                  name: post.userName,
                                  username: post.userUsername,
                                  avatar: post.userAvatar,
                                  streak: post.userStreak,
                                });
                              }
                            }}
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={post.userAvatar}
                              alt={post.userName}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover border border-white/20"
                            />
                            <div>
                              <p className="text-xs font-bold text-white leading-tight">
                                {post.userName}
                              </p>
                              <p className="text-[10px] text-white/50">
                                @{post.userUsername}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                              Day {post.dayNumber}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {post.postDate || post.createdAt}
                            </span>
                          </div>
                        </div>

                        {/* Photo Proof */}
                        {post.imageUrl && (
                          <div
                            onClick={() => setPreviewImage({ url: post.imageUrl, caption: post.text })}
                            className="relative aspect-video w-full bg-black/40 overflow-hidden cursor-pointer"
                          >
                            <img
                              src={post.imageUrl}
                              alt="Proof Receipt"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                              <span>Click to enlarge 🔍</span>
                            </div>
                          </div>
                        )}

                        {/* Caption Notes */}
                        {post.text && (
                          <div className="p-3 text-xs text-white/80 leading-relaxed font-normal flex-1">
                            {post.text}
                          </div>
                        )}

                        {/* Footer / Cheer Action */}
                        <div className="px-3 py-2 border-t border-white/5 bg-black/20 flex items-center justify-between text-xs">
                          <button
                            onClick={() => handleToggleCheer(post.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                              isLiked
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                            />
                            <span>{post.cheersCount || 0} Cheers</span>
                          </button>

                          <span className="text-[10px] text-white/40">
                            Verified Receipt ✓
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 px-4 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3 text-amber-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {selectedMemberFilter
                      ? 'No receipts submitted by this teammate yet'
                      : 'No squad receipts submitted yet'}
                  </h4>
                  <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                    Once squad members upload daily proofs for this challenge, their work, photos, and milestones will be listed here.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEAM MEMBERS LIST */}
          {activeTab === 'members' && (
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/50">
                Squad Roster ({squad.members.length}/{squad.maxMembers})
              </h3>

              <div className="space-y-2">
                {squad.members.map((member) => {
                  const isLeader = member.role === 'leader' || member.userId === squad.leaderId;
                  const isSubmitted = submittedTodayUserIds.has(member.userId);
                  const memberProofs = squadProofs.filter((p) => p.userId === member.userId);

                  return (
                    <div
                      key={member.userId}
                      className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-colors flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => {
                          if (onViewUser) {
                            onViewUser({
                              id: member.userId,
                              name: member.userName,
                              username: member.userUsername || member.userName.toLowerCase().replace(/\s+/g, '_'),
                              avatar: member.userAvatar,
                              streak: member.userStreak,
                            });
                          }
                        }}
                        className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity min-w-0"
                      >
                        <div className="relative shrink-0">
                          <img
                            src={member.userAvatar}
                            alt={member.userName}
                            referrerPolicy="no-referrer"
                            className={`w-11 h-11 rounded-full object-cover border ${
                              isLeader ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/20'
                            }`}
                          />
                          {isLeader && (
                            <span
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border border-black flex items-center justify-center shadow-xs"
                              title="Squad Leader"
                            >
                              <Crown className="w-2.5 h-2.5 text-black fill-black" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white truncate">
                              {member.userName} {member.userId === currentUser.id && '(You)'}
                            </h4>
                            {isLeader && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Leader
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/50 truncate">
                            @{member.userUsername || member.userName.toLowerCase().replace(/\s+/g, '_')}
                            {member.userStreak !== undefined && ` • 🔥 ${member.userStreak}d streak`}
                          </p>
                        </div>
                      </div>

                      {/* Member status & proof stats */}
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedMemberFilter(member.userId);
                            setActiveTab('activity');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="View proofs by this member"
                        >
                          <span>{memberProofs.length} receipts</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>

                        {isSubmitted ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold"
                            title="Submitted daily proof for today"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span className="hidden sm:inline">Proof Done</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold"
                            title="Has not submitted daily proof yet today"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pending</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Photo Zoom Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-3xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors z-10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewImage.url}
                alt="Enlarged Proof"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-white/20 shadow-2xl"
              />
              {previewImage.caption && (
                <p className="mt-3 text-sm text-white/90 text-center bg-black/60 px-4 py-2 rounded-xl max-w-xl">
                  {previewImage.caption}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
