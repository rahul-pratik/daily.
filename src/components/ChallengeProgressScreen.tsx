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
  ThumbsUp,
  Share2,
} from 'lucide-react';
import { User, Challenge, ChallengeProgressPost } from '../types';
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
  const [progressPosts, setProgressPosts] = useState<ChallengeProgressPost[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postPhotoUrl, setPostPhotoUrl] = useState('');
  const [postReflection, setPostReflection] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);

  // Load progress posts
  useEffect(() => {
    const posts = DailyStorageService.getAllChallengeProgressPosts(challenge.id);
    setProgressPosts(posts);
  }, [challenge.id]);

  const userProgress = DailyStorageService.getChallengeUserProgress(challenge.id, currentUser.id);
  const today = getTodayDateString();
  const isJoined = (challenge.participantIds || []).includes(currentUser.id);

  // Handle joining / leaving challenge
  const handleToggleJoin = () => {
    vibrateLight();
    const result = DailyStorageService.toggleJoinChallenge(challenge.id);
    setChallenge(result.challenge);
    onChallengeUpdated(result.challenge);
    setShowLeaveConfirm(false);
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

  const handleToggleCheer = (postId: string) => {
    vibrateLight();
    const updated = DailyStorageService.toggleCheerChallengePost(postId);
    setProgressPosts(updated.filter((p) => p.challengeId === challenge.id));
  };

  const percentComplete = Math.min(100, Math.round((userProgress.daysCompleted / challenge.durationDays) * 100));

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

          <div className="flex items-center gap-1 text-[11px] font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2.5 py-1 rounded-full border border-[#D4AF37]/20">
            <Trophy className="w-3.5 h-3.5" />
            <span>{challenge.durationDays} Days</span>
          </div>
        </div>
      </div>

      {/* Challenge Hero Information Card */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-3xl shrink-0 shadow-lg">
              {challenge.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[10px] font-black text-blue-400 uppercase tracking-wider">
                  #{challenge.tag || challenge.category}
                </span>
                <span className="text-[10px] text-white/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
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
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-bold text-white">
                {(challenge.participantsCount || 1).toLocaleString()}
              </span>
              <span>participants</span>
            </div>

            {!isJoined ? (
              <button
                onClick={handleToggleJoin}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5"
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

        {/* User's 30-Day (or Total Duration) Progress Tracker */}
        {isJoined && (
          <div className="bg-[#0F0F0F] border border-white/15 rounded-3xl p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Your Challenge Journey
                </h3>
              </div>
              <div className="text-xs font-black text-[#D4AF37]">
                {userProgress.daysCompleted} / {challenge.durationDays} Days Tracked
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-[#D4AF37] to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/40 font-bold">
                <span>Day 1</span>
                <span>{percentComplete}% Completed</span>
                <span>Day {challenge.durationDays}</span>
              </div>
            </div>

            {/* Visual Days Grid (interactive preview of all duration days) */}
            <div className="pt-2">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">
                Day-by-Day Milestone Grid:
              </p>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                {Array.from({ length: challenge.durationDays }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const isChecked = dayNum <= userProgress.daysCompleted;
                  return (
                    <div
                      key={dayNum}
                      className={`h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold transition-all border ${
                        isChecked
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37]/60 text-[#D4AF37] shadow-sm'
                          : 'bg-white/5 border-white/10 text-white/30'
                      }`}
                      title={`Day ${dayNum}`}
                    >
                      {isChecked ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <span>{dayNum}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STATUS & POST ACTION LOGIC */}
            <div className="pt-3 border-t border-white/10">
              {userProgress.isCompleted ? (
                /* 30 DAYS OVER / COMPLETED STATE */
                <div className="p-3.5 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-[#D4AF37] font-black text-sm">
                    <Award className="w-5 h-5" />
                    <span>🎉 Challenge Completed! ({challenge.durationDays}/{challenge.durationDays} Days)</span>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed">
                    You have tracked all {challenge.durationDays} days of this challenge! Posting is now closed. You can continue browsing other members' progress or leave the group whenever you wish.
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
                      <strong>Day {userProgress.daysCompleted} proof logged!</strong> Return tomorrow for Day {userProgress.daysCompleted + 1}.
                    </span>
                  </div>
                </div>
              ) : (
                /* ACTIVE POST PROOF BUTTON */
                <button
                  onClick={() => {
                    vibrateLight();
                    setIsPostModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <Camera className="w-4 h-4" />
                  <span>Post Day {userProgress.daysCompleted + 1} Progress Proof</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cohort Progress Proofs Feed */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Cohort Member Proofs ({progressPosts.length})</span>
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
                      <div className="flex items-center gap-1 text-[10px] text-[#D4AF37] font-bold">
                        <Flame className="w-3 h-3 fill-[#D4AF37]" />
                        <span>{post.userStreak}d Streak</span>
                      </div>
                    </div>
                  </div>

                  {/* Day Badge */}
                  <div className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black text-[10px] uppercase tracking-wider">
                    Day {post.dayNumber} of {challenge.durationDays}
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all min-h-[32px] ${
                      post.cheeredByMe
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
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
                  <Camera className="w-4 h-4 text-blue-400" />
                  Log Day {userProgress.daysCompleted + 1} Progress
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
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs text-blue-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Photo proof is mandatory:</strong> Please insert a photo as your achievement (photo only, or photo + text reflection).
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
                    className="text-xs text-blue-400 hover:underline font-bold lowercase flex items-center gap-1"
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
                    <label className="border-2 border-dashed border-white/15 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all text-center">
                      <Upload className="w-5 h-5 text-blue-400" />
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
                          className="relative rounded-xl overflow-hidden border border-white/10 aspect-video group text-left hover:border-blue-500"
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
                  className="w-full bg-[#141414] border border-white/15 focus:border-blue-500 rounded-2xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!postPhotoUrl || isSubmitting}
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 min-h-[44px] ${
                    postPhotoUrl
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25 hover:scale-[1.01]'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Submit Day {userProgress.daysCompleted + 1} Achievement</span>
                </button>
              </div>
            </form>
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
    </div>
  );
};
