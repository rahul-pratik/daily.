/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../types';

export interface AuthDiagnosticEntry {
  id: string;
  timestamp: string;
  event: string;
  sessionUserId?: string;
  email?: string;
  provider?: string;
  mappedUser?: Partial<User>;
  databasePayload?: Record<string, any>;
  syncResult?: {
    success: boolean;
    error?: string;
    action?: 'created' | 'updated' | 'unchanged' | 'failed';
    durationMs?: number;
  };
  notes?: string;
}

// In-memory ring buffer for diagnostic logs
const MAX_LOGS = 50;
const diagnosticLogs: AuthDiagnosticEntry[] = [];
type DiagnosticListener = (logs: AuthDiagnosticEntry[]) => void;
const listeners = new Set<DiagnosticListener>();

// Try loading existing logs from sessionStorage
try {
  const cached = sessionStorage.getItem('daily_auth_diagnostics');
  if (cached) {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed)) {
      diagnosticLogs.push(...parsed.slice(-MAX_LOGS));
    }
  }
} catch {
  // Non-blocking
}

function persistLogs() {
  try {
    sessionStorage.setItem('daily_auth_diagnostics', JSON.stringify(diagnosticLogs.slice(-30)));
  } catch {
    // Quota or storage unavailable
  }
}

/**
 * Diagnostic log function for Supabase Auth state changes and profile synchronization.
 * Prints structured, formatted diagnostic data to the developer console
 * and stores it for inspection in the UI.
 */
export function logAuthStateChangeDiagnostic(params: {
  event: string;
  session: any;
  mappedUser?: User;
  databasePayload?: Record<string, any>;
  syncResult?: {
    success: boolean;
    error?: string;
    action?: 'created' | 'updated' | 'unchanged' | 'failed';
    durationMs?: number;
  };
  notes?: string;
}): AuthDiagnosticEntry {
  const { event, session, mappedUser, databasePayload, syncResult, notes } = params;
  const timestamp = new Date().toISOString();
  const id = `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const sessionUser = session?.user;
  const sessionUserId = sessionUser?.id;
  const email = sessionUser?.email;
  const provider =
    sessionUser?.app_metadata?.provider ||
    (sessionUser?.identities?.[0]?.provider as string) ||
    (sessionUser ? 'email' : 'none');

  const entry: AuthDiagnosticEntry = {
    id,
    timestamp,
    event,
    sessionUserId,
    email,
    provider,
    mappedUser,
    databasePayload,
    syncResult,
    notes,
  };

  // Keep in ring buffer
  diagnosticLogs.push(entry);
  if (diagnosticLogs.length > MAX_LOGS) {
    diagnosticLogs.shift();
  }
  persistLogs();

  // Notify active listeners
  listeners.forEach((fn) => {
    try {
      fn([...diagnosticLogs]);
    } catch (e) {
      console.warn('Diagnostic listener error:', e);
    }
  });

  // Stylized Console Output
  const isSuccess = syncResult ? syncResult.success : true;
  const eventColor = event === 'SIGNED_IN' ? '#10B981' : event === 'SIGNED_OUT' ? '#EF4444' : '#2F6FED';

  console.groupCollapsed(
    `%c[Supabase Auth Diagnostic]%c ${event} %c[${provider}] %c${isSuccess ? '✓ OK' : '⚠ NOTICE'} %c@ ${new Date().toLocaleTimeString()}`,
    'background: #1e293b; color: #60a5fa; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    `color: ${eventColor}; font-weight: bold;`,
    'color: #94a3b8; font-weight: normal;',
    isSuccess ? 'color: #10B981; font-weight: bold;' : 'color: #f59e0b; font-weight: bold;',
    'color: #64748b; font-size: 11px;'
  );

  console.log('%cEvent Details:', 'font-weight: bold; color: #94a3b8;', {
    event,
    timestamp,
    notes: notes || 'Auth state transition processed',
  });

  if (sessionUser) {
    console.log('%cSession User (Supabase Auth):', 'font-weight: bold; color: #38bdf8;', {
      id: sessionUserId,
      email,
      provider,
      last_sign_in_at: sessionUser.last_sign_in_at,
      raw_user_metadata: sessionUser.user_metadata,
      app_metadata: sessionUser.app_metadata,
    });
  } else {
    console.log('%cSession User:', 'font-weight: bold; color: #94a3b8;', 'No active session (signed out)');
  }

  if (mappedUser) {
    console.log('%cMapped App User (Local State):', 'font-weight: bold; color: #34d399;', {
      id: mappedUser.id,
      name: mappedUser.name,
      username: mappedUser.username,
      email: mappedUser.email,
      avatar: mappedUser.avatar,
      bio: mappedUser.bio,
      currentStreak: mappedUser.currentStreak,
      authProvider: mappedUser.authProvider,
    });
  }

  if (databasePayload) {
    console.log("%cMapped Supabase 'profiles' Database Payload:", 'font-weight: bold; color: #a78bfa;', databasePayload);
  }

  if (syncResult) {
    const statusStyle = syncResult.success
      ? 'color: #10B981; font-weight: bold;'
      : 'color: #EF4444; font-weight: bold;';
    console.log(
      `%cSupabase 'profiles' Sync Result: %c${syncResult.success ? 'SUCCESS' : 'FAILED'} %c(${syncResult.action || 'sync'}) ${syncResult.durationMs ? `[${syncResult.durationMs}ms]` : ''}`,
      'font-weight: bold;',
      statusStyle,
      'color: #94a3b8;'
    );
    if (syncResult.error) {
      console.warn('Sync error / warning:', syncResult.error);
    }
  }

  console.groupEnd();

  return entry;
}

/**
 * Retrieve all in-memory and persisted diagnostic logs
 */
export function getAuthDiagnosticLogs(): AuthDiagnosticEntry[] {
  return [...diagnosticLogs];
}

/**
 * Clear diagnostic logs
 */
export function clearAuthDiagnosticLogs(): void {
  diagnosticLogs.length = 0;
  try {
    sessionStorage.removeItem('daily_auth_diagnostics');
  } catch {
    // Non-blocking
  }
  listeners.forEach((fn) => fn([]));
}

/**
 * Subscribe to new diagnostic log entries
 */
export function subscribeToAuthDiagnostics(callback: DiagnosticListener): () => void {
  listeners.add(callback);
  callback([...diagnosticLogs]);
  return () => {
    listeners.delete(callback);
  };
}
