import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  Trophy,
  Users,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Calendar,
  Share2,
  Sparkles,
  Check,
  Clock,
  Plus,
  Target,
  Image as ImageIcon,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { User, Challenge, ChallengeProgressPost } from '../types';
import { DailyStorageService } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface PersonProfileDossierScreenProps {
  targetUser?: User | null;
  currentUser?: User;
  onBack?: () => void;
  onSendMessage?: (targetUser: User) => void;
  onOpenCreatePost?: () => void;
  onOpenChallenge?: (challengeId: string) => void;
}

export const PersonProfileDossierScreen: React.FC<PersonProfileDossierScreenProps> = ({
  targetUser,
  currentUser,
  onBack,
  onSendMessage,
  onOpenCreatePost,
  onOpenChallenge,
}) => {
  // Active user to display: targetUser (e.g. Sarah Chen) or currentUser
  const user: User = targetUser || currentUser || {
    id: 'user_sarah',
    name: 'Sarah Chen',
    username: 'sarahcodes',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    bio: 'Building indie developer tools, shipping in public, and running 5K every morning.',
    interests: ['coding', 'building', 'fitness'],
    habits: ['Build Projects', 'Run', 'Read'],
    currentStreak: 21,
    longestStreak: 45,
    totalPosts: 0,
    activityDates: [],
    followersCount: 1420,
    followingCount: 380,
    followedUserIds: [],
    lastPostedDate: null,
    joinedDate: '2026-06-15',
  };

  const isMe = currentUser ? user.id === currentUser.id || user.id === 'user_me' : false;
  const [activeTab, setActiveTab] = useState<'all' | 'challenges' | 'milestones'>('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedProofModal, setSelectedProofModal] = useState<ChallengeProgressPost | null>(null);

  // Load all challenges from storage and filter for this user
  const allChallenges = useMemo(() => DailyStorageService.getAllChallenges(), []);
  
  const userChallenges = useMemo(() => {
    return allChallenges.filter((c) => {
      const isParticipant = (c.participantIds || []).includes(user.id);
      const isCreator = c.createdBy === user.id;
      const hasPosts = Boolean(c.userPostDates && c.userPostDates[user.id]?.length > 0);
      return isParticipant || isCreator || hasPosts;
    });
  }, [allChallenges, user.id]);

  // Load all challenge progress posts (receipts) for this user
  const allProgressPosts = useMemo(() => DailyStorageService.getAllChallengeProgressPosts(), []);
  
  const userProgressPosts = useMemo(() => {
    return allProgressPosts.filter((p) => p.userId === user.id);
  }, [allProgressPosts, user.id]);

  // Calculate challenge stats
  const challengeStats = useMemo(() => {
    let totalCheckins = userProgressPosts.length;
    let squadsCount = 0;
    let completedCount = 0;

    userChallenges.forEach((c) => {
      if (c.challengeType === 'group') squadsCount++;
      const userDates = c.userPostDates?.[user.id] || [];
      totalCheckins = Math.max(totalCheckins, userDates.length);
      if ((c.completedUserIds || []).includes(user.id) || userDates.length >= c.durationDays) {
        completedCount++;
      }
    });

    return {
      activeCount: userChallenges.length,
      totalCheckins,
      squadsCount,
      completedCount,
    };
  }, [userChallenges, userProgressPosts, user.id]);

  const handleShareDossier = () => {
    vibrateLight();
    const url = `${window.location.origin}/#dossier/${user.username}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      id="person-profile-dossier-screen"
      className="min-h-screen pb-24 bg-white dark:bg-black text-slate-900 dark:text-white transition-colors"
    >
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={() => {
                vibrateLight();
                onBack();
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 transition-colors active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                Person Dossier
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6FED]" />
            </div>
            <h1 className="text-base font-black text-slate-900 dark:text-white truncate">
              {user.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isMe && onSendMessage && (
            <button
              onClick={() => {
                vibrateLight();
                onSendMessage(user);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
              title={`Direct message @${user.username}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Message</span>
            </button>
          )}

          <button
            onClick={handleShareDossier}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/80 transition-colors text-xs flex items-center gap-1"
            title="Share dossier link"
            aria-label="Share dossier"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-[#2F6FED]" />
                <span className="text-[11px] font-bold text-[#2F6FED]">Copied</span>
              </>
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 max-w-lg mx-auto space-y-4">
        {/* User Identity Card */}
        <div className="bg-slate-50 dark:bg-[#0d0d12] border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-white/15 shadow-md"
              />
              <CheckCircle2
                className="w-5 h-5 text-[#2F6FED] bg-white dark:bg-black rounded-full absolute -bottom-1 -right-1"
                aria-label="Verified Member"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
                  {user.name}
                </h2>
                <span className="text-[11px] font-bold text-[#2F6FED] bg-[#2F6FED]/10 px-2 py-0.5 rounded-full font-mono">
                  @{user.username}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-white/70 mt-1 leading-relaxed">
                {user.bio || 'Active momentum builder documenting daily receipts and accountability.'}
              </p>

              {/* Interest / Habit Badges */}
              {user.interests && user.interests.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                  {user.interests.map((interest) => (
                    <span
                      key={interest}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-200/60 dark:bg-white/5 text-slate-700 dark:text-white/80 border border-slate-300/40 dark:border-white/5 uppercase tracking-wider"
                    >
                      #{interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar: Challenge Recording & Streaks */}
          <div className="grid grid-cols-4 gap-2 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-3 text-center">
            <div>
              <span className="text-base font-black font-mono text-[#2F6FED] block">
                {user.currentStreak || 0}
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">
                Day Streak
              </span>
            </div>
            <div>
              <span className="text-base font-black font-mono text-slate-900 dark:text-white block">
                {challengeStats.activeCount}
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">
                Challenges
              </span>
            </div>
            <div>
              <span className="text-base font-black font-mono text-indigo-500 dark:text-indigo-400 block">
                {challengeStats.squadsCount}
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">
                Squads
              </span>
            </div>
            <div>
              <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                {challengeStats.totalCheckins}
              </span>
              <span className="text-[9px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">
                Receipts
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Switcher: All | Challenges & Squads | Receipts */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
          <button
            onClick={() => {
              vibrateLight();
              setActiveTab('all');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#2F6FED] text-white shadow-sm'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => {
              vibrateLight();
              setActiveTab('challenges');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'challenges'
                ? 'bg-[#2F6FED] text-white shadow-sm'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Challenges ({userChallenges.length})</span>
          </button>
          <button
            onClick={() => {
              vibrateLight();
              setActiveTab('milestones');
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === 'milestones'
                ? 'bg-[#2F6FED] text-white shadow-sm'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Receipts ({userProgressPosts.length})</span>
          </button>
        </div>

        {/* ========================================================
            CHALLENGES RECORDED IN DOSSIER
            ======================================================== */}
        {(activeTab === 'all' || activeTab === 'challenges') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#2F6FED]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Active Challenges & Squads
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-white/40">
                {userChallenges.length} recorded
              </span>
            </div>

            {userChallenges.length === 0 ? (
              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-5 text-center space-y-1">
                <Target className="w-7 h-7 text-slate-300 dark:text-white/30 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-white/80">No active challenges yet</p>
                <p className="text-[11px] text-slate-500 dark:text-white/50">
                  {user.name} has not enrolled in any public challenges.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {userChallenges.map((challenge) => {
                  const userDates = challenge.userPostDates?.[user.id] || [];
                  const daysCompleted = userDates.length;
                  const percent = Math.min(100, Math.round((daysCompleted / challenge.durationDays) * 100));
                  const isSquad = challenge.challengeType === 'group';
                  const userTeam = (challenge.teams || []).find((t) =>
                    (t.memberIds || []).includes(user.id)
                  );

                  return (
                    <div
                      key={challenge.id}
                      className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm hover:border-[#2F6FED]/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xl shrink-0">
                            {challenge.icon || '🏆'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {challenge.title}
                              </h4>
                              {isSquad && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20">
                                  Squad: {userTeam?.name || 'Cohort'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-white/50 mt-0.5 font-mono">
                              <span>{challenge.durationDays} Days Goal</span>
                              <span>•</span>
                              <span className="text-[#2F6FED]">#{challenge.tag}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black font-mono text-[#2F6FED]">
                            {percent}%
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-white/40 block">
                            Day {daysCompleted}/{challenge.durationDays}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2F6FED] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Squad members info if in team */}
                      {userTeam && userTeam.members && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5 text-[11px]">
                          <span className="text-slate-500 dark:text-white/50 font-medium">Squad Teammates:</span>
                          <div className="flex items-center -space-x-1.5">
                            {userTeam.members.map((m) => (
                              <img
                                key={m.userId}
                                src={m.userAvatar}
                                alt={m.userName}
                                title={m.userName}
                                className="w-5 h-5 rounded-full border-2 border-white dark:border-black object-cover"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            RECORDED CHALLENGE RECEIPTS & PROOF MILESTONES
            ======================================================== */}
        {(activeTab === 'all' || activeTab === 'milestones') && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Challenge Receipts & Milestones
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-white/40">
                {userProgressPosts.length} proofs recorded
              </span>
            </div>

            {userProgressPosts.length === 0 ? (
              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-center space-y-2">
                <ImageIcon className="w-8 h-8 text-slate-300 dark:text-white/30 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-white/80">No proof receipts posted yet</p>
                <p className="text-[11px] text-slate-500 dark:text-white/50">
                  Daily submissions and receipts will appear here as {user.name} completes challenge days.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userProgressPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-[#0d0d12] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm hover:border-[#2F6FED]/40 transition-all group"
                  >
                    <div className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-[#2F6FED]/15 text-[#2F6FED] font-mono font-black text-xs">
                            Day {post.dayNumber}
                          </span>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-white/80 truncate">
                            {post.teamName ? `${post.teamName} • Receipt` : 'Daily Proof Receipt'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono">
                          {post.postDate || post.createdAt}
                        </span>
                      </div>

                      {post.text && (
                        <p className="text-xs text-slate-700 dark:text-white/90 leading-relaxed">
                          "{post.text}"
                        </p>
                      )}

                      {/* Photo Receipt */}
                      {post.imageUrl && (
                        <div
                          onClick={() => setSelectedProofModal(post)}
                          className="relative rounded-xl overflow-hidden aspect-video bg-black/40 border border-slate-200 dark:border-white/10 cursor-pointer"
                        >
                          <img
                            src={post.imageUrl}
                            alt={`Day ${post.dayNumber} proof`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                          />
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-[#2F6FED]" />
                            <span>Verified Receipt</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-white/40">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500 fill-current" />
                          <span>{post.userStreak || user.currentStreak || 1} day streak active</span>
                        </span>
                        {post.cheersCount > 0 && (
                          <span className="font-bold text-[#2F6FED]">
                            👏 {post.cheersCount} cheers
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Proof Lightbox Modal */}
      {selectedProofModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedProofModal(null)}
        >
          <div
            className="max-w-md w-full bg-[#0d0d12] border border-white/15 rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="font-bold text-xs text-[#2F6FED]">
                Day {selectedProofModal.dayNumber} Verification Proof
              </span>
              <button
                onClick={() => setSelectedProofModal(null)}
                className="text-white/60 hover:text-white text-xs font-bold px-2 py-1 bg-white/10 rounded-lg"
              >
                Close
              </button>
            </div>
            <img
              src={selectedProofModal.imageUrl}
              alt="Proof"
              className="w-full rounded-2xl max-h-[60vh] object-contain bg-black"
            />
            {selectedProofModal.text && (
              <p className="text-xs text-white/80 leading-relaxed italic">
                "{selectedProofModal.text}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
