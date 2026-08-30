import React, { useState } from 'react';
import {
  Flame,
  Grid,
  List,
  Edit3,
  Settings,
  Share2,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Bookmark,
  BarChart3,
  Folder,
  FolderPlus,
  ArrowLeft,
  Trash2,
  Plus,
  ExternalLink,
  Check,
} from 'lucide-react';
import { User, Post, ProofCollection } from '../types';
import { PostCard } from './PostCard';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { vibrateLight } from '../services/haptics';

interface ProfileScreenProps {
  currentUser: User;
  posts: Post[];
  savedPostIds?: string[];
  reportedPostIds?: string[];
  onToggleLike: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onOpenEditProfile: () => void;
  onResetData: () => void;
  onToggleSave?: (postId: string) => void;
  onReportPost?: (post: Post) => void;
  onToggleFollow?: (userId: string) => void;
  onSendDM?: (targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => void;
  onSharePost?: (post: Post) => void;
  onOpenInsights?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onOpenCreateCollection?: () => void;
  onDeleteCollection?: (collectionId: string) => void;
  onRemovePostFromCollection?: (collectionId: string, postId: string) => void;
  onOpenAddToCollection?: (post: Post) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  posts,
  savedPostIds = [],
  reportedPostIds = [],
  onToggleLike,
  onOpenComments,
  onOpenEditProfile,
  onResetData,
  onToggleSave,
  onReportPost,
  onToggleFollow = () => {},
  onSendDM = () => {},
  onSharePost,
  onOpenInsights,
  onDeletePost,
  onOpenCreateCollection = () => {},
  onDeleteCollection = (_collectionId: string) => {},
  onRemovePostFromCollection = (_collectionId: string, _postId: string) => {},
  onOpenAddToCollection,
}) => {
  const [profileTab, setProfileTab] = useState<'my_posts' | 'collections' | 'saved'>('my_posts');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Filter posts created by current user
  const userPosts = posts.filter((p) => p.userId === currentUser.id);

  // Filter saved posts
  const savedPosts = posts.filter((p) => savedPostIds.includes(p.id));

  // Active display posts for grid/list (my proofs vs saved)
  const activeDisplayPosts = profileTab === 'saved' ? savedPosts : userPosts;

  // Collections
  const collections = currentUser.proofCollections || [];
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  // Posts in selected collection
  const collectionPosts = selectedCollection
    ? posts.filter((p) => selectedCollection.postIds.includes(p.id))
    : [];

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white/5 border border-white/5 rounded-[32px] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Top actions */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-bold text-white/50">
            @{currentUser.username}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareProfile}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-colors relative min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Share profile"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedLink && (
                <span className="absolute -top-7 right-0 text-[10px] font-bold bg-[#D4AF37] text-black px-2 py-0.5 rounded shadow whitespace-nowrap">
                  Link copied!
                </span>
              )}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Settings & Reset"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              {showSettingsMenu && (
                <div className="absolute right-0 top-10 w-48 bg-[#0A0A0A] border border-white/10 rounded-2xl p-1.5 shadow-2xl z-30 animate-in fade-in">
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onOpenEditProfile();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/5 rounded-xl flex items-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Edit Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      setShowResetConfirm(true);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                    Reset Demo Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        {showResetConfirm && (
          <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-white animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-xs font-bold text-red-300">Reset All Demo Data?</h4>
                <p className="text-[11px] text-white/70 mt-0.5">
                  This will restore sample users, streak records, posts, groups, and notifications to their initial states.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => {
                      onResetData();
                      setShowResetConfirm(false);
                    }}
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[11px] font-bold transition-colors"
                  >
                    Confirm Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 hover:text-white rounded-xl text-[11px] font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Info Row */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-white/10 shadow-lg">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-black text-[#D4AF37] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#D4AF37]/50 flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3 fill-[#D4AF37]" />
              <span>{currentUser.currentStreak}d</span>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-black text-white flex items-center gap-1.5">
              {currentUser.name}
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            </h1>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">{currentUser.bio}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/5 text-center">
          <div>
            <span className="text-base font-black text-[#D4AF37] block">
              {currentUser.currentStreak}d
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold flex items-center justify-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-[#D4AF37] fill-[#D4AF37]" /> Streak
            </span>
          </div>

          <div>
            <span className="text-base font-black text-white block">
              {userPosts.length}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Proofs</span>
          </div>

          <div>
            <span className="text-base font-black text-white block">
              {collections.length}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Collections</span>
          </div>

          <div>
            <span className="text-base font-black text-white block">
              {currentUser.followersCount}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Followers</span>
          </div>
        </div>

        {/* Interests Badges */}
        {currentUser.interests && currentUser.interests.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mr-1">
              Focus Areas:
            </span>
            {currentUser.interests.map((interest) => (
              <span
                key={interest}
                className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-white/80 border border-white/10 font-bold uppercase tracking-wider"
              >
                #{interest}
              </span>
            ))}
          </div>
        )}

        {/* Edit Profile & Analytics Buttons */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
          <button
            onClick={onOpenEditProfile}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors min-h-[44px] active:scale-[0.99]"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Edit Profile</span>
          </button>

          {userPosts.length > 0 && onOpenInsights && (
            <button
              onClick={() => onOpenInsights(userPosts[0])}
              className="py-2.5 px-4 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-xs font-bold text-[#D4AF37] flex items-center justify-center gap-1.5 transition-colors min-h-[44px] active:scale-[0.99]"
              title="View Engagement Analytics for your latest post"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Insights</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Navigation Tabs: My Proofs, Collections, Saved */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('my_posts');
                setSelectedCollectionId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'my_posts'
                  ? 'bg-white text-black shadow-sm font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>My Proofs ({userPosts.length})</span>
            </button>

            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('collections');
                setSelectedCollectionId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'collections'
                  ? 'bg-[#D4AF37] text-black shadow-sm font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Collections ({collections.length})</span>
            </button>

            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('saved');
                setSelectedCollectionId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'saved'
                  ? 'bg-white text-black shadow-sm font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedPosts.length})</span>
            </button>
          </div>

          {/* Grid vs List View Selector (when viewing posts) */}
          {profileTab !== 'collections' || selectedCollectionId ? (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                }`}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  viewMode === 'list' ? 'bg-white text-black' : 'text-white/40 hover:text-white'
                }`}
                title="List View"
                aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                vibrateLight();
                onOpenCreateCollection();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs flex items-center gap-1 shadow-md shadow-[#D4AF37]/20 active:scale-95 whitespace-nowrap shrink-0 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content: COLLECTIONS TAB */}
      {profileTab === 'collections' && (
        <div className="space-y-4">
          {selectedCollection ? (
            /* Selected Collection Detail View */
            <div className="space-y-4 animate-in fade-in">
              {/* Collection Header Banner */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/60 shadow-2xl">
                {selectedCollection.coverImageUrl && (
                  <div className="h-32 sm:h-36 w-full relative overflow-hidden">
                    <img
                      src={selectedCollection.coverImageUrl}
                      alt={selectedCollection.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  </div>
                )}

                <div className="p-4 sm:p-5 relative -mt-8 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#111111] border-2 border-[#D4AF37] shadow-xl flex items-center justify-center text-2xl shrink-0">
                        {selectedCollection.icon || '📁'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-lg font-black text-white">
                            {selectedCollection.name}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-bold text-[10px]">
                            {selectedCollection.postIds.length} proofs
                          </span>
                        </div>
                        {selectedCollection.description && (
                          <p className="text-xs text-white/70 mt-0.5">
                            {selectedCollection.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        vibrateLight();
                        if (confirm(`Delete the "${selectedCollection.name}" collection? (Proofs won't be deleted)`)) {
                          onDeleteCollection(selectedCollection.id);
                          setSelectedCollectionId(null);
                        }
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors border border-white/10"
                      title="Delete Collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navigation controls */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      onClick={() => {
                        vibrateLight();
                        setSelectedCollectionId(null);
                      }}
                      className="text-xs font-bold text-white/70 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to All Collections</span>
                    </button>

                    <span className="text-[10px] text-white/40">
                      Updated {selectedCollection.updatedAt || 'recently'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collection Proofs List/Grid */}
              {collectionPosts.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid grid-cols-3 gap-2">
                    {collectionPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => onOpenComments(post)}
                        className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/5 hover:border-white/20 cursor-pointer"
                      >
                        {post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt="Post"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full p-2.5 flex flex-col justify-between bg-white/[0.03]">
                            <span className="text-[10px] text-[#D4AF37] font-bold">🔥 Proof</span>
                            <p className="text-[10px] text-white/70 line-clamp-4 leading-tight">
                              {post.content}
                            </p>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-xs font-bold p-1">
                          <span>❤️ {post.likesCount}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              vibrateLight();
                              onRemovePostFromCollection(selectedCollection.id, post.id);
                            }}
                            className="text-[9px] px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {collectionPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUser={currentUser}
                        onToggleLike={onToggleLike}
                        onOpenComments={onOpenComments}
                        onToggleFollow={onToggleFollow}
                        onSendDM={onSendDM}
                        isSaved={savedPostIds.includes(post.id)}
                        onToggleSave={onToggleSave}
                        onReportPost={onReportPost}
                        isReported={reportedPostIds.includes(post.id)}
                        onSharePost={onSharePost}
                        onOpenInsights={onOpenInsights}
                        onDeletePost={onDeletePost}
                        onOpenAddToCollection={onOpenAddToCollection}
                      />
                    ))}
                  </div>
                )
              ) : (
                <EmptyStateIllustration
                  type="collections"
                  title="Collection is empty"
                  description="You haven't added any proofs to this collection yet. You can add photos from your feed or create a new proof!"
                  primaryAction={{
                    label: 'Add Existing Proofs',
                    onClick: () => {
                      setProfileTab('my_posts');
                    },
                    icon: <Plus className="w-4 h-4" />,
                  }}
                />
              )}
            </div>
          ) : (
            /* All Collections Cards Grid */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Create Collection Action Tile */}
                <div
                  onClick={() => {
                    vibrateLight();
                    onOpenCreateCollection();
                  }}
                  className="p-5 rounded-3xl border-2 border-dashed border-white/15 hover:border-[#D4AF37]/60 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 min-h-[140px] group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 group-hover:bg-[#D4AF37] group-hover:text-black text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center transition-colors">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-xs">Create New Collection</h3>
                    <p className="text-[10px] text-white/50 mt-0.5">e.g. Running, Coding, Gym</p>
                  </div>
                </div>

                {/* Existing Collections Cards */}
                {collections.map((col) => {
                  const proofCount = col.postIds.length;
                  return (
                    <div
                      key={col.id}
                      onClick={() => {
                        vibrateLight();
                        setSelectedCollectionId(col.id);
                      }}
                      className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#D4AF37]/40 transition-all cursor-pointer shadow-lg group flex flex-col justify-between"
                    >
                      {/* Cover image banner */}
                      <div className="h-24 w-full relative overflow-hidden bg-black/40">
                        {col.coverImageUrl ? (
                          <img
                            src={col.coverImageUrl}
                            alt={col.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#D4AF37]/20 to-black/80" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white font-bold text-[10px]">
                          {proofCount} {proofCount === 1 ? 'proof' : 'proofs'}
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="p-4 pt-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0 -mt-6 bg-[#111111] shadow-lg border-[#D4AF37]/30">
                          {col.icon || '📁'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-sm text-white truncate group-hover:text-[#D4AF37] transition-colors">
                            {col.name}
                          </h4>
                          <p className="text-[10px] text-white/50 line-clamp-1">
                            {col.description || 'Tap to view proofs collection'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {collections.length === 0 && (
                <EmptyStateIllustration
                  type="collections"
                  title="Organize your proofs into collections"
                  description="Group your photos and proofs by discipline — like a Running group, Coding sprint collection, or Gym records."
                  primaryAction={{
                    label: 'Create First Collection',
                    onClick: onOpenCreateCollection,
                    icon: <FolderPlus className="w-4 h-4" />,
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: MY PROOFS & SAVED */}
      {profileTab !== 'collections' && (
        <>
          {activeDisplayPosts.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-2">
                {activeDisplayPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      if (profileTab === 'my_posts' && onOpenInsights) {
                        onOpenInsights(post);
                      } else {
                        onOpenComments(post);
                      }
                    }}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/5 hover:border-white/20 cursor-pointer"
                  >
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full p-2.5 flex flex-col justify-between bg-white/[0.03]">
                        <span className="text-[10px] text-[#D4AF37] font-bold">🔥 Proof</span>
                        <p className="text-[10px] text-white/70 line-clamp-4 leading-tight">
                          {post.content}
                        </p>
                        <span className="text-[8px] text-white/40">{post.createdAt}</span>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-xs font-bold p-1">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span>❤️ {post.likesCount}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                      </div>
                      {profileTab === 'my_posts' && onOpenAddToCollection && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrateLight();
                            onOpenAddToCollection(post);
                          }}
                          className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-[#D4AF37] hover:text-black border border-white/20 transition-colors flex items-center gap-1 mt-1"
                        >
                          <FolderPlus className="w-3 h-3" /> Add to Box
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {activeDisplayPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onToggleLike={onToggleLike}
                    onOpenComments={onOpenComments}
                    onToggleFollow={onToggleFollow}
                    onSendDM={onSendDM}
                    isSaved={savedPostIds.includes(post.id)}
                    onToggleSave={onToggleSave}
                    onReportPost={onReportPost}
                    isReported={reportedPostIds.includes(post.id)}
                    onSharePost={onSharePost}
                    onOpenInsights={onOpenInsights}
                    onDeletePost={onDeletePost}
                    onOpenAddToCollection={onOpenAddToCollection}
                  />
                ))}
              </div>
            )
          ) : (
            <EmptyStateIllustration
              type={profileTab === 'saved' ? 'saved' : 'feed'}
              title={profileTab === 'saved' ? 'No saved proofs yet' : 'No proof updates posted yet'}
              description={
                profileTab === 'saved'
                  ? 'Tap the bookmark icon on any post in your feed to save it for quick inspiration.'
                  : 'Start your streak! Post your first proof of work for today.'
              }
            />
          )}
        </>
      )}
    </div>
  );
};
