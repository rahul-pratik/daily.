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
  UserPlus,
  Send,
  MessageSquare,
  Sparkles,
  Share2,
  LogOut,
  Flag,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { Community, User, Post, Message } from '../types';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activity' | 'moderation'>('overview');
  const [quickMessage, setQuickMessage] = useState('');
  const [attachedPhotoUrl, setAttachedPhotoUrl] = useState<string>('');
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);
  const [reportedRuleIndex, setReportedRuleIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localComments, setLocalComments] = useState<{ id: string; user: User; text: string; imageUrl?: string; time: string }[]>([
    {
      id: 'c1',
      user: allUsers[0] || currentUser,
      text: `Welcome everyone to the ${community.name} space! Post your daily receipts, ask questions, and share progress photos.`,
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
      time: '2h ago',
    },
    {
      id: 'c2',
      user: allUsers[1] || currentUser,
      text: `Crushed day 14 today! Let's keep this momentum going 🔥`,
      time: '45m ago',
    },
  ]);


  if (!isOpen) return null;

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

  const isMember = (community.memberIds || []).includes(currentUser.id);
  const isPending = (community.pendingRequestUserIds || []).includes(currentUser.id);
  const isModerator = community.moderatorId === currentUser.id;

  // Members list
  const memberUsers = allUsers.filter((u) => (community.memberIds || []).includes(u.id));
  if (isMember && !memberUsers.some((u) => u.id === currentUser.id)) {
    memberUsers.unshift(currentUser);
  }

  // Pending applicants
  const pendingUsers = allUsers.filter((u) => (community.pendingRequestUserIds || []).includes(u.id));

  // Related posts (by direct community tag, ID, or category)
  const categoryPosts = posts.filter(
    (p) =>
      p.communityId === community.id ||
      p.tags?.some(
        (t) =>
          t.toLowerCase() === community.category.toLowerCase() ||
          community.name.toLowerCase().includes(t.toLowerCase())
      ) ||
      p.tags?.includes('DailyProof')
  );

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim() && !attachedPhotoUrl) return;

    vibrateStreakMilestone();
    setLocalComments((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        user: currentUser,
        text: quickMessage.trim() || 'Shared a progress photo in community discussion',
        imageUrl: attachedPhotoUrl || undefined,
        time: 'Just now',
      },
    ]);
    setQuickMessage('');
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


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0A0A0A] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[92vh] flex flex-col">
        {/* Cover & Header */}
        <div className="relative h-36 sm:h-44 w-full bg-black/60 shrink-0">
          <img
            src={community.coverImage || community.avatar}
            alt={community.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full bg-black/60 hover:bg-black text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-colors z-10"
            aria-label="Close community modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge: Access Type */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-bold text-blue-300">
            {community.accessType === 'public' ? (
              <>
                <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Public Community</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Moderated Community</span>
              </>
            )}
          </div>

          {/* Avatar and Title Area */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <div className="flex items-end gap-3 min-w-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-xl bg-black shrink-0">
                <img
                  src={community.avatar}
                  alt={community.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="font-black text-base sm:text-lg text-white truncate drop-shadow-md">
                  {community.name}
                </h1>
                <p className="text-xs text-white/60 truncate flex items-center gap-1.5">
                  <span className="text-blue-400">#{community.category}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-white/80">
                    <Users className="w-3 h-3 text-blue-400" />
                    {community.memberCount || community.memberIds?.length || 1} members
                  </span>
                </p>
              </div>
            </div>

            {/* Join / Leave / Request Button */}
            <div className="shrink-0 pb-1">
              {isMember ? (
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    onToggleJoin(community.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-red-400 border border-white/15 hover:border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
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
                    className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-red-500/20 text-blue-400 hover:text-red-400 border border-blue-500/30 hover:border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Review (Cancel)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateStreakMilestone();
                      onToggleJoin(community.id);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
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
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Join Free</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 border-b border-white/5 flex items-center gap-2 bg-black/40">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            Overview & Rules
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-3 px-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'members'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            Members ({memberUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-2 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'activity'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            Discussions
          </button>
          {isModerator && (
            <button
              onClick={() => setActiveTab('moderation')}
              className={`py-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1 ${
                activeTab === 'moderation'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <span>Moderation</span>
              {pendingUsers.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Community Guidelines (Prominently at Top) */}
              <div className="p-4 bg-white/5 border border-blue-500/30 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white">
                    <BookOpen className="w-4 h-4 text-[#3B82F6]" />
                    <span>Community Rules & Standards</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                    Strictly Enforced
                  </span>
                </div>
                
                <ul className="space-y-2.5 text-xs text-white/80">
                  {(community.rules || [
                    'Post authentic daily proof of work (no falsified or stolen photos)',
                    'Maintain a constructive, encouraging, and supportive environment',
                    'Zero spam, unsolicited promotion, or abusive behavior'
                  ]).map((rule, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-[#3B82F6] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-white/90 leading-snug">{rule}</span>
                      </div>

                      {reportedRuleIndex === idx ? (
                        <span className="text-[10px] font-bold text-emerald-400 shrink-0 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 animate-in fade-in">
                          <Check className="w-3 h-3" />
                          Reported
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReportRule(rule, idx)}
                          className="text-[10px] font-bold text-white/40 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-lg border border-transparent hover:border-red-500/20 transition-all shrink-0 flex items-center gap-1"
                          title="Report rule violation to moderator"
                        >
                          <Flag className="w-3 h-3" />
                          <span>Report</span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mission Statement */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Mission & Purpose</h3>
                <p className="text-xs text-white/90 leading-relaxed">{community.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(community.tags || []).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-[#D4AF37] border border-white/5 font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Moderator Badge */}
              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={community.moderatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                    alt={community.moderatorName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-[#3B82F6]/50"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{community.moderatorName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#3B82F6] text-[9px] font-black border border-[#3B82F6]/30">
                        MODERATOR
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40">@{community.moderatorUsername}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-white/40 block">Created</span>
                  <span className="text-xs font-semibold text-white/80">{community.createdAt}</span>
                </div>
              </div>

              {/* Access Information */}
              <div className="p-3 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded-2xl text-xs text-blue-300 flex items-center gap-2.5">
                {community.accessType === 'public' ? (
                  <>
                    <Globe2 className="w-4 h-4 shrink-0 text-[#3B82F6]" />
                    <span className="text-[11px] leading-tight">
                      <strong>Public Community</strong>: Free and open to everyone in the Explore directory.
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 shrink-0 text-[#3B82F6]" />
                    <span className="text-[11px] leading-tight">
                      <strong>Moderated Access</strong>: Applications are reviewed by @{community.moderatorUsername} before joining.
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-white/60">
                  {memberUsers.length} Active Member{memberUsers.length === 1 ? '' : 's'}
                </span>
              </div>

              {memberUsers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => onViewUser && onViewUser(member)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{member.name}</span>
                        {member.id === community.moderatorId && (
                          <span className="px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] text-[8px] font-black">
                            MOD
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/40 truncate">@{member.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/20">
                    <Flame className="w-3.5 h-3.5 fill-[#D4AF37]" />
                    <span>{member.currentStreak}d</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Discussion messages */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
                {localComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={comment.user.avatar}
                          alt={comment.user.name}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="font-bold text-white">{comment.user.name}</span>
                        <span className="text-[10px] text-white/40">@{comment.user.username}</span>
                      </div>
                      <span className="text-[10px] text-white/30">{comment.time}</span>
                    </div>

                    <p className="text-white/90 pl-8 leading-relaxed">{comment.text}</p>

                    {/* Attached Photo */}
                    {comment.imageUrl && (
                      <div className="pl-8 pt-1">
                        <div
                          className="rounded-xl overflow-hidden border border-white/15 max-h-48 max-w-sm bg-black/40 cursor-pointer relative group"
                          onClick={() => setPreviewPhotoModal(comment.imageUrl || null)}
                        >
                          <img
                            src={comment.imageUrl}
                            alt="Community post attachment"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] text-white/80 font-bold">
                            Tap to expand
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Attached Photo Preview before sending */}
              {attachedPhotoUrl && (
                <div className="relative inline-block rounded-xl overflow-hidden border border-[#D4AF37] max-h-28 bg-black/40">
                  <img
                    src={attachedPhotoUrl}
                    alt="Ready to attach"
                    referrerPolicy="no-referrer"
                    className="h-28 w-auto object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachedPhotoUrl('')}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/80 text-white hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Photo presets selector */}
              {showPhotoPicker && (
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white/70">
                    <span>Choose a sample photo or upload your own:</span>
                    <button
                      type="button"
                      onClick={() => setShowPhotoPicker(false)}
                      className="text-white/40 hover:text-white"
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
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-2 text-left text-xs transition-colors"
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <span className="truncate text-white/80 text-[11px]">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from device</span>
                  </button>
                </div>
              )}

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Chat Input */}
              {isMember ? (
                <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      setShowPhotoPicker(!showPhotoPicker);
                    }}
                    className={`p-2.5 rounded-xl border transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
                      attachedPhotoUrl
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                    }`}
                    title="Attach photo to discussion"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={quickMessage}
                    onChange={(e) => setQuickMessage(e.target.value)}
                    placeholder={attachedPhotoUrl ? "Add a caption for your photo..." : "Share an update, photo, or question in the community..."}
                    className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-blue-500 rounded-xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={!quickMessage.trim() && !attachedPhotoUrl}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 min-h-[40px] min-w-[40px] flex items-center justify-center shadow-md shadow-blue-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center text-xs text-white/50">
                  Join this community to participate in discussions and post updates.
                </div>
              )}
            </div>
          )}

          {activeTab === 'moderation' && isModerator && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-blue-400" />
                <span>You are the moderator. Review and grant access to applicants below.</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white/80">
                  Pending Applications ({pendingUsers.length})
                </h4>

                {pendingUsers.length === 0 ? (
                  <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl text-center text-xs text-white/40 space-y-1">
                    <UserCheck className="w-8 h-8 mx-auto text-white/20 mb-2" />
                    <p className="font-semibold text-white/60">No pending access requests</p>
                    <p className="text-[11px]">When users apply to join, their requests will appear here.</p>
                  </div>
                ) : (
                  pendingUsers.map((applicant) => (
                    <div
                      key={applicant.id}
                      className="p-3.5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={applicant.avatar}
                          alt={applicant.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                        />
                        <div className="truncate">
                          <span className="text-xs font-bold text-white block truncate">
                            {applicant.name}
                          </span>
                          <span className="text-[10px] text-white/40 block">
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
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
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
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={previewPhotoModal}
              alt="Expanded preview"
              referrerPolicy="no-referrer"
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

