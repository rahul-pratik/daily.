import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronDown,
  ShieldCheck,
  Flame,
  Check,
  Clock,
  BookOpen,
  Send,
  MessageSquare,
  Sparkles,
  Flag,
  Share2,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Plus,
  Trash2,
  TrendingUp,
  Info,
  Link,
  HelpCircle,
  Lightbulb,
  Award,
  Pin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  Camera,
  Upload,
} from 'lucide-react';
import { Community, User, Post, CommunityDiscussionThread, CommunityDiscussionComment } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface CommunityHubModalProps {
  community: Community;
  currentUser: User;
  allUsers: User[];
  posts?: Post[];
  isOpen: boolean;
  onClose: () => void;
  onToggleJoin: (communityId: string) => void;
  onApproveMember?: (communityId: string, userId: string) => void;
  onViewUser?: (user: User) => void;
  onViewPost?: (postId: string) => void;
  onReportViolation?: (communityName: string, ruleText: string) => void;
}

type DiscussionSort = 'hot' | 'new' | 'top';
type DiscussionFlairFilter = 'All' | 'Discussion' | 'Question' | 'Advice' | 'Story' | 'Milestone';

const DEFAULT_GUIDELINES = [
  '1. Keep discussions constructive, polite, and supportive of fellow members.',
  '2. Focus on substance and real experiences — no spam, affiliate promotions, or ads.',
  '3. Personal daily proof check-ins belong in your personal streak feed, not community discussion threads.',
  '4. Respect privacy and confidentiality of shared personal stories and dilemmas.',
  '5. Violations of guidelines will be moderated and may lead to removal from the community.',
];

const FLAIR_OPTIONS: Array<'Discussion' | 'Question' | 'Advice' | 'Story' | 'Milestone' | 'Announcement'> = [
  'Discussion',
  'Question',
  'Advice',
  'Story',
  'Milestone',
];

export const CommunityHubModal: React.FC<CommunityHubModalProps> = ({
  community,
  currentUser,
  allUsers,
  isOpen,
  onClose,
  onToggleJoin,
  onViewUser,
  onReportViolation,
}) => {
  // State for discussions and header dropdown
  const [threads, setThreads] = useState<CommunityDiscussionThread[]>([]);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false);
  const [activeThread, setActiveThread] = useState<CommunityDiscussionThread | null>(null);
  const [sortOption, setSortOption] = useState<DiscussionSort>('hot');
  const [selectedFlair, setSelectedFlair] = useState<DiscussionFlairFilter>('All');
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // New Discussion Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newFlair, setNewFlair] = useState<'Discussion' | 'Question' | 'Advice' | 'Story' | 'Milestone' | 'Announcement'>('Discussion');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newTagsInput, setNewTagsInput] = useState('');

  // Comment input state for active thread
  const [commentInput, setCommentInput] = useState('');

  // Load discussions on community mount or change
  useEffect(() => {
    if (community?.id) {
      const loaded = DailyStorageService.getCommunityDiscussions(community.id);
      setThreads(loaded);
    }
  }, [community?.id]);

  if (!isOpen || !community) return null;

  const isMember = (community.memberIds || []).includes(currentUser.id);
  const isPending = (community.pendingRequestUserIds || []).includes(currentUser.id);
  const isModerator = community.moderatorId === currentUser.id;

  const handleVote = (threadId: string, direction: 'up' | 'down') => {
    vibrateLight();
    const updated = DailyStorageService.voteCommunityDiscussion(community.id, threadId, direction);
    setThreads(updated);
    if (activeThread && activeThread.id === threadId) {
      const currentActive = updated.find((t) => t.id === threadId);
      if (currentActive) setActiveThread(currentActive);
    }
  };

  const handleDiscussionPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setNewImageUrl(reader.result);
        vibrateLight();
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateDiscussionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    vibrateStreakMilestone();
    const tags = newTagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    const created = DailyStorageService.createCommunityDiscussion(community.id, {
      title: newTitle,
      content: newContent,
      flair: newFlair,
      imageUrl: newImageUrl.trim() ? newImageUrl.trim() : undefined,
      tags,
    });

    const refreshed = DailyStorageService.getCommunityDiscussions(community.id);
    setThreads(refreshed);

    // Reset form
    setNewTitle('');
    setNewContent('');
    setNewFlair('Discussion');
    setNewImageUrl('');
    setNewTagsInput('');
    setShowCreateDiscussion(false);
  };

  const handleDeleteDiscussion = (threadId: string) => {
    vibrateLight();
    const updated = DailyStorageService.deleteCommunityDiscussion(community.id, threadId);
    setThreads(updated);
    if (activeThread?.id === threadId) {
      setActiveThread(null);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !commentInput.trim()) return;

    vibrateLight();
    const { threads: updated } = DailyStorageService.addDiscussionComment(
      community.id,
      activeThread.id,
      commentInput.trim()
    );
    setThreads(updated);
    const refreshedActive = updated.find((t) => t.id === activeThread.id);
    if (refreshedActive) {
      setActiveThread(refreshedActive);
    }
    setCommentInput('');
  };

  const handleShareCommunity = () => {
    vibrateLight();
    navigator.clipboard?.writeText?.(window.location.origin + `#community-${community.id}`);
    setCopyToast('Community link copied!');
    setTimeout(() => setCopyToast(null), 2400);
  };

  const handleShareThread = (thread: CommunityDiscussionThread) => {
    vibrateLight();
    navigator.clipboard?.writeText?.(
      `${thread.title} - Discuss in ${community.name}: ${window.location.origin}`
    );
    setCopyToast('Thread link copied!');
    setTimeout(() => setCopyToast(null), 2400);
  };

  // Filter and sort discussions
  const filteredThreads = threads.filter((t) => {
    if (selectedFlair === 'All') return true;
    return t.flair === selectedFlair;
  });

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    if (sortOption === 'new') {
      return (b.id > a.id ? 1 : -1);
    } else if (sortOption === 'top') {
      return b.upvotes - a.upvotes;
    } else {
      // Hot: upvotes + comment activity weight
      const scoreA = a.upvotes + (a.comments?.length || 0) * 2;
      const scoreB = b.upvotes + (b.comments?.length || 0) * 2;
      return scoreB - scoreA;
    }
  });

  const guidelinesList = community.rules && community.rules.length > 0 ? community.rules : DEFAULT_GUIDELINES;

  return (
    <div
      id="community-hub-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full h-full max-w-2xl bg-[#0e0e11] text-white flex flex-col md:h-[94vh] md:rounded-[32px] md:border md:border-white/10 overflow-hidden shadow-2xl relative">
        
        {/* Toast Notification */}
        {copyToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[90] bg-[#2F6FED] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>{copyToast}</span>
          </div>
        )}

        {/* TOP HEADER: Community Name clickable with Dropdown Arrow */}
        <header className="px-4 py-3 border-b border-white/10 bg-[#141418] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              id="community-hub-back-btn"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Clickable Community Header Title Pill */}
            <button
              id="community-header-trigger"
              onClick={() => {
                vibrateLight();
                setShowHeaderMenu(!showHeaderMenu);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left max-w-full group"
              title="Click for Community Options & Guidelines"
            >
              <img
                src={community.avatar}
                alt={community.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold text-white tracking-tight truncate group-hover:text-[#2F6FED] transition-colors">
                    {community.name}
                  </h1>
                  <ChevronDown
                    className={`w-4 h-4 text-white/50 group-hover:text-white transition-transform duration-200 shrink-0 ${
                      showHeaderMenu ? 'rotate-180 text-[#2F6FED]' : ''
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/50">
                  <span className="truncate">{community.category}</span>
                  <span>•</span>
                  <span className={isMember ? 'text-emerald-400 font-medium' : 'text-[#2F6FED] font-medium'}>
                    {isMember ? 'Joined' : 'Click to Join'}
                  </span>
                </div>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="community-guidelines-header-btn"
              onClick={() => {
                vibrateLight();
                setShowHeaderMenu(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Community Guidelines & Options"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#2F6FED]" />
              <span className="hidden sm:inline">Guidelines</span>
            </button>
          </div>
        </header>

        {/* CLICKABLE HEADER DROPDOWN / MODAL: Community Options & Guidelines */}
        {showHeaderMenu && (
          <div
            id="community-options-dropdown-overlay"
            className="absolute inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-start justify-center p-4 pt-16 animate-in fade-in duration-200"
            onClick={() => setShowHeaderMenu(false)}
          >
            <div
              id="community-options-dropdown-menu"
              className="w-full max-w-md bg-[#16161c] border border-white/15 rounded-3xl p-5 shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <img
                    src={community.avatar}
                    alt={community.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#2F6FED]/30 shrink-0"
                  />
                  <div>
                    <h2 className="text-base font-bold text-white">{community.name}</h2>
                    <p className="text-xs text-white/50">{community.category} • {community.memberCount || 1} members</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHeaderMenu(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-white/80 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5">
                {community.description || 'Welcome to our focused accountability community.'}
              </p>

              {/* Action 1: Join / Group Joined Toggle */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">
                  Membership Status
                </div>
                <button
                  id="community-toggle-join-btn"
                  onClick={() => {
                    vibrateLight();
                    onToggleJoin(community.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isMember
                      ? 'bg-white/10 hover:bg-red-500/20 text-emerald-400 hover:text-red-300 border border-white/10'
                      : 'bg-[#2F6FED] hover:bg-[#2F6FED]/90 text-white shadow-lg shadow-[#2F6FED]/20'
                  }`}
                >
                  {isMember ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Group Joined (Click to Leave)</span>
                    </>
                  ) : isPending ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Request Pending Approval</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Join Group</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action 2: Community Guidelines */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#2F6FED]" />
                    <span>Community Guidelines</span>
                  </div>
                </div>

                <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {guidelinesList.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-white/80 leading-snug">
                      <span className="text-[#2F6FED] font-bold shrink-0">•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Share & Report Row */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={handleShareCommunity}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Group</span>
                </button>
                <button
                  onClick={() => {
                    vibrateLight();
                    if (onReportViolation) {
                      onReportViolation(community.name, 'Community Guidelines violation report');
                    } else {
                      setCopyToast('Report received by moderators');
                      setTimeout(() => setCopyToast(null), 2000);
                    }
                  }}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  title="Report community"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY: DISCUSSIONS FOCUS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-4">
          
          {/* Start a Discussion Card */}
          <div className="bg-[#141418] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover ring-1 ring-white/15 shrink-0"
              />
              <button
                id="open-create-discussion-btn"
                onClick={() => {
                  vibrateLight();
                  setShowCreateDiscussion(true);
                }}
                className="flex-1 text-left px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white/50 hover:text-white/80 text-xs transition-colors"
              >
                Start a discussion or ask a question in {community.name}...
              </button>
              <button
                onClick={() => {
                  vibrateLight();
                  setShowCreateDiscussion(true);
                }}
                className="p-2.5 rounded-xl bg-[#2F6FED] hover:bg-[#2F6FED]/90 text-white transition-all shadow-md shadow-[#2F6FED]/20 shrink-0"
                title="Create Discussion Thread"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Discussion Filters & Sorting Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
            {/* Flair Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {(['All', 'Discussion', 'Question', 'Advice', 'Story', 'Milestone'] as DiscussionFlairFilter[]).map((flair) => (
                <button
                  key={flair}
                  onClick={() => {
                    vibrateLight();
                    setSelectedFlair(flair);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedFlair === flair
                      ? 'bg-[#2F6FED] text-white shadow-sm shadow-[#2F6FED]/30'
                      : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {flair}
                </button>
              ))}
            </div>

            {/* Sort Dropdown / Pills */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 shrink-0 self-start sm:self-auto">
              <button
                onClick={() => {
                  vibrateLight();
                  setSortOption('hot');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortOption === 'hot' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Flame className={`w-3.5 h-3.5 ${sortOption === 'hot' ? 'text-amber-400' : ''}`} />
                <span>Hot</span>
              </button>
              <button
                onClick={() => {
                  vibrateLight();
                  setSortOption('new');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortOption === 'new' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${sortOption === 'new' ? 'text-[#2F6FED]' : ''}`} />
                <span>New</span>
              </button>
              <button
                onClick={() => {
                  vibrateLight();
                  setSortOption('top');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  sortOption === 'top' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                <TrendingUp className={`w-3.5 h-3.5 ${sortOption === 'top' ? 'text-emerald-400' : ''}`} />
                <span>Top</span>
              </button>
            </div>
          </div>

          {/* Discussion Threads List */}
          <div className="space-y-3">
            {sortedThreads.length === 0 ? (
              <div className="bg-[#141418] border border-white/10 rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-white/40">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">No discussions under "{selectedFlair}" yet</h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  Be the first to share your thoughts, ask for advice, or start a productive conversation.
                </p>
                <button
                  onClick={() => setShowCreateDiscussion(true)}
                  className="px-4 py-2 rounded-xl bg-[#2F6FED] hover:bg-[#2F6FED]/90 text-white text-xs font-bold transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start Discussion</span>
                </button>
              </div>
            ) : (
              sortedThreads.map((thread) => {
                const isAuthor = thread.authorId === currentUser.id || thread.authorUsername === currentUser.username;
                const canDelete = isAuthor || isModerator;

                return (
                  <article
                    key={thread.id}
                    id={`discussion-thread-${thread.id}`}
                    className="bg-[#141418] border border-white/10 rounded-2xl p-3.5 sm:p-4 hover:border-white/20 transition-all shadow-md group relative"
                  >
                    <div className="flex items-start gap-3">
                      {/* Left: Reddit-Style Upvote / Downvote Pillar */}
                      <div className="flex flex-col items-center bg-black/30 rounded-xl p-1 shrink-0 border border-white/5">
                        <button
                          onClick={() => handleVote(thread.id, 'up')}
                          className={`p-1.5 rounded-lg transition-all ${
                            thread.userVote === 'up'
                              ? 'text-orange-500 bg-orange-500/15'
                              : 'text-white/40 hover:text-orange-400 hover:bg-white/5'
                          }`}
                          title="Upvote discussion"
                          aria-label="Upvote"
                        >
                          <ArrowBigUp className="w-5 h-5 fill-current" />
                        </button>
                        <span
                          className={`text-xs font-extrabold py-0.5 ${
                            thread.userVote === 'up'
                              ? 'text-orange-400'
                              : thread.userVote === 'down'
                              ? 'text-blue-400'
                              : 'text-white/80'
                          }`}
                        >
                          {thread.upvotes}
                        </span>
                        <button
                          onClick={() => handleVote(thread.id, 'down')}
                          className={`p-1.5 rounded-lg transition-all ${
                            thread.userVote === 'down'
                              ? 'text-blue-500 bg-blue-500/15'
                              : 'text-white/40 hover:text-blue-400 hover:bg-white/5'
                          }`}
                          title="Downvote discussion"
                          aria-label="Downvote"
                        >
                          <ArrowBigDown className="w-5 h-5 fill-current" />
                        </button>
                      </div>

                      {/* Main Discussion Thread Body */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Meta header: Flair & Author */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Flair Badge */}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                thread.flair === 'Announcement'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : thread.flair === 'Question'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : thread.flair === 'Advice'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : thread.flair === 'Milestone'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : 'bg-[#2F6FED]/20 text-[#2F6FED] border border-[#2F6FED]/30'
                              }`}
                            >
                              {thread.flair || 'Discussion'}
                            </span>

                            {thread.isPinned && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                <Pin className="w-2.5 h-2.5" />
                                <span>PINNED</span>
                              </span>
                            )}

                            {/* Author details */}
                            <div className="flex items-center gap-1.5 text-xs text-white/60 truncate">
                              <img
                                src={thread.authorAvatar}
                                alt={thread.authorName}
                                referrerPolicy="no-referrer"
                                className="w-4 h-4 rounded-full object-cover shrink-0"
                              />
                              <span className="font-semibold text-white/90 truncate">{thread.authorName}</span>
                              {thread.authorFlair && (
                                <span className="text-[10px] px-1 rounded bg-white/10 text-white/60 shrink-0">
                                  {thread.authorFlair}
                                </span>
                              )}
                              <span>•</span>
                              <span className="text-white/40 shrink-0">{thread.createdAt}</span>
                            </div>
                          </div>

                          {/* Delete Thread if author/moderator */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteDiscussion(thread.id)}
                              className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete discussion thread"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Title (Click opens active thread) */}
                        <h2
                          onClick={() => {
                            vibrateLight();
                            setActiveThread(thread);
                          }}
                          className="text-sm sm:text-base font-bold text-white hover:text-[#2F6FED] transition-colors cursor-pointer leading-snug"
                        >
                          {thread.title}
                        </h2>

                        {/* Content Preview */}
                        <p
                          onClick={() => {
                            vibrateLight();
                            setActiveThread(thread);
                          }}
                          className="text-xs text-white/70 leading-relaxed cursor-pointer line-clamp-3"
                        >
                          {thread.content}
                        </p>

                        {/* Attached Image if any */}
                        {thread.imageUrl && (
                          <div
                            onClick={() => {
                              vibrateLight();
                              setActiveThread(thread);
                            }}
                            className="mt-2 rounded-xl overflow-hidden border border-white/10 max-h-64 cursor-pointer"
                          >
                            <img
                              src={thread.imageUrl}
                              alt={thread.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover hover:scale-101 transition-transform"
                            />
                          </div>
                        )}

                        {/* Tags */}
                        {thread.tags && thread.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {thread.tags.map((tag, idx) => (
                              <span key={idx} className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions Row */}
                        <div className="flex items-center gap-3 pt-2 text-xs text-white/60">
                          <button
                            onClick={() => {
                              vibrateLight();
                              setActiveThread(thread);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#2F6FED]" />
                            <span>{thread.comments?.length || 0} Comments</span>
                          </button>

                          <button
                            onClick={() => handleShareThread(thread)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* CREATE DISCUSSION MODAL */}
        {showCreateDiscussion && (
          <div
            id="create-discussion-modal"
            className="fixed inset-0 z-[85] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setShowCreateDiscussion(false)}
          >
            <div
              className="w-full max-w-lg bg-[#141418] border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#2F6FED]/20 text-[#2F6FED]">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Create Discussion Thread</h3>
                    <p className="text-[11px] text-white/50">in {community.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateDiscussion(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDiscussionSubmit} className="space-y-4">
                {/* Flair Picker */}
                <div>
                  <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-1.5">
                    Category Flair
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {FLAIR_OPTIONS.map((flair) => (
                      <button
                        key={flair}
                        type="button"
                        onClick={() => setNewFlair(flair)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                          newFlair === flair
                            ? 'bg-[#2F6FED] text-white shadow-md shadow-[#2F6FED]/20'
                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        {flair}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-1.5">
                    Discussion Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="An interesting, descriptive title..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#2F6FED]"
                  />
                </div>

                {/* Body Content */}
                <div>
                  <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-1.5">
                    Content / Thoughts *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Share your perspectives, question, or story in detail..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#2F6FED] resize-none"
                  />
                </div>

                {/* Photo Attachment (Only 1 photo allowed) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block">
                      Attach Photo (1 photo only)
                    </label>
                    {newImageUrl && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Photo Attached
                      </span>
                    )}
                  </div>

                  {newImageUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/20 aspect-video max-h-44 w-full bg-black/60 group flex items-center justify-center">
                      <img
                        src={newImageUrl}
                        alt="Discussion attachment"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            vibrateLight();
                            setNewImageUrl('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Photo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="border border-dashed border-white/20 hover:border-[#2F6FED] rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all text-center group">
                        <Upload className="w-4 h-4 text-white/50 group-hover:text-[#2F6FED] transition-colors" />
                        <span className="text-xs font-semibold text-white/80 group-hover:text-white">
                          Upload Photo
                        </span>
                        <span className="text-[9px] text-white/40">From your device</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleDiscussionPhotoUpload}
                          className="hidden"
                        />
                      </label>

                      <label className="border border-dashed border-white/20 hover:border-[#2F6FED] rounded-xl p-3 flex flex-col items-center justify-center gap-1 cursor-pointer bg-white/[0.02] hover:bg-white/[0.05] transition-all text-center group">
                        <Camera className="w-4 h-4 text-white/50 group-hover:text-[#2F6FED] transition-colors" />
                        <span className="text-xs font-semibold text-white/80 group-hover:text-white">
                          Take Photo
                        </span>
                        <span className="text-[9px] text-white/40">Camera capture</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleDiscussionPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="text-[11px] font-semibold text-white/60 uppercase tracking-wider block mb-1.5">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newTagsInput}
                    onChange={(e) => setNewTagsInput(e.target.value)}
                    placeholder="e.g. advice, routine, habits"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#2F6FED]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowCreateDiscussion(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#2F6FED] hover:bg-[#2F6FED]/90 text-white text-xs font-bold transition-all shadow-lg shadow-[#2F6FED]/25 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Discussion</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ACTIVE THREAD & COMMENTS DRAWER / MODAL */}
        {activeThread && (
          <div
            id="active-thread-modal"
            className="fixed inset-0 z-[85] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setActiveThread(null)}
          >
            <div
              className="w-full max-w-xl h-full max-h-[92vh] bg-[#141418] border border-white/15 rounded-3xl shadow-2xl text-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10 bg-[#16161c] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => setActiveThread(null)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-white/80 truncate">
                    Discussion in r/{community.name}
                  </span>
                </div>
                <button
                  onClick={() => setActiveThread(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Thread & Comments Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {/* Thread Header & Body */}
                <div className="space-y-3 pb-4 border-b border-white/10">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={activeThread.authorAvatar}
                        alt={activeThread.authorName}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{activeThread.authorName}</span>
                          {activeThread.authorFlair && (
                            <span className="text-[10px] px-1 rounded bg-white/10 text-white/60">
                              {activeThread.authorFlair}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-white/40">{activeThread.createdAt}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-[#2F6FED]/20 text-[#2F6FED] border border-[#2F6FED]/30">
                      {activeThread.flair}
                    </span>
                  </div>

                  <h1 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {activeThread.title}
                  </h1>

                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                    {activeThread.content}
                  </p>

                  {activeThread.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-white/10 mt-2">
                      <img
                        src={activeThread.imageUrl}
                        alt={activeThread.title}
                        referrerPolicy="no-referrer"
                        className="w-full max-h-80 object-cover"
                      />
                    </div>
                  )}

                  {/* Vote & Share Bar */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
                      <button
                        onClick={() => handleVote(activeThread.id, 'up')}
                        className={`p-1 rounded-lg transition-colors ${
                          activeThread.userVote === 'up' ? 'text-orange-400 bg-orange-500/20' : 'text-white/50 hover:text-orange-400'
                        }`}
                      >
                        <ArrowBigUp className="w-4 h-4 fill-current" />
                      </button>
                      <span className="text-xs font-bold px-2 text-white/80">{activeThread.upvotes}</span>
                      <button
                        onClick={() => handleVote(activeThread.id, 'down')}
                        className={`p-1 rounded-lg transition-colors ${
                          activeThread.userVote === 'down' ? 'text-blue-400 bg-blue-500/20' : 'text-white/50 hover:text-blue-400'
                        }`}
                      >
                        <ArrowBigDown className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleShareThread(activeThread)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
                    <MessageCircle className="w-4 h-4 text-[#2F6FED]" />
                    <span>Comments ({activeThread.comments?.length || 0})</span>
                  </div>

                  {(!activeThread.comments || activeThread.comments.length === 0) ? (
                    <div className="p-6 text-center text-xs text-white/40 bg-white/5 rounded-2xl border border-white/5">
                      No comments yet. Start the conversation!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeThread.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={comment.authorAvatar}
                                alt={comment.authorName}
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full object-cover"
                              />
                              <span className="text-xs font-bold text-white">{comment.authorName}</span>
                              <span className="text-[10px] text-white/40">{comment.createdAt}</span>
                            </div>
                          </div>
                          <p className="text-xs text-white/80 leading-relaxed pl-7">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Comment Sticky Bar */}
              <form
                onSubmit={handleAddComment}
                className="p-3 border-t border-white/10 bg-[#16161c] flex items-center gap-2 shrink-0"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <input
                  type="text"
                  required
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Write a thoughtful comment..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#2F6FED]"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="p-2.5 rounded-xl bg-[#2F6FED] hover:bg-[#2F6FED]/90 disabled:opacity-40 text-white transition-all shadow-md shadow-[#2F6FED]/20 shrink-0"
                  aria-label="Send Comment"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
