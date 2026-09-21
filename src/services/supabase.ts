import { createClient, SupabaseClient, User as SupabaseUser, Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    supabaseAnonKey.length > 10
  );
};

// Initialize Supabase Client if configured, or null for fallback
export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export interface AuthResult {
  success: boolean;
  user?: SupabaseUser | null;
  session?: Session | null;
  error?: string | null;
  provider?: 'google' | 'apple' | 'email';
}

/**
 * Sign up a new user with Email and Password via Supabase Auth
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
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: true,
      provider: 'email',
      error: null,
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata?.name || '',
          username: metadata?.username || '',
          avatar_url: metadata?.avatar || '',
          bio: metadata?.bio || '',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      provider: 'email',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during email registration.',
    };
  }
}

/**
 * Sign in existing user with Email and Password via Supabase Auth
 */
export async function supabaseSignInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: true,
      provider: 'email',
      error: null,
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      provider: 'email',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to sign in with email.',
    };
  }
}

/**
 * Sign in with Google OAuth via Supabase
 */
export async function supabaseSignInWithGoogle(): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: true,
      provider: 'google',
      error: null,
    };
  }

  try {
    const redirectTo = window.location.origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      provider: 'google',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Google authentication failed.',
    };
  }
}

/**
 * Sign in with Apple OAuth via Supabase
 */
export async function supabaseSignInWithApple(): Promise<AuthResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: true,
      provider: 'apple',
      error: null,
    };
  }

  try {
    const redirectTo = window.location.origin;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
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
    };
  }
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
