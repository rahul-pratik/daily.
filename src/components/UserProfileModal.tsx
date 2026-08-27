import React, { useState } from 'react';
import { X, Flame, CheckCircle2, UserPlus, Check, MessageSquare, Share2, Grid, List, Sparkles } from 'lucide-react';
import { User, Post } from '../types';

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
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !user) return null;

  const isMe = user.id === currentUser.id;
  const isFollowing = currentUser.followedUserIds.includes(user.id);
  const userPosts = posts.filter((p) => p.userId === user.id);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white my-0 sm:my-6">
        {/* Header Bar */}
        <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between bg-[#0A0A0A] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-white/50">@{user.username}</span>
            {user.currentStreak > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/30 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-[#FF4D00]" /> {user.currentStreak}d Streak
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
                <span className="absolute -top-7 right-0 text-[10px] font-bold bg-[#FF4D00] text-black px-2 py-0.5 rounded shadow whitespace-nowrap">
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
                <span className="absolute -bottom-1 -right-1 bg-black text-[#FF4D00] text-[10px] font-black px-1.5 py-0.5 rounded-full border border-[#FF4D00]/60 shadow">
                  🔥{user.currentStreak}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black text-white">{user.name}</h2>
                <CheckCircle2 className="w-4 h-4 text-[#FF4D00]" />
              </div>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">{user.bio}</p>
            </div>
          </div>

          {/* Action buttons (Follow & Message) */}
          {!isMe && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onToggleFollow(user.id)}
                className={`py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isFollowing
                    ? 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                    : 'bg-white text-black hover:bg-white/90 shadow-md shadow-white/10'
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
                className="py-2.5 rounded-2xl bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#FF4D00]/20 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Direct Message</span>
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
                <Flame className="w-2.5 h-2.5 text-[#FF4D00] fill-[#FF4D00]" /> Streak
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
                          <span className="text-[9px] text-[#FF4D00] font-bold">🔥 Daily</span>
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
                          <span className="text-[#FF4D00] font-bold">
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
      </div>
    </div>
  );
};
