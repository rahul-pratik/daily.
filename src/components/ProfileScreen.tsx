import React, { useState, useEffect } from 'react';
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
  Check,
  ShieldCheck,
  FileText,
  Clock,
  Send,
  Calendar,
  Layers,
  ChevronRight,
  BookOpen,
  X,
  Eye,
  Activity,
  Zap,
} from 'lucide-react';
import { User, Post, ProofCollection, PostDraft } from '../types';
import { PostCard } from './PostCard';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { PersonProfileDossierScreen } from './PersonProfileDossierScreen';
import { PostInsightsModal } from './PostInsightsModal';
import { StreakFreezeCard } from './StreakFreezeCard';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { DailyStorageService } from '../services/storage';

interface ProfileScreenProps {
  currentUser: User;
  posts: Post[];
  savedPostIds?: string[];
  reportedPostIds?: string[];
  initialTab?: 'dossier' | 'proofs' | 'collections';
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
  onOpenResumeDraft?: (draft: PostDraft) => void;
  onOpenCreateDraft?: () => void;
  onOpenCreatePost?: () => void;
  onPublishDraftDirectly?: (draftId: string) => void;
  onOpenDossier?: () => void;
  onUserUpdated?: (user: User) => void;
  onOpenNotifications?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  posts,
  savedPostIds = [],
  reportedPostIds = [],
  initialTab = 'proofs',
  onToggleLike,
  onOpenComments,
  onOpenEditProfile,
  onResetData,
  onToggleSave,
  onReportPost,
  onToggleFollow = () => {},
  onSendDM = (_targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => {},
  onSharePost,
  onOpenInsights,
  onDeletePost,
  onOpenCreateCollection = () => {},
  onDeleteCollection = (_collectionId: string) => {},
  onRemovePostFromCollection = (_collectionId: string, _postId: string) => {},
  onOpenAddToCollection,
  onOpenResumeDraft,
  onOpenCreateDraft,
  onOpenCreatePost,
  onPublishDraftDirectly,
  onOpenDossier,
  onUserUpdated,
  onOpenNotifications,
}) => {
  // Main clean tabs: Dossier, Proofs, Collections
  const [profileTab, setProfileTab] = useState<'dossier' | 'proofs' | 'collections'>(
    initialTab === 'milestones' as any ? 'proofs' : initialTab
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Popup Hub Modal for Insights, Drafts, and Saved
  const [isQuickHubOpen, setIsQuickHubOpen] = useState(false);
  const [activeHubView, setActiveHubView] = useState<'insights' | 'drafts' | 'saved' | null>(null);

  // Settings & share state
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Drafts & Scheduled Queue State
  const [drafts, setDrafts] = useState<PostDraft[]>(() => DailyStorageService.getAllDrafts(currentUser.id));
  const [draftFilter, setDraftFilter] = useState<'all' | 'scheduled' | 'standard'>('all');
  const [draftActionToast, setDraftActionToast] = useState<string | null>(null);

  // Reload drafts when currentUser changes or hub view opens
  useEffect(() => {
    setDrafts(DailyStorageService.getAllDrafts(currentUser.id));
  }, [currentUser.id, activeHubView]);

  const showToast = (msg: string) => {
    setDraftActionToast(msg);
    setTimeout(() => {
      setDraftActionToast(null);
    }, 2800);
  };

  const handleDeleteDraft = (draftId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    vibrateLight();
    const updated = DailyStorageService.deleteDraft(currentUser.id, draftId);
    setDrafts(updated);
    showToast('Draft deleted');
  };

  const handlePublishDraft = (draftId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    vibrateStreakMilestone();
    if (onPublishDraftDirectly) {
      onPublishDraftDirectly(draftId);
      const updated = DailyStorageService.getAllDrafts(currentUser.id);
      setDrafts(updated);
    } else {
      const result = DailyStorageService.publishDraftNow(currentUser.id, draftId);
      if (result.success) {
        setDrafts(result.remainingDrafts);
        showToast('Draft published to feed! 🔥');
      } else {
        showToast(result.error || 'Failed to publish draft');
      }
    }
  };

  // Filter posts created by current user
  const userPosts = posts.filter((p) => p.userId === currentUser.id);

  // Filter saved posts
  const savedPosts = posts.filter((p) => savedPostIds.includes(p.id));

  // Collections
  const collections = currentUser.proofCollections || [];
  const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

  // Posts in selected collection
  const collectionPosts = selectedCollection
    ? posts.filter((p) => selectedCollection.postIds.includes(p.id))
    : [];

  // Filtered drafts
  const scheduledDrafts = drafts.filter((d) => Boolean(d.isScheduled && d.scheduledAt));
  const standardDrafts = drafts.filter((d) => !d.isScheduled);
  const displayDrafts =
    draftFilter === 'scheduled'
      ? scheduledDrafts
      : draftFilter === 'standard'
      ? standardDrafts
      : drafts;

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Quick Hub Options Configuration
  const hubOptions = [
    {
      id: 'insights' as const,
      title: 'Insights',
      subtitle: 'Engagement Analytics & Performance',
      icon: <BarChart3 className="w-5 h-5 text-[#2F6FED]" />,
      badge: `${userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0)} likes`,
      badgeColor: 'bg-[#2F6FED]/15 text-[#2F6FED] border-[#2F6FED]/30',
      gradient: 'from-blue-950/40 to-black',
    },
    {
      id: 'drafts' as const,
      title: 'Drafts & Saved Posts',
      subtitle: 'Post Queue & Scheduled Drafts',
      icon: <FileText className="w-5 h-5 text-[#2F6FED]" />,
      badge: `${drafts.length} drafts`,
      badgeColor: 'bg-[#2F6FED]/15 text-[#2F6FED] border-[#2F6FED]/30',
      gradient: 'from-blue-950/40 to-black',
    },
    {
      id: 'saved' as const,
      title: 'Saved Proofs',
      subtitle: 'Bookmarked Inspiration & Recipes',
      icon: <Bookmark className="w-5 h-5 text-white/80" />,
      badge: `${savedPosts.length} saved`,
      badgeColor: 'bg-white/10 text-white/80 border-white/20',
      gradient: 'from-white/10 to-black',
    },
  ];

  return (
    <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Top bar with username, share, quick hub button, and settings */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-bold text-white/50">
            @{currentUser.username}
          </span>
          <div className="flex items-center gap-2">
            {/* Pop-Up Hub Button in Top Bar */}
            <button
              onClick={() => {
                vibrateLight();
                setIsQuickHubOpen(true);
              }}
              className="px-3 py-1.5 rounded-full bg-[#2F6FED]/15 hover:bg-[#2F6FED]/25 border border-[#2F6FED]/40 text-[#2F6FED] text-xs font-black transition-all flex items-center gap-1.5 shadow-sm shadow-[#2F6FED]/10 active:scale-95"
              title="Open Insights, Analytics & Saved"
            >
              <Sparkles className="w-3.5 h-3.5 fill-[#2F6FED]" />
              <span>Hub & Tools</span>
            </button>

            <button
              onClick={handleShareProfile}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-colors relative min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Share profile"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copiedLink && (
                <span className="absolute -top-7 right-0 text-[10px] font-bold bg-[#2F6FED] text-white px-2 py-0.5 rounded shadow whitespace-nowrap">
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
                    <Edit3 className="w-3.5 h-3.5 text-[#2F6FED]" />
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
            <div className="absolute -bottom-1 -right-1 bg-black text-[#2F6FED] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#2F6FED]/50 flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3 fill-[#2F6FED]" />
              <span>{currentUser.currentStreak}d</span>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-black text-white flex items-center gap-1.5">
              {currentUser.name}
              <CheckCircle2 className="w-4 h-4 text-[#2F6FED]" />
            </h1>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">{currentUser.bio}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/5 text-center">
          <div>
            <span className="text-base font-black text-[#2F6FED] block">
              {currentUser.currentStreak}d
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold flex items-center justify-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-[#2F6FED] fill-[#2F6FED]" /> Streak
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

        {/* Focus Areas */}
        {currentUser.interests && currentUser.interests.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mr-1">
              Focus:
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

        {/* Primary Action Buttons: Edit Profile & Pop-Up Hub Button */}
        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-2">
          <button
            onClick={onOpenEditProfile}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors min-h-[44px] active:scale-[0.99]"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#2F6FED]" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => {
              vibrateLight();
              setIsQuickHubOpen(true);
            }}
            className="py-2.5 px-3 rounded-xl bg-[#2F6FED]/10 hover:bg-[#2F6FED]/20 border border-[#2F6FED]/30 text-[#2F6FED] text-xs font-black flex items-center justify-center gap-2 transition-all min-h-[44px] shadow-sm shadow-[#2F6FED]/10 active:scale-[0.99]"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#2F6FED]" />
            <span>Analytics & Saved</span>
          </button>
        </div>

        {/* Person Dossier Quick Switch Banner */}
        <div className="mt-3 pt-3 border-t border-white/5">
          <button
            onClick={() => {
              vibrateLight();
              setProfileTab('dossier');
            }}
            className={`w-full py-2.5 px-3.5 rounded-2xl transition-all group min-h-[44px] text-left active:scale-[0.99] flex items-center justify-between ${
              profileTab === 'dossier'
                ? 'bg-[#2F6FED]/20 border border-[#2F6FED] text-white'
                : 'bg-[#2F6FED]/10 hover:bg-[#2F6FED]/15 border border-[#2F6FED]/30 text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-[#2F6FED] transition-colors flex items-center gap-1.5">
                  <span>Rahul's Person Dossier</span>
                  <span className="text-[10px] font-mono text-[#2F6FED] bg-[#2F6FED]/10 px-1.5 py-0.5 rounded-full">
                    {profileTab === 'dossier' ? 'Viewing' : 'Open'}
                  </span>
                </div>
                <div className="text-[10px] text-white/50 font-mono">
                  Pillars (Building / Fitness / Learning) & Proof Timeline
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#2F6FED] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Streak Freeze Shield (Shifted from Challenges Tab to Profile Tab) */}
      <StreakFreezeCard
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Clean Profile Navigation Tabs */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('dossier');
                setSelectedCollectionId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'dossier'
                  ? 'bg-white text-black shadow-sm font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED]" />
              <span>Dossier</span>
            </button>

            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('proofs');
                setSelectedCollectionId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'proofs'
                  ? 'bg-white text-black shadow-sm font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#2F6FED]" />
              <span>Proofs ({userPosts.length})</span>
            </button>

            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('collections');
                setSelectedCollectionId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'collections'
                  ? 'bg-white text-black shadow-sm font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Collections ({collections.length})</span>
            </button>
          </div>

          {/* Grid vs List View Selector (when viewing Proofs) or New Collection Button */}
          {profileTab === 'proofs' || selectedCollectionId ? (
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
          ) : profileTab === 'collections' ? (
            <button
              onClick={() => {
                vibrateLight();
                onOpenCreateCollection();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#2861d6] text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-[#2F6FED]/20 active:scale-95 whitespace-nowrap shrink-0 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Box</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Floating Action Toast Notification */}
      {draftActionToast && (
        <div className="p-3 rounded-2xl bg-[#2F6FED] text-white font-bold text-xs flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{draftActionToast}</span>
          </div>
          <button
            onClick={() => setDraftActionToast(null)}
            className="text-white/70 hover:text-white text-[11px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 0: DOSSIER TAB */}
      {profileTab === 'dossier' && (
        <div className="animate-in fade-in pb-8">
          <PersonProfileDossierScreen onOpenCreatePost={onOpenCreatePost} />
        </div>
      )}

      {/* TAB 1: PROOFS TAB */}
      {profileTab === 'proofs' && (
        <div className="space-y-4 animate-in fade-in">
          {userPosts.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-2">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => {
                      if (onOpenInsights) {
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
                        alt="Proof thumbnail"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full p-2.5 flex flex-col justify-between bg-white/[0.03]">
                        <span className="text-[10px] text-[#2F6FED] font-bold">🔥 Proof</span>
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
                      {onOpenAddToCollection && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            vibrateLight();
                            onOpenAddToCollection(post);
                          }}
                          className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-[#2F6FED] hover:text-white border border-white/20 transition-colors flex items-center gap-1 mt-1"
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
                {userPosts.map((post) => (
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
              type="feed"
              title="No proof updates posted yet"
              description="Start your streak! Post your first proof of work for today."
              primaryAction={{
                label: 'Post Proof',
                onClick: () => {
                  if (onOpenCreatePost) onOpenCreatePost();
                  else if (onOpenCreateDraft) onOpenCreateDraft();
                },
                icon: <Plus className="w-4 h-4" />,
              }}
            />
          )}
        </div>
      )}

      {/* TAB 2: COLLECTIONS TAB */}
      {profileTab === 'collections' && (
        <div className="space-y-4 animate-in fade-in">
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
                      <div className="w-14 h-14 rounded-2xl bg-[#111111] border-2 border-[#2F6FED] shadow-xl flex items-center justify-center text-2xl shrink-0">
                        {selectedCollection.icon || '📁'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-lg font-black text-white">
                            {selectedCollection.name}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full bg-[#2F6FED]/20 border border-[#2F6FED]/40 text-[#2F6FED] font-bold text-[10px]">
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
                            <span className="text-[10px] text-[#2F6FED] font-bold">🔥 Proof</span>
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
                      setProfileTab('proofs');
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
                  className="p-5 rounded-3xl border-2 border-dashed border-white/15 hover:border-[#2F6FED]/60 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2 min-h-[140px] group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#2F6FED]/10 group-hover:bg-[#2F6FED] group-hover:text-white text-[#2F6FED] border border-[#2F6FED]/30 flex items-center justify-center transition-colors">
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
                      className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-[#2F6FED]/40 transition-all cursor-pointer shadow-lg group flex flex-col justify-between"
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
                          <div className="w-full h-full bg-gradient-to-br from-[#2F6FED]/20 to-black/80" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-white font-bold text-[10px]">
                          {proofCount} {proofCount === 1 ? 'proof' : 'proofs'}
                        </span>
                      </div>

                      {/* Info body */}
                      <div className="p-4 pt-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0 -mt-6 bg-[#111111] shadow-lg border-[#2F6FED]/30">
                          {col.icon || '📁'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-sm text-white truncate group-hover:text-[#2F6FED] transition-colors">
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



      {/* POP-UP OPTIONS MENU MODAL: Insights, Drafts, and Saved */}
      {isQuickHubOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsQuickHubOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0E0E0E] border-t sm:border border-white/15 rounded-t-[36px] sm:rounded-[36px] overflow-hidden shadow-2xl text-white p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2F6FED]/20 border border-[#2F6FED]/40 flex items-center justify-center text-[#2F6FED]">
                  <Sparkles className="w-4 h-4 fill-[#2F6FED]" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">Profile Tools & Quick Hub</h2>
                  <p className="text-[11px] text-white/50">Explore insights, analytics & drafts</p>
                </div>
              </div>

              <button
                onClick={() => setIsQuickHubOpen(false)}
                className="p-1.5 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close hub options"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prominent Option Cards */}
            <div className="space-y-2.5">
              {hubOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setIsQuickHubOpen(false);
                    setActiveHubView(opt.id);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {opt.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white group-hover:text-[#2F6FED] transition-colors">
                          {opt.title}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 mt-0.5 truncate">{opt.subtitle}</p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>

            {/* Bottom Dismiss */}
            <button
              type="button"
              onClick={() => setIsQuickHubOpen(false)}
              className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/70 hover:text-white transition-colors text-center"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* DEDICATED FULL SUBVIEW MODALS TRIGGERED FROM POP-UP HUB */}

      {/* 2. INSIGHTS MODAL */}
      {activeHubView === 'insights' && (
        <PostInsightsModal
          isOpen={true}
          post={userPosts[0] || null}
          onClose={() => setActiveHubView(null)}
          onSharePost={onSharePost}
        />
      )}

      {/* 3. DRAFTS & SAVED POSTS MODAL */}
      {activeHubView === 'drafts' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2F6FED]" />
                <h3 className="text-xs font-black text-white">Drafts Queue & Scheduled Posts ({drafts.length})</h3>
              </div>
              <button
                onClick={() => setActiveHubView(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 pb-2">
                <button
                  type="button"
                  onClick={() => setDraftFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    draftFilter === 'all'
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  All ({drafts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDraftFilter('scheduled')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${
                    draftFilter === 'scheduled'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-white/5 text-blue-300 hover:text-white border border-white/10'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Scheduled ({scheduledDrafts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraftFilter('standard')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    draftFilter === 'standard'
                      ? 'bg-[#2F6FED] text-white font-black'
                      : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                  }`}
                >
                  Standard ({standardDrafts.length})
                </button>
              </div>

              {/* Drafts List */}
              {displayDrafts.length > 0 ? (
                displayDrafts.map((draft) => {
                  const isScheduled = Boolean(draft.isScheduled && draft.scheduledAt);
                  const scheduledDateObj = draft.scheduledAt ? new Date(draft.scheduledAt) : null;
                  const isOverdue = scheduledDateObj ? scheduledDateObj.getTime() <= Date.now() : false;

                  const formattedScheduled = scheduledDateObj
                    ? scheduledDateObj.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : null;

                  return (
                    <div
                      key={draft.id}
                      className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-white">
                          {draft.title || (draft.content ? draft.content.slice(0, 35) + '...' : 'Untitled Draft')}
                        </span>
                        {isScheduled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {isOverdue ? 'Ready' : formattedScheduled}
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5">
                        {draft.imageUrl && (
                          <img
                            src={draft.imageUrl}
                            alt="Draft preview"
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                        )}
                        <p className="text-xs text-white/70 line-clamp-2">{draft.content || 'No text content'}</p>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveHubView(null);
                              if (onOpenResumeDraft) onOpenResumeDraft(draft);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3 text-[#2F6FED]" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteDraft(draft.id, e)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={(e) => handlePublishDraft(draft.id, e)}
                          className="px-3 py-1 rounded-xl bg-[#2F6FED] hover:bg-[#2861d6] text-white text-xs font-black flex items-center gap-1 shadow-sm"
                        >
                          <Flame className="w-3 h-3 fill-black" />
                          <span>Post Now</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-white/40 space-y-1">
                  <p className="font-semibold text-white/60">No drafts in this category</p>
                  <p>Create a draft from the create post view to queue proofs in advance.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. SAVED PROOFS MODAL */}
      {activeHubView === 'saved' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black text-white">Saved Proofs & Bookmarks ({savedPosts.length})</h3>
              </div>
              <button
                onClick={() => setActiveHubView(null)}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {savedPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {savedPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => {
                        setActiveHubView(null);
                        onOpenComments(post);
                      }}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer"
                    >
                      {post.imageUrl ? (
                        <img
                          src={post.imageUrl}
                          alt="Saved Post"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full p-2 flex flex-col justify-between bg-white/[0.03]">
                          <span className="text-[9px] text-[#2F6FED] font-bold">🔥 Saved</span>
                          <p className="text-[9px] text-white/70 line-clamp-3">{post.content}</p>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-xs font-bold">
                        <span>❤️ {post.likesCount}</span>
                        <span className="text-[9px] text-white/70">Tap to open</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateIllustration
                  type="saved"
                  title="No saved proofs yet"
                  description="Tap the bookmark icon on any post in your feed to save it for quick inspiration."
                />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
