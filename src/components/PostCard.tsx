import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Flame, MoreHorizontal, Check, UserPlus, Share2, Eye, User as UserIcon, Flag, ShieldAlert, BarChart3, Trash2, AlertTriangle, X } from 'lucide-react';
import { Post, User } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { handleHorizontalWheelScroll } from '../utils/scroll';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onToggleFollow?: (userId: string) => void;
  onSendDM?: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onTagClick?: (tag: string) => void;
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  isSaved?: boolean;
  onToggleSave?: (postId: string) => void;
  onReportPost?: (post: Post) => void;
  isReported?: boolean;
  onSharePost?: (post: Post) => void;
  onOpenInsights?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  isFocusMode?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onToggleLike,
  onOpenComments,
  onToggleFollow,
  onSendDM,
  onTagClick,
  onViewUser,
  isSaved: isSavedProp,
  onToggleSave,
  onReportPost,
  isReported,
  onSharePost,
  onOpenInsights,
  onDeletePost,
  isFocusMode = false,
}) => {
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isSaved = isSavedProp !== undefined ? isSavedProp : localSaved;
  const isMyPost =
    post.userId === currentUser.id ||
    post.userId === 'user_me' ||
    post.username === currentUser.username ||
    (currentUser.username && post.username && currentUser.username.toLowerCase() === post.username.toLowerCase());
  const isFollowing = currentUser.followedUserIds.includes(post.userId);

  // Handle double-tap to like
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (!post.likedByMe) {
        onToggleLike(post.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    }
    setLastTap(now);
  };

  const handleSaveToggle = () => {
    vibrateLight();
    if (onToggleSave) {
      onToggleSave(post.id);
    } else {
      setLocalSaved(!localSaved);
    }
  };

  const handleOpenShareModal = () => {
    vibrateLight();
    if (onSharePost) {
      onSharePost(post);
    }
  };

  const handleUserClick = () => {
    if (onViewUser) {
      onViewUser({
        id: post.userId,
        name: post.name,
        username: post.username,
        avatar: post.userAvatar,
        streak: post.userStreak,
      });
    }
  };

  const handleReport = () => {
    setShowOptionsMenu(false);
    if (onReportPost) {
      onReportPost(post);
    }
  };

  const confirmDelete = () => {
    vibrateStreakMilestone();
    setShowDeleteConfirm(false);
    if (onDeletePost) {
      onDeletePost(post.id);
    }
  };

  if (isReported) {
    return (
      <div className="w-full bg-white/5 border border-white/5 rounded-[24px] p-4 text-center text-xs text-white/40 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400/70" />
          <span>This post was reported and hidden from your feed.</span>
        </div>
        <span className="text-[10px] font-mono text-white/30">Flagged</span>
      </div>
    );
  }

  return (
    <article className="w-full bg-white/5 border border-white/5 hover:border-white/10 rounded-[28px] overflow-hidden mb-4 transition-all relative">
      {/* Post Header */}
      <header className="px-4 py-3.5 flex items-center justify-between border-b border-white/5">
        <div 
          onClick={handleUserClick}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Avatar with clean streak indication */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 group-hover:border-[#FF4D00]/50 transition-colors">
              <img
                src={post.userAvatar}
                alt={post.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            {post.userStreak > 0 && (
              <span className="absolute -bottom-1 -right-1 bg-black border border-[#FF4D00]/50 text-[#FF4D00] text-[8px] font-black px-1 rounded-full flex items-center shadow">
                🔥{post.userStreak}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-white group-hover:text-[#FF4D00] transition-colors">
                @{post.username}
              </span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-white/40 text-[10px]">{post.createdAt}</span>
            </div>
            {post.isDailyStreakPost && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-[#FF4D00] font-bold">
                  🔥 {post.userStreak} Day Streak
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Follow Button & Options */}
        {!isFocusMode && (
          <div className="flex items-center gap-1.5 relative">
            {isMyPost && onOpenInsights && (
              <button
                onClick={() => onOpenInsights(post)}
                className="p-1.5 rounded-lg text-white/50 hover:text-[#FF4D00] hover:bg-[#FF4D00]/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="View Post Insights & Analytics"
                aria-label="View Insights"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            )}

            {isMyPost && onDeletePost && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Delete Post (Resets 1-Photo/Day limit)"
                aria-label="Delete Post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {!isMyPost && onToggleFollow && (
              <button
                onClick={() => onToggleFollow(post.userId)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 min-h-[32px] ${
                  isFollowing
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-white text-black hover:bg-white/90'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-9 w-48 bg-[#0A0A0A] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-20 animate-in fade-in">
                  {isMyPost && onOpenInsights && (
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        onOpenInsights(post);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-[#FF4D00] hover:text-[#FF4D00] hover:bg-[#FF4D00]/10 rounded-xl flex items-center gap-2 font-bold"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Engagement Insights</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      handleOpenShareModal();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#FF4D00]" />
                    <span>Share to Friends & Groups</span>
                  </button>

                  {onViewUser && (
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        handleUserClick();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-2"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>View Profile</span>
                    </button>
                  )}

                  {!isMyPost && onSendDM && (
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        onSendDM({
                          id: post.userId,
                          name: post.name,
                          username: post.username,
                          avatar: post.userAvatar,
                          streak: post.userStreak,
                        });
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-[#FF4D00]" />
                      <span>Send Message</span>
                    </button>
                  )}

                  {isMyPost && onDeletePost && (
                    <button
                      onClick={() => {
                        setShowOptionsMenu(false);
                        setShowDeleteConfirm(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-2 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Delete Post</span>
                    </button>
                  )}

                  {!isMyPost && (
                    <>
                      <div className="my-1 border-t border-white/5" />
                      <button
                        onClick={handleReport}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-2"
                      >
                        <Flag className="w-3.5 h-3.5 text-red-400" />
                        <span>Report Post</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Post Media (Image if present) with double-tap heart */}
      {post.imageUrl ? (
        <div
          onClick={!isFocusMode ? handleDoubleTap : undefined}
          className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#0A0A0A] overflow-hidden cursor-pointer select-none"
        >
          <img
            src={post.imageUrl}
            alt="Daily Post"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
            loading="lazy"
          />

          {/* Heart burst animation on double tap */}
          {!isFocusMode && showHeartBurst && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
              <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl opacity-90" />
            </div>
          )}
        </div>
      ) : null}

      {/* Caption & Content */}
      <div className={isFocusMode ? "p-5 space-y-3" : "p-4 space-y-2"}>
        <p className={isFocusMode ? "text-base sm:text-lg leading-relaxed text-white font-normal break-words py-1 tracking-wide" : "text-sm leading-relaxed text-white/80 break-words"}>
          {post.content}
        </p>

        {/* Tags (Horizontally Scrollable) */}
        {post.tags && post.tags.length > 0 && (
          <div 
            onWheel={handleHorizontalWheelScroll}
            className="w-full flex items-center gap-1.5 pt-1 overflow-x-auto whitespace-nowrap flex-nowrap no-scrollbar touch-pan-x overscroll-x-contain py-1"
          >
            {post.tags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => onTagClick && onTagClick(tag)}
                className="shrink-0 text-[10px] font-bold text-white/80 bg-white/10 hover:bg-[#FF4D00] hover:text-black px-2.5 py-1 rounded-full border border-white/10 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Action Bar (Hidden in Focus Reading mode) */}
        {!isFocusMode && (
          <div className="pt-2 flex items-center justify-between text-white/40">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Like Button */}
              <button
                onClick={() => onToggleLike(post.id)}
                className="flex items-center gap-1.5 text-white/40 hover:text-white transition-transform active:scale-125 min-h-[36px] min-w-[36px] py-1"
                aria-label="Like post"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    post.likedByMe
                      ? 'text-red-500 fill-red-500 stroke-red-500'
                      : 'stroke-2'
                  }`}
                />
                <span className="text-xs font-semibold">{post.likesCount}</span>
              </button>

              {/* Comment Button */}
              <button
                onClick={() => onOpenComments(post)}
                className="flex items-center gap-1.5 text-white/40 hover:text-white transition-transform active:scale-110 min-h-[36px] min-w-[36px] py-1"
                aria-label="Comment on post"
              >
                <MessageCircle className="w-4 h-4 stroke-2" />
                <span className="text-xs font-semibold">{post.comments?.length || 0}</span>
              </button>

              {/* Send DM button */}
              {!isMyPost && (
                <button
                  onClick={() =>
                    onSendDM?.({
                      id: post.userId,
                      name: post.name,
                      username: post.username,
                      avatar: post.userAvatar,
                      streak: post.userStreak,
                    })
                  }
                  className="text-white/40 hover:text-[#FF4D00] transition-colors p-1.5 rounded-lg hover:bg-white/5 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  title="Send Direct Message"
                >
                  <Send className="w-3.5 h-3.5 stroke-2" />
                </button>
              )}

              {/* Share to friends & groups button */}
              <button
                onClick={handleOpenShareModal}
                className="text-white/40 hover:text-white transition-colors flex items-center gap-1.5 text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 relative min-h-[36px]"
                title="Share to friends & groups"
              >
                <Share2 className="w-4 h-4 text-white/50 hover:text-[#FF4D00] transition-colors" />
                <span className="font-semibold">Share</span>
              </button>

              {/* Insights button for own posts */}
              {isMyPost && onOpenInsights && (
                <button
                  onClick={() => onOpenInsights(post)}
                  className="transition-all flex items-center gap-1 text-[11px] py-1 px-2.5 rounded-lg border bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 text-[#FF4D00] border-[#FF4D00]/30 min-h-[32px]"
                  title="View Post Engagement Statistics"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="font-bold">Stats</span>
                </button>
              )}

              {/* Delete button for own posts */}
              {isMyPost && onDeletePost && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="transition-all flex items-center gap-1 text-[11px] py-1 px-2 rounded-lg border bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 min-h-[32px]"
                  title="Delete Post"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-bold">Delete</span>
                </button>
              )}
            </div>

            {/* Bookmark */}
            <button
              onClick={handleSaveToggle}
              className={`text-white/40 hover:text-white transition-transform active:scale-110 p-1.5 rounded-lg hover:bg-white/5 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                isSaved ? 'text-[#FF4D00] fill-[#FF4D00]' : ''
              }`}
              aria-label={isSaved ? 'Unsave post' : 'Save post'}
              title={isSaved ? 'Remove from Saved' : 'Save to Profile'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#FF4D00] text-[#FF4D00]' : 'stroke-2'}`} />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#111111] border border-white/15 rounded-3xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Delete Daily Post?</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Deleting your post will reset today's photo limit back to 0, allowing you to take and upload a fresh photo today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all min-h-[40px] shadow-lg shadow-red-500/20 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

