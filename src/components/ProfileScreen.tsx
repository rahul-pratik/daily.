import React, { useState } from 'react';
import { Flame, Grid, List, Edit3, Settings, Share2, Sparkles, CheckCircle2, RotateCcw, AlertTriangle, X, Bookmark, Image as ImageIcon, BarChart3, TrendingUp, Plus, Check, Trash2, Zap, Target, Calendar } from 'lucide-react';
import { User, Post, PersonalHabit } from '../types';
import { PostCard } from './PostCard';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateSuccess } from '../services/haptics';

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
}) => {
  const [profileTab, setProfileTab] = useState<'my_posts' | 'habits' | 'saved'>('habits');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Personal habits state
  const [habits, setHabits] = useState<PersonalHabit[]>(() => DailyStorageService.getPersonalHabits());
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<PersonalHabit['category']>('Fitness');
  const [newHabitIcon, setNewHabitIcon] = useState('💪');
  const [newHabitTarget, setNewHabitTarget] = useState(7);

  const today = getTodayDateString();

  // Filter posts created by current user
  const userPosts = posts.filter((p) => p.userId === currentUser.id);

  // Filter saved posts
  const savedPosts = posts.filter((p) => savedPostIds.includes(p.id));

  const activeDisplayPosts = profileTab === 'my_posts' ? userPosts : savedPosts;

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleHabit = (habitId: string) => {
    const { habits: updatedHabits, isCompletedToday } = DailyStorageService.toggleHabitToday(habitId);
    setHabits(updatedHabits);
    if (isCompletedToday) {
      vibrateSuccess();
    } else {
      vibrateLight();
    }
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const categoryColors: Record<PersonalHabit['category'], string> = {
      Fitness: '#FF4D00',
      Productivity: '#38BDF8',
      Learning: '#A855F7',
      Health: '#22C55E',
      Mindfulness: '#EAB308',
      Creativity: '#EC4899',
    };

    const { habits: updated } = DailyStorageService.addPersonalHabit({
      title: newHabitTitle.trim(),
      category: newHabitCategory,
      icon: newHabitIcon,
      color: categoryColors[newHabitCategory] || '#FF4D00',
      targetDaysPerWeek: newHabitTarget,
    });

    setHabits(updated);
    setNewHabitTitle('');
    setShowAddHabitModal(false);
    vibrateSuccess();
  };

  const handleDeleteHabit = (habitId: string) => {
    const updated = DailyStorageService.deletePersonalHabit(habitId);
    setHabits(updated);
    vibrateLight();
  };

  const completedTodayCount = habits.filter((h) => h.completedDates.includes(today)).length;

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
                <span className="absolute -top-7 right-0 text-[10px] font-bold bg-[#FF4D00] text-black px-2 py-0.5 rounded shadow whitespace-nowrap">
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
                    <Edit3 className="w-3.5 h-3.5 text-[#FF4D00]" />
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
                  This will restore the sample users, habit streaks, posts, and direct messages to their initial states.
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
            <div className="absolute -bottom-1 -right-1 bg-black text-[#FF4D00] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#FF4D00]/50 flex items-center gap-1 shadow-md">
              <Flame className="w-3 h-3 fill-[#FF4D00]" />
              <span>{currentUser.currentStreak}d</span>
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-lg font-black text-white flex items-center gap-1.5">
              {currentUser.name}
              <CheckCircle2 className="w-4 h-4 text-[#FF4D00]" />
            </h1>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">{currentUser.bio}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/5 text-center">
          <div>
            <span className="text-base font-black text-white block">
              {currentUser.currentStreak}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold flex items-center justify-center gap-0.5">
              <Flame className="w-2.5 h-2.5 text-[#FF4D00] fill-[#FF4D00]" /> Streak
            </span>
          </div>

          <div>
            <span className="text-base font-black text-white block">
              {userPosts.length}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Posts</span>
          </div>

          <div>
            <span className="text-base font-black text-white block">
              {currentUser.followersCount}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Followers</span>
          </div>

          <div>
            <span className="text-base font-black text-white block">
              {currentUser.followingCount}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Following</span>
          </div>
        </div>

        {/* Interests & Habits Badges */}
        <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
          {currentUser.interests && currentUser.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mr-1">
                Interests:
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

          {currentUser.habits && currentUser.habits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider mr-1">
                Habits:
              </span>
              {currentUser.habits.map((habit) => (
                <span
                  key={habit}
                  className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 font-bold uppercase tracking-wider"
                >
                  ⚡ {habit}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Edit Profile & Analytics Buttons */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
          <button
            onClick={onOpenEditProfile}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors min-h-[44px] active:scale-[0.99]"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#FF4D00]" />
            <span>Edit Profile</span>
          </button>

          {userPosts.length > 0 && onOpenInsights && (
            <button
              onClick={() => onOpenInsights(userPosts[0])}
              className="py-2.5 px-4 rounded-xl bg-[#FF4D00]/10 hover:bg-[#FF4D00]/20 border border-[#FF4D00]/30 text-xs font-bold text-[#FF4D00] flex items-center justify-center gap-1.5 transition-colors min-h-[44px] active:scale-[0.99]"
              title="View Engagement Analytics for your latest post"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Insights</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Tabs & View Selector */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setProfileTab('habits')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'habits'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#FF4D00]" />
              <span>Habits ({habits.length})</span>
            </button>
            <button
              onClick={() => setProfileTab('my_posts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'my_posts'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Posts ({userPosts.length})</span>
            </button>
            <button
              onClick={() => setProfileTab('saved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                profileTab === 'saved'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved ({savedPosts.length})</span>
            </button>
          </div>

          {/* Grid vs List View Selector (Only for posts/saved) */}
          {profileTab !== 'habits' ? (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
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
              onClick={() => setShowAddHabitModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#FF4D00] hover:bg-[#ff5d19] text-black font-black text-xs flex items-center gap-1 shadow-md shadow-[#FF4D00]/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Habit</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {profileTab === 'habits' ? (
        <div className="space-y-3">
          {/* Habits Summary Header Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF4D00]/10 border border-[#FF4D00]/20 flex items-center justify-center text-[#FF4D00]">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Daily Habit Tracker
                </h3>
                <p className="text-xs text-white/50">
                  {completedTodayCount} of {habits.length} habits completed today
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-[#FF4D00]">
                {habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0}%
              </span>
              <span className="text-[10px] text-white/40 block">Done Today</span>
            </div>
          </div>

          {/* Habits List */}
          {habits.length > 0 ? (
            <div className="space-y-2.5">
              {habits.map((habit) => {
                const isCompleted = habit.completedDates.includes(today);
                return (
                  <div
                    key={habit.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Habit Icon */}
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0">
                        {habit.icon}
                      </div>

                      {/* Habit Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs sm:text-sm font-bold truncate ${isCompleted ? 'text-white' : 'text-white/90'}`}>
                            {habit.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-[#FF4D00] bg-[#FF4D00]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 fill-[#FF4D00]" />
                            {habit.streak}d streak
                          </span>
                          <span className="text-[10px] text-white/40 font-medium">
                            {habit.targetDaysPerWeek}x / week
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Check-in toggle & Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleHabit(habit.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 min-h-[38px] active:scale-95 ${
                          isCompleted
                            ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                        }`}
                        title={isCompleted ? 'Mark uncompleted' : 'Mark completed for today'}
                      >
                        <Check className={`w-3.5 h-3.5 ${isCompleted ? 'stroke-[3]' : 'opacity-40'}`} />
                        <span>{isCompleted ? 'Done' : 'Check in'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Delete habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-[28px] border border-white/10 p-6">
              <Target className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <h3 className="font-bold text-white text-sm">No habits defined</h3>
              <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
                Define daily habits like morning workouts, coding, reading, or meditation to track your streaks.
              </p>
              <button
                onClick={() => setShowAddHabitModal(true)}
                className="mt-4 px-4 py-2 bg-[#FF4D00] text-black font-black text-xs rounded-xl shadow-lg shadow-[#FF4D00]/20"
              >
                + Add Your First Habit
              </button>
            </div>
          )}
        </div>
      ) : activeDisplayPosts.length > 0 ? (
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
                    <span className="text-[10px] text-[#FF4D00] font-bold">🔥 Daily</span>
                    <p className="text-[10px] text-white/70 line-clamp-4 leading-tight">
                      {post.content}
                    </p>
                    <span className="text-[8px] text-white/40">{post.createdAt}</span>
                  </div>
                )}
                {/* Hover overlay with likes and comments */}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white text-xs font-bold p-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span>❤️ {post.likesCount}</span>
                    <span>💬 {post.comments?.length || 0}</span>
                  </div>
                  {profileTab === 'my_posts' && onOpenInsights && (
                    <span className="text-[9px] bg-[#FF4D00] text-black px-2 py-0.5 rounded-full font-black flex items-center gap-1 mt-0.5">
                      <BarChart3 className="w-2.5 h-2.5" /> Stats
                    </span>
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
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white/5 rounded-[28px] border border-white/10 p-6">
          {profileTab === 'saved' ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-white/40">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">No saved posts yet</h3>
              <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
                Tap the bookmark button on any post in your feed to save it for quick reference later.
              </p>
            </>
          ) : (
            <>
              <Flame className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <h3 className="font-bold text-white text-sm">No updates posted yet</h3>
              <p className="text-xs text-white/40 mt-1">
                Tap the plus button below to share what you did today!
              </p>
            </>
          )}
        </div>
      )}

      {/* Add New Habit Modal */}
      {showAddHabitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-[#111111] border border-white/15 rounded-3xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#FF4D00]/10 text-[#FF4D00]">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">Define Daily Habit</h3>
              </div>
              <button
                onClick={() => setShowAddHabitModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 block mb-1">
                  Habit Title
                </label>
                <input
                  type="text"
                  value={newHabitTitle}
                  onChange={(e) => setNewHabitTitle(e.target.value)}
                  placeholder="e.g., 30-min Morning Run, Code 1 Hr"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-[#FF4D00]"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 block mb-1">
                  Category & Emoji
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { cat: 'Fitness' as const, emoji: '💪', label: 'Fitness' },
                    { cat: 'Productivity' as const, emoji: '💻', label: 'Productivity' },
                    { cat: 'Learning' as const, emoji: '📚', label: 'Learning' },
                    { cat: 'Health' as const, emoji: '🥗', label: 'Health' },
                    { cat: 'Mindfulness' as const, emoji: '🧘', label: 'Mindfulness' },
                    { cat: 'Creativity' as const, emoji: '🎨', label: 'Creativity' },
                  ].map((item) => (
                    <button
                      key={item.cat}
                      type="button"
                      onClick={() => {
                        setNewHabitCategory(item.cat);
                        setNewHabitIcon(item.emoji);
                      }}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        newHabitCategory === item.cat
                          ? 'bg-[#FF4D00] text-black border-[#FF4D00]'
                          : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/60 block mb-1">
                  Weekly Goal ({newHabitTarget} days / week)
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNewHabitTarget(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        newHabitTarget === num
                          ? 'bg-white text-black border-white'
                          : 'bg-white/5 text-white/50 border-white/10 hover:text-white'
                      }`}
                    >
                      {num}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!newHabitTitle.trim()}
                  className="flex-1 py-2.5 bg-[#FF4D00] hover:bg-[#ff5d19] disabled:opacity-40 text-black font-black text-xs rounded-xl shadow-lg shadow-[#FF4D00]/20 transition-all"
                >
                  Save Habit
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddHabitModal(false)}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
