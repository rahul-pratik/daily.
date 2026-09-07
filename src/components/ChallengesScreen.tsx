import React, { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle2,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Sparkles,
  Award,
  Check,
  Zap,
  MessageSquare,
  Trophy,
  Search,
  ArrowRight,
  X,
  Target,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { User, Post, Challenge } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { CreateChallengeModal } from './CreateChallengeModal';
import { ChallengeProgressScreen } from './ChallengeProgressScreen';
import { ChallengeDailyProofProgressBar } from './ChallengeDailyProofProgressBar';
import { StreakFreezeCard } from './StreakFreezeCard';

interface ChallengesScreenProps {
  currentUser: User;
  posts: Post[];
  onOpenCreate: () => void;
  onToggleLike?: (postId: string) => void;
  onOpenComments?: (post: Post) => void;
  savedPostIds?: string[];
  reportedPostIds?: string[];
  onToggleSave?: (postId: string) => void;
  onReportPost?: (post: Post) => void;
  onSharePost?: (post: Post) => void;
  onOpenInsights?: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onOpenGroupChat?: (groupId: string) => void;
  initialChallengeId?: string | null;
  onClearInitialChallenge?: () => void;
  onOpenNotifications?: () => void;
  onUserUpdated?: (user: User) => void;
}

const CATEGORY_CHIPS = [
  'All',
  'Joined',
  '👥 Squads',
  '🎯 Solo',
  '30 Days',
  '60 Days',
  'Fitness',
  'Coding',
  'Mindset',
];

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  currentUser,
  posts,
  onOpenCreate,
  onToggleLike = () => {},
  onOpenComments = () => {},
  savedPostIds = [],
  reportedPostIds = [],
  onToggleSave = () => {},
  onReportPost = () => {},
  onSharePost = () => {},
  onOpenInsights = () => {},
  onDeletePost = () => {},
  onOpenGroupChat,
  initialChallengeId,
  onClearInitialChallenge,
  onOpenNotifications,
  onUserUpdated,
}) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterChip, setSelectedFilterChip] = useState('All');
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [activeChallengeScreen, setActiveChallengeScreen] = useState<Challenge | null>(null);
  const [initialChallengeTab, setInitialChallengeTab] = useState<'proofs' | 'leaderboard' | 'squads' | 'chat'>('proofs');
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);

  // Active group challenge for the collective proof progress bar
  const activeGroupChallenge =
    challenges.find((c) => {
      const isJoined = (c.participantIds || []).includes(currentUser.id);
      return isJoined && c.challengeType === 'group';
    }) ||
    challenges.find((c) => c.challengeType === 'group');

  useEffect(() => {
    const loadedChallenges = DailyStorageService.getAllChallenges();
    setChallenges(loadedChallenges);

    if (initialChallengeId) {
      const match = loadedChallenges.find((c) => c.id === initialChallengeId);
      if (match) {
        setActiveChallengeScreen(match);
        if (onClearInitialChallenge) {
          onClearInitialChallenge();
        }
      }
    }
  }, [initialChallengeId]);

  const today = getTodayDateString();

  // Filter Challenges
  const filteredChallenges = challenges.filter((c) => {
    const isJoined = (c.participantIds || []).includes(currentUser.id);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      const matchCat = (c.category || '').toLowerCase().includes(q);
      const matchTag = (c.tag || '').toLowerCase().includes(q);
      const matchDuration = `${c.durationDays} days`.includes(q);
      if (!matchTitle && !matchDesc && !matchCat && !matchTag && !matchDuration) {
        return false;
      }
    }

    if (selectedFilterChip === 'Joined') {
      return isJoined;
    } else if (selectedFilterChip === '👥 Squads') {
      return c.challengeType === 'group';
    } else if (selectedFilterChip === '🎯 Solo') {
      return c.challengeType === 'individual' || !c.challengeType;
    } else if (selectedFilterChip === '30 Days') {
      return c.durationDays === 30;
    } else if (selectedFilterChip === '60 Days') {
      return c.durationDays === 60;
    } else if (selectedFilterChip !== 'All') {
      const catLower = selectedFilterChip.toLowerCase();
      const matchCat = (c.category || '').toLowerCase() === catLower;
      const matchTag = (c.tag || '').toLowerCase() === catLower;
      return matchCat || matchTag;
    }

    return true;
  });

  const handleChallengeCreated = (newChallenge: Challenge) => {
    const all = DailyStorageService.getAllChallenges();
    setChallenges(all);
    setActiveChallengeScreen(newChallenge);
  };

  const handleChallengeUpdated = (updatedChallenge: Challenge) => {
    const all = DailyStorageService.getAllChallenges();
    setChallenges(all);
    if (activeChallengeScreen && activeChallengeScreen.id === updatedChallenge.id) {
      setActiveChallengeScreen(updatedChallenge);
    }
  };

  const handleToggleJoin = (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    vibrateLight();
    const result = DailyStorageService.toggleJoinChallenge(challengeId);
    setChallenges(DailyStorageService.getAllChallenges());
    if (activeChallengeScreen && activeChallengeScreen.id === challengeId) {
      setActiveChallengeScreen(result.challenge);
    }
  };

  const toggleExpand = (e: React.MouseEvent, challengeId: string) => {
    e.stopPropagation();
    vibrateLight();
    setExpandedChallengeId((prev) => (prev === challengeId ? null : challengeId));
  };

  // If viewing a specific challenge's progress hub
  if (activeChallengeScreen) {
    return (
      <ChallengeProgressScreen
        challenge={activeChallengeScreen}
        currentUser={currentUser}
        initialTab={initialChallengeTab}
        onOpenGroupChat={onOpenGroupChat}
        onBack={() => {
          setActiveChallengeScreen(null);
          setInitialChallengeTab('proofs');
          setChallenges(DailyStorageService.getAllChallenges());
        }}
        onChallengeUpdated={handleChallengeUpdated}
      />
    );
  }

  return (
    <div className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4 text-slate-900 dark:text-white">
      {/* Visual Accountability Progress Bar */}
      {activeGroupChallenge && (
        <ChallengeDailyProofProgressBar
          challengeId={activeGroupChallenge.id}
          onOpenChallenge={(id) => {
            const target = challenges.find((c) => c.id === id);
            if (target) {
              setInitialChallengeTab('proofs');
              setActiveChallengeScreen(target);
            }
          }}
          onOpenSubmitProof={(id) => {
            const target = challenges.find((c) => c.id === id);
            if (target) {
              setInitialChallengeTab('proofs');
              setActiveChallengeScreen(target);
            }
          }}
          onOpenGroupChat={onOpenGroupChat}
        />
      )}

      {/* Challenge Streak Freeze Defense Shield */}
      <StreakFreezeCard
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
        onOpenNotifications={onOpenNotifications}
      />

      {/* Header & Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#2F6FED]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Challenges & Squads</h2>
          </div>

          <button
            onClick={() => {
              vibrateLight();
              setIsCreateChallengeOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Minimal Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search challenges..."
            className="w-full bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/15 focus:border-[#2F6FED] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 focus:outline-none transition-colors shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = selectedFilterChip === chip;
            return (
              <button
                key={chip}
                onClick={() => {
                  vibrateLight();
                  setSelectedFilterChip(chip);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#2F6FED] text-white shadow-sm'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* MINIMAL PROGRESSIVE-DISCLOSURE CHALLENGES LIST */}
      <div className="space-y-2.5 pt-1">
        {filteredChallenges.length === 0 ? (
          <div className="bg-white dark:bg-[#0F0F0F] border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center space-y-2 shadow-sm">
            <Trophy className="w-8 h-8 text-slate-300 dark:text-white/30 mx-auto" />
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">No challenges found</h3>
              <p className="text-[11px] text-slate-500 dark:text-white/50">
                {searchQuery
                  ? `No challenges match "${searchQuery}".`
                  : 'Start a new challenge to build daily momentum.'}
              </p>
            </div>
            <button
              onClick={() => setIsCreateChallengeOpen(true)}
              className="py-1.5 px-3 rounded-lg bg-[#2F6FED] text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm mt-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Challenge</span>
            </button>
          </div>
        ) : (
          filteredChallenges.map((challenge) => {
            const isJoined = (challenge.participantIds || []).includes(currentUser.id);
            const userProgress = DailyStorageService.getChallengeUserProgress(challenge.id, currentUser.id);
            const percent = Math.min(100, Math.round((userProgress.daysCompleted / challenge.durationDays) * 100));
            const isGroup = challenge.challengeType === 'group';
            const hasCheckedInToday = userProgress.userPostDates.includes(today);
            const isExpanded = expandedChallengeId === challenge.id;

            return (
              <div
                key={challenge.id}
                className="bg-white dark:bg-[#0F0F0F] border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-sm hover:border-[#2F6FED]/50 transition-all space-y-3 text-slate-900 dark:text-white"
              >
                {/* Main Row: Icon, Title, Tags, and Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xl shrink-0">
                      {challenge.icon || '🏆'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {challenge.title}
                        </h3>
                        {isGroup && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                            Squad
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-white/50 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400 dark:text-white/40" />
                          {challenge.durationDays}d
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400 dark:text-white/40" />
                          {(challenge.participantIds || []).length}
                        </span>
                        {challenge.tag && (
                          <>
                            <span>•</span>
                            <span className="text-[#2F6FED]">#{challenge.tag}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Primary Fast Action */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isJoined ? (
                      <button
                        onClick={() => {
                          vibrateLight();
                          setInitialChallengeTab('proofs');
                          setActiveChallengeScreen(challenge);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${
                          hasCheckedInToday
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-[#2F6FED] hover:bg-[#255bd1] text-white'
                        }`}
                      >
                        {hasCheckedInToday ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            <span>Check In</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleToggleJoin(e, challenge.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                      >
                        <span>Join</span>
                      </button>
                    )}

                    {/* Bit-by-bit Toggle Button */}
                    <button
                      onClick={(e) => toggleExpand(e, challenge.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                      title={isExpanded ? 'Hide details' : 'Show details'}
                      aria-label="Toggle challenge details"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Progress bar if joined */}
                {isJoined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-white/50">
                      <span>Day {userProgress.daysCompleted} of {challenge.durationDays}</span>
                      <span className="font-semibold text-slate-700 dark:text-white/80">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2F6FED] rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* BIT-BY-BIT PROGRESSIVE DISCLOSURE DRAWER */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-3 animate-in fade-in duration-200">
                    {/* Goal & Description */}
                    <div className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                      {challenge.description || 'Commit to showing up and submitting daily proof receipts to stay accountable.'}
                    </div>

                    {/* Guidelines or Rules bit */}
                    {challenge.rules && challenge.rules.length > 0 && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#2F6FED]" />
                          Check-in Guidelines
                        </span>
                        <ul className="text-xs text-slate-600 dark:text-white/70 space-y-0.5 list-disc list-inside">
                          {challenge.rules.map((rule, rIdx) => (
                            <li key={rIdx}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Secondary Actions Row */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <button
                        onClick={() => {
                          vibrateLight();
                          setActiveChallengeScreen(challenge);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Target className="w-3.5 h-3.5 text-[#2F6FED]" />
                        <span>Open Challenge Hub</span>
                      </button>

                      {isJoined && (
                        <button
                          onClick={(e) => handleToggleJoin(e, challenge.id)}
                          className="py-1.5 px-3 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition-colors"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE CHALLENGE MODAL */}
      {isCreateChallengeOpen && (
        <CreateChallengeModal
          isOpen={isCreateChallengeOpen}
          onClose={() => setIsCreateChallengeOpen(false)}
          currentUser={currentUser}
          onChallengeCreated={handleChallengeCreated}
        />
      )}
    </div>
  );
};
