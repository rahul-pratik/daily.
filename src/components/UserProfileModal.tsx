import React, { useState } from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  UserPlus,
  Check,
  Share2,
  Grid,
  List,
  FolderHeart,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles,
  Heart,
  MessageSquare,
  Layers,
} from 'lucide-react';
import { User, Post, ProofCollection } from '../types';
import { vibrateLight } from '../services/haptics';

interface UserProfileModalProps {
  user: User | null;
  currentUser: User;
  posts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onToggleFollow: (userId: string) => void;
  onSendDM?: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onToggleLike: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onToggleBlock?: (userId: string) => void;
  isBlocked?: boolean;
  onOpenDossier?: (user: User) => void;
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
  onOpenDossier,
}) => {
  const [activeTab, setActiveTab] = useState<'proofs' | 'collections'>('proofs');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<ProofCollection | null>(null);

  if (!isOpen || !user) return null;

  const isMe = user.id === currentUser.id || user.id === 'user_me';
  const isFollowing = currentUser.followedUserIds?.includes(user.id) || false;
  const userPosts = (posts || []).filter((p) => p.userId === user.id);

  // Derive proof collections for the user (fallback if not populated)
  const userCollections: ProofCollection[] =
    user.proofCollections && user.proofCollections.length > 0
      ? user.proofCollections
      : [
          {
            id: `col_${user.id}_1`,
            name: `${user.interests?.[0] || 'Daily'} Proofs`,
            description: `Consecutive daily receipts and build updates by @${user.username}`,
            icon: '⚡',
            coverImageUrl:
              userPosts[0]?.imageUrl ||
              'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
            postIds: userPosts.map((p) => p.id),
            createdAt: user.joinedDate || '2026-06-01',
            updatedAt: '2026-08-25',
          },
          {
            id: `col_${user.id}_2`,
            name: `${user.interests?.[1] || 'Core'} Highlights`,
            description: `Milestone proofs and key breakthroughs`,
            icon: '🏆',
            coverImageUrl:
              userPosts[1]?.imageUrl ||
              userPosts[0]?.imageUrl ||
              'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
            postIds: userPosts.slice(0, 2).map((p) => p.id),
            createdAt: user.joinedDate || '2026-07-10',
            updatedAt: '2026-08-28',
          },
        ];

  const handleShare = () => {
    vibrateLight();
    const shareUrl = `${window.location.origin}/#profile/${user.username}`;
    navigator.clipboard?.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleFollowClick = () => {
    vibrateLight();
    onToggleFollow(user.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0c0c10] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white my-0 sm:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar: @username, Share & Close */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#0c0c10] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-white/70">@{user.username}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors relative"
              title="Share profile link"
              aria-label="Share profile"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && (
                <span className="absolute -top-7 right-0 text-[10px] font-bold bg-[#2F6FED] text-white px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Profile Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* PFP and Identity Section */}
          <div className="flex items-start gap-4">
            {/* PFP Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 bg-black/60 shadow-xl ring-2 ring-[#2F6FED]/20">
                <img
                  src={user.avatar}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Name, Handle, Bio */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black text-white truncate">{user.name}</h2>
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              </div>
              <p className="text-xs text-white/50 font-mono mt-0.5">@{user.username}</p>
              {user.bio && (
                <p className="text-xs text-white/80 mt-2 leading-relaxed break-words">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Action Row: Follow, Message, and Person Dossier */}
          <div className="pt-1 flex items-center gap-2">
            {!isMe && (
              <>
                <button
                  type="button"
                  id="profile-follow-toggle-btn"
                  onClick={handleFollowClick}
                  className={`flex-1 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    isFollowing
                      ? 'bg-white/10 text-white/90 hover:bg-white/15 border border-white/15 shadow-sm'
                      : 'bg-[#2F6FED] hover:bg-blue-600 text-white shadow-lg shadow-[#2F6FED]/25'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="profile-direct-message-btn"
                  onClick={() => {
                    vibrateLight();
                    onClose();
                    if (onSendDM) {
                      onSendDM({
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        avatar: user.avatar,
                        streak: user.currentStreak || 0,
                      });
                    }
                  }}
                  className="flex-1 py-2.5 rounded-2xl text-xs font-black bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  title={`Direct message @${user.username}`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#2F6FED]" />
                  <span>Message</span>
                </button>
              </>
            )}

            <button
              type="button"
              id="profile-view-dossier-btn"
              onClick={() => {
                vibrateLight();
                onClose();
                if (onOpenDossier) {
                  onOpenDossier(user);
                }
              }}
              className={`${
                isMe ? 'w-full' : 'px-4'
              } py-2.5 rounded-2xl text-xs font-black bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 hover:border-[#2F6FED]/40 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 shrink-0`}
              title={`View ${user.name}'s Person Dossier & challenge history`}
            >
              <Layers className="w-3.5 h-3.5 text-[#2F6FED]" />
              <span>Dossier</span>
            </button>
          </div>

          {/* Stats Row: Proofs, Followers, Following */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-white/[0.04] border border-white/10 rounded-2xl text-center">
            <div>
              <span className="text-base font-black text-white block">{userPosts.length}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Proofs</span>
            </div>
            <div>
              <span className="text-base font-black text-white block">{user.followersCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Followers</span>
            </div>
            <div>
              <span className="text-base font-black text-white block">{user.followingCount}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Following</span>
            </div>
          </div>

          {/* Interests Section */}
          {user.interests && user.interests.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mr-1">
                  Interests
                </span>
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.06] text-white/90 border border-white/10 font-semibold"
                  >
                    #{interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs: Proofs & Collections */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between pb-3">
              {/* Tab Switcher */}
              <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setActiveTab('proofs');
                    setSelectedCollection(null);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'proofs'
                      ? 'bg-[#2F6FED] text-white shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Proofs ({userPosts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setActiveTab('collections');
                    setSelectedCollection(null);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'collections'
                      ? 'bg-[#2F6FED] text-white shadow-md'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <FolderHeart className="w-3.5 h-3.5" />
                  <span>Collections ({userCollections.length})</span>
                </button>
              </div>

              {/* View Mode Toggle for Proofs Tab */}
              {activeTab === 'proofs' && userPosts.length > 0 && (
                <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === 'list' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                    }`}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* TAB CONTENT: PROOFS */}
            {activeTab === 'proofs' && (
              <div>
                {userPosts.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-3 gap-2">
                      {userPosts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setViewMode('list')}
                          className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer shadow-sm hover:border-[#2F6FED]/50 transition-all"
                        >
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt="Proof preview"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full p-2.5 flex flex-col justify-between bg-white/[0.03]">
                              <span className="text-[10px] text-[#2F6FED] font-bold">🔥 Daily Proof</span>
                              <p className="text-[10px] text-white/80 line-clamp-3 leading-tight font-medium">
                                {p.content}
                              </p>
                              <span className="text-[8px] text-white/30">{p.createdAt}</span>
                            </div>
                          )}

                          {/* Hover Overlay with Likes */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-bold">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 fill-white" />
                              {p.likesCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 fill-white" />
                              {p.comments?.length || 0}
                            </span>
                          </div>

                          {p.imageUrls && p.imageUrls.length > 1 && (
                            <span
                              className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-white/10 flex items-center gap-1 shadow-sm"
                              title={`${p.imageUrls.length} photos in this proof`}
                            >
                              <Layers className="w-2.5 h-2.5 text-[#2F6FED]" />
                              <span>{p.imageUrls.length}</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userPosts.map((p) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 text-xs shadow-sm"
                        >
                          <div className="flex items-center justify-between text-[11px] text-white/50">
                            <span>{p.createdAt}</span>
                          </div>

                          {p.imageUrl && (
                            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                              <img
                                src={p.imageUrl}
                                alt="Proof Media"
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              {p.imageUrls && p.imageUrls.length > 1 && (
                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/20 text-white flex items-center gap-1 shadow-sm">
                                  <Layers className="w-2.5 h-2.5 text-white/90" />
                                  <span className="text-[9px] font-mono font-bold">{p.imageUrls.length}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-white/90 leading-relaxed break-words">{p.content}</p>

                          <div className="flex items-center gap-4 pt-1 text-white/50 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                vibrateLight();
                                onToggleLike(p.id);
                              }}
                              className={`flex items-center gap-1.5 hover:text-white transition-colors ${
                                p.likedByMe ? 'text-red-500 font-bold' : ''
                              }`}
                            >
                              <Heart className={`w-4 h-4 ${p.likedByMe ? 'fill-red-500' : ''}`} />
                              <span>{p.likesCount}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenComments(p)}
                              className="flex items-center gap-1.5 hover:text-white transition-colors"
                            >
                              <MessageSquare className="w-4 h-4" />
                              <span>{p.comments?.length || 0}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-10 text-white/40 text-xs">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-white/20" />
                    <span>No proofs shared yet by @{user.username}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: COLLECTIONS */}
            {activeTab === 'collections' && (
              <div>
                {selectedCollection ? (
                  /* Expanded Collection Proofs View */
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <button
                        type="button"
                        onClick={() => setSelectedCollection(null)}
                        className="flex items-center gap-1 text-xs text-white/70 hover:text-white font-bold transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>All Collections</span>
                      </button>
                      <span className="text-xs font-bold text-white/90 flex items-center gap-1.5">
                        <span>{selectedCollection.icon || '📂'}</span>
                        <span>{selectedCollection.name}</span>
                      </span>
                    </div>

                    <p className="text-xs text-white/60">{selectedCollection.description}</p>

                    {/* Proofs inside this collection */}
                    {(() => {
                      const collectionPosts = userPosts.filter(
                        (p) =>
                          selectedCollection.postIds.includes(p.id) ||
                          selectedCollection.postIds.length === 0
                      );

                      if (collectionPosts.length === 0) {
                        return (
                          <div className="text-center py-8 text-white/40 text-xs">
                            <span>No proofs in this collection yet.</span>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {collectionPosts.map((p) => (
                            <div
                              key={p.id}
                              className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 space-y-1.5 p-2"
                            >
                              {p.imageUrl && (
                                <div className="aspect-square rounded-xl overflow-hidden bg-black">
                                  <img
                                    src={p.imageUrl}
                                    alt="Proof"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <p className="text-[10px] text-white/80 line-clamp-2 leading-snug">
                                {p.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Collections Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userCollections.map((col) => {
                      const postCount = col.postIds?.length || userPosts.length;
                      return (
                        <div
                          key={col.id}
                          onClick={() => {
                            vibrateLight();
                            setSelectedCollection(col);
                          }}
                          className="group rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 hover:border-[#2F6FED]/50 transition-all cursor-pointer shadow-sm flex flex-col"
                        >
                          <div className="relative aspect-video w-full overflow-hidden bg-black/60">
                            {col.coverImageUrl ? (
                              <img
                                src={col.coverImageUrl}
                                alt={col.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-[#2F6FED]/20 to-black">
                                {col.icon || '📂'}
                              </div>
                            )}
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white flex items-center gap-1">
                              <span>{col.icon || '📂'}</span>
                              <span>{postCount} Proof{postCount === 1 ? '' : 's'}</span>
                            </span>
                          </div>

                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-black text-white group-hover:text-[#2F6FED] transition-colors">
                                {col.name}
                              </h4>
                              {col.description && (
                                <p className="text-[10px] text-white/60 line-clamp-2 mt-1 leading-relaxed">
                                  {col.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
