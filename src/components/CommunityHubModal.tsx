import React, { useState, useRef } from 'react';
import {
  X,
  Globe2,
  ShieldCheck,
  Users,
  Flame,
  Check,
  Clock,
  BookOpen,
  UserCheck,
  Send,
  MessageSquare,
  Sparkles,
  Flag,
  Camera,
  Image as ImageIcon,
  Upload,
  ThumbsUp,
  Share2,
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Plus,
} from 'lucide-react';
import { Community, User, Post } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface CommunityHubModalProps {
  community: Community;
  currentUser: User;
  allUsers: User[];
  posts: Post[];
  isOpen: boolean;
  onClose: () => void;
  onToggleJoin: (communityId: string) => void;
  onApproveMember?: (communityId: string, userId: string) => void;
  onViewUser?: (user: User) => void;
  onViewPost?: (postId: string) => void;
  onReportViolation?: (communityName: string, ruleText: string) => void;
}

const COMMUNITY_PHOTO_PRESETS = [
  {
    label: 'Deep Work Setup',
    url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
  },
  {
    label: 'Workout & Training',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=80',
  },
  {
    label: 'Outdoor Focus',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000&auto=format&fit=crop&q=80',
  },
  {
    label: 'Book & Notes',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
  },
];

interface RedditThread {
  id: string;
  author: User;
  title: string;
  content: string;
  imageUrl?: string;
  upvotes: number;
  userVote: 'up' | 'down' | null;
  commentCount: number;
  time: string;
}

export const CommunityHubModal: React.FC<CommunityHubModalProps> = ({
  community,
  currentUser,
  allUsers,
  posts,
  isOpen,
  onClose,
  onToggleJoin,
  onApproveMember,
  onViewUser,
  onViewPost,
  onReportViolation,
}) => {
  // Default to 'feed' so users immediately see what's going on
  const [activeTab, setActiveTab] = useState<'feed' | 'discussions' | 'about' | 'moderation'>('feed');
  const [quickPostText, setQuickPostText] = useState('');
  const [attachedPhotoUrl, setAttachedPhotoUrl] = useState<string>('');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);
  const [reportedRuleIndex, setReportedRuleIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reddit-style discussion threads
  const [threads, setThreads] = useState<RedditThread[]>([
    {
      id: 't1',
      author: allUsers[0] || currentUser,
      title: `Welcome to ${community.name}! Here is our accountability pledge`,
      content: 'Post your receipts, check-ins, and questions every single day. No fluff, just consistent daily action.',
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
      upvotes: 42,
      userVote: null,
      commentCount: 16,
      time: '3h ago',
    },
    {
      id: 't2',
      author: allUsers[1] || currentUser,
      title: 'Day 21 milestone reached! How do you stay consistent on low energy days?',
      content: 'On days when motivation dips, keeping the routine small (even 10 minutes) keeps the chain unbroken. What is your go-to trick?',
      upvotes: 28,
      userVote: null,
      commentCount: 9,
      time: '5h ago',
    },
    {
      id: 't3',
      author: allUsers[2] || currentUser,
      title: 'Weekly proof dump: Share your photos below!',
      content: 'Drop your receipts, workouts, or desk setups in the comments. Keep the momentum going 🔥',
      imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=80',
      upvotes: 35,
      userVote: null,
      commentCount: 22,
      time: '1d ago',
    },
  ]);

  if (!isOpen) return null;

  const isMember = (community.memberIds || []).includes(currentUser.id);
  const isPending = (community.pendingRequestUserIds || []).includes(currentUser.id);
  const isModerator = community.moderatorId === currentUser.id;

  // Members list
  const memberUsers = (allUsers || []).filter((u) => (community.memberIds || []).includes(u.id));
  if (isMember && !memberUsers.some((u) => u.id === currentUser.id)) {
    memberUsers.unshift(currentUser);
  }

  // Pending applicants
  const pendingUsers = (allUsers || []).filter((u) => (community.pendingRequestUserIds || []).includes(u.id));

  // Community-specific posts with robust category matching and realistic preview
  const communityPosts = React.useMemo(() => {
    const directMatches = (posts || []).filter((p) => {
      if (p.communityId === community.id) return true;
      if ((community.memberIds || []).includes(p.userId)) return true;
      const tagMatches = p.tags?.some((t) => {
        const lowerT = t.toLowerCase();
        const lowerCat = (community.category || '').toLowerCase();
        const lowerName = (community.name || '').toLowerCase();
        return lowerT.includes(lowerCat) || lowerCat.includes(lowerT) || lowerName.includes(lowerT);
      });
      return Boolean(tagMatches);
    });

    if (directMatches.length > 0) return directMatches;

    // If a brand new community has no direct posts yet, provide top relevant preview proofs so new users can preview the community vibe
    return (posts || []).slice(0, 4).map((p, idx) => ({
      ...p,
      communityId: community.id,
      tags: [...(p.tags || []), community.category].slice(0, 3),
    }));
  }, [posts, community]);

  const handleVoteThread = (threadId: string, direction: 'up' | 'down') => {
    vibrateLight();
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== threadId) return t;
        if (t.userVote === direction) {
          // undo vote
          return {
            ...t,
            userVote: null,
            upvotes: direction === 'up' ? t.upvotes - 1 : t.upvotes + 1,
          };
        } else {
          const delta =
            t.userVote === null
              ? direction === 'up'
                ? 1
                : -1
              : direction === 'up'
              ? 2
              : -2;
          return {
            ...t,
            userVote: direction,
            upvotes: t.upvotes + delta,
          };
        }
      })
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPostText.trim() && !attachedPhotoUrl) return;

    vibrateStreakMilestone();

    // Auto-join if not joined yet
    if (!isMember) {
      onToggleJoin(community.id);
    }

    // Save as new post in database
    const postText = quickPostText.trim() || `Shared proof in ${community.name}`;
    DailyStorageService.createPost({
      content: postText,
      imageUrl: attachedPhotoUrl || undefined,
      imageUrls: attachedPhotoUrl ? [attachedPhotoUrl] : undefined,
      tags: [community.category, 'DailyProof'],
      communityId: community.id,
      isMainPost: true,
    });

    // Also add to Reddit threads
    setThreads((prev) => [
      {
        id: `t_${Date.now()}`,
        author: currentUser,
        title: postText.slice(0, 70),
        content: postText,
        imageUrl: attachedPhotoUrl || undefined,
        upvotes: 1,
        userVote: 'up',
        commentCount: 0,
        time: 'Just now',
      },
      ...prev,
    ]);

    setQuickPostText('');
    setAttachedPhotoUrl('');
    setShowPhotoPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAttachedPhotoUrl(reader.result);
          setShowPhotoPicker(false);
          vibrateLight();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReportRule = (rule: string, idx: number) => {
    vibrateLight();
    setReportedRuleIndex(idx);
    if (onReportViolation) {
      onReportViolation(community.name, rule);
    }
    setTimeout(() => {
      setReportedRuleIndex(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#0A0A0A] border-t sm:border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl text-slate-900 dark:text-white max-h-[92vh] flex flex-col">
        {/* Cover & Header */}
        <div className="relative h-32 sm:h-40 w-full bg-slate-900 shrink-0">
          <img
            src={community.coverImage || community.avatar}
            alt={community.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-colors z-10"
            aria-label="Close community modal"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge: Access Type */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-bold text-sky-300">
            {community.accessType === 'public' ? (
              <>
                <Globe2 className="w-3.5 h-3.5" />
                <span>Public Community</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Moderated Community</span>
              </>
            )}
          </div>

          {/* Community Info overlay */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div className="flex items-end gap-3 min-w-0">
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl overflow-hidden border-2 border-white/80 shadow-lg bg-black shrink-0">
                <img
                  src={community.avatar}
                  alt={community.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 pb-0.5">
                <h1 className="font-bold text-base sm:text-lg text-white truncate drop-shadow">
                  {community.name}
                </h1>
                <p className="text-xs text-white/80 truncate flex items-center gap-1.5">
                  <span className="text-sky-300 font-semibold">#{community.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-sky-300" />
                    {community.memberCount || community.memberIds?.length || 1} members
                  </span>
                </p>
              </div>
            </div>

            {/* Join / Leave Button */}
            <div className="shrink-0 pb-0.5">
              {isMember ? (
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    onToggleJoin(community.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-rose-500/30 text-white hover:text-rose-200 border border-white/30 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Joined</span>
                </button>
              ) : community.accessType === 'moderated' ? (
                isPending ? (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      onToggleJoin(community.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/30 text-sky-200 border border-sky-400/40 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      onToggleJoin(community.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <span>Request Access</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    vibrateStreakMilestone();
                    onToggleJoin(community.id);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Join Community</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-4 bg-slate-50 dark:bg-black/30">
          <button
            onClick={() => setActiveTab('feed')}
            className={`py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'feed'
                ? 'border-[#2F6FED] text-[#2F6FED]'
                : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Posts & Activity
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'discussions'
                ? 'border-[#2F6FED] text-[#2F6FED]'
                : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussions</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'about'
                ? 'border-[#2F6FED] text-[#2F6FED]'
                : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            About & Rules
          </button>
          {isModerator && (
            <button
              onClick={() => setActiveTab('moderation')}
              className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1 ${
                activeTab === 'moderation'
                  ? 'border-[#2F6FED] text-[#2F6FED]'
                  : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Moderation</span>
              {pendingUsers.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#2F6FED]" />
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: POSTS & WHAT'S GOING ON (PREVIEW FOR ALL USERS) */}
          {activeTab === 'feed' && (
            <div className="space-y-4">
              {/* Preview banner for non-members */}
              {!isMember && (
                <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-500/30 rounded-2xl flex items-center justify-between text-xs text-sky-800 dark:text-sky-300">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2F6FED] shrink-0" />
                    <span>Viewing community activity preview. Join to post and interact!</span>
                  </div>
                  <button
                    onClick={() => {
                      vibrateStreakMilestone();
                      onToggleJoin(community.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#2F6FED] text-white font-bold text-xs shrink-0"
                  >
                    Join
                  </button>
                </div>
              )}

              {/* POST COMPOSER FOR THE COMMUNITY */}
              <form
                onSubmit={handleCreatePost}
                className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <textarea
                      value={quickPostText}
                      onChange={(e) => setQuickPostText(e.target.value)}
                      placeholder={`Post an update, receipt, or photo to ${community.name}...`}
                      rows={2}
                      className="w-full bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none focus:border-[#2F6FED] resize-none transition-colors"
                    />

                    {/* Attached Photo Preview */}
                    {attachedPhotoUrl && (
                      <div className="relative inline-block rounded-xl overflow-hidden border border-[#2F6FED] max-h-32">
                        <img
                          src={attachedPhotoUrl}
                          alt="Attachment preview"
                          className="h-32 w-auto object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setAttachedPhotoUrl('')}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 text-white hover:bg-rose-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preset Photo Picker */}
                {showPhotoPicker && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-white/60">
                      <span>Pick a photo preset or upload your own:</span>
                      <button
                        type="button"
                        onClick={() => setShowPhotoPicker(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {COMMUNITY_PHOTO_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            vibrateLight();
                            setAttachedPhotoUrl(preset.url);
                            setShowPhotoPicker(false);
                          }}
                          className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 text-left text-xs"
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-7 h-7 rounded object-cover shrink-0"
                          />
                          <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-white/80">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Composer Action Toolbar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPhotoPicker(!showPhotoPicker)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 text-xs flex items-center gap-1 transition-colors"
                      title="Choose preset photo"
                    >
                      <ImageIcon className="w-4 h-4 text-[#2F6FED]" />
                      <span className="text-[11px] font-semibold">Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 text-xs flex items-center gap-1 transition-colors"
                      title="Upload from device"
                    >
                      <Upload className="w-4 h-4 text-emerald-500" />
                      <span className="text-[11px] font-semibold">Upload</span>
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="submit"
                    disabled={!quickPostText.trim() && !attachedPhotoUrl}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </div>
              </form>

              {/* POSTS FEED STREAM */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/50 px-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#2F6FED]" />
                    <span>Recent Community Feed ({communityPosts.length})</span>
                  </span>
                  {!isMember && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2F6FED]/10 text-[#2F6FED] font-bold border border-[#2F6FED]/20">
                      Preview Mode
                    </span>
                  )}
                </div>

                {communityPosts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 dark:text-white/20 mx-auto" />
                    <p className="text-xs font-bold text-slate-700 dark:text-white/80">No posts in this community yet</p>
                    <p className="text-[11px] text-slate-500 dark:text-white/50">Be the first to share a photo or update with the squad above!</p>
                  </div>
                ) : (
                  communityPosts.map((post) => {
                    const photos = post.imageUrls && post.imageUrls.length > 0
                      ? post.imageUrls
                      : post.imageUrl
                      ? [post.imageUrl]
                      : [];

                    return (
                      <div
                        key={post.id}
                        onClick={() => onViewPost && onViewPost(post.id)}
                        className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3 hover:border-[#2F6FED]/50 transition-all cursor-pointer shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={post.userAvatar}
                              alt={post.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/10"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {post.name}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-white/40">
                                  @{post.username}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-white/40">
                                <span>{post.createdAt}</span>
                                {post.userStreak > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#2F6FED] font-bold">🔥 {post.userStreak}d streak</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-slate-800 dark:text-white/90 leading-relaxed">
                          {post.content}
                        </p>

                        {/* Attached Image(s) / Receipt Gallery */}
                        {photos.length > 0 && (
                          <div className="space-y-1.5">
                            <div
                              className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 max-h-60 bg-black group"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPhotoModal(photos[0] || null);
                              }}
                            >
                              <img
                                src={photos[0]}
                                alt="Proof Receipt"
                                className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                              />
                              {photos.length > 1 && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/20">
                                  <Camera className="w-3 h-3 text-[#2F6FED]" />
                                  <span>1 / {photos.length} photos</span>
                                </div>
                              )}
                            </div>

                            {/* Multi-Photo Thumbnail Bar */}
                            {photos.length > 1 && (
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                {photos.map((photo, pIdx) => (
                                  <img
                                    key={pIdx}
                                    src={photo}
                                    alt={`Receipt ${pIdx + 1}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewPhotoModal(photo);
                                    }}
                                    className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-white/15 shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tags and Interaction Bar */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-white/50">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {post.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/60 dark:bg-white/5 text-slate-700 dark:text-white/70 font-semibold"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                              ❤️ {post.likesCount || 0}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-white/50">
                              💬 {post.comments?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REDDIT-STYLE LIVE DISCUSSION ROOM */}
          {activeTab === 'discussions' && (
            <div className="space-y-4">
              {/* Reddit Header Banner */}
              <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500 dark:text-white/50">
                <span className="font-bold text-slate-700 dark:text-white/80">
                  r/{community.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                </span>
                <span>Sorted by Top</span>
              </div>

              {/* Reddit Thread Cards */}
              <div className="space-y-2.5">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 flex gap-3 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                  >
                    {/* Reddit Upvote Column */}
                    <div className="flex flex-col items-center justify-start gap-0.5 shrink-0 pt-0.5">
                      <button
                        onClick={() => handleVoteThread(thread.id, 'up')}
                        className={`p-1 rounded-md transition-colors ${
                          thread.userVote === 'up'
                            ? 'text-orange-500 bg-orange-500/10'
                            : 'text-slate-400 hover:text-orange-500'
                        }`}
                        title="Upvote"
                      >
                        <ArrowBigUp className="w-5 h-5 fill-current" />
                      </button>
                      <span className={`text-xs font-bold ${
                        thread.userVote === 'up'
                          ? 'text-orange-500'
                          : thread.userVote === 'down'
                          ? 'text-indigo-500'
                          : 'text-slate-700 dark:text-white/80'
                      }`}>
                        {thread.upvotes}
                      </span>
                      <button
                        onClick={() => handleVoteThread(thread.id, 'down')}
                        className={`p-1 rounded-md transition-colors ${
                          thread.userVote === 'down'
                            ? 'text-indigo-500 bg-indigo-500/10'
                            : 'text-slate-400 hover:text-indigo-500'
                        }`}
                        title="Downvote"
                      >
                        <ArrowBigDown className="w-5 h-5 fill-current" />
                      </button>
                    </div>

                    {/* Thread Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Meta line */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-white/40 flex-wrap">
                        <span className="font-semibold text-slate-700 dark:text-white/80">
                          u/{thread.author.username}
                        </span>
                        <span>•</span>
                        <span>{thread.time}</span>
                      </div>

                      {/* Title & Body */}
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {thread.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                        {thread.content}
                      </p>

                      {/* Image Preview if present */}
                      {thread.imageUrl && (
                        <div
                          className="mt-2 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 max-h-48 max-w-sm cursor-pointer"
                          onClick={() => setPreviewPhotoModal(thread.imageUrl || null)}
                        >
                          <img
                            src={thread.imageUrl}
                            alt="Thread receipt"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Actions footer */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 dark:text-white/50">
                        <button className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-white">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{thread.commentCount} Comments</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-white">
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT & COMMUNITY RULES */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Description */}
              <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-[#2F6FED] uppercase tracking-wider">
                  About Community
                </span>
                <p className="text-xs text-slate-700 dark:text-white/80 leading-relaxed">
                  {community.description ||
                    'A dedicated space to share daily proofs, stay disciplined, and build unstoppable momentum with peers.'}
                </p>
              </div>

              {/* Community Guidelines */}
              <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-[#2F6FED]" />
                  <span>Community Guidelines</span>
                </div>

                <div className="space-y-2">
                  {(community.rules || [
                    'Show up and post honest receipts daily.',
                    'Keep interactions respectful and encouraging.',
                    'No spam or off-topic promotions.',
                  ]).map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 text-xs text-slate-700 dark:text-white/80"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-[#2F6FED]">{idx + 1}.</span>
                        <span>{rule}</span>
                      </div>
                      <button
                        onClick={() => handleReportRule(rule, idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 shrink-0"
                        title="Report rule violation"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Members Preview */}
              <div className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Members ({memberUsers.length})
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {memberUsers.slice(0, 8).map((u) => (
                    <div
                      key={u.id}
                      onClick={() => onViewUser && onViewUser(u)}
                      className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-200/60 dark:border-white/5 cursor-pointer hover:border-[#2F6FED]/50 transition-all"
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-white/40 block truncate">
                          @{u.username}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MODERATION (FOR MODERATOR) */}
          {activeTab === 'moderation' && isModerator && (
            <div className="space-y-4">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-500/30 rounded-2xl text-xs text-sky-800 dark:text-sky-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#2F6FED]" />
                <span>You are the moderator. Review and grant access to applicants below.</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-white/80">
                  Pending Applications ({pendingUsers.length})
                </h4>

                {pendingUsers.length === 0 ? (
                  <div className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-center text-xs text-slate-400 dark:text-white/40 space-y-1">
                    <UserCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-white/20 mb-2" />
                    <p className="font-semibold text-slate-600 dark:text-white/60">No pending access requests</p>
                    <p className="text-[11px]">When users apply to join, their requests will appear here.</p>
                  </div>
                ) : (
                  pendingUsers.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={applicant.avatar}
                          alt={applicant.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {applicant.name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-white/40 block">
                            @{applicant.username} • {applicant.currentStreak}d streak
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          vibrateStreakMilestone();
                          if (onApproveMember) {
                            onApproveMember(community.id, applicant.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Grant Access</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {previewPhotoModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={previewPhotoModal}
              alt="Expanded preview"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setPreviewPhotoModal(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
