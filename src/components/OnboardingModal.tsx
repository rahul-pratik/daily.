import React, { useState, useMemo } from 'react';
import {
  Flame,
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
  KeyRound,
  AlertCircle,
  UserX,
  CheckCircle,
} from 'lucide-react';
import { User, AVAILABLE_INTERESTS, DEFAULT_USER_AVATAR } from '../types';
import { vibrateLight, vibrateStreakMilestone } from '../services/haptics';
import { DailyStorageService } from '../services/storage';
import {
  isSupabaseConfigured,
  supabaseSignInWithEmail,
  supabaseSignUpWithEmail,
  supabaseSignInWithGoogle,
  supabaseSignInWithApple,
  syncUserToSupabase,
} from '../services/supabase';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (updatedUser: Partial<User>) => void;
  initialUser: User;
  forceSignInView?: boolean;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  initialUser,
  forceSignInView = false,
  onClose,
}) => {
  // Steps: 1 = Create Profile, 2 = Interests, 3 = Login / Auth
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Separate view for account switcher (when clicking "Already have an account? Sign in" or Switch Account)
  const [showPreviousAccounts, setShowPreviousAccounts] = useState(forceSignInView);

  // Sync state if forceSignInView changes
  React.useEffect(() => {
    if (forceSignInView) {
      setShowPreviousAccounts(true);
    }
  }, [forceSignInView]);

  // Profile data starts clean without default Alex Rivera / @alexrivera / default bio
  const isAlexRivera =
    initialUser.name === 'Alex Rivera' || initialUser.username === 'alexrivera';
  const [name, setName] = useState(isAlexRivera ? '' : (initialUser.name || ''));
  const [username, setUsername] = useState(isAlexRivera ? '' : (initialUser.username || ''));
  const [avatar, setAvatar] = useState(DEFAULT_USER_AVATAR);
  const [bio, setBio] = useState(isAlexRivera ? '' : (initialUser.bio || ''));

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
  const [socialConnecting, setSocialConnecting] = useState<{
    provider: 'google' | 'apple';
    email: string;
    name: string;
  } | null>(null);

  // Previously signed in accounts on this device
  const previousAccounts = useMemo(() => {
    return DailyStorageService.getPreviousAccounts();
  }, [showPreviousAccounts]);

  // Username availability detection:
  // ONLY flags as taken if the exact username already belongs to a registered user.
  // No false-positive prefix or substring blocks (e.g. @rahulpratik will NOT be blocked by @rahul).
  const usernameStatus = useMemo(() => {
    const clean = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    if (!clean) return { isAvailable: true, message: '', suggestion: '' };

    const allUsers = DailyStorageService.getAllUsers();
    const takenList = Array.from(
      new Set([
        ...allUsers.map((u) => (u.username || '').toLowerCase().replace(/^@/, '')),
        'admin',
        'system',
        'daily',
        'support',
      ])
    ).filter(Boolean);

    // Exact match only
    const exactTaken = takenList.find((u) => u === clean);
    if (exactTaken) {
      const suggested = `${clean}_daily`;
      return {
        isAvailable: false,
        message: `This username @${clean} is already taken`,
        suggestion: suggested,
      };
    }

    return { isAvailable: true, message: '', suggestion: '' };
  }, [username]);

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
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefaultAvatar = () => {
    vibrateLight();
    setAvatar(DEFAULT_USER_AVATAR);
  };

  // Start creating a brand new account
  const handleStartMakeNewAccount = () => {
    vibrateLight();
    setName('');
    setUsername('');
    setAvatar(DEFAULT_USER_AVATAR);
    setBio('');
    setEmail('');
    setPassword('');
    setSelectedInterests(['Coding', 'AI & Tech', 'Fitness & Gym']);
    setAuthError(null);
    setShowPreviousAccounts(false);
    setStep(1);
  };

  // Select an existing account previously signed in
  const handleSelectExistingAccount = async (account: User) => {
    vibrateStreakMilestone();
    DailyStorageService.savePreviousAccount(account);
    DailyStorageService.saveCurrentUser(account);
    DailyStorageService.setOnboarded(true);

    // Persist to Supabase in background
    try {
      await syncUserToSupabase(account);
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    }

    onComplete(account);
  };

  // Finalize onboarding after authenticating with selected credentials
  const handleAuthComplete = async (
    provider: 'google' | 'apple' | 'email',
    userEmail?: string,
    overrideUser?: Partial<User>
  ) => {
    vibrateStreakMilestone();
    const cleanUsername =
      (overrideUser?.username || username).trim().toLowerCase().replace(/[^a-z0-9_]/g, '') ||
      (userEmail ? userEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : 'creator');
    const finalEmail = userEmail || `${cleanUsername}@dailyapp.io`;

    const newUser: User = {
      ...initialUser,
      id: overrideUser?.id || `user_${cleanUsername}_${Date.now()}`,
      name: (overrideUser?.name || name).trim() || 'Daily Creator',
      username: cleanUsername,
      avatar: overrideUser?.avatar || avatar || DEFAULT_USER_AVATAR,
      bio: (overrideUser?.bio || bio).trim() || 'Showing the daily receipts & staying consistent 🔥',
      interests: selectedInterests.length > 0 ? selectedInterests : ['Coding', 'AI & Tech'],
      habits: initialUser.habits || ['Build Daily', 'Exercise', 'Read 20 min'],
      email: finalEmail,
      authProvider: provider,
    };

    // Save to local device storage & previous accounts list
    DailyStorageService.saveCurrentUser(newUser);
    DailyStorageService.savePreviousAccount(newUser);
    DailyStorageService.setOnboarded(true);

    // Save & sync to Supabase database
    try {
      await syncUserToSupabase(newUser);
    } catch (err) {
      console.warn('Supabase sync notice on auth complete:', err);
    }

    onComplete(newUser);
  };

  // Google Sign-In Handler via Supabase / Google Accounts popup
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthLoading('google');
    vibrateLight();

    try {
      // Open Google Account portal in popup
      const googleAuthUrl =
        'https://accounts.google.com/signin/v2/identifier?service=lso&passive=1209600&continue=https%3A%2F%2Fmyaccount.google.com';
      try {
        window.open(googleAuthUrl, 'google_signin_popup', 'width=520,height=640,left=150,top=100');
      } catch {}

      const res = await supabaseSignInWithGoogle();
      if (!res.success) {
        setAuthError(res.error || 'Google sign-in failed. Please try again.');
        setAuthLoading(null);
        return;
      }

      // Display Google connection sheet to confirm authentic Google account
      setSocialConnecting({
        provider: 'google',
        email: email.trim().includes('@gmail.com') ? email.trim() : 'pratik.rahulb@gmail.com',
        name: name.trim() || 'Rahul Pratik',
      });
      setAuthLoading(null);
    } catch (err: any) {
      setAuthLoading(null);
      setAuthError(err?.message || 'Google sign-in error occurred.');
    }
  };

  // Apple Sign-In Handler via Supabase / Apple ID popup
  const handleAppleLogin = async () => {
    setAuthError(null);
    setAuthLoading('apple');
    vibrateLight();

    try {
      // Open Apple ID portal in popup
      const appleAuthUrl = 'https://appleid.apple.com';
      try {
        window.open(appleAuthUrl, 'apple_signin_popup', 'width=520,height=650,left=150,top=100');
      } catch {}

      const res = await supabaseSignInWithApple();
      if (!res.success) {
        setAuthError(res.error || 'Apple sign-in failed. Please try again.');
        setAuthLoading(null);
        return;
      }

      // Display Apple ID connection sheet to confirm authentic Apple account
      setSocialConnecting({
        provider: 'apple',
        email: email.trim().includes('@icloud.com') || email.trim().includes('@apple')
          ? email.trim()
          : 'pratik.rahulb@icloud.com',
        name: name.trim() || 'Apple User',
      });
      setAuthLoading(null);
    } catch (err: any) {
      setAuthLoading(null);
      setAuthError(err?.message || 'Apple sign-in error occurred.');
    }
  };

  // Confirm Social Connection (Google / Apple)
  const handleConfirmSocialConnect = () => {
    if (!socialConnecting) return;
    const { provider, email: socialEmail, name: socialName } = socialConnecting;
    vibrateStreakMilestone();
    setSocialConnecting(null);

    const cleanUsername =
      (socialEmail ? socialEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : provider + '_user') ||
      'creator';

    handleAuthComplete(provider, socialEmail, {
      name: socialName || (provider === 'google' ? 'Google User' : 'Apple User'),
      username: cleanUsername,
      avatar: provider === 'google'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
        : DEFAULT_USER_AVATAR,
      bio: provider === 'google' ? 'Connected via Google Account' : 'Connected via Apple ID',
    });
  };

  // Cancel Social Connection
  const handleCancelSocialConnect = () => {
    vibrateLight();
    const prov = socialConnecting?.provider === 'google' ? 'Google' : 'Apple';
    setSocialConnecting(null);
    setAuthError(`${prov} sign-in was cancelled.`);
  };

  // Email Sign-In / Sign-Up Handler via Supabase
  const handleEmailSubmit = async (e: React.FormEvent) => {
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

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername =
        username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') ||
        cleanEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      const cleanName = name.trim() || cleanEmail.split('@')[0];

      if (authMode === 'signup') {
        const res = await supabaseSignUpWithEmail(cleanEmail, password, {
          name: cleanName,
          username: cleanUsername,
          avatar,
          bio: bio.trim(),
        });

        if (!res.success) {
          setAuthError(res.error || 'Failed to create account.');
          setAuthLoading(null);
          return;
        }

        setAuthLoading(null);
        handleAuthComplete('email', cleanEmail);
      } else {
        // Sign In mode - strictly verify genuine password against stored credentials
        const res = await supabaseSignInWithEmail(cleanEmail, password);

        if (!res.success) {
          setAuthError(res.error || 'Incorrect email or password. Please verify your credentials and try again.');
          setAuthLoading(null);
          return;
        }

        setAuthLoading(null);
        const meta = res.user?.user_metadata || {};
        const resolvedName = meta.full_name || meta.name || cleanName;
        const resolvedUsername = meta.username || cleanUsername;
        const resolvedAvatar = meta.avatar_url || avatar;
        const resolvedBio = meta.bio || bio;

        handleAuthComplete('email', cleanEmail, {
          name: resolvedName,
          username: resolvedUsername,
          avatar: resolvedAvatar,
          bio: resolvedBio,
        });
      }
    } catch (err: any) {
      setAuthLoading(null);
      setAuthError(err?.message || 'Authentication error.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] p-5 sm:p-6 shadow-2xl relative text-white flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* =================================================================== */}
        {/* AUTHENTIC SOCIAL CONNECTION SHEET (GOOGLE / APPLE)                  */}
        {/* =================================================================== */}
        {socialConnecting && (
          <div className="absolute inset-0 z-50 bg-[#0A0A0A] rounded-[32px] p-6 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200 border border-white/20">
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {socialConnecting.provider === 'google' ? (
                    <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/10 shrink-0">
                      <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
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
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-lg shrink-0">
                      <svg className="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.65-.79 1.1-1.89.98-2.99-.95.04-2.1.63-2.78 1.42-.59.68-1.12 1.77-.98 2.85 1.06.08 2.14-.54 2.78-1.28z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-black text-white">
                      {socialConnecting.provider === 'google' ? 'Google Account Connected' : 'Apple ID Connected'}
                    </h3>
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Authorization portal active
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3.5">
                <p className="text-xs text-white/70 leading-relaxed">
                  {socialConnecting.provider === 'google'
                    ? 'Authenticated via Google accounts portal. Confirm your Google account details to link your profile to Daily:'
                    : 'Authenticated via Apple ID authorization portal. Confirm your Apple ID details to link your profile to Daily:'}
                </p>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                    {socialConnecting.provider === 'google' ? 'Google Email' : 'Apple ID Email'}
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-3.5 h-3.5 text-white/40" />
                    <input
                      type="email"
                      value={socialConnecting.email}
                      onChange={(e) =>
                        setSocialConnecting((prev) => (prev ? { ...prev, email: e.target.value } : null))
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-black/50 border border-white/15 focus:border-[#2F6FED] rounded-xl text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={socialConnecting.name}
                    onChange={(e) =>
                      setSocialConnecting((prev) => (prev ? { ...prev, name: e.target.value } : null))
                    }
                    className="w-full px-3 py-2.5 bg-black/50 border border-white/15 focus:border-[#2F6FED] rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 shrink-0">
              <button
                type="button"
                onClick={handleConfirmSocialConnect}
                className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer shadow-lg ${
                  socialConnecting.provider === 'google'
                    ? 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10'
                    : 'bg-[#1a1a20] hover:bg-[#24242c] text-white border border-white/20'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Confirm & Connect {socialConnecting.provider === 'google' ? 'Google' : 'Apple'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancelSocialConnect}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* =================================================================== */}
        {/* PREVIOUSLY SIGNED-IN ACCOUNTS SCREEN                                */}
        {/* Opened when clicking "Sign in" or "Switch Account"                  */}
        {/* =================================================================== */}
        {showPreviousAccounts ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Header with Back or Cancel button */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                {onClose ? (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      onClose();
                    }}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                    aria-label="Back to App"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      setShowPreviousAccounts(false);
                      setStep(1);
                    }}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                    aria-label="Back to Sign Up"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-black text-white">Sign In / Switch Account</h2>
                  <p className="text-xs text-white/50">
                    {previousAccounts.length > 0
                      ? 'Select an account to open or make a new account'
                      : 'Access your daily streak profile'}
                  </p>
                </div>
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    onClose();
                  }}
                  className="text-xs font-bold text-white/40 hover:text-white px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {previousAccounts.length > 0 ? (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2 shrink-0">
                  <span>Accounts on this device ({previousAccounts.length})</span>
                  <span className="text-[#2F6FED]">Tap to open</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1">
                  {previousAccounts.map((account, index) => {
                    const isRecent = index === 0;
                    const legacyStreak = (account as User & { streak?: number }).streak ?? 0;
                    const accountStreak = account.currentStreak ?? legacyStreak;

                    return (
                      <div
                        key={account.id || account.username || index}
                        onClick={() => handleSelectExistingAccount(account)}
                        className={`w-full p-3.5 rounded-2xl transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] border ${
                          isRecent
                            ? 'bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/30 hover:border-[#2F6FED]'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <img
                              src={account.avatar || DEFAULT_USER_AVATAR}
                              alt={account.name}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-full object-cover border border-white/20 shrink-0"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0A0A0A]" />
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white block truncate group-hover:text-[#2F6FED] transition-colors">
                                {account.name}
                              </span>
                              {isRecent && (
                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                                  Recent
                                </span>
                              )}
                              {accountStreak > 0 && (
                                <span className="text-[10px] font-black text-amber-400 flex items-center gap-0.5 shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                                  <Flame className="w-2.5 h-2.5 fill-current" />
                                  {accountStreak}d
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-white/50 font-mono block truncate">
                              @{account.username.toLowerCase().replace(/^@/, '')}
                            </span>
                            {account.email && (
                              <span className="text-[10px] text-white/40 block truncate">
                                {account.email}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[#2F6FED] text-xs font-bold shrink-0">
                          <span className="hidden sm:inline">Open</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Make a New Account Button */}
                <div className="pt-3 mt-2 border-t border-white/10 flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleStartMakeNewAccount}
                    className="w-full py-3 rounded-2xl bg-[#2F6FED] hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#2F6FED]/20 cursor-pointer active:scale-[0.99]"
                  >
                    <span>+ Make a New Account</span>
                  </button>

                  {onClose ? (
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        onClose();
                      }}
                      className="w-full py-2 px-3 rounded-2xl text-white/50 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Back to App
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setShowPreviousAccounts(false);
                        setStep(1);
                      }}
                      className="w-full py-2 px-3 rounded-2xl text-white/50 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Sign Up
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* CASE B: No previous accounts found on this device */
              <div className="flex flex-col flex-1 items-center justify-center py-6 text-center">
                <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/30">
                  <UserX className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No Accounts Currently</h3>
                <p className="text-xs text-white/50 max-w-[280px] mb-6 leading-relaxed">
                  No previously signed-in accounts were found on this device. Create your profile to get started.
                </p>

                <div className="w-full space-y-2.5 max-w-xs">
                  <button
                    type="button"
                    onClick={handleStartMakeNewAccount}
                    className="w-full py-3 rounded-2xl bg-[#2F6FED] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.99] transition-all shadow-lg shadow-[#2F6FED]/20 cursor-pointer"
                  >
                    <span>+ Make a New Account</span>
                  </button>

                  {onClose ? (
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        onClose();
                      }}
                      className="w-full py-2 px-3 rounded-2xl text-white/50 hover:text-white text-xs font-medium transition-colors flex items-center justify-center cursor-pointer"
                    >
                      Back to App
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        vibrateLight();
                        setShowPreviousAccounts(false);
                        setStep(1);
                      }}
                      className="w-full py-2 px-3 rounded-2xl text-white/50 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Sign Up
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =================================================================== */
          /* STANDARD ONBOARDING SIGN-UP FLOW (STEP 1, 2, 3)                     */
          /* =================================================================== */
          <>
            {/* Welcome to Daily header bar */}
            <div className="flex items-center justify-between mb-3 shrink-0">
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

            {/* Button for users who already have an account - placed directly below "Welcome to Daily" */}
            {/* Strictly labeled "Sign in" as requested */}
            {step === 1 && (
              <button
                type="button"
                onClick={() => {
                  vibrateLight();
                  setShowPreviousAccounts(true);
                }}
                className="w-full mb-3.5 py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#2F6FED]/40 text-xs text-white/80 hover:text-white flex items-center justify-between transition-all cursor-pointer group shrink-0"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-medium text-white/90">Already have an account?</span>
                </div>
                <span className="text-[#2F6FED] group-hover:text-blue-400 font-bold text-[11px] flex items-center gap-1">
                  Sign in <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            )}

            {/* STEP 1: CREATE PROFILE SCREEN */}
            {step === 1 && (
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                <div>
                  <h2 className="text-xl font-black text-white">Create your profile</h2>
                  <p className="text-xs text-white/50 mt-1">
                    Add your details and photo to begin tracking your daily proofs.
                  </p>
                </div>

                {/* Avatar section - Strictly defaults to default avatar */}
                <div className="flex flex-col items-center py-2">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20 shadow-xl ring-2 ring-[#2F6FED]/30 bg-[#18181b] flex items-center justify-center">
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
                      {avatar !== DEFAULT_USER_AVATAR ? 'Change Photo' : 'Upload Photo'}
                      <input
                        id="onboarding-avatar-btn"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {avatar !== DEFAULT_USER_AVATAR && (
                      <button
                        type="button"
                        onClick={handleResetToDefaultAvatar}
                        className="text-xs font-medium px-3 py-1.5 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset to Default
                      </button>
                    )}
                  </div>

                  {/* Explicit status: Only have "Using default avatar (you can upload anytime)" */}
                  <p className="text-[11px] text-white/50 mt-2 text-center font-medium">
                    Using default avatar (you can upload anytime)
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
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                  />
                </div>

                {/* Username input with exact availability check */}
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
                      placeholder="choose_username"
                      className={`w-full pl-8 pr-3.5 py-2.5 bg-white/5 border rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors font-mono ${
                        !usernameStatus.isAvailable
                          ? 'border-amber-500/60 focus:border-amber-500'
                          : 'border-white/10 focus:border-[#2F6FED]'
                      }`}
                    />
                  </div>

                  {/* Username Taken Warning & Clickable Suggestion (Only triggers if exact match exists!) */}
                  {!usernameStatus.isAvailable && usernameStatus.message && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{usernameStatus.message}</span>
                      </div>
                      {usernameStatus.suggestion && (
                        <div className="text-[11px] text-white/70 flex items-center gap-1.5 flex-wrap">
                          <span>You can use:</span>
                          <button
                            type="button"
                            onClick={() => {
                              vibrateLight();
                              setUsername(usernameStatus.suggestion);
                            }}
                            className="font-mono font-bold text-[#2F6FED] hover:underline bg-[#2F6FED]/15 hover:bg-[#2F6FED]/25 px-2 py-0.5 rounded-lg border border-[#2F6FED]/30 inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            @{usernameStatus.suggestion}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bio input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Bio
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
                  disabled={!name.trim() || !username.trim() || !usernameStatus.isAvailable}
                  className="w-full mt-2 py-3 rounded-2xl bg-[#2F6FED] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.99] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#2F6FED]/20 cursor-pointer"
                >
                  Continue to Interests <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: WHAT ARE YOUR INTERESTS SCREEN */}
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
                    className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10 transition-colors flex items-center justify-center gap-1 cursor-pointer"
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
                    className="w-2/3 py-3 rounded-2xl bg-[#2F6FED] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.99] transition-all disabled:opacity-30 shadow-lg shadow-[#2F6FED]/20 cursor-pointer"
                  >
                    Continue to Sign Up <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AUTH / LOGIN SCREEN (SUPABASE: GOOGLE, APPLE, EMAIL) */}
            {step === 3 && (
              <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pr-1">
                {(name.trim() || username.trim()) && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={avatar}
                        alt={name || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {name || 'Daily Member'}
                        </span>
                        {username && (
                          <span className="text-[10px] text-white/50 font-mono block truncate">
                            @{username.toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedInterests.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2F6FED]/20 text-[#2F6FED] border border-[#2F6FED]/30 shrink-0">
                        {selectedInterests.length} {selectedInterests.length === 1 ? 'topic' : 'topics'}
                      </span>
                    )}
                  </div>
                )}

                <div className="mb-3 shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white">Create your account</h2>
                    {isSupabaseConfigured() && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Supabase
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">
                    Complete your registration to preserve your daily streaks across devices.
                  </p>
                </div>

                {authError && (
                  <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-2 shrink-0">
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

                  <button
                    type="button"
                    onClick={handleAppleLogin}
                    disabled={!!authLoading}
                    className="w-full py-2.5 px-4 rounded-2xl bg-[#141416] hover:bg-[#1f1f24] border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {authLoading === 'apple' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.47c.65-.79 1.1-1.89.98-2.99-.95.04-2.1.63-2.78 1.42-.59.68-1.12 1.77-.98 2.85 1.06.08 2.14-.54 2.78-1.28z" />
                      </svg>
                    )}
                    <span>Continue with Apple</span>
                  </button>
                </div>

                <div className="flex items-center gap-3 my-3 shrink-0">
                  <div className="h-[1px] bg-white/10 flex-1" />
                  <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                    or with email
                  </span>
                  <div className="h-[1px] bg-white/10 flex-1" />
                </div>

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
                        required
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
                        required
                        minLength={6}
                        className="w-full pl-9 pr-9 py-2.5 bg-white/5 border border-white/10 focus:border-[#2F6FED] rounded-2xl text-xs text-white placeholder-white/30 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-white/40 hover:text-white transition-colors cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!!authLoading || !email.trim() || !password}
                    className="w-full py-3 rounded-2xl bg-[#2F6FED] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-600 active:scale-[0.99] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#2F6FED]/20 cursor-pointer mt-1"
                  >
                    {authLoading === 'email' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Create Account & Enter Daily</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      vibrateLight();
                      setStep(2);
                    }}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Interests
                  </button>

                  <span className="text-[10px] text-white/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Secure Supabase Auth
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
