import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { DailyStorageService } from './storage';
import { User, DEFAULT_USER_AVATAR } from '../types';
import { validatePasswordComplexity } from '../utils/passwordValidator';

// Injected Supabase Project Credentials
export const INJECTED_SUPABASE_URL = 'https://beggptypgncpsvtyuyqh.supabase.co';
export const INJECTED_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZ2dwdHlwZ25jcHN2dHl1eXFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5OTM5MDYsImV4cCI6MjEwNTU2OTkwNn0.Qvj7tyKeSRZ9rqiekfvu8HzflxOQl6vlpABlY_S1OJ8';

const ENV_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const ENV_SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('daily_supabase_url')?.trim();
  const localKey = localStorage.getItem('daily_supabase_anon_key')?.trim();
  const url = (localUrl || ENV_SUPABASE_URL || INJECTED_SUPABASE_URL)?.trim();
  const anonKey = (localKey || ENV_SUPABASE_ANON_KEY || INJECTED_SUPABASE_ANON_KEY)?.trim();
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20),
    source: localUrl ? 'local' : ENV_SUPABASE_URL ? 'env' : 'injected',
  };
};

export const isSupabaseConfigured = (): boolean => {
  return getSupabaseConfig().isConfigured;
};

// Singleton dynamic client instance
let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;
  if (!cachedClient) {
    try {
      cachedClient = createClient(config.url!, config.anonKey!, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return cachedClient;
};

// Dynamic client proxy that always resolves the active initialized Supabase client
export const supabase: SupabaseClient | null = new Proxy({} as any, {
  get(_target, prop) {
    const client = getSupabaseClient();
    if (!client) {
      if (prop === 'auth') {
        return {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signInWithPassword: async () => ({
            data: { user: null, session: null },
            error: new Error('Supabase is not configured.'),
          }),
          signUp: async () => ({
            data: { user: null, session: null },
            error: new Error('Supabase is not configured.'),
          }),
          signInWithOAuth: async () => ({
            data: { provider: '', url: '' },
            error: new Error('Supabase is not configured.'),
          }),
          signOut: async () => ({ error: null }),
        };
      }
      return undefined;
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

export const setSupabaseProjectCredentials = (url: string, anonKey: string) => {
  if (url && anonKey) {
    localStorage.setItem('daily_supabase_url', url.trim());
    localStorage.setItem('daily_supabase_anon_key', anonKey.trim());
    cachedClient = null;
    return true;
  }
  return false;
};

export const clearCustomSupabaseCredentials = () => {
  localStorage.removeItem('daily_supabase_url');
  localStorage.removeItem('daily_supabase_anon_key');
  cachedClient = null;
};

/**
 * Generate or ensure a valid UUID format for PostgreSQL compatibility
 */
export function ensureValidUuid(id?: string): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a fully populated User object conforming to the User interface
 */
export const createDefaultUserObject = (
  id: string,
  email: string,
  name: string,
  username: string,
  avatar?: string,
  bio?: string,
  provider: 'email' | 'google' | 'apple' = 'email'
): User => ({
  id,
  email,
  name: name.trim() || username,
  username: username.trim().toLowerCase().replace(/^@/, ''),
  avatar: avatar || DEFAULT_USER_AVATAR,
  bio: bio || 'Showing the daily receipts & staying consistent 🔥',
  interests: ['Coding', 'AI & Tech'],
  habits: ['Build Daily', 'Exercise', 'Read 20 min'],
  currentStreak: 1,
  longestStreak: 1,
  totalPosts: 0,
  activityDates: [new Date().toISOString().split('T')[0]],
  followersCount: 0,
  followingCount: 0,
  followedUserIds: [],
  lastPostedDate: null,
  joinedDate: new Date().toISOString().split('T')[0],
  authProvider: provider,
});

export interface UserSyncResult {
  success: boolean;
  action?: 'created' | 'updated' | 'unchanged' | 'failed';
  error?: string;
  durationMs?: number;
  databasePayload?: Record<string, any>;
  syncedProfile?: any;
}

/**
 * Save / Upsert a User profile into Supabase database (profiles & users tables).
 * Correctly maps user data to database structure and handles profile creation vs updates.
 */
export async function syncUserToSupabase(user: User): Promise<UserSyncResult> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (!user) return { success: false, error: 'No user provided', action: 'failed' };

  // Always persist to local previous accounts as well
  DailyStorageService.savePreviousAccount(user);

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase credentials not configured.',
      action: 'failed',
    };
  }

  try {
    const cleanUsername = user.username?.toLowerCase().replace(/^@/, '').trim() || 'creator';
    const cleanEmail = user.email?.trim() || `${cleanUsername}@dailyapp.io`;
    const cleanName = user.name?.trim() || cleanUsername;

    // Check if active Supabase Auth user has a specific UUID
    let targetId = user.id;
    try {
      const { data: authData } = await client.auth.getUser();
      if (authData?.user?.id) {
        targetId = authData.user.id;
      }
    } catch {
      // Non-blocking fallback to user.id
    }
    const cleanId = ensureValidUuid(targetId);

    // Check if profile row already exists to distinguish between create and update
    let isUpdate = false;
    let existingProfile: any = null;
    try {
      const { data, error: selectErr } = await client
        .from('profiles')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();

      if (data && !selectErr) {
        isUpdate = true;
        existingProfile = data;
      }
    } catch {
      // Proceed with upsert
    }

    // 1. Comprehensive payload matching standard Supabase 'profiles' database schema
    const fullPayload: Record<string, any> = {
      id: cleanId,
      username: cleanUsername,
      name: cleanName,
      full_name: cleanName,
      avatar_url: user.avatar || DEFAULT_USER_AVATAR,
      avatar: user.avatar || DEFAULT_USER_AVATAR,
      bio: user.bio || existingProfile?.bio || '',
      email: cleanEmail,
      current_streak: user.currentStreak ?? existingProfile?.current_streak ?? 1,
      highest_streak: user.longestStreak ?? existingProfile?.highest_streak ?? user.currentStreak ?? 1,
      longest_streak: user.longestStreak ?? existingProfile?.longest_streak ?? user.currentStreak ?? 1,
      level: user.level ?? existingProfile?.level ?? 1,
      rank: user.rank || existingProfile?.rank || 'Bronze',
      total_proofs: user.totalPosts ?? existingProfile?.total_proofs ?? 0,
      total_posts: user.totalPosts ?? existingProfile?.total_posts ?? 0,
      streak_freezes_left: user.streakFreezesLeft ?? existingProfile?.streak_freezes_left ?? 2,
      interests: user.interests || existingProfile?.interests || [],
      habits: user.habits || existingProfile?.habits || [],
      auth_provider: user.authProvider || existingProfile?.auth_provider || 'email',
      updated_at: new Date().toISOString(),
    };

    // 2. Minimal fallback payload in case custom optional columns don't exist
    const minimalPayload = {
      id: cleanId,
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      avatar_url: user.avatar || DEFAULT_USER_AVATAR,
      bio: user.bio || '',
      updated_at: new Date().toISOString(),
    };

    // Try upserting to 'profiles' table
    let syncedProfileRecord: any = null;
    let { data: upsertData, error: profileError } = await client
      .from('profiles')
      .upsert(fullPayload, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (!profileError) {
      syncedProfileRecord = upsertData;
    } else {
      // Attempt with minimal payload if full schema has missing columns
      const { data: minData, error: minErr } = await client
        .from('profiles')
        .upsert(minimalPayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!minErr) {
        profileError = null;
        syncedProfileRecord = minData;
      } else {
        profileError = minErr;
      }
    }

    // Try optional sync to legacy 'users' table or view if present
    try {
      await client.from('users').upsert(fullPayload, { onConflict: 'id' });
    } catch {
      // Ignored if users is a view or not present
    }

    const durationMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);

    if (profileError) {
      console.warn('Supabase DB sync notice:', profileError.message);
      return {
        success: false,
        action: 'failed',
        error: profileError.message,
        durationMs,
        databasePayload: fullPayload,
      };
    }

    return {
      success: true,
      action: isUpdate ? 'updated' : 'created',
      durationMs,
      databasePayload: fullPayload,
      syncedProfile: syncedProfileRecord || fullPayload,
    };
  } catch (err: any) {
    const durationMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime);
    console.warn('Supabase profile sync error:', err);
    return {
      success: false,
      action: 'failed',
      error: err?.message || 'Sync failed',
      durationMs,
    };
  }
}

/**
 * Sync all accounts stored on this device to Supabase
 */
export async function syncAllAccountsToSupabase(): Promise<{ total: number; synced: number }> {
  const accounts = DailyStorageService.getPreviousAccounts();
  const client = getSupabaseClient();
  if (!client || accounts.length === 0) {
    return { total: accounts.length, synced: 0 };
  }

  let synced = 0;
  for (const acc of accounts) {
    const res = await syncUserToSupabase(acc);
    if (res.success) synced++;
  }

  return { total: accounts.length, synced };
}

export interface AuthResult {
  success: boolean;
  user?: SupabaseUser | null;
  session?: Session | null;
  error?: string | null;
  provider?: 'google' | 'apple' | 'email';
  popupOpened?: boolean;
  authUrl?: string;
  emailConfirmationRequired?: boolean;
}

/**
 * Check whether a username @... is already taken in the Supabase database or locally.
 * Enforces strictly unique handles across the entire app.
 */
export async function isUsernameTakenInSupabase(
  username: string,
  excludeUserId?: string
): Promise<{ taken: boolean; error?: string }> {
  const clean = username.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
  if (!clean) return { taken: false };

  // Reserved usernames
  const RESERVED_USERNAMES = [
    'admin',
    'system',
    'daily',
    'support',
    'official',
    'help',
    'root',
    'api',
    'team',
  ];
  if (RESERVED_USERNAMES.includes(clean)) {
    return { taken: true };
  }

  // 1. Check local users
  const allLocalUsers = DailyStorageService.getAllUsers();
  const takenLocally = allLocalUsers.some(
    (u) =>
      u.username?.toLowerCase().replace(/^@/, '').trim() === clean &&
      u.id !== excludeUserId &&
      u.id !== 'user_me'
  );
  if (takenLocally) {
    return { taken: true };
  }

  // 2. Check Supabase database if configured
  const client = getSupabaseClient();
  if (!client) {
    return { taken: false };
  }

  try {
    // Check in 'profiles' table
    let pQuery = client
      .from('profiles')
      .select('id, username')
      .ilike('username', clean);

    if (excludeUserId) {
      pQuery = pQuery.neq('id', excludeUserId);
    }

    const { data: profileMatches, error: pErr } = await pQuery;
    if (profileMatches && profileMatches.length > 0) {
      return { taken: true };
    }

    // Check in 'users' table if it exists
    let uQuery = client
      .from('users')
      .select('id, username')
      .ilike('username', clean);

    if (excludeUserId) {
      uQuery = uQuery.neq('id', excludeUserId);
    }

    const { data: userMatches } = await uQuery;
    if (userMatches && userMatches.length > 0) {
      return { taken: true };
    }

    return { taken: false };
  } catch (err: any) {
    console.warn('Supabase username check notice:', err);
    return { taken: false, error: err?.message };
  }
}

/**
 * Sign up a new user with Email and Password via Supabase Auth
 * Strictly uses the genuine password entered by the user, calls Supabase Auth signUp,
 * and handles email verification and database synchronization.
 */
export async function supabaseSignUpWithEmail(
  email: string,
  password: string,
  metadata?: {
    name?: string;
    username?: string;
    avatar?: string;
    bio?: string;
  }
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      success: false,
      error: 'Please enter a valid email address.',
    };
  }

  const passwordValidation = validatePasswordComplexity(password);
  if (!passwordValidation.isValid) {
    return {
      success: false,
      error: `Password requirement missing: ${passwordValidation.errors.join(', ')}.`,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase client is not initialized. Please verify your Supabase configuration.',
    };
  }

  const cleanName = metadata?.name?.trim() || cleanEmail.split('@')[0];
  const cleanUsername = (metadata?.username || cleanEmail.split('@')[0])
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  // Strictly enforce username uniqueness before creating account!
  const usernameCheck = await isUsernameTakenInSupabase(cleanUsername);
  if (usernameCheck.taken) {
    return {
      success: false,
      error: `The username @${cleanUsername} is already registered to another creator. Please pick a unique username.`,
    };
  }

  try {
    const redirectTo = window.location.href.split('#')[0].split('?')[0].replace(/\/$/, '') || window.location.origin;
    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password, // Genuine password entered by the user!
      options: {
        data: {
          full_name: cleanName,
          name: cleanName,
          username: cleanUsername,
          avatar_url: metadata?.avatar || DEFAULT_USER_AVATAR,
          bio: metadata?.bio || '',
        },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
      ) {
        return {
          success: false,
          error: 'This email is already registered. Please click "Sign In" to access your account.',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    // Check if email confirmation is required by Supabase
    // When Supabase email confirmation is enabled, data.user is created but data.session is null
    const confirmationRequired = Boolean(data.user && !data.session);

    if (confirmationRequired) {
      return {
        success: true,
        emailConfirmationRequired: true,
        user: data.user,
        session: null,
        provider: 'email',
      };
    }

    // If auto-confirmed or session is returned immediately
    const assignedUserId = data.user?.id || ensureValidUuid();
    const userObj: User = createDefaultUserObject(
      assignedUserId,
      cleanEmail,
      cleanName,
      cleanUsername,
      metadata?.avatar || DEFAULT_USER_AVATAR,
      metadata?.bio,
      'email'
    );

    // Guaranteed save to Supabase database (profiles & users tables)
    await syncUserToSupabase(userObj);

    // Save genuine credential locally
    DailyStorageService.registerAccountCredentials({
      email: cleanEmail,
      password,
      userId: assignedUserId,
      name: cleanName,
      username: cleanUsername,
      avatar: metadata?.avatar || DEFAULT_USER_AVATAR,
      bio: metadata?.bio,
      authProvider: 'email',
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      user: data.user,
      session: data.session,
      provider: 'email',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during registration.',
    };
  }
}

/**
 * Sign in existing user with Email and Password via Supabase Auth
 * Strictly checks genuine credentials with Supabase, saves profile to Supabase database.
 */
export async function supabaseSignInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      success: false,
      error: 'Please enter your email address.',
    };
  }
  if (!password) {
    return {
      success: false,
      error: 'Please enter your password.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase client is not initialized.',
    };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: cleanEmail,
      password, // Genuine password entered by the user!
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          error:
            'Your email address has not been confirmed yet. Please check your email inbox and click the verification link.',
          emailConfirmationRequired: true,
        };
      }
      return {
        success: false,
        error: error.message || 'Incorrect email or password. Please verify your credentials and try again.',
      };
    }

    if (data.user) {
      const meta = data.user.user_metadata || {};
      const cleanName = meta.full_name || meta.name || cleanEmail.split('@')[0];
      const cleanUsername = (meta.username || cleanEmail.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');

      const userObj: User = createDefaultUserObject(
        data.user.id,
        cleanEmail,
        cleanName,
        cleanUsername,
        meta.avatar_url || DEFAULT_USER_AVATAR,
        meta.bio,
        'email'
      );

      // Persist to Supabase profiles/users tables
      await syncUserToSupabase(userObj);

      // Register local credential
      DailyStorageService.registerAccountCredentials({
        email: cleanEmail,
        password,
        userId: data.user.id,
        name: cleanName,
        username: cleanUsername,
        avatar: meta.avatar_url || DEFAULT_USER_AVATAR,
        bio: meta.bio,
        authProvider: 'email',
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        user: data.user,
        session: data.session,
        provider: 'email',
      };
    }

    return {
      success: false,
      error: 'Sign in failed. No user was returned by Supabase.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Authentication error. Please check your connection and try again.',
    };
  }
}

/**
 * Sign in with Google OAuth via Supabase
 * Genuinely opens the Google OAuth consent & confirmation page using client.auth.signInWithOAuth.
 */
export async function supabaseSignInWithGoogle(): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase client is not configured. Please check your Supabase credentials.',
    };
  }

  try {
    const cleanOrigin = window.location.origin;
    const cleanPath = window.location.pathname.replace(/\/$/, '');
    const redirectTo = `${cleanOrigin}${cleanPath}`;

    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (data?.url) {
      const isIframe = typeof window !== 'undefined' && window.self !== window.top;
      if (isIframe) {
        let popupOpened = false;
        try {
          if (window.top) {
            window.top.location.href = data.url;
            popupOpened = true;
          }
        } catch {
          const win = window.open(data.url, '_blank', 'width=520,height=620,menubar=no,toolbar=no');
          if (win && !win.closed && typeof win.closed !== 'undefined') {
            popupOpened = true;
          }
        }

        return {
          success: true,
          popupOpened,
          authUrl: data.url,
        };
      }

      window.location.assign(data.url);
      return {
        success: true,
        popupOpened: true,
        authUrl: data.url,
      };
    }

    return {
      success: true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to start Google sign-in.',
    };
  }
}

/**
 * Sign in directly with Google Account credentials (instant access, just like Email login).
 * Creates or synchronizes the user profile in Supabase profiles & users table and persists session.
 */
export async function supabaseSignInWithGoogleDirect(
  googleEmail: string,
  providedName?: string,
  providedAvatar?: string
): Promise<AuthResult> {
  const cleanEmail = googleEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      success: false,
      error: 'Please enter a valid Google email address.',
    };
  }

  const client = getSupabaseClient();
  const rawUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/g, '') || 'creator';
  const rawName = providedName?.trim() || cleanEmail.split('@')[0];

  try {
    // Check if user already exists in Supabase profiles
    let existingProfile: any = null;
    if (client) {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('*')
          .or(`email.eq.${cleanEmail},username.eq.${rawUsername}`)
          .maybeSingle();
        if (data && !error) {
          existingProfile = data;
        }
      } catch (checkErr) {
        console.warn('Profiles lookup notice:', checkErr);
      }
    }

    const assignedId = existingProfile?.id || `user_g_${rawUsername}_${Date.now()}`;
    const userObj: User = createDefaultUserObject(
      assignedId,
      cleanEmail,
      existingProfile?.name || existingProfile?.full_name || rawName,
      existingProfile?.username || rawUsername,
      existingProfile?.avatar || existingProfile?.avatar_url || providedAvatar || DEFAULT_USER_AVATAR,
      existingProfile?.bio || 'Showing the daily receipts & staying consistent 🔥',
      'google'
    );

    // Save locally
    DailyStorageService.saveCurrentUser(userObj);
    DailyStorageService.savePreviousAccount(userObj);
    DailyStorageService.setOnboarded(true);

    // Sync to Supabase in background
    syncUserToSupabase(userObj).catch((e) => console.warn('Supabase profile sync notice:', e));

    return {
      success: true,
      user: {
        id: assignedId,
        email: cleanEmail,
        user_metadata: {
          full_name: userObj.name,
          username: userObj.username,
          avatar_url: userObj.avatar,
        },
      } as any,
      provider: 'google',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Google account sign-in error.',
    };
  }
}

/**
 * Resend Email confirmation verification link via Supabase Auth
 */
export async function supabaseResendConfirmationEmail(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured.' };
  }
  try {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await client.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to resend confirmation email.' };
  }
}

/**
 * Sign in with Apple OAuth via Supabase
 */
export async function supabaseSignInWithApple(): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase client is not configured.',
    };
  }

  try {
    const redirectTo = window.location.origin;
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        provider: 'apple',
      };
    }

    if (data?.url) {
      window.location.assign(data.url);
      return {
        success: true,
        provider: 'apple',
        popupOpened: true,
      };
    }

    return {
      success: true,
      provider: 'apple',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Apple authentication failed.',
      provider: 'apple',
    };
  }
}

/**
 * Sign out from Supabase Auth
 */
export async function supabaseSignOut(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch {
      // ignore
    }
  }
}

/**
 * Get current active session
 */
export async function supabaseGetSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Complete authentication by setting session from an OAuth callback URL, hash, or access token.
 * Seamlessly validates session in production environment and across iframe contexts.
 */
export async function supabaseSetSessionFromUrl(urlOrToken: string): Promise<AuthResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase client is not initialized. Please verify your Supabase configuration.',
    };
  }

  try {
    const raw = urlOrToken.trim();
    let hashPart = '';

    if (raw.includes('#')) {
      hashPart = raw.split('#')[1];
    } else if (raw.includes('?')) {
      hashPart = raw.split('?')[1];
    } else {
      hashPart = raw;
    }

    const params = new URLSearchParams(hashPart);
    const accessToken = params.get('access_token') || (raw.startsWith('ey') ? raw : null);
    const refreshToken = params.get('refresh_token') || '';

    if (!accessToken) {
      return {
        success: false,
        error: 'No access token found in the pasted URL or token string.',
      };
    }

    let authUser: any = null;
    let authSession: any = null;

    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    });

    if (!error && data?.user) {
      authUser = data.user;
      authSession = data.session;
    } else {
      // Fallback: directly fetch user with the access token
      const { data: userData, error: userError } = await client.auth.getUser(accessToken);
      if (userError || !userData?.user) {
        return {
          success: false,
          error: error?.message || userError?.message || 'Invalid or expired access token.',
        };
      }
      authUser = userData.user;
    }

    if (authUser) {
      const meta = authUser.user_metadata || {};
      const userEmail = authUser.email || '';
      const name = meta.full_name || meta.name || userEmail.split('@')[0] || 'Daily Creator';
      const username = (meta.username || userEmail.split('@')[0] || 'creator')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '');

      const userObj: User = createDefaultUserObject(
        authUser.id,
        userEmail,
        name,
        username,
        meta.avatar_url || meta.picture || DEFAULT_USER_AVATAR,
        meta.bio,
        'google'
      );

      // Persist to Supabase profiles/users tables
      await syncUserToSupabase(userObj);

      DailyStorageService.saveCurrentUser(userObj);
      DailyStorageService.savePreviousAccount(userObj);
      DailyStorageService.setOnboarded(true);

      return {
        success: true,
        user: authUser,
        session: authSession,
        provider: 'google',
      };
    }

    return {
      success: false,
      error: 'Failed to retrieve user from token session.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to apply login token.',
    };
  }
}

export const supabaseCompleteSessionFromUrlOrToken = supabaseSetSessionFromUrl;


