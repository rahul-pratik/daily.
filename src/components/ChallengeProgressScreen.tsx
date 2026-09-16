import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Flame,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Users,
  Trophy,
  Camera,
  Sparkles,
  Heart,
  Send,
  AlertCircle,
  LogOut,
  Check,
  Award,
  X,
  MessageCircle,
  ThumbsUp,
  UserPlus,
  Crown,
  Plus,
  Target,
  ArrowUpDown,
  Search,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { User, Challenge, ChallengeProgressPost, Message, ChallengeTeam } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateSuccess, vibrateStreakMilestone } from '../services/haptics';
import { ChallengeLeaderboardView } from './ChallengeLeaderboardView';

interface ChallengeProgressScreenProps {
  challenge: Challenge;
  currentUser: User;
  onBack: () => void;
  onChallengeUpdated: (updatedChallenge: Challenge) => void;
  initialTab?: 'proofs' | 'leaderboard' | 'squads' | 'chat';
  onOpenGroupChat?: (groupId: string) => void;
}

const SAMPLE_ACHIEVEMENTS = [
  {
    title: 'Code Ship Receipt',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
  },
  {
    title: 'Workout Log',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=80',
  },
  {
    title: 'Morning Sun & Run',
    url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000&auto=format&fit=crop&q=80',
  },
  {
    title: 'Book Notes & Margins',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
  },
];

export const ChallengeProgressScreen: React.FC<ChallengeProgressScreenProps> = ({
  challenge: initialChallenge,
  currentUser,
  onBack,
  onChallengeUpdated,
  initialTab = 'proofs',
  onOpenGroupChat,
}) => {
  const [challenge, setChallenge] = useState<Challenge>(initialChallenge);
  const [challengeTab, setChallengeTab] = useState<'proofs' | 'leaderboard' | 'squads' | 'chat'>(initialTab);
  const [chatChannel, setChatChannel] = useState<'cohort' | 'squad'>('cohort');
  const [progressPosts, setProgressPosts] = useState<ChallengeProgressPost[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [squadMessages, setSquadMessages] = useState<Message[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postPhotoUrl, setPostPhotoUrl] = useState('');
  const [postReflection, setPostReflection] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [selectedDayProof, setSelectedDayProof] = useState<ChallengeProgressPost | null>(null);

  // Proofs Sort By state
  const [proofsFilter, setProofsFilter] = useState<'all' | 'my_proofs' | 'squad'>('all');
  const [squadProofMode, setSquadProofMode] = useState<'all_members' | 'individual'>('all_members');
  const [selectedSquadMemberId, setSelectedSquadMemberId] = useState<string | null>(null);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  // Squad / Team management states
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [squadNameInput, setSquadNameInput] = useState('');
  const [squadMottoInput, setSquadMottoInput] = useState('');
  const [squadError, setSquadError] = useState<string | null>(null);
  const [squadTargetUserToInvite, setSquadTargetUserToInvite] = useState<User | null>(null);

  // Find Squad Members search & recruit modal
  const [isFindSquadModalOpen, setIsFindSquadModalOpen] = useState(false);
  const [squadMemberSearchQuery, setSquadMemberSearchQuery] = useState('');
  const [squadSearchQuery, setSquadSearchQuery] = useState('');
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>(() => {
    const notifs = DailyStorageService.getAllNotifications();
    return notifs
      .filter((n) => (n.type === 'squad_invite' || n.type === 'challenge_invite') && n.targetId === challenge.id && n.recipientId)
      .map((n) => n.recipientId as string);
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const userProgress = DailyStorageService.getChallengeUserProgress(challenge.id, currentUser.id);
  const mySquad =
    userProgress.userTeam ||
    (challenge.teams || []).find((t) => (t.memberIds || []).includes(currentUser.id));

  const squadProofStats = mySquad
    ? DailyStorageService.getChallengeTodayProofStats(challenge.id, mySquad.id)
    : null;
  const squadStreak = mySquad
    ? DailyStorageService.getSquadCollectiveStreak(challenge.id, mySquad.id)
    : 0;

  const isMemberOnline = (userId: string) => {
    if (userId === currentUser.id) return true;
    if (DailyStorageService.isUserOnline(userId)) return true;
    return squadMessages.some((m) => m.senderId === userId);
  };

  const handleNudgeSquad = () => {
    if (!mySquad) return;
    vibrateLight();
    const nudgeText = `⚡ Accountability check-in: Let's lock in our daily proofs to protect our ${squadStreak}-day collective squad streak! 🎯📸`;
    DailyStorageService.sendChallengeSquadTextMessage(challenge.id, mySquad.id, nudgeText);
    const updatedMsgs = DailyStorageService.getChallengeSquadMessages(challenge.id, mySquad.id);
    setSquadMessages(updatedMsgs);
    showToast(`Nudged ${mySquad.name} in squad chat!`);
  };

  // Load progress posts, cohort chat messages, and squad chat messages
  useEffect(() => {
    const posts = DailyStorageService.getAllChallengeProgressPosts(challenge.id);
    setProgressPosts(posts);
    const msgs = DailyStorageService.getChallengeMessages(challenge.id);
    setChatMessages(msgs);

    if (mySquad) {
      DailyStorageService.ensureChallengeSquadGroup(challenge.id, mySquad.id);
      const sMsgs = DailyStorageService.getChallengeSquadMessages(challenge.id, mySquad.id);
      setSquadMessages(sMsgs);
    }
  }, [challenge.id, mySquad?.id]);

  const today = getTodayDateString();
  const isJoined = (challenge.participantIds || []).includes(currentUser.id);
  const isGroupChallenge = challenge.challengeType === 'group';

  // Calculate days completed & duration
  const daysCompleted = userProgress.daysCompleted;
  const totalDays = challenge.durationDays || 30;
  const remainingDays = Math.max(0, totalDays - daysCompleted);
  const percentComplete = Math.min(100, Math.round((daysCompleted / totalDays) * 100));

  // Compute countdown to deadline
  const calculateDeadlineCountdown = () => {
    try {
      const todayDate = new Date();
      const deadline = new Date(`${challenge.deadlineDate}T23:59:59`);
      const diffMs = deadline.getTime() - todayDate.getTime();
      const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return diffDays;
    } catch {
      return remainingDays;
    }
  };

  const deadlineDaysLeft = calculateDeadlineCountdown();

  // Handle joining / leaving challenge
  const handleToggleJoin = () => {
    vibrateLight();
    const result = DailyStorageService.toggleJoinChallenge(challenge.id);
    setChallenge(result.challenge);
    onChallengeUpdated(result.challenge);
    setShowLeaveConfirm(false);
  };

  // Squad Management actions
  const handleCreateSquad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadNameInput.trim()) {
      setSquadError('Squad name is required');
      return;
    }

    const result = DailyStorageService.createChallengeTeam(
      challenge.id,
      squadNameInput.trim(),
      squadMottoInput.trim() || undefined
    );

    let updatedChallenge = result.challenge;

    // If an invited user was queued up, send them a squad invite notification
    if (squadTargetUserToInvite) {
      DailyStorageService.sendSquadInvite({
        challengeId: challenge.id,
        squadId: result.team.id,
        targetUser: squadTargetUserToInvite,
      });
      setInvitedUserIds((prev) => Array.from(new Set([...prev, squadTargetUserToInvite.id])));
      showToast(`Squad created & invite sent to @${squadTargetUserToInvite.username}!`);
    }

    vibrateSuccess();
    setChallenge(updatedChallenge);
    onChallengeUpdated(updatedChallenge);
    setSquadNameInput('');
    setSquadMottoInput('');
    setSquadError(null);
    setSquadTargetUserToInvite(null);
    setIsCreateSquadOpen(false);
  };

  const handleJoinSquad = (teamId: string) => {
    vibrateLight();
    const result = DailyStorageService.joinChallengeTeam(challenge.id, teamId);
    setChallenge(result.challenge);
    onChallengeUpdated(result.challenge);
  };

  const handleLeaveSquad = () => {
    vibrateLight();
    const result = DailyStorageService.leaveChallengeTeam(challenge.id, mySquad?.id);
    setChallenge(result.challenge);
    onChallengeUpdated(result.challenge);
  };

  const handleInviteUserToSquad = (userToInvite: User) => {
    vibrateLight();
    if (mySquad) {
      // Trigger in-app notification to the selected user to join requester's squad
      DailyStorageService.sendSquadInvite({
        challengeId: challenge.id,
        squadId: mySquad.id,
        targetUser: userToInvite,
      });
      vibrateSuccess();
      setInvitedUserIds((prev) => Array.from(new Set([...prev, userToInvite.id])));
      showToast(`Squad invite sent to ${userToInvite.name} (@${userToInvite.username})!`);
    } else {
      // Prompt user to name their squad and include userToInvite
      setSquadTargetUserToInvite(userToInvite);
      setSquadNameInput(`${currentUser.name.split(' ')[0]} & ${userToInvite.name.split(' ')[0]}'s Squad`);
      setIsFindSquadModalOpen(false);
      setIsCreateSquadOpen(true);
    }
  };

  const handleSelectPresetPhoto = (url: string) => {
    vibrateLight();
    setPostPhotoUrl(url);
    setPhotoError(null);
    setShowPresets(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPostPhotoUrl(reader.result as string);
      setPhotoError(null);
    };
    reader.onerror = () => {
      setPhotoError('Failed to read image file. Please try a different photo.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProgress = (e: React.FormEvent) => {
    e.preventDefault();

    if (!postPhotoUrl || !postPhotoUrl.trim()) {
      setPhotoError('Please insert a photo as your achievement proof before submitting.');
      vibrateLight();
      return;
    }

    setIsSubmitting(true);
    const result = DailyStorageService.postChallengeProgress(challenge.id, {
      imageUrl: postPhotoUrl.trim(),
      text: postReflection.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.progressPost) {
      vibrateStreakMilestone();
      setProgressPosts((prev) => [result.progressPost!, ...prev]);
      if (result.challenge) {
        setChallenge(result.challenge);
        onChallengeUpdated(result.challenge);
      }
      setPostPhotoUrl('');
      setPostReflection('');
      setPhotoError(null);
      setIsPostModalOpen(false);
    } else {
      setPhotoError(result.error || 'Failed to submit progress');
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    vibrateLight();
    if (chatChannel === 'squad' && mySquad) {
      const newMsg = DailyStorageService.sendChallengeSquadTextMessage(
        challenge.id,
        mySquad.id,
        chatInputText.trim()
      );
      setSquadMessages((prev) => [...prev, newMsg]);
    } else {
      const newMsg = DailyStorageService.sendChallengeTextMessage(challenge.id, chatInputText.trim());
      setChatMessages((prev) => [...prev, newMsg]);
    }
    setChatInputText('');
  };

  const handleToggleCheer = (postId: string) => {
    vibrateLight();
    const updated = DailyStorageService.toggleCheerChallengePost(postId);
    setProgressPosts(updated.filter((p) => p.challengeId === challenge.id));
  };

  // Find user's progress post for a specific day
  const getProgressPostForDay = (dayNum: number) => {
    return progressPosts.find((p) => p.userId === currentUser.id && p.dayNumber === dayNum);
  };

  const handleDayClick = (dayNum: number) => {
    vibrateLight();
    const postForDay = getProgressPostForDay(dayNum);
    if (postForDay) {
      setSelectedDayProof(postForDay);
    } else if (dayNum === daysCompleted + 1 && !userProgress.hasPostedToday && !userProgress.isCompleted) {
      setIsPostModalOpen(true);
    }
  };

  // Squad members list for individual proof filtering
  const squadMembersList = mySquad?.members && mySquad.members.length > 0
    ? mySquad.members
    : (challenge.teams || []).flatMap((t) => t.members || []);

  const selectedMember = squadMembersList.find((m) => m.userId === selectedSquadMemberId);

  // Filter progress posts according to Sort By option
  const filteredProgressPosts = progressPosts.filter((post) => {
    if (proofsFilter === 'my_proofs') {
      return post.userId === currentUser.id;
    }
    if (proofsFilter === 'squad') {
      if (squadProofMode === 'individual' && selectedSquadMemberId) {
        return post.userId === selectedSquadMemberId;
      }
      // All squad member proofs
      if (mySquad) {
        const squadMemberIds = (mySquad.memberIds || []).concat((mySquad.members || []).map((m) => m.userId));
        return squadMemberIds.includes(post.userId);
      }
      // If user is not in a squad, match any team member
      const allTeamMemberIds = (challenge.teams || []).flatMap((t) => t.memberIds || []);
      return allTeamMemberIds.includes(post.userId);
    }
    return true; // 'all'
  });

  // All users for squad member finder
  const allUsers = DailyStorageService.getAllUsers();
  const searchResultsUsers = allUsers.filter((u) => {
    if (u.id === currentUser.id) return false;
    if (!squadMemberSearchQuery.trim()) return true;
    const q = squadMemberSearchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col pb-24 animate-in fade-in duration-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#161616] text-white border border-amber-500/50 shadow-2xl px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>All Challenges</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-[#2F6FED] truncate max-w-[180px]">
            {challenge.title}
          </span>
        </div>
      </div>

      {/* Main Challenge Content */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Challenge Hero Information Card */}
        <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#2F6FED]/10 border border-[#2F6FED]/30 flex items-center justify-center text-3xl shrink-0 shadow-lg">
              {challenge.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#2F6FED]/10 border border-[#2F6FED]/30 text-[10px] font-black text-[#2F6FED] uppercase tracking-wider">
                  #{challenge.tag || challenge.category}
                </span>
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#2F6FED]" />
                  Ends {challenge.deadlineDate}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                {challenge.title}
              </h1>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                {challenge.description}
              </p>
            </div>
          </div>

          {/* Participants bar & Status */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1.5 text-white/60">
              <Users className="w-3.5 h-3.5 text-[#2F6FED]" />
              <span className="font-bold text-white">
                {(challenge.participantsCount || 1).toLocaleString()}
              </span>
              <span>participants</span>
            </div>

            {isJoined ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
                <span>Joined Challenge</span>
              </div>
            ) : (
              <span className="text-[11px] text-white/40">Not joined yet</span>
            )}
          </div>
        </div>

        {/* Top Action Buttons: Find Squad Members & Leave Challenge */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              vibrateLight();
              setIsFindSquadModalOpen(true);
            }}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-[#2F6FED]/15 hover:bg-[#2F6FED]/25 text-[#2F6FED] border border-[#2F6FED]/30 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            title="Find other participants to form a squad"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Find Squad Members</span>
          </button>

          {isJoined ? (
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-red-500/10 text-white/60 hover:text-red-400 border border-white/10 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Challenge</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleJoin}
              className="py-2.5 px-4 rounded-2xl bg-[#2F6FED] hover:bg-[#255bd1] text-white font-black text-xs transition-all shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Join Challenge</span>
            </button>
          )}
        </div>

        {/* PRIMARY NAVIGATION BAR (Present at the Top, below buttons) */}
        <div className="flex items-center gap-1 bg-[#0F0F0F] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => {
              vibrateLight();
              setChallengeTab('proofs');
            }}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              challengeTab === 'proofs'
                ? 'bg-[#2F6FED] text-white font-black shadow-md shadow-[#2F6FED]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Proofs</span>
          </button>

          <button
            onClick={() => {
              vibrateLight();
              setChallengeTab('leaderboard');
            }}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              challengeTab === 'leaderboard'
                ? 'bg-amber-400 text-black font-black shadow-md shadow-amber-400/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => {
              vibrateLight();
              setChallengeTab('squads');
            }}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              challengeTab === 'squads'
                ? 'bg-amber-400 text-black font-black shadow-md shadow-amber-400/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Squads</span>
          </button>

          <button
            onClick={() => {
              vibrateLight();
              setChallengeTab('chat');
            }}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              challengeTab === 'chat'
                ? 'bg-white text-black font-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        </div>

        {/* TAB 1: PROOFS (With Progress Calendar & Sort By Button) */}
        {challengeTab === 'proofs' && (
          <div className="space-y-4">
            {/* PROGRESS CALENDAR CARD (Where people can post about their challenges) */}
            {isJoined && (
              <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-5 shadow-xl space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-white">Progress Calendar</h3>
                    </div>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      Post daily receipts and track challenge consistency
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-400">
                      {remainingDays} Days Left
                    </span>
                    <p className="text-[9px] text-white/40">{deadlineDaysLeft}d until deadline</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-[#2F6FED] via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentComplete}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/50 font-bold">
                    <span>Day 1</span>
                    <span className="text-[#2F6FED] font-black">
                      {daysCompleted} of {totalDays} Completed ({percentComplete}%)
                    </span>
                    <span>Day {totalDays} 🏁</span>
                  </div>
                </div>

                {/* Calendar Days Matrix */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                      Consistency Days:
                    </span>
                    <div className="flex items-center gap-2 text-[9px] text-white/40">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded bg-blue-600 inline-block" /> Completed
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded border border-[#2F6FED] inline-block" /> Target
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                    {Array.from({ length: totalDays }, (_, i) => {
                      const dayNum = i + 1;
                      const isCompletedDay = dayNum <= daysCompleted;
                      const isNextTarget = dayNum === daysCompleted + 1 && !userProgress.hasPostedToday;
                      const isFuture = dayNum > daysCompleted + 1;
                      const postForDay = getProgressPostForDay(dayNum);

                      return (
                        <button
                          key={dayNum}
                          onClick={() => handleDayClick(dayNum)}
                          disabled={isFuture}
                          className={`aspect-square rounded-xl text-xs font-black flex flex-col items-center justify-center relative transition-all ${
                            isCompletedDay
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm border border-blue-400/40 cursor-pointer'
                              : isNextTarget
                              ? 'border-2 border-[#2F6FED] bg-[#2F6FED]/15 text-[#2F6FED] animate-pulse cursor-pointer hover:bg-[#2F6FED]/25'
                              : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
                          }`}
                          title={
                            isCompletedDay
                              ? `Day ${dayNum} Completed - Click to view proof`
                              : isNextTarget
                              ? `Day ${dayNum} Target - Click to submit proof`
                              : `Day ${dayNum}`
                          }
                        >
                          <span className="text-[10px] leading-none">{dayNum}</span>
                          {isCompletedDay && (
                            <Check className="w-2.5 h-2.5 mt-0.5 text-white stroke-[3]" />
                          )}
                          {postForDay && (
                            <span className="w-1 h-1 rounded-full bg-amber-300 absolute bottom-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status and Post Action */}
                <div className="pt-2 border-t border-white/10">
                  {userProgress.isCompleted ? (
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1.5 text-blue-400 font-bold text-xs">
                        <Award className="w-4 h-4" />
                        <span>Challenge Completed! ({totalDays}/{totalDays} Days)</span>
                      </div>
                      <p className="text-[11px] text-white/60">
                        You have tracked all days of this challenge. Great consistency!
                      </p>
                    </div>
                  ) : userProgress.hasPostedToday ? (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>Day {daysCompleted} proof logged!</strong> Return tomorrow for Day {daysCompleted + 1}.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        vibrateLight();
                        setIsPostModalOpen(true);
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-[#2F6FED] hover:bg-[#255bd1] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Post Day {daysCompleted + 1} Progress Proof</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Proofs Feed Header with SORT BY BUTTON */}
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#2F6FED]" />
                  <span>Proof Receipts ({filteredProgressPosts.length})</span>
                </h3>
                <p className="text-[10px] text-white/40">
                  {proofsFilter === 'all'
                    ? 'Showing all cohort member proofs'
                    : proofsFilter === 'my_proofs'
                    ? "Showing only your own proofs"
                    : squadProofMode === 'all_members'
                    ? 'Showing all squad member proofs'
                    : `Showing individual proof for ${selectedMember?.userName || 'Member'}`}
                </p>
              </div>

              {/* SORT BY DROPDOWN BUTTON: squad-(all squad member or proof of individual), all, my proofs */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#2F6FED]" />
                  <span>
                    {proofsFilter === 'all'
                      ? 'Sort: All'
                      : proofsFilter === 'my_proofs'
                      ? 'Sort: My Proofs'
                      : squadProofMode === 'all_members'
                      ? 'Sort: Squad'
                      : `Sort: ${selectedMember?.userName?.split(' ')[0] || 'Individual'}`}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-[#121212] border border-white/15 rounded-2xl shadow-2xl p-2 z-30 space-y-1 text-xs">
                    {/* Option 1: All */}
                    <button
                      onClick={() => {
                        vibrateLight();
                        setProofsFilter('all');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left font-bold flex items-center justify-between transition-colors ${
                        proofsFilter === 'all'
                          ? 'bg-[#2F6FED] text-white'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>All Proofs</span>
                      </span>
                      <span className="text-[10px] opacity-70">({progressPosts.length})</span>
                    </button>

                    {/* Option 2: My Proofs */}
                    <button
                      onClick={() => {
                        vibrateLight();
                        setProofsFilter('my_proofs');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left font-bold flex items-center justify-between transition-colors ${
                        proofsFilter === 'my_proofs'
                          ? 'bg-[#2F6FED] text-white'
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>My Proofs</span>
                      </span>
                      <span className="text-[10px] opacity-70">
                        ({progressPosts.filter((p) => p.userId === currentUser.id).length})
                      </span>
                    </button>

                    {/* Option 3: Squad Proofs */}
                    <div className="pt-1 border-t border-white/10 space-y-1">
                      <button
                        onClick={() => {
                          vibrateLight();
                          setProofsFilter('squad');
                          setSquadProofMode('all_members');
                          setSelectedSquadMemberId(null);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left font-bold flex items-center justify-between transition-colors ${
                          proofsFilter === 'squad' && squadProofMode === 'all_members'
                            ? 'bg-amber-400 text-black'
                            : 'text-amber-300 hover:bg-amber-400/10'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          <span>Squad — All Squad Members</span>
                        </span>
                        <span className="text-[10px] opacity-70">
                          {mySquad ? mySquad.name : 'Squad'}
                        </span>
                      </button>

                      {/* Sub-option: Proof of an Individual */}
                      <div className="pl-3 pr-1 pt-1 space-y-1">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">
                          Proof of an Individual:
                        </span>

                        {squadMembersList.length === 0 ? (
                          <div className="text-[10px] text-white/40 italic p-1">
                            No squad members registered yet
                          </div>
                        ) : (
                          <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                            {squadMembersList.map((member) => {
                              const isSelected =
                                proofsFilter === 'squad' &&
                                squadProofMode === 'individual' &&
                                selectedSquadMemberId === member.userId;
                              return (
                                <button
                                  key={member.userId}
                                  onClick={() => {
                                    vibrateLight();
                                    setProofsFilter('squad');
                                    setSquadProofMode('individual');
                                    setSelectedSquadMemberId(member.userId);
                                    setIsSortDropdownOpen(false);
                                  }}
                                  className={`w-full p-1.5 rounded-lg text-left text-xs flex items-center gap-2 transition-colors ${
                                    isSelected
                                      ? 'bg-amber-400 text-black font-bold'
                                      : 'text-white/80 hover:bg-white/10'
                                  }`}
                                >
                                  <img
                                    src={member.userAvatar}
                                    alt={member.userName}
                                    referrerPolicy="no-referrer"
                                    className="w-5 h-5 rounded-full object-cover border border-white/20"
                                  />
                                  <span className="truncate flex-1">
                                    {member.userName} {member.userId === currentUser.id && '(You)'}
                                  </span>
                                  {isSelected && <Check className="w-3 h-3" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Proofs List */}
            <div className="space-y-3 pt-1">
              {filteredProgressPosts.length === 0 ? (
                <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-8 text-center space-y-2">
                  <Camera className="w-8 h-8 text-white/30 mx-auto" />
                  <p className="text-xs font-bold text-white/80">No progress proofs found</p>
                  <p className="text-[11px] text-white/40">
                    {proofsFilter !== 'all'
                      ? 'No proofs match the selected filter. Try switching back to All Proofs.'
                      : 'Be the first to post your daily achievement photo!'}
                  </p>
                  {proofsFilter !== 'all' && (
                    <button
                      onClick={() => setProofsFilter('all')}
                      className="py-1 px-3 rounded-lg bg-white/10 text-xs font-bold text-white hover:bg-white/15 mt-1"
                    >
                      Show All Proofs
                    </button>
                  )}
                </div>
              ) : (
                filteredProgressPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3 relative"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={post.userAvatar}
                          alt={post.userName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-white/20"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white">{post.userName}</span>
                            <span className="text-[10px] text-white/40">@{post.userUsername}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold">
                              <Flame className="w-3 h-3 fill-blue-400" />
                              <span>{post.userStreak}d Streak</span>
                            </div>
                            {post.teamName && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 px-2 py-0.2 rounded-md border border-amber-500/30 flex items-center gap-1">
                                <Users className="w-2.5 h-2.5" />
                                <span>{post.teamName}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Day Badge */}
                      <div className="px-2.5 py-1 rounded-full bg-[#2F6FED]/10 border border-[#2F6FED]/30 text-[#2F6FED] font-black text-[10px] uppercase tracking-wider">
                        Day {post.dayNumber}
                      </div>
                    </div>

                    {/* Mandatory Photo Achievement */}
                    <div
                      className="rounded-2xl overflow-hidden border border-white/15 bg-black/60 aspect-video relative group cursor-pointer"
                      onClick={() => setSelectedPhotoPreview(post.imageUrl)}
                    >
                      <img
                        src={post.imageUrl}
                        alt={`Day ${post.dayNumber} progress`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold flex items-center gap-1">
                        <Camera className="w-3 h-3 text-[#2F6FED]" />
                        <span>Receipt Photo</span>
                      </div>
                    </div>

                    {/* Optional Reflection */}
                    {post.text && (
                      <p className="text-xs text-white/90 leading-relaxed font-sans px-1">
                        {post.text}
                      </p>
                    )}

                    {/* Cheer and date footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-white/40">
                      <span>{post.createdAt}</span>
                      <button
                        onClick={() => handleToggleCheer(post.id)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                          post.cheeredByMe
                            ? 'text-amber-400 bg-amber-500/15 font-bold'
                            : 'hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{post.cheersCount || 0} Cheers</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {challengeTab === 'leaderboard' && (
          <ChallengeLeaderboardView challenge={challenge} currentUser={currentUser} />
        )}

        {/* TAB 3: SQUADS (Squad roster, squad creation, find members) */}
        {challengeTab === 'squads' && (
          <div className="space-y-4">
            {/* User Squad Status */}
            {mySquad ? (
              <div className="bg-[#0F0F0F] border border-amber-500/30 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white">{mySquad.name}</h3>
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                          Your Squad
                        </span>
                      </div>
                      {mySquad.motto && (
                        <p className="text-xs text-white/60 italic mt-0.5">"{mySquad.motto}"</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400">
                      {mySquad.totalCheckinsCount || 0}
                    </span>
                    <p className="text-[9px] uppercase font-bold text-white/40">Total Receipts</p>
                  </div>
                </div>

                {/* Squad Members */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-wider">
                      Squad Teammates ({mySquad.members.length}/{mySquad.maxMembers})
                    </span>
                    {mySquad.members.length < mySquad.maxMembers && (
                      <button
                        onClick={() => setIsFindSquadModalOpen(true)}
                        className="text-[11px] font-bold text-[#2F6FED] hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Invite Teammate</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mySquad.members.map((m) => {
                      const isCreator = m.userId === mySquad.leaderId || m.role === 'leader';
                      const isOnline = isMemberOnline(m.userId);
                      return (
                        <div
                          key={m.userId}
                          className={`p-2.5 rounded-2xl border flex items-center gap-2.5 ${
                            m.userId === currentUser.id
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-white/5 border-white/10'
                          }`}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={m.userAvatar}
                              alt={m.userName}
                              referrerPolicy="no-referrer"
                              className={`w-9 h-9 rounded-full object-cover border ${
                                isCreator ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-white/20'
                              }`}
                            />
                            {isCreator && (
                              <span
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border border-black flex items-center justify-center shadow-xs z-10"
                                title="Squad Creator & Leader"
                              >
                                <Crown className="w-2.5 h-2.5 text-black fill-black" />
                              </span>
                            )}
                            {/* Online/Offline Status Indicator on Avatar */}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0A0A0A] ${
                                isOnline
                                  ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                                  : 'bg-zinc-500'
                              }`}
                              title={isOnline ? 'Online / Active now' : 'Offline'}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">
                                {m.userName} {m.userId === currentUser.id && '(You)'}
                              </span>
                              {isCreator && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm shrink-0">
                                  <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                  <span>Leader</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[10px] text-blue-400 font-bold">
                                {m.checkinsCount || 0} receipts
                              </span>
                              <span className="text-white/20 text-[10px]">•</span>
                              <span className="inline-flex items-center gap-1 text-[10px]">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                                  }`}
                                />
                                <span
                                  className={`font-semibold ${
                                    isOnline ? 'text-emerald-400' : 'text-white/40'
                                  }`}
                                >
                                  {isOnline ? 'Active now' : 'Offline'}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Squad Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs flex-wrap gap-2">
                  <button
                    onClick={() => {
                      vibrateLight();
                      setChallengeTab('chat');
                      setChatChannel('squad');
                    }}
                    className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-amber-500/10"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Go to Team Chat</span>
                  </button>

                  <button
                    onClick={handleLeaveSquad}
                    className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    Leave Squad
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-5 shadow-xl space-y-3 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-white">You're not in a squad yet</h3>
                <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                  Find fellow participants or create your own squad to stay accountable and conquer this challenge together!
                </p>
                <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <button
                    onClick={() => {
                      vibrateLight();
                      setIsFindSquadModalOpen(true);
                    }}
                    className="py-2 px-3.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Find Squad Members</span>
                  </button>

                  <button
                    onClick={() => {
                      vibrateLight();
                      setIsCreateSquadOpen(true);
                    }}
                    className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create a Squad</span>
                  </button>
                </div>
              </div>
            )}

            {/* Squads Search & Directory */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>All Active Squads ({challenge.teams?.length || 0})</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFindSquadModalOpen(true)}
                    className="text-xs font-bold text-[#2F6FED] hover:underline flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Find Members</span>
                  </button>
                  <button
                    onClick={() => setIsCreateSquadOpen(true)}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Squad</span>
                  </button>
                </div>
              </div>

              {/* Minimal Squad Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={squadSearchQuery}
                  onChange={(e) => setSquadSearchQuery(e.target.value)}
                  placeholder="Search squads by name or motto..."
                  className="w-full bg-[#111] border border-white/15 focus:border-amber-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>

              {/* Squads List */}
              {(!challenge.teams || challenge.teams.length === 0) ? (
                <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 text-center text-xs text-white/40">
                  No squads created yet. Click "Find Squad Members" or "New Squad" to begin!
                </div>
              ) : (
                challenge.teams
                  .filter((team) => {
                    if (!squadSearchQuery.trim()) return true;
                    const q = squadSearchQuery.toLowerCase().trim();
                    return (
                      team.name.toLowerCase().includes(q) ||
                      (team.motto || '').toLowerCase().includes(q)
                    );
                  })
                  .map((team, idx) => {
                    const isMember = team.members.some((m) => m.userId === currentUser.id);
                    const isFull = team.members.length >= team.maxMembers;

                    return (
                      <div
                        key={team.id}
                        className={`bg-[#0F0F0F] border rounded-3xl p-4 shadow-xl space-y-3 transition-all ${
                          isMember
                            ? 'border-amber-500/40 bg-amber-500/[0.03]'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300 font-black text-sm shrink-0">
                              #{idx + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-black text-white">{team.name}</h4>
                                {isMember && (
                                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.2 rounded-full">
                                    Your Squad
                                  </span>
                                )}
                                {team.leaderName && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                    <span>Leader: {team.leaderName === currentUser.name ? 'You' : team.leaderName}</span>
                                  </span>
                                )}
                              </div>
                              {team.motto && (
                                <p className="text-xs text-white/60 italic mt-0.5 line-clamp-1">
                                  "{team.motto}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-amber-400">
                              {team.totalCheckinsCount || 0}
                            </span>
                            <p className="text-[9px] text-white/40 uppercase font-bold">Receipts</p>
                          </div>
                        </div>

                        {/* Teammates List & Join Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2 overflow-hidden items-center">
                              {team.members.map((m) => {
                                const isCreator = m.userId === team.leaderId || m.role === 'leader';
                                const isOnline = isMemberOnline(m.userId);
                                return (
                                  <div key={m.userId} className="relative group/avatar">
                                    <img
                                      src={m.userAvatar}
                                      alt={m.userName}
                                      referrerPolicy="no-referrer"
                                      className={`w-7 h-7 rounded-full object-cover border-2 ${
                                        isCreator ? 'border-amber-400 ring-1 ring-amber-400/50' : 'border-[#0F0F0F]'
                                      }`}
                                      title={`${m.userName}${isCreator ? ' (Leader/Owner)' : ''} (${isOnline ? 'Online' : 'Offline'} • ${m.checkinsCount || 0} receipts)`}
                                    />
                                    {isCreator && (
                                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border border-black flex items-center justify-center shadow-xs z-10">
                                        <Crown className="w-2 h-2 text-black fill-black" />
                                      </span>
                                    )}
                                    <span
                                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0F0F0F] ${
                                        isOnline ? 'bg-emerald-400' : 'bg-zinc-500'
                                      }`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[11px] text-white/60">
                              {team.members.length}/{team.maxMembers} members
                            </span>
                          </div>

                          {isMember ? (
                            <button
                              onClick={() => {
                                vibrateLight();
                                setChallengeTab('chat');
                                setChatChannel('squad');
                              }}
                              className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs transition-all flex items-center gap-1 border border-amber-500/30"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                              <span>Team Chat</span>
                            </button>
                          ) : !mySquad && !isFull ? (
                            <button
                              onClick={() => handleJoinSquad(team.id)}
                              className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all flex items-center gap-1 shadow-sm"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Join Squad</span>
                            </button>
                          ) : isFull ? (
                            <span className="text-[11px] font-bold text-white/30 px-2 py-1 rounded-lg bg-white/5">
                              Squad Full
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CHAT (Cohort Discussion + Squad Channel) */}
        {challengeTab === 'chat' && (
          <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    {chatChannel === 'squad' && mySquad
                      ? `Squad Chat: ${mySquad.name}`
                      : 'Cohort Discussion Room'}
                  </h3>
                  <p className="text-[10px] text-white/40">
                    {chatChannel === 'squad'
                      ? 'Private squad discussion with your team'
                      : 'Cohort chat with all participants'}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {chatChannel === 'squad' && mySquad
                  ? `${mySquad.members.length} squad members`
                  : `${challenge.participantsCount || 1} online`}
              </span>
            </div>

            {/* Squad vs Cohort Channel Selector */}
            {mySquad && (
              <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setChatChannel('cohort');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    chatChannel === 'cohort'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>🌐 Cohort Discussion</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setChatChannel('squad');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    chatChannel === 'squad'
                      ? 'bg-amber-400 text-black font-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <span>⚔️ {mySquad.name}</span>
                </button>
              </div>
            )}

            {/* Squad Progress Summary Card (Top of Squad Chat) */}
            {chatChannel === 'squad' && mySquad && squadProofStats && (
              <div className="bg-gradient-to-br from-[#161616] to-[#101010] border border-amber-500/25 rounded-2xl p-3.5 space-y-3 shadow-lg shadow-black/50">
                {/* Header Row: Collective Streak + Proofs Submitted */}
                <div className="flex items-center justify-between gap-2.5">
                  {/* Collective Streak */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-white">
                          {squadStreak} {squadStreak === 1 ? 'Day' : 'Days'}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Streak
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 font-medium">Collective Squad Streak</p>
                    </div>
                  </div>

                  {/* Proofs submitted today */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-xs font-mono font-bold text-white">
                        <span className="text-[#2F6FED]">{squadProofStats.submittedCount}</span>
                        <span className="text-white/40">/{squadProofStats.totalMembers}</span>
                      </span>
                      {squadProofStats.allSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Locked In
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                          <Clock className="w-2.5 h-2.5" /> {squadProofStats.totalMembers - squadProofStats.submittedCount} Pending
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/50 font-medium mt-0.5">
                      {squadProofStats.percentage}% submitted proof today
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      squadProofStats.allSubmitted
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-[#2F6FED] to-blue-400'
                    }`}
                    style={{ width: `${Math.max(6, squadProofStats.percentage)}%` }}
                  />
                </div>

                {/* Teammates Status Row (Avatars + Online/Offline + Submitted/Pending) */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {mySquad.members.map((m) => {
                      const isSubmitted = squadProofStats.submittedMembers.some((sm) => sm.userId === m.userId);
                      const isOnline = isMemberOnline(m.userId);
                      return (
                        <div
                          key={m.userId}
                          className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-2 py-1"
                          title={`${m.userName} (${isOnline ? 'Online' : 'Offline'} • ${isSubmitted ? 'Proof submitted today' : 'Proof pending'})`}
                        >
                          <div className="relative shrink-0">
                            <img
                              src={m.userAvatar}
                              alt={m.userName}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full object-cover border border-white/20"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${
                                isOnline ? 'bg-emerald-400 ring-1 ring-emerald-400/40' : 'bg-zinc-500'
                              }`}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-white/90 truncate max-w-[75px]">
                            {m.userId === currentUser.id ? 'You' : m.userName.split(' ')[0]}
                          </span>
                          {isSubmitted ? (
                            <span className="text-[9px] font-bold text-emerald-400 flex items-center" title="Proof submitted today">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-amber-400" title="Proof pending">
                              <Clock className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Contextual Action: Submit Proof or Nudge Squad */}
                  <div className="shrink-0 ml-auto">
                    {!squadProofStats.hasCurrentUserSubmitted ? (
                      <button
                        type="button"
                        onClick={() => {
                          vibrateLight();
                          setIsPostModalOpen(true);
                        }}
                        className="py-1 px-2.5 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-sm active:scale-95"
                      >
                        <Camera className="w-3 h-3" />
                        <span>Submit Proof</span>
                      </button>
                    ) : !squadProofStats.allSubmitted ? (
                      <button
                        type="button"
                        onClick={handleNudgeSquad}
                        className="py-1 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1 transition-all active:scale-95"
                        title="Send accountability reminder to squad chat"
                      >
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Nudge Squad</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>All Verified</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages Feed */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar min-h-[180px]">
              {(chatChannel === 'squad' ? squadMessages : chatMessages).length === 0 ? (
                <div className="py-10 text-center text-white/40 text-xs">
                  {chatChannel === 'squad'
                    ? `No squad messages yet. Say hello to your team in "${mySquad?.name}"!`
                    : 'No messages yet. Say hello and encourage your cohort!'}
                </div>
              ) : (
                (chatChannel === 'squad' ? squadMessages : chatMessages).map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  const senderName = isMe
                    ? 'You'
                    : msg.senderId === 'user_1'
                    ? 'Elena Vance'
                    : msg.senderId === 'user_2'
                    ? 'Marcus Vance'
                    : 'Teammate';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[10px] font-bold text-white/50">{senderName}</span>
                        <span className="text-[9px] text-white/30">{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#2F6FED] text-white rounded-tr-none'
                            : 'bg-white/10 text-white rounded-tl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={
                  chatChannel === 'squad'
                    ? `Message your squad (${mySquad?.name})...`
                    : 'Post a message to cohort...'
                }
                className="flex-1 bg-white/5 border border-white/15 focus:border-[#2F6FED] rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="p-2.5 rounded-2xl bg-[#2F6FED] hover:bg-[#255bd1] text-white disabled:opacity-40 transition-all shadow-md shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* FIND SQUAD MEMBERS & FORM SQUAD MODAL */}
      {isFindSquadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsFindSquadModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0D0D0D] border border-white/15 rounded-[32px] p-6 shadow-2xl text-white space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2F6FED]/15 border border-[#2F6FED]/30 flex items-center justify-center text-[#2F6FED]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Find Squad Members</h3>
                  <p className="text-[10px] text-white/50">
                    Search participants to team up and form an accountability squad
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFindSquadModalOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar (just like the search bar in challenge cohort discussions) */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={squadMemberSearchQuery}
                onChange={(e) => setSquadMemberSearchQuery(e.target.value)}
                placeholder="Search people by name or username to make a squad..."
                className="w-full bg-[#141414] border border-white/15 focus:border-[#2F6FED] rounded-2xl pl-10 pr-8 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none transition-colors"
              />
              {squadMemberSearchQuery && (
                <button
                  onClick={() => setSquadMemberSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar min-h-[200px]">
              {searchResultsUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/40">
                  No users found matching "{squadMemberSearchQuery}".
                </div>
              ) : (
                searchResultsUsers.map((user) => {
                  // Check if user is already in a squad in this challenge
                  const userSquad = (challenge.teams || []).find((t) =>
                    (t.memberIds || []).includes(user.id)
                  );
                  const isUserInMySquad = mySquad && (mySquad.memberIds || []).includes(user.id);

                  return (
                    <div
                      key={user.id}
                      className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white truncate">{user.name}</span>
                            <span className="text-[10px] text-white/40">@{user.username}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/50">
                            <span className="flex items-center gap-1 text-orange-400">
                              <Flame className="w-3 h-3 fill-orange-400" />
                              {user.currentStreak || 0}d streak
                            </span>
                            {userSquad && (
                              <span className="text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 truncate">
                                {userSquad.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isUserInMySquad ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>In Squad</span>
                          </span>
                        ) : invitedUserIds.includes(user.id) ? (
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/15 px-2.5 py-1.5 rounded-xl border border-blue-500/30 flex items-center gap-1.5 shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Invite Sent</span>
                          </span>
                        ) : mySquad ? (
                          mySquad.members.length < mySquad.maxMembers ? (
                            <button
                              onClick={() => handleInviteUserToSquad(user)}
                              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 active:scale-95"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send Invite</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-white/30 font-bold px-2 py-1 rounded-lg bg-white/5">
                              Squad Full
                            </span>
                          )
                        ) : (
                          <button
                            onClick={() => handleInviteUserToSquad(user)}
                            className="py-1.5 px-3 rounded-xl bg-[#2F6FED] hover:bg-[#255bd1] text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send Invite</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsFindSquadModalOpen(false);
                  setIsCreateSquadOpen(true);
                }}
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create squad from scratch</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFindSquadModalOpen(false)}
                className="py-1.5 px-3 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SQUAD MODAL */}
      {isCreateSquadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsCreateSquadOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0D0D0D] border border-amber-500/30 rounded-[32px] p-6 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Create Challenge Squad</h3>
                  <p className="text-[10px] text-white/50">Capacity: Max {challenge.teamSize || 3} members per squad</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateSquadOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {squadTargetUserToInvite && (
              <div className="p-2.5 rounded-xl bg-[#2F6FED]/15 border border-[#2F6FED]/30 text-xs text-white flex items-center gap-2">
                <img
                  src={squadTargetUserToInvite.avatar}
                  alt={squadTargetUserToInvite.name}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span>
                  Teaming up with <strong>{squadTargetUserToInvite.name}</strong>
                </span>
              </div>
            )}

            {squadError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{squadError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSquad} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                  Squad Name *
                </label>
                <input
                  type="text"
                  value={squadNameInput}
                  onChange={(e) => setSquadNameInput(e.target.value)}
                  placeholder="e.g., Code Spartans, Dawn Runners, Iron Duo"
                  maxLength={30}
                  className="w-full bg-[#141414] border border-white/15 focus:border-amber-400 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                  Squad Motto / Goal (Optional)
                </label>
                <input
                  type="text"
                  value={squadMottoInput}
                  onChange={(e) => setSquadMottoInput(e.target.value)}
                  placeholder="e.g., No zero days. Ship daily."
                  maxLength={60}
                  className="w-full bg-[#141414] border border-white/15 focus:border-amber-400 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <Crown className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  You will become the <strong>Squad Leader</strong>. Other cohort members can join until your team reaches the limit of <strong>{challenge.teamSize || 3} members</strong>.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSquadOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!squadNameInput.trim()}
                  className="flex-1 py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all shadow-md shadow-amber-400/20 disabled:opacity-40"
                >
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POST PROOF MODAL */}
      {isPostModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsPostModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0D0D0D] border border-white/15 rounded-[32px] p-6 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#2F6FED]/15 border border-[#2F6FED]/30 flex items-center justify-center text-[#2F6FED]">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Submit Day {daysCompleted + 1} Progress Proof
                  </h3>
                  <p className="text-[10px] text-white/50">Verifiable photo receipt required</p>
                </div>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {photoError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProgress} className="space-y-4">
              {/* Photo Upload or Preset Preview */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  Achievement Receipt Photo *
                </label>

                {postPhotoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 aspect-video group">
                    <img
                      src={postPhotoUrl}
                      alt="Achievement Proof Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPostPhotoUrl('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-white/20 hover:border-[#2F6FED] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-white/[0.02]">
                      <Camera className="w-6 h-6 text-[#2F6FED]" />
                      <div className="text-center">
                        <span className="text-xs font-bold text-white block">
                          Upload Photo Receipt
                        </span>
                        <span className="text-[10px] text-white/40">
                          Click to select image file from your device
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] text-white/40">Or use a sample proof:</span>
                      <button
                        type="button"
                        onClick={() => setShowPresets(!showPresets)}
                        className="text-[10px] font-bold text-[#2F6FED] hover:underline"
                      >
                        {showPresets ? 'Hide presets' : 'Browse sample receipts'}
                      </button>
                    </div>

                    {showPresets && (
                      <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in">
                        {SAMPLE_ACHIEVEMENTS.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectPresetPhoto(item.url)}
                            className="rounded-xl overflow-hidden border border-white/15 bg-black cursor-pointer group hover:border-[#2F6FED] transition-all relative aspect-video"
                          >
                            <img
                              src={item.url}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-1 bg-black/70 text-[9px] font-bold text-white truncate text-center">
                              {item.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Optional Text Reflection */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1">
                  Daily Notes & Reflection (Optional)
                </label>
                <textarea
                  value={postReflection}
                  onChange={(e) => setPostReflection(e.target.value)}
                  placeholder="What was completed today? Any takeaways or metrics?"
                  rows={3}
                  className="w-full bg-[#141414] border border-white/15 focus:border-[#2F6FED] rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!postPhotoUrl || isSubmitting}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#2F6FED] hover:bg-[#255bd1] text-white font-black text-xs transition-all shadow-md shadow-[#2F6FED]/25 disabled:opacity-40"
                >
                  {isSubmitting ? 'Posting...' : 'Submit Daily Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DAY PROOF DETAIL VIEW MODAL */}
      {selectedDayProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedDayProof(null)}
        >
          <div
            className="w-full max-w-sm bg-[#0D0D0D] border border-white/15 rounded-3xl p-5 shadow-2xl text-white space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#2F6FED]">
                  Day {selectedDayProof.dayNumber} Proof Receipt
                </span>
              </div>
              <button
                onClick={() => setSelectedDayProof(null)}
                className="p-1 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/20 aspect-video">
              <img
                src={selectedDayProof.imageUrl}
                alt="Day Proof"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {selectedDayProof.text && (
              <p className="text-xs text-white/80 leading-relaxed font-sans">
                {selectedDayProof.text}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-white/40">
              <span>{selectedDayProof.createdAt}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified Receipt
              </span>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE CHALLENGE CONFIRMATION MODAL */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-[#0D0D0D] border border-white/15 rounded-3xl p-5 shadow-2xl text-white space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-black text-sm text-white">Leave {challenge.title}?</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                You can browse as an observer or rejoin anytime.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleJoin}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md"
              >
                Leave Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PHOTO ZOOM MODAL */}
      {selectedPhotoPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPhotoPreview(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPhotoPreview(null)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/80 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedPhotoPreview}
              alt="Proof full view"
              referrerPolicy="no-referrer"
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
