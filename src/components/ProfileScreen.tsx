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
import { UserConnectionsModal } from './UserConnectionsModal';
import { ShareProfileIdModal } from './ShareProfileIdModal';
import { ProfileSettingsModal } from './ProfileSettingsModal';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { DailyStorageService } from '../services/storage';

interface ProfileScreenProps {
  currentUser: User;
  posts: Post[];
  savedPostIds?: string[];
  reportedPostIds?: string[];
  initialTab?: 'dossier' | 'proofs' | 'collections' | 'drafts';
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
  // Clean profile tabs: Proofs, Collections, and Drafts
  const [profileTab, setProfileTab] = useState<'proofs' | 'collections' | 'drafts'>(
    initialTab === 'drafts' ? 'drafts' : initialTab === 'collections' ? 'collections' : 'proofs'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Connections (Followers / Following) Modal State
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [connectionsTab, setConnectionsTab] = useState<'followers' | 'following'>('followers');

  // Share ID Modal State
  const [isShareIdModalOpen, setIsShareIdModalOpen] = useState(false);

  // Settings & Tools Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Person Dossier Full Modal State (opened from Settings)
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);

  // Sub-modals for Insights, Drafts, and Saved (accessible via Settings)
  const [activeHubView, setActiveHubView] = useState<'insights' | 'drafts' | 'saved' | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Drafts & Scheduled Queue State
  const [drafts, setDrafts] = useState<PostDraft[]>(() => DailyStorageService.getAllDrafts(currentUser.id));
  const [draftFilter, setDraftFilter] = useState<'all' | 'scheduled' | 'standard'>('all');
  const [draftActionToast, setDraftActionToast] = useState<string | null>(null);

  // Reload drafts when currentUser changes, hub view opens, or draft is auto-saved
  useEffect(() => {
    const refreshDrafts = () => {
      setDrafts(DailyStorageService.getAllDrafts(currentUser.id));
    };
    refreshDrafts();
    window.addEventListener('daily:draft-saved', refreshDrafts);
    return () => window.removeEventListener('daily:draft-saved', refreshDrafts);
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

  // Activity Heatmap: GitHub-style 30-day posting history dot graph
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    formattedLabel: string;
    count: number;
    isToday: boolean;
  } | null>(null);

  const last30DaysActivity = React.useMemo(() => {
    const days = [];
    const now = new Date();

    const postsPerDayMap: Record<string, number> = {};
    userPosts.forEach((post) => {
      const dateKey = post.postDate || post.createdAt?.slice(0, 10);
      if (dateKey) {
        postsPerDayMap[dateKey] = (postsPerDayMap[dateKey] || 0) + 1;
      }
    });

    if (Array.isArray(currentUser.activityDates)) {
      currentUser.activityDates.forEach((dateKey) => {
        if (!postsPerDayMap[dateKey]) {
          postsPerDayMap[dateKey] = 1;
        }
      });
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const count = postsPerDayMap[isoDate] || 0;
      const formattedLabel = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      days.push({
        date: isoDate,
        formattedLabel,
        count,
        isToday: i === 0,
      });
    }
    return days;
  }, [userPosts, currentUser.activityDates]);

  const activeDaysCount = last30DaysActivity.filter((d) => d.count > 0).length;
  const totalProofsLast30Days = last30DaysActivity.reduce((sum, d) => sum + d.count, 0);

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

  return (
    <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white/5 border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Top bar with username, share ID button, and settings */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono font-bold text-white/50">
            @{currentUser.username}
          </span>
          <div className="flex items-center gap-2">
            {/* Share ID to Chats & Groups Button */}
            <button
              onClick={() => {
                vibrateLight();
                setIsShareIdModalOpen(true);
              }}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Share ID to Chats & Groups"
              aria-label="Share ID to Chats & Groups"
            >
              <Send className="w-3.5 h-3.5" />
            </button>

            {/* Settings & Tools Button */}
            <button
              onClick={() => {
                vibrateLight();
                setIsSettingsModalOpen(true);
              }}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Settings & Tools"
              aria-label="Settings & Tools"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* User Info Row */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-white/10 shadow-lg shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
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

        {/* Stats Row: Proofs, Collections, Drafts, Followers, Following */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-5 pt-4 border-t border-white/5 text-center">
          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setProfileTab('proofs');
              setSelectedCollectionId(null);
            }}
            className="group p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="View Proofs"
          >
            <span className="text-base font-black text-white group-hover:text-[#2F6FED] transition-colors block">
              {userPosts.length}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 group-hover:text-white/70 font-semibold transition-colors">Proofs</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setProfileTab('collections');
              setSelectedCollectionId(null);
            }}
            className="group p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="View Collections"
          >
            <span className="text-base font-black text-white group-hover:text-blue-400 transition-colors block">
              {collections.length}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 group-hover:text-white/70 font-semibold transition-colors">Collections</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setProfileTab('drafts');
              setSelectedCollectionId(null);
            }}
            className="group p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="View Saved Drafts"
          >
            <span className="text-base font-black text-white group-hover:text-amber-400 transition-colors block">
              {drafts.length}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 group-hover:text-amber-400/80 font-semibold transition-colors">Drafts</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setConnectionsTab('followers');
              setIsConnectionsModalOpen(true);
            }}
            className="group p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="View Followers"
          >
            <span className="text-base font-black text-white group-hover:text-[#2F6FED] transition-colors block">
              {currentUser.followersCount || 489}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 group-hover:text-white/70 font-semibold transition-colors">
              Followers
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setConnectionsTab('following');
              setIsConnectionsModalOpen(true);
            }}
            className="group p-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="View Following"
          >
            <span className="text-base font-black text-white group-hover:text-[#2F6FED] transition-colors block">
              {currentUser.followingCount || currentUser.followedUserIds?.length || 92}
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-white/40 group-hover:text-white/70 font-semibold transition-colors">
              Following
            </span>
          </button>
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

        {/* Activity Heatmap: GitHub-style 30-Day Posting Dot Graph */}
        <div className="mt-4 pt-3.5 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold text-white/90 tracking-wide">
                Posting Activity
              </span>
              <span className="text-[10px] text-white/40 font-medium">
                (Last 30 Days)
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/90 font-bold">
              {activeDaysCount}/30 active days • {totalProofsLast30Days} proofs
            </span>
          </div>

          {/* GitHub-style Dot Grid */}
          <div className="bg-black/30 rounded-2xl border border-white/10 p-3 space-y-2">
            {/* Dots matrix: 30 days in a clean 10x3 scannable grid */}
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
              {last30DaysActivity.map((day) => {
                let dotStyle = 'bg-white/10 border-white/5 hover:border-white/30';
                if (day.count === 1) {
                  dotStyle = 'bg-emerald-500/70 border-emerald-400/80 shadow-sm shadow-emerald-500/20';
                } else if (day.count >= 2) {
                  dotStyle = 'bg-emerald-400 border-emerald-300 shadow-md shadow-emerald-400/30 font-bold';
                }

                return (
                  <button
                    key={day.date}
                    type="button"
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => {
                      vibrateLight();
                      setHoveredDay(day);
                    }}
                    className={`group relative aspect-square rounded-md border transition-all duration-150 flex items-center justify-center ${dotStyle} ${
                      day.isToday ? 'ring-1 ring-white/60' : ''
                    }`}
                    title={`${day.formattedLabel}: ${day.count} ${day.count === 1 ? 'proof' : 'proofs'} posted`}
                    aria-label={`${day.formattedLabel}: ${day.count} proofs`}
                  >
                    {day.count > 1 && (
                      <span className="text-[7px] font-mono text-black font-black leading-none">
                        {day.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Hover Tooltip or Default Legend */}
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/50">
              {hoveredDay ? (
                <div className="font-mono text-white text-[11px] flex items-center gap-1.5 animate-in fade-in duration-150">
                  <span className="font-bold text-emerald-300">{hoveredDay.formattedLabel}:</span>
                  <span>{hoveredDay.count} {hoveredDay.count === 1 ? 'proof' : 'proofs'} posted</span>
                  {hoveredDay.isToday && <span className="text-amber-400 font-bold">(Today)</span>}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-wider text-white/40">Consistency</span>
                  <span className="text-white/70 font-mono font-medium">
                    {Math.round((activeDaysCount / 30) * 100)}% rate
                  </span>
                </div>
              )}

              {/* GitHub Dot Legend */}
              <div className="flex items-center gap-1 text-[9px] text-white/40 font-mono">
                <span>Less</span>
                <span className="w-2 h-2 rounded-[2px] bg-white/10 border border-white/5 inline-block" />
                <span className="w-2 h-2 rounded-[2px] bg-emerald-500/70 border border-emerald-400/80 inline-block" />
                <span className="w-2 h-2 rounded-[2px] bg-emerald-400 border border-emerald-300 inline-block" />
                <span>More</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Action Button: Edit Profile */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <button
            onClick={onOpenEditProfile}
            className="w-full py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors min-h-[44px] active:scale-[0.99]"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#2F6FED]" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Clean Profile Navigation Tabs */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
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

            <button
              onClick={() => {
                vibrateLight();
                setProfileTab('drafts');
                setSelectedCollectionId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'drafts'
                  ? 'bg-white text-black shadow-sm font-black'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Drafts ({drafts.length})</span>
            </button>
          </div>

          {/* Grid vs List View Selector (when viewing Proofs) or New Collection Button or New Draft Button */}
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
          ) : (
            <button
              onClick={() => {
                vibrateLight();
                if (onOpenCreateDraft) onOpenCreateDraft();
                else if (onOpenCreatePost) onOpenCreatePost();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 whitespace-nowrap shrink-0 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Draft</span>
            </button>
          )}
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

      {/* TAB 3: DEDICATED DRAFTS & QUEUE TAB */}
      {profileTab === 'drafts' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Drafts Filter Pills and Actions Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setDraftFilter('all');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  draftFilter === 'all'
                    ? 'bg-white text-black font-black shadow-sm'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                All ({drafts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setDraftFilter('scheduled');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                  draftFilter === 'scheduled'
                    ? 'bg-blue-500 text-white font-black shadow-sm'
                    : 'bg-white/5 text-blue-300 hover:text-white border border-white/10'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Scheduled ({scheduledDrafts.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setDraftFilter('standard');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  draftFilter === 'standard'
                    ? 'bg-amber-500 text-black font-black shadow-sm'
                    : 'bg-white/5 text-amber-300 hover:text-white border border-white/10'
                }`}
              >
                Standard ({standardDrafts.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                vibrateLight();
                if (onOpenCreateDraft) onOpenCreateDraft();
                else if (onOpenCreatePost) onOpenCreatePost();
              }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 whitespace-nowrap pl-2 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Draft</span>
            </button>
          </div>

          {/* Drafts Cards List */}
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

                const draftPhotos = draft.imageUrls && draft.imageUrls.length > 0
                  ? draft.imageUrls
                  : draft.imageUrl
                  ? [draft.imageUrl]
                  : [];

                return (
                  <div
                    key={draft.id}
                    className="p-4 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all space-y-3 shadow-lg"
                  >
                    {/* Header: Title / Scheduled badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <h4 className="font-bold text-xs text-white line-clamp-1">
                          {draft.title || (draft.content ? draft.content.slice(0, 40) + '...' : 'Untitled Post Draft')}
                        </h4>
                      </div>

                      {isScheduled && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${
                            isOverdue
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          <span>{isOverdue ? 'Ready to post' : formattedScheduled}</span>
                        </span>
                      )}
                    </div>

                    {/* Content preview & Media */}
                    <div className="flex items-start gap-3">
                      {draftPhotos.length > 0 && (
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-white/15 bg-black shrink-0">
                          <img
                            src={draftPhotos[0]}
                            alt="Draft receipt"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {draftPhotos.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold font-mono px-1 rounded">
                              +{draftPhotos.length - 1}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">
                          {draft.content || <span className="italic text-white/30">No text content</span>}
                        </p>

                        {/* Tags */}
                        {draft.tags && draft.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {draft.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/5 border border-white/10 text-white/60 font-semibold"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Edit, Delete, Post Now */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            vibrateLight();
                            if (onOpenResumeDraft) onOpenResumeDraft(draft);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[32px]"
                          title="Edit draft in composer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#2F6FED]" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                          title="Delete draft"
                          aria-label="Delete draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handlePublishDraft(draft.id, e)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#2861d6] text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-[#2F6FED]/20 active:scale-95 transition-all min-h-[32px]"
                      >
                        <Flame className="w-3.5 h-3.5 fill-current text-white" />
                        <span>Publish Now</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white/[0.02] border border-white/10 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-white">No drafts found</h4>
                <p className="text-xs text-white/50 max-w-xs mx-auto leading-relaxed">
                  {draftFilter === 'scheduled'
                    ? 'You have no scheduled posts queued. Schedule posts to automatically deliver on your target day!'
                    : draftFilter === 'standard'
                    ? 'You have no standard saved drafts.'
                    : 'Capture your thoughts, multiple proof receipts, or scheduled check-ins here before publishing.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  if (onOpenCreateDraft) onOpenCreateDraft();
                  else if (onOpenCreatePost) onOpenCreatePost();
                }}
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all mt-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Draft</span>
              </button>
            </div>
          )}
        </div>
      )}



      {/* USER CONNECTIONS MODAL: Followers & Following */}
      <UserConnectionsModal
        isOpen={isConnectionsModalOpen}
        onClose={() => setIsConnectionsModalOpen(false)}
        initialTab={connectionsTab}
        currentUser={currentUser}
        onSendDM={onSendDM}
        onToggleFollow={onToggleFollow}
      />

      {/* SHARE PROFILE ID MODAL: Send ID to Chats & Groups */}
      <ShareProfileIdModal
        isOpen={isShareIdModalOpen}
        onClose={() => setIsShareIdModalOpen(false)}
        currentUser={currentUser}
      />

      {/* PROFILE SETTINGS & TOOLS MODAL: Hub for Analytics, Saved, Dossier, Drafts, and Data */}
      <ProfileSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        userPosts={userPosts}
        savedPosts={savedPosts}
        drafts={drafts}
        onOpenEditProfile={onOpenEditProfile}
        onOpenAnalytics={() => setActiveHubView('insights')}
        onOpenSaved={() => setActiveHubView('saved')}
        onOpenDrafts={() => setActiveHubView('drafts')}
        onOpenDossier={() => setIsDossierModalOpen(true)}
        onResetData={onResetData}
      />

      {/* PERSON DOSSIER FULLSCREEN MODAL (Opened from Settings) */}
      {isDossierModalOpen && (
        <div className="fixed inset-0 z-50 bg-black overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-lg mx-auto p-4 pt-6 min-h-screen">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 sticky top-0 bg-black/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2F6FED]" />
                <h2 className="text-base font-black text-white">Person Dossier</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDossierModalOpen(false)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                title="Close Dossier"
                aria-label="Close Dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <PersonProfileDossierScreen onOpenCreatePost={onOpenCreatePost} />
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
