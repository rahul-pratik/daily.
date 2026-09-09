import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, Flame, MoreHorizontal, Check, UserPlus, Share2, Eye, User as UserIcon, Flag, ShieldAlert, BarChart3, Trash2, AlertTriangle, X, FolderPlus, Trophy, Sparkles, Award, Crown, ChevronLeft, ChevronRight, Camera, ChevronDown, ChevronUp, LayoutGrid, Images } from 'lucide-react';
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
  onViewUser?: (user: { id: string; name: string; username: string; avatar: string; streak?: number }) => void;
  isSaved?: boolean;
  onToggleSave?: (postId: string) => void;
  onReportPost?: (post: Post) => void;
  isReported?: boolean;
  onSharePost?: (post: Post) => void;
  onOpenInsights?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onOpenAddToCollection?: (post: Post) => void;
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
  onOpenAddToCollection,
}) => {
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [localSaved, setLocalSaved] = useState(false);
  const [lastTap, setLastTap] = useState<number>(0);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  // Photos attached to this post (handles single or infinite multi-photo carousel without feed spam)
  const allPhotos: string[] = post.imageUrls && post.imageUrls.length > 0
    ? post.imageUrls
    : (post.imageUrl ? [post.imageUrl] : []);
  const activePhoto = allPhotos[currentPhotoIdx] || allPhotos[0];
  const currentPhotoCaption = post.photoCaptions?.[currentPhotoIdx];

  const isSaved = isSavedProp !== undefined ? isSavedProp : localSaved;
  const isMyPost =
    post.userId === currentUser.id ||
    post.userId === 'user_me' ||
    post.username === currentUser.username ||
    (currentUser.username && post.username && currentUser.username.toLowerCase() === post.username.toLowerCase());
  const isFollowing = currentUser.followedUserIds.includes(post.userId);

  // Text truncation mechanism for long post content in HomeFeed
  const CONTENT_CHAR_LIMIT = 180;
  const isContentLong = (post.content || '').length > CONTENT_CHAR_LIMIT || (post.content || '').split('\n').length > 3;

  const getTruncatedText = (text: string) => {
    if (!text) return '';
    const lines = text.split('\n');
    if (lines.length > 3) {
      const topThree = lines.slice(0, 3).join('\n');
      if (topThree.length <= CONTENT_CHAR_LIMIT) {
        return topThree;
      }
    }
    if (text.length <= CONTENT_CHAR_LIMIT) return text;
    const slice = text.slice(0, CONTENT_CHAR_LIMIT);
    const lastSpace = slice.lastIndexOf(' ');
    return (lastSpace > 60 ? slice.slice(0, lastSpace) : slice).trim();
  };

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

  const handleUserClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onViewUser) {
      if (isMyPost) {
        onViewUser({
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
        });
      } else {
        onViewUser({
          id: post.userId,
          name: post.name,
          username: post.username,
          avatar: post.userAvatar,
        });
      }
    }
  };

  const handleReport = () => {
    setShowOptionsMenu(false);
    if (onReportPost) {
      onReportPost(post);
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
          {/* Avatar */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 group-hover:border-[#2F6FED]/50 transition-colors">
              <img
                src={post.userAvatar}
                alt={post.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-white group-hover:text-[#2F6FED] transition-colors">
                @{post.username}
              </span>
              <span className="text-white/20 text-xs">•</span>
              <span className="text-white/40 text-[10px]">{post.createdAt}</span>
            </div>
            {post.isChallengeRecap && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-amber-300 font-black bg-gradient-to-r from-amber-500/20 to-amber-600/10 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1 shadow-sm shadow-amber-500/10">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>Weekly Recap & MVP</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Follow Button & Options */}
        <div className="flex items-center gap-1.5 relative">
            {isMyPost && onOpenInsights && (
              <button
                onClick={() => onOpenInsights(post)}
                className="p-1.5 rounded-lg text-white/50 hover:text-[#2F6FED] hover:bg-[#2F6FED]/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="View Post Insights & Analytics"
                aria-label="View Insights"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            )}

            {isMyPost && onDeletePost && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePost(post.id);
                }}
                className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
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
                      className="w-full text-left px-3 py-2 text-xs text-[#2F6FED] hover:text-[#2F6FED] hover:bg-[#2F6FED]/10 rounded-xl flex items-center gap-2 font-bold"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-[#2F6FED]" />
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
                    <Share2 className="w-3.5 h-3.5 text-[#2F6FED]" />
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
                      <UserIcon className="w-3.5 h-3.5 text-[#2F6FED]" />
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
                      <Send className="w-3.5 h-3.5 text-[#2F6FED]" />
                      <span>Send Message</span>
                    </button>
                  )}

                  {isMyPost && onDeletePost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptionsMenu(false);
                        onDeletePost(post.id);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-2 font-semibold cursor-pointer"
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
      </header>

      {/* Post Media (Image carousel & all-photos grid) with double-tap heart */}
      {allPhotos.length > 0 ? (
        <div className="relative w-full bg-[#0A0A0A] border-y border-white/10">
          {/* Multi-Photo Toolbar: Carousel vs Grid Toggle & Counter */}
          {allPhotos.length > 1 && (
            <div className="px-4 py-2 bg-black/40 backdrop-blur-sm border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-white/80 font-mono">
                <Camera className="w-3.5 h-3.5 text-[#2F6FED]" />
                <span className="font-semibold">
                  {viewMode === 'carousel'
                    ? `Photo ${currentPhotoIdx + 1} of ${allPhotos.length}`
                    : `All ${allPhotos.length} Photos Gallery`}
                </span>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setViewMode('carousel');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'carousel'
                      ? 'bg-[#2F6FED] text-white shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                  title="Carousel single view with thumbnails"
                >
                  <Images className="w-3.5 h-3.5" />
                  <span>Carousel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setViewMode('grid');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[#2F6FED] text-white shadow-sm'
                      : 'text-white/50 hover:text-white'
                  }`}
                  title="View all 13 photos simultaneously in a grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid ({allPhotos.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE: CAROUSEL */}
          {viewMode === 'carousel' ? (
            <div>
              <div
                onClick={handleDoubleTap}
                className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#0A0A0A] overflow-hidden cursor-pointer select-none group"
              >
                <img
                  src={activePhoto}
                  alt={`Daily Proof Receipt ${currentPhotoIdx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
                  loading="lazy"
                />

                {/* Carousel Left / Right Navigation */}
                {allPhotos.length > 1 && (
                  <>
                    {currentPhotoIdx > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          vibrateLight();
                          setCurrentPhotoIdx((prev) => Math.max(0, prev - 1));
                        }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 transition-all opacity-80 hover:opacity-100 shadow-lg"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    )}

                    {currentPhotoIdx < allPhotos.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          vibrateLight();
                          setCurrentPhotoIdx((prev) => Math.min(allPhotos.length - 1, prev + 1));
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md border border-white/20 transition-all opacity-80 hover:opacity-100 shadow-lg"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Dot Indicators */}
                    <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1.5 pointer-events-none">
                      {allPhotos.map((_, idx) => (
                        <span
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            idx === currentPhotoIdx
                              ? 'w-5 bg-[#2F6FED] shadow-sm'
                              : 'w-1.5 bg-white/50 backdrop-blur-sm'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Heart burst animation on double tap */}
                {showHeartBurst && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                    <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl opacity-90" />
                  </div>
                )}
              </div>

              {/* Interactive Thumbnail Reel: See all 13 photos side-by-side with 1-click focus */}
              {allPhotos.length > 1 && (
                <div
                  onWheel={handleHorizontalWheelScroll}
                  className="p-2.5 bg-black/60 overflow-x-auto flex items-center gap-2 scrollbar-thin"
                >
                  {allPhotos.map((photo, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setCurrentPhotoIdx(idx);
                      }}
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 transition-all ${
                        currentPhotoIdx === idx
                          ? 'ring-2 ring-[#2F6FED] scale-105 shadow-md'
                          : 'opacity-60 hover:opacity-100 border border-white/10'
                      }`}
                      title={`Jump to photo #${idx + 1}`}
                    >
                      <img
                        src={photo}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 left-0.5 text-[8px] font-mono font-bold text-white bg-black/80 px-1 rounded">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* VIEW MODE: GRID (SHOW ALL 13 PHOTOS SIMULTANEOUSLY) */
            <div className="p-3 bg-black/40">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {allPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      vibrateLight();
                      setCurrentPhotoIdx(idx);
                      setViewMode('carousel');
                    }}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-black/80 border border-white/15 cursor-pointer hover:border-[#2F6FED] transition-all hover:scale-[1.02]"
                    title={`Click to focus photo #${idx + 1}`}
                  >
                    <img
                      src={photo}
                      alt={`Proof photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold text-white bg-black/80 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    {post.photoCaptions?.[idx] && (
                      <p className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] text-white/90 truncate font-medium bg-black/70 px-1.5 py-0.5 rounded">
                        {post.photoCaptions[idx]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[10px] text-white/40">
                Tap any photo to view full size in carousel mode
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Caption & Content */}
      <div className="p-4 space-y-2">
        {/* Photo-specific caption for currently visible carousel photo */}
        {currentPhotoCaption && (
          <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white/90 flex items-start gap-2">
            <span className="text-[10px] font-mono font-bold text-[#2F6FED] bg-[#2F6FED]/15 px-1.5 py-0.5 rounded shrink-0">
              Photo #{currentPhotoIdx + 1}
            </span>
            <p className="leading-snug text-white/80">{currentPhotoCaption}</p>
          </div>
        )}
        {/* If Challenge Recap, render rich collective recap & MVP spotlight */}
        {post.challengeRecapData && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#2F6FED]/5 to-transparent border border-amber-500/30 space-y-2.5 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{post.challengeRecapData.challengeTitle} • Week {post.challengeRecapData.weekNumber}</span>
              </span>
              <span className="text-[10px] font-bold text-amber-400/80 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                {post.challengeRecapData.totalCollectiveCheckins} Receipts
              </span>
            </div>

            {post.challengeRecapData.mvpContributor && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-400/60 shrink-0">
                    <img
                      src={post.challengeRecapData.mvpContributor.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={post.challengeRecapData.mvpContributor.userName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                      <span className="text-xs font-black text-white truncate">
                        {post.challengeRecapData.mvpContributor.userName}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-300/80 font-bold block">
                      {post.challengeRecapData.mvpContributor.mvpTitle || 'Weekly MVP Contributor'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-amber-300">
                    {post.challengeRecapData.mvpContributor.weeklyCheckins}
                  </span>
                  <p className="text-[9px] text-white/40 uppercase font-bold">Receipts</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post Content with ARIA-labeled 'See more' Truncation Mechanism */}
        <div
          id={`post-content-${post.id}`}
          className="text-sm leading-relaxed text-white/80 break-words"
        >
          {isContentLong && !isContentExpanded ? (
            <p className="whitespace-pre-line">
              <span>{getTruncatedText(post.content)}... </span>
              <button
                type="button"
                id={`see-more-btn-${post.id}`}
                aria-label="See more"
                aria-expanded="false"
                aria-controls={`post-content-${post.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  vibrateLight();
                  setIsContentExpanded(true);
                }}
                className="text-[#2F6FED] hover:text-[#4a85f6] font-bold text-xs inline-flex items-center gap-0.5 py-0.5 px-1.5 rounded-lg bg-[#2F6FED]/10 hover:bg-[#2F6FED]/20 transition-all cursor-pointer select-none"
              >
                <span>See more</span>
                <ChevronDown className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
              </button>
            </p>
          ) : (
            <p className="whitespace-pre-line">
              <span>{post.content}</span>
              {isContentLong && isContentExpanded && (
                <button
                  type="button"
                  id={`see-less-btn-${post.id}`}
                  aria-label="See less"
                  aria-expanded="true"
                  aria-controls={`post-content-${post.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    vibrateLight();
                    setIsContentExpanded(false);
                  }}
                  className="text-white/40 hover:text-white/70 font-semibold text-xs inline-flex items-center gap-0.5 ml-2 py-0.5 px-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer select-none"
                >
                  <span>See less</span>
                  <ChevronUp className="w-3 h-3 stroke-[2.5]" aria-hidden="true" />
                </button>
              )}
            </p>
          )}
        </div>

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
                className="shrink-0 text-[10px] font-bold text-white/80 bg-white/10 hover:bg-[#2F6FED] hover:text-white px-2.5 py-1 rounded-full border border-white/10 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Action Bar */}
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
                  className="text-white/40 hover:text-[#2F6FED] transition-colors p-1.5 rounded-lg hover:bg-white/5 min-h-[36px] min-w-[36px] flex items-center justify-center"
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
                <Share2 className="w-4 h-4 text-white/50 hover:text-[#2F6FED] transition-colors" />
                <span className="font-semibold">Share</span>
              </button>
            </div>

            {/* Right actions: Add to Collection (only for user's own posts) & Bookmark */}
            <div className="flex items-center gap-1">
              {onOpenAddToCollection && currentUser && post.userId === currentUser.id && (
                <button
                  onClick={() => {
                    vibrateLight();
                    onOpenAddToCollection(post);
                  }}
                  className="text-white/40 hover:text-[#2F6FED] transition-transform active:scale-110 p-1.5 rounded-lg hover:bg-white/5 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  aria-label="Add to collection"
                  title="Add proof to your collections"
                >
                  <FolderPlus className="w-4 h-4 stroke-2" />
                </button>
              )}

              {/* Bookmark */}
              <button
                onClick={handleSaveToggle}
                className={`text-white/40 hover:text-white transition-transform active:scale-110 p-1.5 rounded-lg hover:bg-white/5 min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  isSaved ? 'text-[#2F6FED] fill-[#2F6FED]' : ''
                }`}
                aria-label={isSaved ? 'Unsave post' : 'Save post'}
                title={isSaved ? 'Remove from Saved' : 'Save to Profile'}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#2F6FED] text-[#2F6FED]' : 'stroke-2'}`} />
              </button>
            </div>
          </div>
      </div>
    </article>
  );
};

