import React, { useState } from 'react';
import { X, Flame, CheckCircle2, UserPlus, Check, MessageSquare, Share2, Grid, List, Sparkles, UserX, ShieldAlert, AlertTriangle, ShieldCheck, Trophy, Swords } from 'lucide-react';
import { User, Post } from '../types';
import { vibrateStreakMilestone, vibrateLight } from '../services/haptics';
import { DirectChallengeInviteModal } from './DirectChallengeInviteModal';

interface UserProfileModalProps {
  user: User | null;
  currentUser: User;
  posts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onToggleFollow: (userId: string) => void;
  onSendDM: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onToggleLike: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onToggleBlock?: (userId: string) => void;
  isBlocked?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  currentUser,
  posts,
  isOpen,
  onClose,
  onToggleFollow,
  onSendDM,
  onToggleLike,
  onOpenComments,
  onToggleBlock,
  isBlocked: isBlockedProp,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  if (!isOpen || !user) return null;

  const isMe = user.id === currentUser.id || user.id === 'user_me';
  const isFollowing = currentUser.followedUserIds?.includes(user.id) || false;
  const isBlocked = isBlockedProp !== undefined ? isBlockedProp : (currentUser.blockedUserIds?.includes(user.id) || false);
  const userPosts = posts.filter((p) => p.userId === user.id);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleConfirmBlock = () => {
    vibrateStreakMilestone();
    if (onToggleBlock) {
      onToggleBlock(user.id);
    }
    setShowBlockConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white my-0 sm:my-6">
        {/* Header Bar */}
        <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between bg-[#0A0A0A] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-white/50">@{user.username}</span>
            {user.currentStreak > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-[#D4AF37]" /> {user.currentStreak}d Streak
              </span>
            )}
            {isBlocked && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-400" /> Blocked
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors relative"
              title="Share profile link"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && (
                <span className="absolute -top-7 right-0 text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded shadow whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Profile Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* User Info Row */}
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-white/15 shadow-lg">
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              {user.currentStreak > 0 && (
                <span className="absolute -bottom-1 -right-1 bg-black text-[#D4AF37] text-[10px] font-black px-1.5 py-0.5 rounded-full border border-[#D4AF37]/60 shadow">
                  🔥{user.currentStreak}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black text-white">{user.name}</h2>
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">{user.bio}</p>
            </div>
          </div>

          {/* Blocked Notice Banner if blocked */}
          {isBlocked && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-between text-xs text-red-300">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>You blocked @{user.username}. Their posts are hidden from your feed.</span>
              </div>
              <button
                onClick={() => onToggleBlock && onToggleBlock(user.id)}
                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-white rounded-lg text-[10px] font-bold border border-red-500/30 transition-colors shrink-0 ml-2"
              >
                Unblock
              </button>
            </div>
          )}

          {/* Action buttons (Follow & Message & Direct Challenge Invite) */}
          {!isMe && !isBlocked && (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onToggleFollow(user.id)}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isFollowing
                      ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onSendDM({
                      id: user.id,
                      name: user.name,
                      username: user.username,
                      avatar: user.avatar,
                      streak: user.currentStreak,
                    });
                  }}
                  className="py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Direct Message</span>
                </button>
              </div>

              {/* Direct Challenge Invite Action Button */}
              <button
                onClick={() => {
                  vibrateLight();
                  setIsInviteModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.01] transition-all"
              >
                <Trophy className="w-4 h-4 stroke-[2.5]" />
                <span>Direct Challenge Invite</span>
              </button>
            </div>
          )}

          {/* Block user option button for other users */}
          {!isMe && (
            <div className="pt-1 flex items-center justify-end">
              <button
                onClick={() => {
                  if (isBlocked) {
                    if (onToggleBlock) onToggleBlock(user.id);
                  } else {
                    setShowBlockConfirm(true);
                  }
                }}
                className={`text-[11px] font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                  isBlocked
                    ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'text-white/40 hover:text-red-400 border-white/10 hover:border-red-500/30 hover:bg-red-500/10'
                }`}
              >
                {isBlocked ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Unblock @{user.username}</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-3.5 h-3.5" />
                    <span>Block User</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 p-3.5 bg-white/5 border border-white/5 rounded-2xl text-center">
            <div>
              <span className="text-sm sm:text-base font-black text-white block">
                {user.currentStreak}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-semibold flex items-center justify-center gap-0.5">
                <Flame className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" /> Streak
              </span>
            </div>

            <div>
              <span className="text-sm sm:text-base font-black text-white block">
                {userPosts.length}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-semibold">
                Posts
              </span>
            </div>

            <div>
              <span className="text-sm sm:text-base font-black text-white block">
                {user.followersCount}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-semibold">
                Followers
              </span>
            </div>

            <div>
              <span className="text-sm sm:text-base font-black text-white block">
                {user.followingCount}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-white/40 font-semibold">
                Following
              </span>
            </div>
          </div>

          {/* Interests & Habits */}
          {(user.interests?.length > 0 || user.habits?.length > 0) && (
            <div className="space-y-2 pt-1">
              {user.interests && user.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mr-1">
                    Interests:
                  </span>
                  {user.interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-white/80 border border-white/10 font-bold uppercase tracking-wider"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              )}

              {user.habits && user.habits.length > 0 && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mr-1">
                    Habits:
                  </span>
                  {user.habits.map((habit) => (
                    <span
                      key={habit}
                      className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-bold uppercase tracking-wider"
                    >
                      ⚡ {habit}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Posts Segment */}
          <div className="pt-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="text-xs font-bold text-white/70">
                Updates by @{user.username} ({userPosts.length})
              </span>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {userPosts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-3 gap-2">
                  {userPosts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setViewMode('list')}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer"
                    >
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt="Post preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full p-2 flex flex-col justify-between bg-white/[0.03]">
                          <span className="text-[9px] text-[#D4AF37] font-bold">🔥 Daily</span>
                          <p className="text-[9px] text-white/70 line-clamp-3 leading-tight">
                            {p.content}
                          </p>
                          <span className="text-[8px] text-white/30">{p.createdAt}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {userPosts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-white/40">
                        <span>{p.createdAt}</span>
                        {p.isDailyStreakPost && (
                          <span className="text-[#D4AF37] font-bold">
                            🔥 {p.userStreak} Day Streak
                          </span>
                        )}
                      </div>

                      {p.imageUrl && (
                        <div className="aspect-video rounded-xl overflow-hidden bg-black">
                          <img
                            src={p.imageUrl}
                            alt="Post Media"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <p className="text-white/80 leading-relaxed break-words">{p.content}</p>

                      <div className="flex items-center gap-4 pt-1 text-white/40 text-[11px]">
                        <button
                          onClick={() => onToggleLike(p.id)}
                          className="flex items-center gap-1 hover:text-white"
                        >
                          <span className={p.likedByMe ? 'text-red-500 font-bold' : ''}>
                            ♥ {p.likesCount}
                          </span>
                        </button>
                        <button
                          onClick={() => onOpenComments(p)}
                          className="flex items-center gap-1 hover:text-white"
                        >
                          💬 {p.comments?.length || 0}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-8 text-white/40 text-xs">
                <Sparkles className="w-6 h-6 mx-auto mb-1.5 text-white/20" />
                <span>No posts shared yet by @{user.username}</span>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal for Blocking */}
        {showBlockConfirm && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-[#141414] border border-red-500/30 rounded-3xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <UserX className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Block @{user.username}?</h3>
                <p className="text-xs text-white/60 mt-1.5 leading-relaxed">
                  They will no longer appear on your social feed, discover tab, or direct messages.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setShowBlockConfirm(false)}
                  className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBlock}
                  className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-lg shadow-red-600/30"
                >
                  Yes, Block
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Direct Challenge Invite Modal */}
        <DirectChallengeInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          currentUser={currentUser}
          targetUser={{
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
            streak: user.currentStreak,
          }}
        />
      </div>
    </div>
  );
};
