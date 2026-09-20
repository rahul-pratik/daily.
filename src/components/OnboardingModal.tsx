import React, { useState } from 'react';
import {
  Flame,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  Mail,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  User as UserIcon,
} from 'lucide-react';
import { User, AVAILABLE_INTERESTS, DEFAULT_USER_AVATAR } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (updatedUser: Partial<User>) => void;
  initialUser: User;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialUser,
}) => {
  // Steps: 1 = Create Profile, 2 = Interests, 3 = Login / Auth
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Profile data
  const [name, setName] = useState(initialUser.name || '');
  const [username, setUsername] = useState(initialUser.username || '');
  const [avatar, setAvatar] = useState(initialUser.avatar || DEFAULT_USER_AVATAR);
  const [hasCustomAvatar, setHasCustomAvatar] = useState(
    Boolean(initialUser.avatar && initialUser.avatar !== DEFAULT_USER_AVATAR)
  );
  const [bio, setBio] = useState(initialUser.bio || '');

  // Interests data
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    initialUser.interests && initialUser.interests.length > 0
      ? initialUser.interests
      : ['Coding', 'AI & Tech', 'Fitness & Gym']
  );

  // Auth screen credentials state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleInterest = (interest: string) => {
    vibrateLight();
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      vibrateLight();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
          setHasCustomAvatar(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefaultAvatar = () => {
    vibrateLight();
    setAvatar(DEFAULT_USER_AVATAR);
    setHasCustomAvatar(false);
  };

  // Finalize onboarding after authenticating with selected credentials
  const handleAuthComplete = (provider: 'google' | 'apple' | 'email', userEmail?: string) => {
    vibrateStreakMilestone();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'creator';
    const finalEmail = userEmail || `${cleanUsername}@dailyapp.io`;

    onComplete({
      name: name.trim() || 'Daily Creator',
      username: cleanUsername,
      avatar: avatar || DEFAULT_USER_AVATAR,
      bio: bio.trim() || 'Showing the daily receipts & staying consistent 🔥',
      interests: selectedInterests.length > 0 ? selectedInterests : ['Coding', 'AI & Tech'],
      habits: initialUser.habits || ['Build Daily', 'Exercise', 'Read 20 min'],
      email: finalEmail,
      authProvider: provider,
    });
  };

  // Google Sign-In Handler
  const handleGoogleLogin = () => {
    setAuthError(null);
    setAuthLoading('google');
    vibrateLight();
    setTimeout(() => {
      setAuthLoading(null);
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
      handleAuthComplete('google', `${cleanUsername}@gmail.com`);
    }, 600);
  };

  // Apple Sign-In Handler
  const handleAppleLogin = () => {
    setAuthError(null);
    setAuthLoading('apple');
    vibrateLight();
    setTimeout(() => {
      setAuthLoading(null);
      const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || 'user';
      handleAuthComplete('apple', `${cleanUsername}@privaterelay.appleid.com`);
    }, 600);
  };

  // Email Sign-In / Sign-Up Handler
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!email.trim() || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setAuthLoading('email');
    vibrateLight();
    setTimeout(() => {
      setAuthLoading(null);
      handleAuthComplete('email', email.trim());
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#2F6FED] fill-[#2F6FED]" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider text-white/50">
              Welcome to Daily
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-[#2F6FED]'
                    : s < step
                    ? 'w-3 bg-[#2F6FED]/50'
                    : 'w-3 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* =================================================================== */}
        {/* STEP 1: CREATE PROFILE SCREEN                                       */}
        {/* =================================================================== */}
        {step === 1 && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div>
              <h2 className="text-xl font-black text-white">Create your profile</h2>
              <p className="text-xs text-white/50 mt-1">
                Add your details and photo to begin tracking your daily proofs.
              </p>
            </div>

            {/* Avatar picker - User adds own photo or keeps default */}
            <div className="flex flex-col items-center py-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-xl ring-2 ring-[#2F6FED]/30 bg-black/60 flex items-center justify-center">
                  <img
                    src={avatar}
                    alt="Avatar Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <label
                  htmlFor="onboarding-avatar-file"
                  className="absolute bottom-0 right-0 p-2 bg-[#2F6FED] hover:bg-blue-600 border-2 border-[#0A0A0A] rounded-full text-white cursor-pointer shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
                  title="Upload your photo"
                >
                  <Upload className="w-4 h-4" />
                  <input
                    id="onboarding-avatar-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <label
                  htmlFor="onboarding-avatar-btn"
                  className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#2F6FED]" />
                  {hasCustomAvatar ? 'Change Photo' : 'Upload Your Photo'}
                  <input
                    id="onboarding-avatar-btn"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {hasCustomAvatar && (
                  <button
                    type="button"
                    onClick={handleResetToDefaultAvatar}
                    className="text-xs font-medium px-3 py-1.5 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset to Default
                  </button>
                )}
              </div>
              <p className="text-[10px] text-white/40 mt-1.5">
                {hasCustomAvatar ? 'Custom photo added' : 'Using default avatar (you can upload anytime)'}
              </p>
            </div>

            {/* Name input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Full Name <span className="text-[#2F6FED]">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors"
              />
            </div>

            {/* Username input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Username <span className="text-[#2F6FED]">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-white/40 text-xs font-mono">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alexrivera"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Bio input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                Short Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What are you building, practicing, or improving daily?"
                rows={2}
                maxLength={140}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors resize-none"
              />
              <span className="text-[10px] font-mono text-white/30 block text-right mt-0.5">
                {bio.length}/140
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                vibrateLight();
                setStep(2);
              }}
              disabled={!name.trim() || !username.trim()}
              className="w-full mt-2 py-3 rounded-2xl bg-[#2F6FED] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.99] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#2F6FED]/20"
            >
              Continue to Interests <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: WHAT ARE YOUR INTERESTS SCREEN                              */}
        {/* =================================================================== */}
        {step === 2 && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="mb-3 shrink-0">
              <h2 className="text-xl font-black text-white">What are your interests?</h2>
              <p className="text-xs text-white/50 mt-1">
                Select topics you want to see in your daily feed and track proofs for.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1.5 -mr-1.5 my-1">
              <div className="flex flex-wrap gap-2 py-1">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-[#2F6FED] text-white border-[#2F6FED] shadow-md shadow-[#2F6FED]/20 scale-105'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 mt-2 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setStep(1);
                }}
                className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setStep(3);
                }}
                disabled={selectedInterests.length === 0}
                className="w-2/3 py-3 rounded-2xl bg-[#2F6FED] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.99] transition-all disabled:opacity-30 shadow-lg shadow-[#2F6FED]/20"
              >
                Continue to Sign In <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: AUTH / LOGIN SCREEN (GOOGLE, APPLE, EMAIL)                  */}
        {/* =================================================================== */}
        {step === 3 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pr-1">
            {/* Identity Summary Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={avatar}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">{name}</span>
                  <span className="text-[10px] text-white/50 font-mono block truncate">
                    @{username.toLowerCase()}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2F6FED]/20 text-[#2F6FED] border border-[#2F6FED]/30 shrink-0">
                {selectedInterests.length} {selectedInterests.length === 1 ? 'topic' : 'topics'}
              </span>
            </div>

            <div className="mb-3 shrink-0">
              <h2 className="text-xl font-black text-white">Sign in to Daily</h2>
              <p className="text-xs text-white/50 mt-0.5">
                Authenticate your account to sync streaks and connect with the community.
              </p>
            </div>

            {authError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {authError}
              </div>
            )}

            {/* Quick Provider Credentials: Google & Apple */}
            <div className="space-y-2 shrink-0">
              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={!!authLoading}
                className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {authLoading === 'google' ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Apple Login Button */}
              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={!!authLoading}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#141416] hover:bg-[#1f1f24] border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {authLoading === 'apple' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.8-12-14.28-6.19-9.35-11.1-20.02-14.73-32.01-3.63-11.99-5.45-23.3-5.45-33.93 0-14.89 3.81-27.12 11.43-36.68 7.62-9.56 17.03-14.44 28.23-14.65 4.35 0 9.4 1.15 15.15 3.45 5.75 2.3 9.4 3.52 10.96 3.66 2.01 0 5.86-1.28 11.55-3.83 5.69-2.56 10.6-3.72 14.73-3.48 10.45.64 19.14 4.89 26.08 12.75-9.35 5.66-13.92 13.62-13.72 23.88.2 10.45 4.35 18.94 12.45 25.48 4.02 3.35 8.52 5.75 13.5 7.2-2.12 6.53-4.58 13.06-7.38 19.59zM119.22 33.72c0-7.39 2.68-14.32 8.04-20.78 5.36-6.46 12.06-10.45 20.1-11.94.13 1.13.2 2.12.2 2.98 0 7.39-2.82 14.49-8.46 21.3-5.64 6.81-12.44 10.63-20.4 11.46-.39-1.02-.58-2.03-.58-3.02z" />
                  </svg>
                )}
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3 shrink-0">
              <div className="h-[1px] bg-white/10 flex-1" />
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                or with email
              </span>
              <div className="h-[1px] bg-white/10 flex-1" />
            </div>

            {/* Email & Password Credentials Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-3.5 h-3.5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-3.5 h-3.5 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 chars)"
                    className="w-full pl-9 pr-9 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-white/40 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                  className="text-[#2F6FED] hover:underline font-medium"
                >
                  {authMode === 'signin'
                    ? "New to Daily? Create account"
                    : 'Already have an account? Sign in'}
                </button>
              </div>

              <button
                type="submit"
                disabled={!!authLoading || !email.trim() || !password}
                className="w-full py-3 rounded-2xl bg-[#2F6FED] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.99] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#2F6FED]/20 cursor-pointer"
              >
                {authLoading === 'email' ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{authMode === 'signin' ? 'Sign In & Enter Daily' : 'Create Account & Enter Daily'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Back Button */}
            <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setStep(2);
                }}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Interests
              </button>

              <span className="text-[10px] text-white/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Secure credentials
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
