import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  User,
  BarChart3,
  Bookmark,
  FileText,
  ShieldAlert,
  RotateCcw,
  Edit3,
  ChevronRight,
  Sparkles,
  Layers,
  Heart,
  MessageSquare,
  Flame,
  AlertTriangle,
  Sun,
  Moon,
  Smartphone,
  Monitor,
  Activity,
  Trophy,
  AtSign,
  Check,
  Plus,
  Target,
  ArrowLeft,
  Search,
  Ban,
  UserCheck,
  ShieldCheck,
  LogOut,
  Users,
  Cloud,
  Database,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { User as UserType, Post, PostDraft } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import {
  getSupabaseConfig,
  setSupabaseProjectCredentials,
  syncAllAccountsToSupabase,
  syncUserToSupabase,
} from '../services/supabase';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseSchema';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  userPosts: Post[];
  savedPosts: Post[];
  drafts: PostDraft[];
  onOpenEditProfile: () => void;
  onOpenDossier: () => void;
  onOpenAnalytics: () => void;
  onOpenSaved: () => void;
  onOpenDrafts: () => void;
  onResetData: () => void;
  onUserUpdated?: (user: UserType) => void;
  onOpenNotifications?: () => void;
  onSwitchAccount?: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userPosts,
  savedPosts,
  drafts,
  onOpenEditProfile,
  onOpenDossier,
  onOpenAnalytics,
  onOpenSaved,
  onOpenDrafts,
  onResetData,
  onUserUpdated,
  onOpenNotifications,
  onSwitchAccount,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>(() => DailyStorageService.getThemeMode());
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => DailyStorageService.getTheme());
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => DailyStorageService.getHapticsEnabled());
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<string | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [showSqlSchemaModal, setShowSqlSchemaModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(() => getSupabaseConfig().url || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(() => getSupabaseConfig().anonKey || '');
  const [storedAccounts, setStoredAccounts] = useState<UserType[]>(() => DailyStorageService.getPreviousAccounts());

  useEffect(() => {
    if (isOpen) {
      setStoredAccounts(DailyStorageService.getPreviousAccounts());
    }
  }, [isOpen, currentUser]);

  // Blocked Users Management View State
  const [activeView, setActiveView] = useState<'main' | 'blocked_users'>('main');
  const [blockedUsers, setBlockedUsers] = useState<UserType[]>([]);
  const [searchBlockedQuery, setSearchBlockedQuery] = useState('');
  const [unblockedToastMessage, setUnblockedToastMessage] = useState<string | null>(null);

  // Sync blocked users whenever modal opens or blocked IDs change
  useEffect(() => {
    if (isOpen) {
      setBlockedUsers(DailyStorageService.getBlockedUsers());
    }
  }, [isOpen, currentUser.blockedUserIds]);

  // Previous accounts list for switcher count and quick selection
  const previousAccounts = useMemo(() => {
    return DailyStorageService.getPreviousAccounts();
  }, [isOpen]);

  const handleSyncSupabase = async () => {
    vibrateLight();
    setIsSyncingSupabase(true);
    setSupabaseSyncStatus(null);
    try {
      const res = await syncAllAccountsToSupabase();
      setSupabaseSyncStatus(`Synced ${res.synced} of ${res.total} accounts to Supabase`);
      vibrateStreakMilestone();
    } catch (err: any) {
      setSupabaseSyncStatus(`Sync error: ${err?.message || 'Failed to reach Supabase'}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Reset to main view on modal close/open
  useEffect(() => {
    if (isOpen) {
      setActiveView('main');
      setSearchBlockedQuery('');
      setUnblockedToastMessage(null);
    }
  }, [isOpen]);

  const handleUnblockUser = (userId: string, userName: string) => {
    vibrateLight();
    const result = DailyStorageService.unblockUser(userId);
    setBlockedUsers(DailyStorageService.getBlockedUsers());
    if (onUserUpdated) {
      onUserUpdated(result.updatedUser);
    }
    setUnblockedToastMessage(`Unblocked ${userName}`);
    setTimeout(() => {
      setUnblockedToastMessage(null);
    }, 2500);
  };

  const filteredBlockedUsers = useMemo(() => {
    if (!searchBlockedQuery.trim()) return blockedUsers;
    const q = searchBlockedQuery.toLowerCase().trim();
    return blockedUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q)
    );
  }, [blockedUsers, searchBlockedQuery]);

  // 30 Days Activity State
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    formattedLabel: string;
    count: number;
    isToday: boolean;
  } | null>(null);

  const last30DaysActivity = useMemo(() => {
    const days: {
      date: string;
      formattedLabel: string;
      count: number;
      isToday: boolean;
    }[] = [];
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
  const consistencyRate = Math.round((activeDaysCount / 30) * 100);

  // Biography & Mention / Challenge State
  const [bioInput, setBioInput] = useState<string>(() => {
    const raw = currentUser.bio || '';
    if (!raw.toLowerCase().includes('focus:')) {
      return `Focus: ${raw}`;
    }
    return raw;
  });
  const [bioSaveToast, setBioSaveToast] = useState<string | null>(null);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [showChallengePicker, setShowChallengePicker] = useState(false);

  const allOtherUsers = useMemo(() => {
    return DailyStorageService.getAllUsers().filter((u) => u.id !== currentUser.id);
  }, [currentUser.id]);

  const allChallenges = useMemo(() => {
    return DailyStorageService.getAllChallenges();
  }, []);

  const handleInsertMention = (username: string) => {
    vibrateLight();
    setBioInput((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} @${username}` : `Focus: collaborating with @${username}`;
    });
    setShowMentionPicker(false);
  };

  const handleInsertChallenge = (challengeTitle: string) => {
    vibrateLight();
    setBioInput((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} 🏆 ${challengeTitle}` : `Focus: 🏆 ${challengeTitle}`;
    });
    setShowChallengePicker(false);
  };

  const handleSaveBio = () => {
    vibrateStreakMilestone();
    let finalBio = bioInput.trim();
    if (!finalBio.toLowerCase().includes('focus:')) {
      finalBio = `Focus: ${finalBio}`;
    }
    const updated: UserType = {
      ...currentUser,
      bio: finalBio,
    };
    DailyStorageService.saveCurrentUser(updated);
    if (onUserUpdated) {
      onUserUpdated(updated);
    }
    setBioSaveToast('Biography saved successfully!');
    setTimeout(() => setBioSaveToast(null), 2500);
  };

  if (!isOpen) return null;

  const handleSwitchThemeMode = (newMode: 'system' | 'dark' | 'light') => {
    vibrateLight();
    setThemeMode(newMode);
    DailyStorageService.setThemeMode(newMode);
    setCurrentTheme(DailyStorageService.getTheme());
  };

  const handleToggleHaptics = () => {
    const nextVal = !hapticsEnabled;
    setHapticsEnabled(nextVal);
    DailyStorageService.setHapticsEnabled(nextVal);
    if (nextVal) {
      vibrateLight();
    }
  };

  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  const totalComments = userPosts.reduce((acc, p) => acc + (p.comments?.length || 0), 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0A0A0A] border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl text-white max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          {activeView === 'blocked_users' ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="settings-back-to-main-btn"
                onClick={() => {
                  vibrateLight();
                  setActiveView('main');
                }}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                aria-label="Back to settings"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>Blocked Users</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                    {blockedUsers.length}
                  </span>
                </h2>
                <p className="text-[11px] text-white/50">Manage accounts hidden from your HomeFeed</p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Settings & Tools</span>
              </h2>
              <p className="text-[11px] text-white/50">Manage dossier, analytics, saved items & account</p>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        {activeView === 'blocked_users' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Context Info Banner */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                <Ban className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white">Blocked Accounts & Feeds</h4>
                <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
                  Posts and discussions from blocked members are completely hidden from your HomeFeed. Unblocking restores their posts immediately.
                </p>
              </div>
            </div>

            {/* Notification Toast inside View */}
            {unblockedToastMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{unblockedToastMessage}</span>
              </div>
            )}

            {/* Search filter if blocked users exist */}
            {blockedUsers.length > 0 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchBlockedQuery}
                  onChange={(e) => setSearchBlockedQuery(e.target.value)}
                  placeholder="Search blocked accounts..."
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-red-500/40 focus:ring-1 focus:ring-red-500/40 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none transition-all"
                />
                {searchBlockedQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchBlockedQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Blocked Members List */}
            {filteredBlockedUsers.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40">
                    Blocked Members ({filteredBlockedUsers.length})
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">
                    Tap to unblock
                  </span>
                </div>

                {filteredBlockedUsers.map((bUser) => (
                  <div
                    key={bUser.id}
                    id={`blocked-user-row-${bUser.id}`}
                    className="p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-red-500/30 shrink-0 bg-neutral-900">
                        <img
                          src={bUser.avatar}
                          alt={bUser.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{bUser.name}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
                            Blocked
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 font-mono truncate">@{bUser.username}</p>
                        {bUser.bio && (
                          <p className="text-[10px] text-white/40 truncate mt-0.5">{bUser.bio}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      id={`unblock-btn-${bUser.id}`}
                      onClick={() => handleUnblockUser(bUser.id, bUser.name)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/15 hover:border-white/30 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-white/60" />
                      <span>Unblock</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : blockedUsers.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">No Blocked Members</h4>
                  <p className="text-xs text-white/50 max-w-xs mt-1 leading-relaxed">
                    You haven't blocked any accounts. Anyone you block from their profile or post will appear here and can be unblocked anytime.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2">
                <p className="text-xs text-white/60">No blocked members match "{searchBlockedQuery}"</p>
                <button
                  type="button"
                  onClick={() => setSearchBlockedQuery('')}
                  className="text-xs text-[#2F6FED] font-bold hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick User Summary */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xs font-black text-white">{currentUser.name}</h3>
                <p className="text-[11px] text-white/50 font-mono">@{currentUser.username}</p>
              </div>
            </div>

            <button
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenEditProfile();
              }}
              className="px-3 py-1.5 rounded-xl bg-[#2F6FED]/15 hover:bg-[#2F6FED]/25 text-[#2F6FED] border border-[#2F6FED]/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Posting Activity (Last 30 Days) Section */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Posting Activity</span>
                    <span className="text-[10px] text-white/50 font-normal">(Last 30 Days)</span>
                  </h4>
                  <p className="text-[10px] text-white/50">
                    {activeDaysCount} of 30 active days • {totalProofsLast30Days} proofs logged
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {consistencyRate}% Consistency
              </span>
            </div>

            {/* 30-Day Activity Heatmap Grid */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
              <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                {last30DaysActivity.map((day) => {
                  let cellBg = 'bg-white/5 border-white/5';
                  if (day.count === 1) cellBg = 'bg-emerald-500/40 border-emerald-500/30';
                  else if (day.count === 2) cellBg = 'bg-emerald-500/70 border-emerald-400/50';
                  else if (day.count >= 3) cellBg = 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/50';

                  return (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`aspect-square rounded-md border ${cellBg} transition-all cursor-pointer hover:scale-110 ${
                        day.isToday ? 'ring-2 ring-white/60' : ''
                      }`}
                      title={`${day.formattedLabel}: ${day.count} proofs`}
                    />
                  );
                })}
              </div>

              {/* Hover Status or Legend */}
              <div className="flex items-center justify-between text-[10px] text-white/50 pt-1 border-t border-white/5 font-mono">
                {hoveredDay ? (
                  <span className="text-emerald-300 font-medium">
                    {hoveredDay.formattedLabel}: {hoveredDay.count} {hoveredDay.count === 1 ? 'proof' : 'proofs'} {hoveredDay.isToday ? '(Today)' : ''}
                  </span>
                ) : (
                  <span>Hover a day to inspect daily volume</span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] text-white/30 mr-1">Less</span>
                  <span className="w-2 h-2 rounded-xs bg-white/10" />
                  <span className="w-2 h-2 rounded-xs bg-emerald-500/40" />
                  <span className="w-2 h-2 rounded-xs bg-emerald-500/70" />
                  <span className="w-2 h-2 rounded-xs bg-emerald-400" />
                  <span className="text-[9px] text-white/30 ml-1">More</span>
                </div>
              </div>
            </div>

            {/* Biography, Focus, Mentions & Completed Challenges Editor */}
            <div className="pt-2 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#2F6FED]" />
                    <span>Biography & Identity Focus</span>
                  </h5>
                  <p className="text-[10px] text-white/50">
                    Write your bio with <code className="text-sky-300">Focus:</code>, mention collaborators with <code className="text-sky-300">@</code>, or add completed challenges <code className="text-amber-300">🏆</code>
                  </p>
                </div>
                {bioSaveToast && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 animate-in fade-in">
                    {bioSaveToast}
                  </span>
                )}
              </div>

              {/* Bio Input Field */}
              <div className="space-y-1.5">
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Focus: Daily discipline, high-agency shipping with @sarah 🏆 30-Day Morning Run"
                  rows={3}
                  maxLength={180}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 focus:border-[#2F6FED] focus:outline-none text-xs text-white placeholder-white/30 resize-none leading-relaxed transition-colors"
                />
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <div className="flex items-center gap-1.5">
                    {/* Add @ Mention Button */}
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setShowMentionPicker(!showMentionPicker);
                        setShowChallengePicker(false);
                      }}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                        showMentionPicker
                          ? 'bg-[#2F6FED] text-white border-[#2F6FED]'
                          : 'bg-white/5 hover:bg-white/10 text-sky-400 border-white/10'
                      }`}
                    >
                      <AtSign className="w-3 h-3" />
                      <span>Mention Someone</span>
                    </button>

                    {/* Add Completed Challenge Button */}
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setShowChallengePicker(!showChallengePicker);
                        setShowMentionPicker(false);
                      }}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all ${
                        showChallengePicker
                          ? 'bg-amber-500 text-black border-amber-500'
                          : 'bg-white/5 hover:bg-white/10 text-amber-300 border-white/10'
                      }`}
                    >
                      <Trophy className="w-3 h-3" />
                      <span>Add Challenge 🏆</span>
                    </button>
                  </div>
                  <span>{bioInput.length} / 180</span>
                </div>
              </div>

              {/* Mention Someone Picker Dropdown */}
              {showMentionPicker && (
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/15 space-y-1.5 animate-in fade-in">
                  <span className="text-[10px] font-mono font-bold uppercase text-white/50 block">
                    Select a member to mention in bio:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {allOtherUsers.slice(0, 8).map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleInsertMention(user.username)}
                        className="w-full p-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-left transition-colors"
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-5 h-5 rounded-full object-cover border border-white/20"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block truncate">{user.name}</span>
                          <span className="text-[10px] font-mono text-sky-400 block truncate">@{user.username}</span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-white/40" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Challenge Picker Dropdown */}
              {showChallengePicker && (
                <div className="p-2.5 rounded-xl bg-black/60 border border-white/15 space-y-1.5 animate-in fade-in">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-300/80 block">
                    Click to append completed challenge milestone:
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {allChallenges.slice(0, 8).map((challenge) => (
                      <button
                        key={challenge.id}
                        type="button"
                        onClick={() => handleInsertChallenge(challenge.title)}
                        className="w-full p-1.5 rounded-lg hover:bg-white/10 flex items-center gap-2 text-left transition-colors border border-white/5"
                      >
                        <span className="text-sm">{challenge.icon || '🏆'}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold text-white block truncate">{challenge.title}</span>
                          <span className="text-[9px] font-mono text-amber-400 block truncate">#{challenge.tag || 'milestone'}</span>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-amber-400/70" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Biography Action */}
              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveBio}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-blue-600 text-white font-black text-xs transition-all shadow-md shadow-[#2F6FED]/25 flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Biography</span>
                </button>
              </div>
            </div>
          </div>

          {/* Theme Mode Toggle (System Auto / Dark / Light) */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#2F6FED]/15 border border-[#2F6FED]/30 flex items-center justify-center text-[#2F6FED]">
                  {themeMode === 'system' ? (
                    <Monitor className="w-3.5 h-3.5" />
                  ) : currentTheme === 'dark' ? (
                    <Moon className="w-3.5 h-3.5" />
                  ) : (
                    <Sun className="w-3.5 h-3.5" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Appearance & Theme</h4>
                  <p className="text-[10px] text-white/50">
                    Sync with OS preference or force Dark/Light mode
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#2F6FED]">
                {themeMode === 'system' ? 'System (Auto)' : themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>

            {/* 3-Way Segmented Switcher */}
            <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => handleSwitchThemeMode('system')}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  themeMode === 'system'
                    ? 'bg-[#2F6FED] text-white shadow-sm font-black'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
                title="Automatically synchronizes with your device operating system theme"
              >
                <Monitor className="w-3 h-3" />
                <span>Auto (OS)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchThemeMode('dark')}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  themeMode === 'dark'
                    ? 'bg-white/20 text-white shadow-sm font-black border border-white/15'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchThemeMode('light')}
                className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  themeMode === 'light'
                    ? 'bg-amber-400 text-slate-900 shadow-sm font-black'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Light</span>
              </button>
            </div>
          </div>

          {/* Accessibility: Haptic Feedback Option */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Haptic Feedback</span>
                    <span className="text-[10px] font-normal text-white/50">(Tactile Vibration)</span>
                  </h4>
                  <p className="text-[10px] text-white/50">
                    Tactile pulses on post submissions, streak milestones, and alerts
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={hapticsEnabled}
                onClick={handleToggleHaptics}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hapticsEnabled ? 'bg-[#2F6FED]' : 'bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/40 font-mono">
              <span>Status: {hapticsEnabled ? 'Vibrations Active' : 'Silent Mode'}</span>
              <span className="text-[#2F6FED]">Accessibility Optimized</span>
            </div>
          </div>

          {/* Reset Confirmation Notice if active */}
          {showResetConfirm && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-white animate-in fade-in space-y-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-red-300">Reset All Demo Data?</h4>
                  <p className="text-[11px] text-white/70 mt-0.5">
                    This will restore sample users, posts, groups, and notifications to their initial states.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white/70 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    vibrateStreakMilestone();
                    onResetData();
                    setShowResetConfirm(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}

          {/* Feature Hub Section */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 px-1">
              Personal Tools & Hubs
            </span>

            {/* 1. Person Dossier */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenDossier();
              }}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#2F6FED]/40 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white group-hover:text-[#2F6FED] transition-colors">
                      Person Dossier
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#2F6FED]/15 text-[#2F6FED] border border-[#2F6FED]/30">
                      Pillars & Diary
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Core identity pillars, proof chronology & daily timeline
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 2. Analytics & Insights */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenAnalytics();
              }}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white group-hover:text-cyan-300 transition-colors">
                      Analytics & Insights
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {totalLikes} likes • {totalComments} comments
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Engagement trends, post reach, and interaction statistics
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 3. Saved Proofs */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenSaved();
              }}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white group-hover:text-purple-300 transition-colors">
                      Saved Proofs
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {savedPosts.length} saved
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Bookmarked inspirations, methods, and routines
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 4. Drafts & Scheduled Queue */}
            <button
              type="button"
              onClick={() => {
                vibrateLight();
                onClose();
                onOpenDrafts();
              }}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">
                      Drafts & Scheduled
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {drafts.length} drafts
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Queued proofs, scheduled releases, and unfinished drafts
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* 5. Switch Account & Accounts On Device Drawer */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[#2F6FED] shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">
                        Switch Account
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#2F6FED]/15 text-[#2F6FED] border border-[#2F6FED]/30">
                        {storedAccounts.length} {storedAccounts.length === 1 ? 'account' : 'accounts'}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 mt-0.5">
                      Switch between your active profiles or sign in to another account
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="settings-switch-account-btn"
                  onClick={() => {
                    vibrateLight();
                    onClose();
                    if (onSwitchAccount) {
                      onSwitchAccount();
                    }
                  }}
                  className="py-1.5 px-3 rounded-xl bg-[#2F6FED] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add / Sign In</span>
                </button>
              </div>

              {/* Accounts list stored on this device */}
              <div className="space-y-2 pt-1 border-t border-white/5">
                {storedAccounts.map((account) => {
                  const isActive =
                    account.id === currentUser.id ||
                    (account.username &&
                      currentUser.username &&
                      account.username.toLowerCase().replace(/^@/, '') ===
                        currentUser.username.toLowerCase().replace(/^@/, ''));
                  return (
                    <div
                      key={account.id || account.username}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                        isActive
                          ? 'bg-[#2F6FED]/10 border-[#2F6FED]/40'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={account.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                          alt={account.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-white/20 shrink-0"
                        />
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {account.name || 'Daily Creator'}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/50 font-mono block truncate">
                            @{account.username?.toLowerCase().replace(/^@/, '') || 'creator'}
                          </span>
                        </div>
                      </div>

                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            vibrateLight();
                            DailyStorageService.saveCurrentUser(account);
                            DailyStorageService.savePreviousAccount(account);
                            if (onUserUpdated) {
                              onUserUpdated(account);
                            }
                            setStoredAccounts(DailyStorageService.getPreviousAccounts());
                          }}
                          className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-[#2F6FED] text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Switch
                        </button>
                      ) : (
                        <span className="text-[10px] text-white/40 font-mono pr-1">Current</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Account & Storage Actions */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 px-1">
              Account Management & Cloud Persistence
            </span>

            {/* Supabase Cloud Database Persistence */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Supabase Persistence</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          getSupabaseConfig().isConfigured
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {getSupabaseConfig().isConfigured ? 'Connected' : 'Active'}
                      </span>
                    </h4>
                    <p className="text-[10px] text-white/50">
                      Syncs user accounts and streaks directly to Supabase
                    </p>
                  </div>
                </div>
              </div>

              {supabaseSyncStatus && (
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-emerald-300 font-mono">
                  {supabaseSyncStatus}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSyncSupabase}
                  disabled={isSyncingSupabase}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#2F6FED] hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#2F6FED]/20 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSupabase ? 'Syncing...' : 'Sync Accounts to Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSqlSchemaModal(true)}
                  className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                  title="View SQL DDL script for Supabase SQL Editor"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>SQL Tables</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSupabaseConfig(!showSupabaseConfig)}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs border border-white/10 transition-colors cursor-pointer"
                >
                  {showSupabaseConfig ? 'Hide' : 'Keys'}
                </button>
              </div>

              {showSupabaseConfig && (
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-white/60 block font-bold uppercase">
                    Supabase Project URL & Anon Key:
                  </span>
                  <input
                    type="text"
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xyz.supabase.co"
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 outline-none"
                  />
                  <input
                    type="password"
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="anon-public-key"
                    className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white placeholder-white/30 outline-none"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSupabaseProjectCredentials(supabaseUrlInput, supabaseKeyInput);
                        setSupabaseSyncStatus('Saved custom Supabase credentials!');
                        setShowSupabaseConfig(false);
                      }}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs cursor-pointer"
                    >
                      Save Credentials
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Blocked Users Management Entry */}
            <button
              type="button"
              id="settings-blocked-users-btn"
              onClick={() => {
                vibrateLight();
                setActiveView('blocked_users');
              }}
              className="w-full p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-red-500/30 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white group-hover:text-red-300 transition-colors">
                      Blocked Users
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        blockedUsers.length > 0
                          ? 'bg-red-500/15 text-red-400 border-red-500/30'
                          : 'bg-white/5 text-white/50 border-white/10'
                      }`}
                    >
                      {blockedUsers.length} blocked
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Review blocked accounts & restore feed visibility
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            {/* Switch Account */}
            <button
              type="button"
              id="settings-switch-account-footer-btn"
              onClick={() => {
                vibrateLight();
                onClose();
                if (onSwitchAccount) {
                  onSwitchAccount();
                }
              }}
              className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white/80 shrink-0">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-[#2F6FED] transition-colors">
                    Switch Account
                  </span>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    Save current session to device list and open account switcher
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full p-3.5 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-red-300 group-hover:text-red-200">
                    Reset Demo Data
                  </span>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    Restore sample users, initial posts & challenge states
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400/40 group-hover:text-red-400 shrink-0" />
            </button>
          </div>
        </div>
        )}
        {/* Supabase SQL Editor Tables Modal */}
        {showSqlSchemaModal && (
          <div className="absolute inset-0 z-50 bg-[#0A0A0A] rounded-[32px] p-6 flex flex-col justify-between border border-white/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Supabase SQL Editor Schema</h3>
                  <p className="text-xs text-white/50">Run in your Supabase Dashboard &gt; SQL Editor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setShowSqlSchemaModal(false);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col my-3 space-y-2.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                <span>Includes <code>profiles</code>, <code>posts</code>, unique username index &amp; auth triggers.</span>
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2500);
                  }}
                  className="py-1 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto rounded-xl bg-black/80 border border-white/10 p-3.5 font-mono text-[11px] text-emerald-300/90 leading-relaxed select-all">
                <pre className="whitespace-pre-wrap font-mono">{SUPABASE_SQL_SCHEMA}</pre>
              </div>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setShowSqlSchemaModal(false);
                }}
                className="py-2.5 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
