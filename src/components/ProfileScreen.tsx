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
  ExternalLink,
  Check,
  Award,
  ShieldCheck,
  FileText,
  Clock,
  Send,
  Calendar,
  Layers,
  ChevronRight,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { User, Post, ProofCollection, AVAILABLE_DISCIPLINE_MILESTONES, PostDraft } from '../types';
import { PostCard } from './PostCard';
import { EmptyStateIllustration } from './EmptyStateIllustration';
import { DisciplineMilestonesModal } from './DisciplineMilestonesModal';
import { ActivityTrendChart } from './ActivityTrendChart';
import { DailyDiaryNotebook } from './DailyDiaryNotebook';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { DailyStorageService } from '../services/storage';

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
  onUpdateMilestones?: (milestoneIds: string[]) => void;
  onOpenResumeDraft?: (draft: PostDraft) => void;
  onOpenCreateDraft?: () => void;
  onOpenCreatePost?: () => void;
  onPublishDraftDirectly?: (draftId: string) => void;
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
  onSendDM = (_targetUser: { id: string; name: string; username: string; avatar: string; streak: number }) => {},
  onSharePost,
  onOpenInsights,
  onDeletePost,
  onOpenCreateCollection = () => {},
  onDeleteCollection = (_collectionId: string) => {},
  onRemovePostFromCollection = (_collectionId: string, _postId: string) => {},
  onOpenAddToCollection,
  onUpdateMilestones,
  onOpenResumeDraft,
  onOpenCreateDraft,
  onOpenCreatePost,
  onPublishDraftDirectly,
}) => {
  const [profileTab, setProfileTab] = useState<'my_posts' | 'diary' | 'drafts' | 'collections' | 'saved'>('my_posts');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false);
  const [showActivityChart, setShowActivityChart] = useState(true);

  // Drafts & Scheduled Queue State
  const [drafts, setDrafts] = useState<PostDraft[]>(() => DailyStorageService.getAllDrafts(currentUser.id));
  const [draftFilter, setDraftFilter] = useState<'all' | 'scheduled' | 'standard'>('all');
  const [draftActionToast, setDraftActionToast] = useState<string | null>(null);

  // Reload drafts when tab changes or currentUser changes
  useEffect(() => {
    setDrafts(DailyStorageService.getAllDrafts(currentUser.id));
  }, [currentUser.id, profileTab]);

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

  // Active display posts for grid/list (my proofs vs saved)
  const activeDisplayPosts = profileTab === 'saved' ? savedPosts : userPosts;

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

        {/* 3 DISCIPLINE MILESTONES SHOWCASE */}
        <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Discipline Milestones ({currentUser.disciplineMilestones?.length || 0}/3)
            </span>
            <button
              onClick={() => {
                vibrateLight();
                setIsMilestonesModalOpen(true);
              }}
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Apply Milestones</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((slotIdx) => {
              const activeId = currentUser.disciplineMilestones?.[slotIdx];
              const milestone = AVAILABLE_DISCIPLINE_MILESTONES.find((m) => m.id === activeId);

              if (milestone) {
                return (
                  <div
                    key={slotIdx}
                    onClick={() => {
                      vibrateLight();
                      setIsMilestonesModalOpen(true);
                    }}
                    className="p-2.5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 hover:border-[#D4AF37] text-left cursor-pointer transition-all relative group shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{milestone.icon}</span>
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-[#D4AF37] border border-[#D4AF37]/20">
                        {milestone.category}
                      </span>
                    </div>
                    <p className="font-black text-xs text-white truncate mt-1.5">{milestone.title}</p>
                    <p className="text-[9px] text-white/50 truncate">{milestone.headline}</p>
                  </div>
                );
              }

              return (
                <button
                  key={slotIdx}
                  onClick={() => {
                    vibrateLight();
                    setIsMilestonesModalOpen(true);
                  }}
                  className="p-2.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-dashed border-white/15 text-center flex flex-col items-center justify-center min-h-[72px] transition-all cursor-pointer group"
                >
                  <Plus className="w-4 h-4 text-white/30 group-hover:text-[#D4AF37] transition-colors" />
                  <span className="text-[9px] font-bold text-white/40 group-hover:text-white mt-1">
                    Apply Slot {slotIdx + 1}
                  </span>
                </button>
              );
            })}
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

          <button
            onClick={() => {
              vibrateLight();
              setShowActivityChart(!showActivityChart);
            }}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] active:scale-[0.99] ${
              showActivityChart
                ? 'bg-[#D4AF37]/20 border-[#D4AF37]/50 text-[#D4AF37]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
            }`}
            title="Toggle 30-Day Activity Trend Line Chart"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trends</span>
          </button>

          {userPosts.length > 0 && onOpenInsights && (
            <button
              onClick={() => onOpenInsights(userPosts[0])}
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/80 hover:text-white flex items-center justify-center gap-1.5 transition-colors min-h-[44px] active:scale-[0.99]"
              title="View Engagement Analytics for your latest post"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Insights</span>
            </button>
          )}
        </div>
      </div>

      {/* 30-Day Activity Trend Chart Component */}
      {showActivityChart && (
        <ActivityTrendChart
          user={currentUser}
        />
      )}

      {/* Profile Navigation Tabs: My Proofs, Daily Diary, Drafts, Collections, Saved */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar max-w-full">
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
              <span>Proofs ({userPosts.length})</span>
            </button>

            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('diary');
                setSelectedCollectionId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'diary'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-amber-950 shadow-md font-black'
                  : 'text-amber-200/70 hover:text-amber-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Diary</span>
            </button>

            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('drafts');
                setSelectedCollectionId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap relative ${
                profileTab === 'drafts'
                  ? 'bg-[#D4AF37] text-black shadow-sm font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Drafts ({drafts.length})</span>
              {scheduledDrafts.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 absolute top-1 right-1" />
              )}
            </button>

            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('collections');
                setSelectedCollectionId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'collections'
                  ? 'bg-white text-black shadow-sm font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Boxes ({collections.length})</span>
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

          {/* Grid vs List View Selector (when viewing posts) or Action Button */}
          {profileTab === 'my_posts' || profileTab === 'saved' || selectedCollectionId ? (
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
          ) : profileTab === 'drafts' ? (
            <button
              onClick={() => {
                vibrateLight();
                if (onOpenCreateDraft) {
                  onOpenCreateDraft();
                } else if (onOpenResumeDraft) {
                  onOpenResumeDraft({
                    id: `draft_${Date.now()}`,
                    title: '',
                    content: '',
                    tags: [],
                    updatedAt: Date.now(),
                    isScheduled: false,
                  });
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-black font-black text-xs flex items-center gap-1 shadow-md shadow-[#D4AF37]/20 active:scale-95 whitespace-nowrap shrink-0 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Draft</span>
            </button>
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

      {/* Floating Action Toast Notification */}
      {draftActionToast && (
        <div className="p-3 rounded-2xl bg-[#D4AF37] text-black font-black text-xs flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{draftActionToast}</span>
          </div>
          <button
            onClick={() => setDraftActionToast(null)}
            className="text-black/70 hover:text-black text-[11px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab Content: DAILY DIARY NOTEBOOK TAB */}
      {profileTab === 'diary' && (
        <div className="space-y-4 animate-in fade-in">
          <DailyDiaryNotebook
            user={currentUser}
            onOpenCreatePost={() => {
              if (onOpenCreatePost) onOpenCreatePost();
              else if (onOpenCreateDraft) onOpenCreateDraft();
            }}
            onOpenChatWithUser={(targetUserId) => {
              const allUsers = DailyStorageService.getAllUsers();
              const foundUser = allUsers.find((u) => u.id === targetUserId);
              if (onSendDM) {
                onSendDM({
                  id: targetUserId,
                  name: foundUser?.name || 'Friend',
                  username: foundUser?.username || 'friend',
                  avatar: foundUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                  streak: foundUser?.currentStreak || 1,
                });
              }
            }}
          />
        </div>
      )}

      {/* Tab Content: DRAFTS TAB */}
      {profileTab === 'drafts' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header Summary Banner */}
          <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#D4AF37]" />
                  Saved Drafts & Queued Posts
                </h2>
                <p className="text-[11px] text-white/50 mt-0.5">
                  Resume editing, schedule for upcoming dates, or post directly.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10px] font-bold border border-[#D4AF37]/30">
                  {drafts.length} total
                </span>
                {scheduledDrafts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {scheduledDrafts.length} scheduled
                  </span>
                )}
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 pt-1">
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
                    ? 'bg-[#D4AF37] text-black font-black'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                Standard Drafts ({standardDrafts.length})
              </button>
            </div>
          </div>

          {/* Drafts List */}
          {displayDrafts.length > 0 ? (
            <div className="space-y-3">
              {displayDrafts.map((draft) => {
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

                const formattedUpdated = draft.updatedAt
                  ? new Date(draft.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recent';

                return (
                  <div
                    key={draft.id}
                    className="p-4 rounded-3xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 transition-all space-y-3 relative group"
                  >
                    {/* Header: Title / Status / Date */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white">
                          {draft.title || (draft.content ? draft.content.slice(0, 30) + '...' : 'Untitled Draft')}
                        </span>

                        {isScheduled ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 border ${
                              isOverdue
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{isOverdue ? 'Ready to publish' : `Scheduled for ${formattedScheduled}`}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/5 text-white/50 border border-white/10 flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" />
                            <span>Draft</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-white/40 whitespace-nowrap">
                        Saved {formattedUpdated}
                      </span>
                    </div>

                    {/* Content Preview & Image Thumbnail */}
                    <div className="flex items-start gap-3">
                      {draft.imageUrl && (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-black/60 border border-white/10 shrink-0">
                          <img
                            src={draft.imageUrl}
                            alt="Draft attachment"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 line-clamp-3 leading-relaxed">
                          {draft.content || <span className="italic text-white/40">No text content</span>}
                        </p>

                        {/* Tags */}
                        {draft.tags && draft.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {draft.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-semibold text-[#D4AF37] px-2 py-0.5 rounded bg-[#D4AF37]/10"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            vibrateLight();
                            if (onOpenResumeDraft) {
                              onOpenResumeDraft(draft);
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-white/10"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Resume / Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors border border-white/10"
                          title="Delete draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handlePublishDraft(draft.id, e)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f27] text-black text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-[#D4AF37]/20 active:scale-95"
                      >
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        <span>Post Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center space-y-3 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl p-6">
              <div className="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-white/40">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No saved drafts in this view</h3>
                <p className="text-xs text-white/50 mt-1 max-w-xs mx-auto">
                  {draftFilter === 'scheduled'
                    ? 'You have no scheduled posts queued. You can schedule a post from the create post screen.'
                    : 'Save drafts while preparing proofs for tomorrow or compose multiple posts in advance.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  if (onOpenCreateDraft) {
                    onOpenCreateDraft();
                  } else if (onOpenResumeDraft) {
                    onOpenResumeDraft({
                      id: `draft_${Date.now()}`,
                      title: '',
                      content: '',
                      tags: [],
                      updatedAt: Date.now(),
                      isScheduled: false,
                    });
                  }
                }}
                className="px-4 py-2 rounded-2xl bg-[#D4AF37] text-black font-black text-xs inline-flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/20 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Draft</span>
              </button>
            </div>
          )}
        </div>
      )}

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

      {/* Discipline Milestones Modal */}
      <DisciplineMilestonesModal
        isOpen={isMilestonesModalOpen}
        onClose={() => setIsMilestonesModalOpen(false)}
        selectedMilestoneIds={currentUser.disciplineMilestones || []}
        onSaveMilestones={(milestoneIds) => {
          if (onUpdateMilestones) {
            onUpdateMilestones(milestoneIds);
          }
        }}
      />
    </div>
  );
};
