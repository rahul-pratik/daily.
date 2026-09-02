import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Flame,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Users,
  Trophy,
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Heart,
  Send,
  AlertCircle,
  LogOut,
  Check,
  Award,
  X,
  Layers,
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  Share2,
  Hourglass,
  Flag,
  UserPlus,
  Shield,
  Crown,
  Plus,
  Target,
} from 'lucide-react';
import { User, Challenge, ChallengeProgressPost, Message, ChallengeTeam } from '../types';
import { DailyStorageService, getTodayDateString } from '../services/storage';
import { vibrateLight, vibrateSuccess, vibrateStreakMilestone } from '../services/haptics';

interface ChallengeProgressScreenProps {
  challenge: Challenge;
  currentUser: User;
  onBack: () => void;
  onChallengeUpdated: (updatedChallenge: Challenge) => void;
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
}) => {
  const [challenge, setChallenge] = useState<Challenge>(initialChallenge);
  const [challengeTab, setChallengeTab] = useState<'proofs' | 'squads' | 'chat'>('proofs');
  const [progressPosts, setProgressPosts] = useState<ChallengeProgressPost[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
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

  // Squad / Team management states
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState(false);
  const [squadNameInput, setSquadNameInput] = useState('');
  const [squadMottoInput, setSquadMottoInput] = useState('');
  const [squadError, setSquadError] = useState<string | null>(null);

  // Load progress posts and challenge chat messages
  useEffect(() => {
    const posts = DailyStorageService.getAllChallengeProgressPosts(challenge.id);
    setProgressPosts(posts);
    const msgs = DailyStorageService.getChallengeMessages(challenge.id);
    setChatMessages(msgs);
  }, [challenge.id]);

  const userProgress = DailyStorageService.getChallengeUserProgress(challenge.id, currentUser.id);
  const today = getTodayDateString();
  const isJoined = (challenge.participantIds || []).includes(currentUser.id);
  const isGroupChallenge = challenge.challengeType === 'group';
  const mySquad = userProgress.userTeam;

  // Calculate countdown days remaining
  const daysCompleted = userProgress.daysCompleted;
  const totalDays = challenge.durationDays || 30;
  const remainingDays = Math.max(0, totalDays - daysCompleted);

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

    vibrateSuccess();
    setChallenge(result.challenge);
    onChallengeUpdated(result.challenge);
    setSquadNameInput('');
    setSquadMottoInput('');
    setSquadError(null);
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
    const result = DailyStorageService.leaveChallengeTeam(challenge.id);
    setChallenge(result.challenge);
    onChallengeUpdated(result.challenge);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPostPhotoUrl(reader.result);
          setPhotoError(null);
          setShowPresets(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitProgress = (e: React.FormEvent) => {
    e.preventDefault();

    // PHOTO IS MANDATORY: "either only photo or both photo and text, no only text, say user insert a photo as as your achievement"
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
    const newMsg = DailyStorageService.sendChallengeTextMessage(challenge.id, chatInputText.trim());
    setChatMessages((prev) => [...prev, newMsg]);
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

  const percentComplete = Math.min(100, Math.round((daysCompleted / totalDays) * 100));


  return (
    <div className="w-full min-h-screen bg-[#050505] text-white flex flex-col pb-24 animate-in fade-in duration-200">
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
          {isJoined && (
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="text-[11px] font-bold text-white/50 hover:text-red-400 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-[11px] font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
            <Trophy className="w-3.5 h-3.5" />
            <span>{totalDays} Days</span>
          </div>
        </div>
      </div>

      {/* Main Challenge Content */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        {/* Challenge Hero Information Card */}
        <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-3xl shrink-0 shadow-lg">
              {challenge.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[10px] font-black text-[#D4AF37] uppercase tracking-wider">
                  #{challenge.tag || challenge.category}
                </span>
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
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

          {/* Participants bar & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1.5 text-white/60">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="font-bold text-white">
                {(challenge.participantsCount || 1).toLocaleString()}
              </span>
              <span>participants</span>
            </div>

            {!isJoined ? (
              <button
                onClick={handleToggleJoin}
                className="py-2 px-4 rounded-xl bg-[#D4AF37] hover:bg-[#e5c158] text-black font-black text-xs transition-all shadow-md shadow-[#D4AF37]/25 flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Join Challenge</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/30">
                <Check className="w-3.5 h-3.5" />
                <span>Joined</span>
              </div>
            )}
          </div>
        </div>

        {/* VISUAL 30-DAY DAY-BY-DAY PROGRESS TRACKER & COUNTDOWN */}
        {isJoined && (
          <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-5 shadow-xl space-y-4">
            {/* Header with Title and Countdown */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Flame className="w-3.5 h-3.5 fill-blue-400" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    {totalDays}-Day Progress Tracker
                  </h3>
                </div>
                <p className="text-[10px] text-white/40 mt-0.5">
                  Tap any completed day to view its proof receipt
                </p>
              </div>

              {/* Remaining Duration Countdown Pill */}
              <div className="text-right">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black">
                  <Hourglass className="w-3.5 h-3.5 animate-pulse" />
                  <span>{remainingDays} Days Left</span>
                </div>
                <div className="text-[9px] text-white/40 mt-0.5 font-bold">
                  {deadlineDaysLeft}d until {challenge.deadlineDate}
                </div>
              </div>
            </div>

            {/* Visual Progress Stats Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] via-amber-400 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/50 font-bold">
                <span>Day 1</span>
                <span className="text-[#D4AF37] font-black">{daysCompleted} of {totalDays} Completed ({percentComplete}%)</span>
                <span>Day {totalDays} 🏁</span>
              </div>
            </div>

            {/* Visual Day-by-Day Matrix (30-Day Window Grid) */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                  30-Day Window Tracker:
                </span>
                <div className="flex items-center gap-2 text-[9px] text-white/40">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded bg-blue-600 inline-block" /> Completed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded border border-[#D4AF37] inline-block" /> Target
                  </span>
                </div>
              </div>

              {/* Day cells matrix */}
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {Array.from({ length: totalDays }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isChecked = dayNum <= daysCompleted;
                  const isCurrentTarget = dayNum === daysCompleted + 1 && !userProgress.isCompleted;
                  const isMilestone = [7, 14, 21, 30].includes(dayNum);
                  const postForDay = getProgressPostForDay(dayNum);

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => handleDayClick(dayNum)}
                      className={`h-10 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all border relative cursor-pointer ${
                        isChecked
                          ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-500/25 hover:scale-105 active:scale-95'
                          : isCurrentTarget
                          ? 'bg-[#D4AF37]/15 border-2 border-[#D4AF37] text-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 hover:scale-105 animate-pulse'
                          : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 hover:text-white/60'
                      }`}
                      title={
                        isChecked
                          ? `Day ${dayNum} Completed - Click to view proof`
                          : isCurrentTarget
                          ? `Day ${dayNum} (Today's Target) - Click to post proof`
                          : `Day ${dayNum} - ${remainingDays} days left`
                      }
                    >
                      {isChecked ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                          <span className="text-[8px] font-black text-white/90 leading-none">D{dayNum}</span>
                        </>
                      ) : isCurrentTarget ? (
                        <>
                          <span className="text-[9px] font-black text-[#D4AF37] leading-none">{dayNum}</span>
                          <span className="text-[7px] font-bold text-[#D4AF37] uppercase leading-none mt-0.5">Now</span>
                        </>
                      ) : (
                        <>
                          <span>{dayNum}</span>
                          {isMilestone && (
                            <span className="w-1 h-1 rounded-full bg-white/40 absolute top-1 right-1" />
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Countdown Milestone Progress & Status Actions */}
            <div className="pt-3 border-t border-white/10">
              {userProgress.isCompleted ? (
                /* 30 DAYS OVER / COMPLETED STATE */
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-blue-400 font-black text-sm">
                    <Award className="w-5 h-5" />
                    <span>🎉 Challenge Completed! ({totalDays}/{totalDays} Days)</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    You have tracked all {totalDays} days of this challenge! Posting is now closed. You can continue viewing other cohort members' proofs or leave the group whenever you wish.
                  </p>
                  <button
                    onClick={() => setShowLeaveConfirm(true)}
                    className="mt-1 text-xs font-bold text-red-400 hover:text-red-300 underline"
                  >
                    Leave Challenge Group
                  </button>
                </div>
              ) : userProgress.hasPostedToday ? (
                /* TODAY ALREADY LOGGED */
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-300">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>
                      <strong>Day {daysCompleted} proof logged!</strong> Return tomorrow for Day {daysCompleted + 1}.
                    </span>
                  </div>
                  <span className="text-[10px] text-white/40 font-bold">
                    {remainingDays}d countdown active
                  </span>
                </div>
              ) : (
                /* ACTIVE POST PROOF BUTTON (Golden Theme) */
                <button
                  onClick={() => {
                    vibrateLight();
                    setIsPostModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#D4AF37] hover:bg-[#e5c158] text-black font-black text-xs transition-all shadow-lg shadow-[#D4AF37]/25 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <Camera className="w-4 h-4 text-black" />
                  <span>Post Day {daysCompleted + 1} Progress Proof</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Challenge Section Switcher: Photo Proofs vs Squads vs Text-Only Cohort Chat */}
        <div className="flex items-center gap-1.5 bg-[#0F0F0F] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => {
              vibrateLight();
              setChallengeTab('proofs');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              challengeTab === 'proofs'
                ? 'bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Proofs ({progressPosts.length})</span>
          </button>

          {isGroupChallenge && (
            <button
              onClick={() => {
                vibrateLight();
                setChallengeTab('squads');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                challengeTab === 'squads'
                  ? 'bg-amber-400 text-black font-black shadow-md shadow-amber-400/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squads ({challenge.teams?.length || 0})</span>
            </button>
          )}

          <button
            onClick={() => {
              vibrateLight();
              setChallengeTab('chat');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              challengeTab === 'chat'
                ? 'bg-white text-black font-black shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat ({chatMessages.length})</span>
          </button>
        </div>

        {/* Tab 1: Cohort Progress Proofs Feed */}
        {challengeTab === 'proofs' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{isGroupChallenge ? 'Squad & Cohort Proofs' : 'Cohort Member Proofs'} ({progressPosts.length})</span>
              </h2>
              <span className="text-[10px] text-white/40">Photo receipts mandatory</span>
            </div>

            {progressPosts.length === 0 ? (
              <div className="bg-[#0F0F0F] border border-white/10 rounded-2xl p-8 text-center space-y-2">
                <Camera className="w-8 h-8 text-white/30 mx-auto" />
                <p className="text-xs font-bold text-white/80">No progress proofs posted yet</p>
                <p className="text-[11px] text-white/40">
                  Be the first to post your daily achievement photo!
                </p>
              </div>
            ) : (
              progressPosts.map((post) => (
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
                    <div className="px-2.5 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] font-black text-[10px] uppercase tracking-wider">
                      Day {post.dayNumber} of {totalDays}
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
                      <Camera className="w-3 h-3 text-[#D4AF37]" />
                      <span>Receipt Photo</span>
                    </div>
                  </div>

                  {/* Optional Reflection */}
                  {post.text && (
                    <p className="text-xs text-white/90 leading-relaxed font-sans px-1">
                      {post.text}
                    </p>
                  )}

                  {/* Footer: Cheers & Time */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <span className="text-[10px] text-white/40">{post.createdAt}</span>

                    <button
                      onClick={() => handleToggleCheer(post.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all min-h-[32px] ${
                        post.cheeredByMe
                          ? 'bg-[#D4AF37] text-black font-black shadow-md shadow-[#D4AF37]/25'
                          : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>👏</span>
                      <span>{post.cheersCount}</span>
                      <span className="text-[10px] opacity-80">{post.cheeredByMe ? 'Cheered' : 'Cheer'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Squads & Teams Management (for Group Challenges) */}
        {challengeTab === 'squads' && isGroupChallenge && (
          <div className="space-y-4 pt-1">
            {/* My Squad Card */}
            {mySquad ? (
              <div className="bg-[#0F0F0F] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-[#0F0F0F] to-[#0F0F0F]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>My Squad</span>
                      </span>
                      <span className="text-[10px] text-white/50">
                        {mySquad.members.length}/{mySquad.maxMembers} Members
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white">{mySquad.name}</h3>
                    {mySquad.motto && (
                      <p className="text-xs text-white/70 italic">"{mySquad.motto}"</p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-amber-400">{mySquad.totalCheckinsCount || 0}</span>
                    <p className="text-[9px] uppercase font-bold text-white/40">Total Receipts</p>
                  </div>
                </div>

                {/* Squad Members */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-wider">
                    Squad Teammates ({mySquad.members.length}/{mySquad.maxMembers})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mySquad.members.map((m) => (
                      <div
                        key={m.userId}
                        className={`p-2.5 rounded-2xl border flex items-center gap-2.5 ${
                          m.userId === currentUser.id
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <img
                          src={m.userAvatar}
                          alt={m.userName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-white/20"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white truncate">
                              {m.userName} {m.userId === currentUser.id && '(You)'}
                            </span>
                            {m.role === 'leader' && (
                              <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-blue-400 font-bold">
                            {m.checkinsCount || 0} receipts posted
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="text-[10px] text-white/40">
                    Posting progress automatically logs receipts for {mySquad.name}
                  </span>
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
                  Join an open squad below or create your own squad to conquer this {challenge.durationDays}-day challenge together!
                </p>
                <button
                  onClick={() => {
                    vibrateLight();
                    setIsCreateSquadOpen(true);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all shadow-md shadow-amber-400/20 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create a Squad (Max {challenge.teamSize || 3})</span>
                </button>
              </div>
            )}

            {/* Squads Leaderboard / Roster */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>All Active Squads ({challenge.teams?.length || 0})</span>
                </h3>
                <button
                  onClick={() => {
                    vibrateLight();
                    setIsCreateSquadOpen(true);
                  }}
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Squad</span>
                </button>
              </div>

              {(!challenge.teams || challenge.teams.length === 0) ? (
                <div className="p-6 rounded-2xl bg-[#0F0F0F] border border-white/10 text-center text-xs text-white/40">
                  No squads created yet. Be the first squad leader!
                </div>
              ) : (
                challenge.teams.map((team, idx) => {
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
                          <div className="flex -space-x-2 overflow-hidden">
                            {team.members.map((m) => (
                              <img
                                key={m.userId}
                                src={m.userAvatar}
                                alt={m.userName}
                                referrerPolicy="no-referrer"
                                className="w-7 h-7 rounded-full object-cover border-2 border-[#0F0F0F]"
                                title={`${m.userName} (${m.checkinsCount} receipts)`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-white/60">
                            {team.members.length}/{team.maxMembers} members
                          </span>
                        </div>

                        {!isMember && !mySquad && !isFull && (
                          <button
                            onClick={() => handleJoinSquad(team.id)}
                            className="py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition-all flex items-center gap-1 shadow-sm"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Join Squad</span>
                          </button>
                        )}

                        {!isMember && isFull && (
                          <span className="text-[11px] font-bold text-white/30 px-2 py-1 rounded-lg bg-white/5">
                            Squad Full
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Cohort Live Text-Only Chat (No photos allowed in chat) */}
        {challengeTab === 'chat' && (
          <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Cohort Discussion Room
                  </h3>
                  <p className="text-[10px] text-white/40">
                    Text-only chat • Pure words & accountability (no images)
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {challenge.participantsCount || 1} online
              </span>
            </div>

            {/* Chat message feed */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 no-scrollbar min-h-[160px]">
              {chatMessages.length === 0 ? (
                <div className="py-8 text-center text-white/40 text-xs">
                  No messages yet. Say hello and encourage your cohort!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <div className="flex items-center gap-1.5 px-1">
                        <span className="text-[10px] font-bold text-white/50">
                          {isMe ? 'You' : msg.senderId === 'user_1' ? 'Elena Vance' : msg.senderId === 'user_2' ? 'Marcus Vance' : 'Cohort Member'}
                        </span>
                        <span className="text-[9px] text-white/30">{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-[#D4AF37] text-black font-medium rounded-tr-sm shadow-md'
                            : 'bg-white/10 text-white rounded-tl-sm border border-white/10'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Text-Only Input Bar (No Photo Upload in this chat section) */}
            {isJoined ? (
              <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="text"
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  placeholder="Send a text message to cohort members..."
                  className="flex-1 px-4 py-2.5 bg-white/5 border border-white/15 focus:border-[#D4AF37] rounded-xl text-xs text-white placeholder-white/35 outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInputText.trim()}
                  className="p-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#e0be48] text-black font-black transition-all disabled:opacity-40 shadow-md min-w-[40px] flex items-center justify-center"
                  title="Send Text Message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center text-xs text-white/50">
                Join this challenge to participate in the text-only discussion room.
              </div>
            )}
          </div>
        )}

      </div>

      {/* POST PROGRESS MODAL (Photo is MANDATORY) */}
      {isPostModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsPostModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0D0D0D] border border-white/15 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white my-auto max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#D4AF37]" />
                  Log Day {daysCompleted + 1} Progress
                </h3>
                <p className="text-[10px] text-white/50">{challenge.title}</p>
              </div>

              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProgress} className="flex-1 overflow-y-auto space-y-4 py-3.5 pr-1">
              {/* Photo Requirement Notice */}
              <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl text-xs text-[#D4AF37] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span className="leading-relaxed text-white/90">
                  <strong className="text-[#D4AF37]">Photo proof is mandatory:</strong> Please insert a photo as your achievement (photo only, or photo + text reflection).
                </span>
              </div>

              {photoError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Photo Proof Box */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Achievement Photo Proof *</span>
                  <button
                    type="button"
                    onClick={() => setShowPresets(!showPresets)}
                    className="text-xs text-[#D4AF37] hover:underline font-bold lowercase flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {showPresets ? 'hide presets' : 'sample receipts'}
                  </button>
                </label>

                {postPhotoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 aspect-video bg-black/40">
                    <img
                      src={postPhotoUrl}
                      alt="Achievement Proof"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPostPhotoUrl('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="border-2 border-dashed border-white/15 hover:border-[#D4AF37]/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center">
                      <Upload className="w-5 h-5 text-[#D4AF37]" />
                      <span className="text-xs font-semibold text-white">Upload Photo</span>
                      <span className="text-[10px] text-white/40">Required proof</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="border-2 border-dashed border-white/15 hover:border-[#D4AF37]/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center">
                      <Camera className="w-5 h-5 text-[#D4AF37]" />
                      <span className="text-xs font-semibold text-white">Camera Snap</span>
                      <span className="text-[10px] text-white/40">Live snapshot</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Presets */}
                {showPresets && !postPhotoUrl && (
                  <div className="mt-2 p-2.5 bg-black/40 border border-white/10 rounded-2xl">
                    <p className="text-[10px] text-white/50 font-bold mb-2 uppercase">
                      Select a sample achievement photo:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {SAMPLE_ACHIEVEMENTS.map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => {
                            vibrateLight();
                            setPostPhotoUrl(item.url);
                            setPhotoError(null);
                            setShowPresets(false);
                          }}
                          className="relative rounded-xl overflow-hidden border border-white/10 aspect-video group text-left hover:border-[#D4AF37]"
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100"
                          />
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-black/80 px-1 py-0.5 rounded">
                            {item.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Text Reflection */}
              <div>
                <label className="block text-[11px] font-bold text-white/70 uppercase tracking-wider mb-1.5">
                  Reflection / Notes (Optional)
                </label>
                <textarea
                  value={postReflection}
                  onChange={(e) => setPostReflection(e.target.value)}
                  placeholder="Notes on what you accomplished, obstacles, or lessons..."
                  rows={3}
                  className="w-full bg-[#141414] border border-white/15 focus:border-[#D4AF37] rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Submit Button (Golden Theme) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!postPhotoUrl || isSubmitting}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 min-h-[44px] ${
                    postPhotoUrl
                      ? 'bg-[#D4AF37] hover:bg-[#e5c158] text-black shadow-[#D4AF37]/25 hover:scale-[1.01]'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-black" />
                  <span>Submit Day {daysCompleted + 1} Achievement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLICKED DAY PROOF DETAIL MODAL */}
      {selectedDayProof && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedDayProof(null)}
        >
          <div
            className="w-full max-w-md bg-[#0D0D0D] border border-white/15 rounded-[32px] p-5 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xs">
                  D{selectedDayProof.dayNumber}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">
                    Day {selectedDayProof.dayNumber} Verified Proof
                  </h4>
                  <span className="text-[10px] text-white/40">{selectedDayProof.createdAt}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayProof(null)}
                className="p-1.5 rounded-full text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedDayProof.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/15 aspect-video bg-black/60">
                <img
                  src={selectedDayProof.imageUrl}
                  alt={`Day ${selectedDayProof.dayNumber}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {selectedDayProof.text && (
              <p className="text-xs text-white/90 leading-relaxed font-sans">
                {selectedDayProof.text}
              </p>
            )}

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-blue-400 font-bold text-[11px]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified Achievement</span>
              </div>
              <button
                onClick={() => setSelectedDayProof(null)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                Close
              </button>
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
                You can browse as an observer or rejoin anytime. {userProgress.isCompleted && 'Note: Completed challenges remain in read-only mode if you rejoin.'}
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
                Leave Group
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
    </div>
  );
};
