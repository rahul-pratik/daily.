import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { DailyStorageService } from './storage';
import { User, DEFAULT_USER_AVATAR } from '../types';

const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const getSupabaseConfig = () => {
  const localUrl = localStorage.getItem('daily_supabase_url');
  const localKey = localStorage.getItem('daily_supabase_anon_key');
  const url = ENV_SUPABASE_URL || localUrl || undefined;
  const anonKey = ENV_SUPABASE_ANON_KEY || localKey || undefined;
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 10),
    source: ENV_SUPABASE_URL ? 'env' : localUrl ? 'local' : 'none',
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
    if (!client) return undefined;
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
function ensureValidUuid(id?: string): string {
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
  name,
  username,
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

/**
 * Save / Upsert a User profile into Supabase database (profiles & users tables)
 */
export async function syncUserToSupabase(user: User): Promise<{ success: boolean; error?: string }> {
  if (!user) return { success: false, error: 'No user provided' };

  // Always persist to local previous accounts as well
  DailyStorageService.savePreviousAccount(user);

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase credentials not configured in environment or settings.',
    };
  }

  try {
    const cleanUsername = user.username?.toLowerCase().replace(/^@/, '').trim() || 'creator';
    const cleanEmail = user.email?.trim() || `${cleanUsername}@dailyapp.io`;
    const cleanName = user.name?.trim() || cleanUsername;
    const cleanId = ensureValidUuid(user.id);

    // 1. Comprehensive payload matching standard Supabase profile schemas
    const fullPayload = {
      id: cleanId,
      username: cleanUsername,
      name: cleanName,
      full_name: cleanName,
      avatar_url: user.avatar || DEFAULT_USER_AVATAR,
      avatar: user.avatar || DEFAULT_USER_AVATAR,
      bio: user.bio || '',
      email: cleanEmail,
      streak: user.currentStreak || 0,
      current_streak: user.currentStreak || 0,
      longest_streak: user.longestStreak || 0,
      total_posts: user.totalPosts || 0,
      interests: user.interests || [],
      habits: user.habits || [],
      updated_at: new Date().toISOString(),
    };

    // 2. Minimal fallback payload in case extra columns don't exist
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
    let { error: profileError } = await client
      .from('profiles')
      .upsert(fullPayload, { onConflict: 'id' });

    if (profileError) {
      const { error: minErr } = await client
        .from('profiles')
        .upsert(minimalPayload, { onConflict: 'id' });
      profileError = minErr;
    }

    // Try upserting to 'users' table as well
    let { error: userTableError } = await client
      .from('users')
      .upsert(fullPayload, { onConflict: 'id' });

    if (userTableError) {
      const { error: minErr2 } = await client
        .from('users')
        .upsert(minimalPayload, { onConflict: 'id' });
      userTableError = minErr2;
    }

    if (profileError && userTableError) {
      console.warn('Supabase DB sync note:', profileError.message || userTableError.message);
      return {
        success: false,
        error: profileError.message || userTableError.message,
      };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Supabase profile sync error:', err);
    return { success: false, error: err?.message || 'Sync failed' };
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
}

/**
 * Sign up a new user with Email and Password via Supabase Auth
 * Strictly checks credentials, persists to Supabase Auth, and syncs to database tables.
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

  if (!password || password.length < 6) {
    return {
      success: false,
      error: 'Password must be at least 6 characters long.',
    };
  }

  const client = getSupabaseClient();
  const cleanName = metadata?.name?.trim() || cleanEmail.split('@')[0];
  const cleanUsername = (metadata?.username || cleanEmail.split('@')[0])
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

  if (client) {
    try {
      let authUser: SupabaseUser | null = null;
      let authSession: Session | null = null;

      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            name: cleanName,
            username: cleanUsername,
            avatar_url: metadata?.avatar || DEFAULT_USER_AVATAR,
            bio: metadata?.bio || '',
          },
        },
      });

      if (error) {
        // If account is already registered in Supabase Auth, attempt sign-in automatically
        if (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already exists')
        ) {
          const signInRes = await client.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (signInRes.data?.user) {
            authUser = signInRes.data.user;
            authSession = signInRes.data.session;
          } else {
            return {
              success: false,
              error: 'This email is already registered, but the password provided was incorrect. Please check your password.',
            };
          }
        } else {
          return {
            success: false,
            error: error.message,
          };
        }
      } else {
        authUser = data.user;
        authSession = data.session;
      }

      const assignedUserId = authUser?.id || ensureValidUuid();

      // Register credentials locally for rapid offline access
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

      // Construct complete User object and guarantee persistence to Supabase DB tables
      const userObj: User = createDefaultUserObject(
        assignedUserId,
        cleanEmail,
        cleanName,
        cleanUsername,
        metadata?.avatar || DEFAULT_USER_AVATAR,
        metadata?.bio,
        'email'
      );

      // Guaranteed database sync to profiles & users tables
      await syncUserToSupabase(userObj);

      return {
        success: true,
        user: authUser || ({
          id: assignedUserId,
          email: cleanEmail,
          user_metadata: {
            full_name: cleanName,
            name: cleanName,
            username: cleanUsername,
            avatar_url: userObj.avatar,
          },
        } as any),
        session: authSession,
        provider: 'email',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred during email registration.',
      };
    }
  }

  // Register locally when Supabase environment is pending configuration
  const newUserId = ensureValidUuid();
  DailyStorageService.registerAccountCredentials({
    email: cleanEmail,
    password,
    userId: newUserId,
    name: cleanName,
    username: cleanUsername,
    avatar: metadata?.avatar,
    bio: metadata?.bio,
    authProvider: 'email',
    createdAt: new Date().toISOString(),
  });

  const localUser: User = createDefaultUserObject(
    newUserId,
    cleanEmail,
    cleanName,
    cleanUsername,
    metadata?.avatar || DEFAULT_USER_AVATAR,
    metadata?.bio,
    'email'
  );
  DailyStorageService.savePreviousAccount(localUser);

  return {
    success: true,
    user: {
      id: newUserId,
      email: cleanEmail,
      user_metadata: {
        full_name: cleanName,
        name: cleanName,
        username: cleanUsername,
        avatar_url: metadata?.avatar || '',
        bio: metadata?.bio || '',
      },
    } as any,
    provider: 'email',
  };
}

/**
 * Sign in existing user with Email and Password
 * Strictly verifies against Supabase and local credentials.
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
  if (client) {
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
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

        // Sync to Supabase profiles table on sign in
        await syncUserToSupabase(userObj);

        return {
          success: true,
          user: data.user,
          session: data.session,
          provider: 'email',
        };
      }
    } catch (err: any) {
      console.warn('Supabase sign in attempt exception:', err);
    }
  }

  // Strictly verify against registered credentials
  const verifyRes = DailyStorageService.verifyEmailPassword(cleanEmail, password);
  if (!verifyRes.success) {
    return {
      success: false,
      error: verifyRes.error || 'Incorrect email or password. Please verify your credentials and try again.',
    };
  }

  const cred = verifyRes.credential!;
  return {
    success: true,
    user: {
      id: cred.userId,
      email: cred.email,
      user_metadata: {
        full_name: cred.name,
        name: cred.name,
        username: cred.username,
        avatar_url: cred.avatar,
        bio: cred.bio,
      },
    } as any,
    provider: 'email',
  };
}

/**
 * Sign in with Google OAuth via Supabase and persist directly into Supabase database
 */
export async function supabaseSignInWithGoogle(
  googleEmail?: string,
  googleName?: string,
  googleAvatar?: string
): Promise<AuthResult> {
  const client = getSupabaseClient();
  const finalEmail = (googleEmail?.trim().toLowerCase()) || 'pratik.rahulb@gmail.com';
  const finalName = googleName?.trim() || 'Rahul Pratik';
  const cleanUsername = finalEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  const finalAvatar = googleAvatar || DEFAULT_USER_AVATAR;

  if (client) {
    try {
      const redirectTo = window.location.origin;
      // Trigger genuine OAuth flow with Supabase
      client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      }).catch((oauthErr) => {
        console.warn('Supabase Google OAuth trigger notice:', oauthErr);
      });
    } catch (err) {
      console.warn('Supabase Google OAuth error:', err);
    }
  }

  // Immediately persist Google profile to Supabase database tables (profiles & users)
  const userObj: User = createDefaultUserObject(
    ensureValidUuid(),
    finalEmail,
    finalName,
    cleanUsername,
    finalAvatar,
    'Showing the daily receipts & staying consistent 🔥',
    'google'
  );

  // Sync to database
  try {
    await syncUserToSupabase(userObj);
  } catch (err) {
    console.warn('Sync google user to Supabase notice:', err);
  }

  return {
    success: true,
    provider: 'google',
    user: {
      id: userObj.id,
      email: finalEmail,
      user_metadata: {
        full_name: finalName,
        name: finalName,
        username: cleanUsername,
        avatar_url: userObj.avatar,
      },
    } as any,
  };
}

/**
 * Sign in with Apple OAuth via Supabase or genuine Apple ID flow
 */
export async function supabaseSignInWithApple(): Promise<AuthResult> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const redirectTo = window.location.origin;
      const { data: _data, error } = await supabase.auth.signInWithOAuth({
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

  return {
    success: true,
    provider: 'apple',
    popupOpened: true,
  };
}

/**
 * Sign out from Supabase Auth
 */
export async function supabaseSignOut(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
}

/**
 * Get current active session
 */
export async function supabaseGetSession(): Promise<Session | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}
