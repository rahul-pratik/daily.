import React, { useState, useEffect } from 'react';
import {
  Flame,
  Clock,
  Users,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Check,
  MessageSquare,
  Trophy,
  Search,
  X,
  Target,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { User, Post, Challenge } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { CreateChallengeModal } from './CreateChallengeModal';
import { ChallengeProgressScreen } from './ChallengeProgressScreen';

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
  const [selectedTab, setSelectedTab] = useState<'all' | 'squads' | 'solo' | 'joined'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [activeChallengeScreen, setActiveChallengeScreen] = useState<Challenge | null>(null);
  const [initialChallengeTab, setInitialChallengeTab] = useState<'proofs' | 'leaderboard' | 'squads' | 'chat'>('proofs');
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);

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

  // Distinct tags
  const allTags = Array.from(
    new Set(challenges.map((c) => c.tag).filter(Boolean))
  );

  // Filter Challenges
  const filteredChallenges = challenges.filter((c) => {
    const isJoined = (c.participantIds || []).includes(currentUser.id);
    const isGroup = c.challengeType === 'group';

    // Primary tab filtering: strictly Challenges & Squads
    if (selectedTab === 'squads' && !isGroup) return false;
    if (selectedTab === 'solo' && isGroup) return false;
    if (selectedTab === 'joined' && !isJoined) return false;

    // Tag filter
    if (selectedTag && c.tag !== selectedTag) return false;

    // Search query
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

  // Find joined challenges for chat shortcuts
  const myJoinedChallenges = challenges.filter((c) =>
    (c.participantIds || []).includes(currentUser.id)
  );

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
    <div
      id="challenges-main-screen"
      className="w-full pb-24 pt-2 px-3 sm:px-4 max-w-lg mx-auto space-y-4 text-slate-900 dark:text-white"
    >
      {/* Header & Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#2F6FED]" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Challenges & Squads
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-white/50">
              Join daily accountability sprints & team squads
            </p>
          </div>

          <button
            onClick={() => {
              vibrateLight();
              setIsCreateChallengeOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Challenge</span>
          </button>
        </div>

        {/* Community-style Challenge Cohort Chat Bar */}
        {myJoinedChallenges.length > 0 && (
          <div
            onClick={() => {
              vibrateLight();
              const topChallenge = myJoinedChallenges[0];
              setInitialChallengeTab('chat');
              setActiveChallengeScreen(topChallenge);
            }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#2F6FED]/15 border border-[#2F6FED]/30 flex items-center justify-center text-[#2F6FED] shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-[#2F6FED] transition-colors">
                    Challenge Cohort Discussions
                  </h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#2F6FED]/15 text-[#2F6FED]">
                    {myJoinedChallenges.length} Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-white/60 truncate mt-0.5">
                  Tap to chat with fellow participants & view daily tasks
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        )}

        {/* Minimal Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search challenges by title, tag, or goal..."
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

        {/* Clean Primary Switcher: Just Challenges & Squads */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
          <button
            onClick={() => {
              vibrateLight();
              setSelectedTab('all');
            }}
            className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'all'
                ? 'bg-[#2F6FED] text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              vibrateLight();
              setSelectedTab('squads');
            }}
            className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              selectedTab === 'squads'
                ? 'bg-[#2F6FED] text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Squads</span>
          </button>
          <button
            onClick={() => {
              vibrateLight();
              setSelectedTab('solo');
            }}
            className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              selectedTab === 'solo'
                ? 'bg-[#2F6FED] text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3 h-3" />
            <span>Solo</span>
          </button>
          <button
            onClick={() => {
              vibrateLight();
              setSelectedTab('joined');
            }}
            className={`py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              selectedTab === 'joined'
                ? 'bg-[#2F6FED] text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Check className="w-3 h-3" />
            <span>Joined</span>
          </button>
        </div>

        {/* Optional Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => {
                vibrateLight();
                setSelectedTag(null);
              }}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                selectedTag === null
                  ? 'bg-slate-800 text-white dark:bg-white dark:text-black'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              #All Tags
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => {
                  vibrateLight();
                  setSelectedTag(selectedTag === t ? null : t);
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                  selectedTag === t
                    ? 'bg-[#2F6FED] text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ELEVATED CHALLENGE CARDS LIST */}
      <div className="space-y-3 pt-1">
        {filteredChallenges.length === 0 ? (
          <div className="bg-white dark:bg-[#0F0F0F] border border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center space-y-3 shadow-sm">
            <Trophy className="w-10 h-10 text-slate-300 dark:text-white/30 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No challenges found
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/50 max-w-xs mx-auto">
                {searchQuery
                  ? `No challenges match "${searchQuery}".`
                  : 'Select another filter or launch a new challenge.'}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedTab('all');
                setSelectedTag(null);
                setSearchQuery('');
              }}
              className="py-1.5 px-3.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Reset Filters</span>
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
                className="bg-white dark:bg-[#0e0e13] border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm hover:border-[#2F6FED]/50 transition-all group"
              >
                {/* Visual Header / Banner */}
                <div className="p-4 pb-3 space-y-3">
                  {/* Top Badges: Type, Duration, Participants */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {isGroup ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Squad Sprint</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>Solo Focus</span>
                        </span>
                      )}

                      {challenge.tag && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 border border-slate-200 dark:border-white/5">
                          #{challenge.tag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-white/50 font-mono font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-white/40" />
                        {challenge.durationDays}d
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400 dark:text-white/40" />
                        {(challenge.participantIds || []).length} joined
                      </span>
                    </div>
                  </div>

                  {/* Title & Icon */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {challenge.icon || '🏆'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-[#2F6FED] transition-colors">
                        {challenge.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-white/50 mt-0.5">
                        Created by {challenge.createdByName}
                      </p>
                    </div>
                  </div>

                  {/* WHAT YOU CAN PERFORM (Clear, actionable daily task) */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-[#2F6FED] uppercase tracking-wider">
                      <Target className="w-3 h-3" />
                      <span>What you perform</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-white/80 leading-relaxed font-medium">
                      {challenge.description || 'Commit to showing up daily and submitting verified proof receipts.'}
                    </p>
                  </div>

                  {/* Progress bar if joined */}
                  {isJoined && (
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-white/50 font-mono">
                        <span>Day {userProgress.daysCompleted} of {challenge.durationDays} completed</span>
                        <span className="font-bold text-[#2F6FED]">{percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2F6FED] rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ACTION BUTTONS ROW: Chat / Discussion & Check-in / Join */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* Chat / Discussion Button (similar to community discussions) */}
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setInitialChallengeTab('chat');
                        setActiveChallengeScreen(challenge);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-white/10 active:scale-95 shadow-sm"
                      title="Open challenge chat & cohort discussions"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#2F6FED]" />
                      <span>Cohort Chat</span>
                    </button>

                    {/* Check In / Join Button */}
                    {isJoined ? (
                      <button
                        type="button"
                        onClick={() => {
                          vibrateLight();
                          setInitialChallengeTab('proofs');
                          setActiveChallengeScreen(challenge);
                        }}
                        className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                          hasCheckedInToday
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-600/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-[#2F6FED] hover:bg-[#255bd1] text-white shadow-lg shadow-[#2F6FED]/25'
                        }`}
                      >
                        {hasCheckedInToday ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Done Today</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-3.5 h-3.5 fill-current text-orange-400" />
                            <span>Check In</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleToggleJoin(e, challenge.id)}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-[#2F6FED] hover:bg-[#255bd1] text-white text-xs font-black transition-all shadow-lg shadow-[#2F6FED]/25 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Join Sprint</span>
                      </button>
                    )}

                    {/* Details Accordion Toggle */}
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(e, challenge.id)}
                      className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors shrink-0"
                      title={isExpanded ? 'Hide guidelines' : 'Show guidelines'}
                      aria-label="Toggle challenge guidelines"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE DETAILS DRAWER */}
                {isExpanded && (
                  <div className="p-4 pt-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/30 space-y-3 animate-in fade-in duration-200">
                    {/* Guidelines or Rules */}
                    {challenge.rules && challenge.rules.length > 0 && (
                      <div className="p-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#2F6FED]" />
                          Daily Verification Rules
                        </span>
                        <ul className="text-xs text-slate-600 dark:text-white/70 space-y-1 list-disc list-inside">
                          {challenge.rules.map((rule, rIdx) => (
                            <li key={rIdx}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Secondary Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => {
                          vibrateLight();
                          setActiveChallengeScreen(challenge);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-200/60 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Target className="w-3.5 h-3.5 text-[#2F6FED]" />
                        <span>Open Full Challenge Hub</span>
                      </button>

                      {isJoined && (
                        <button
                          onClick={(e) => handleToggleJoin(e, challenge.id)}
                          className="py-2 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors"
                        >
                          Leave Challenge
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
