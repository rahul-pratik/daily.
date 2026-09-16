import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { User as UserType, Post, PostDraft } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { StreakFreezeCard } from './StreakFreezeCard';

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
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>(() => DailyStorageService.getThemeMode());
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(() => DailyStorageService.getTheme());
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => DailyStorageService.getHapticsEnabled());

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
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>Settings & Tools</span>
            </h2>
            <p className="text-[11px] text-white/50">Manage dossier, analytics, saved items & account</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
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

          {/* Streak Freeze Protection (Moved from Challenges Tab) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-orange-400 fill-current" />
                <span>Streak Freeze Protection</span>
              </span>
              <span className="text-[9px] font-mono text-[#2F6FED]">Profile Security</span>
            </div>
            <StreakFreezeCard
              currentUser={currentUser}
              onUserUpdated={onUserUpdated}
              onOpenNotifications={onOpenNotifications}
            />
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
          </div>

          {/* Account & Storage Actions */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/40 px-1">
              Account Management
            </span>

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
      </div>
    </div>
  );
};
