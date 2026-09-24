/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Post,
  Message,
  Group,
  Community,
  Challenge,
  NavigationTab,
  ReportReason,
  AppNotification,
  ProofCollection,
  PostDraft,
  CommunitySharePreview,
  ChallengeInvitePreview,
  SharedPostPreview,
  UserProfileSharePreview,
  DEFAULT_USER_AVATAR,
} from './types';
import {
  supabase,
  isSupabaseConfigured,
  getSupabaseClient,
  syncUserToSupabase,
  supabaseSetSessionFromUrl,
} from './services/supabase';
import { logAuthStateChangeDiagnostic } from './services/authDiagnostic';
import { DailyStorageService } from './services/storage';
import { TopHeader, BottomNavigation } from './components/Navigation';
import { HomeFeed } from './components/HomeFeed';
import { ChallengesScreen } from './components/ChallengesScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { PersonProfileDossierScreen } from './components/PersonProfileDossierScreen';
import { CreatePostModal } from './components/CreatePostModal';
import { StreakCelebrationModal } from './components/StreakCelebrationModal';
import { CommentsModal } from './components/CommentsModal';
import { DirectMessagesScreen } from './components/DirectMessagesScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { EditProfileModal } from './components/EditProfileModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ReportModal } from './components/ReportModal';
import { ShareModal } from './components/ShareModal';
import { UniversalShareModal, UniversalShareItem } from './components/UniversalShareModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { CreateCommunityModal } from './components/CreateCommunityModal';
import { CommunityHubModal } from './components/CommunityHubModal';
import { PostInsightsModal } from './components/PostInsightsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CreateCollectionModal } from './components/CreateCollectionModal';
import { AddToCollectionModal } from './components/AddToCollectionModal';
import { GlobalSearchModal, SearchWish } from './components/GlobalSearchModal';
import { FeedSortDropdown } from './components/FeedSortDropdown';
import { usePhoneBackButton } from './hooks/usePhoneBackButton';
import { vibratePostSubmit, vibrateLight, vibrateStreakMilestone } from './services/haptics';

export default function App() {
  // Main Data States
  const [currentUser, setCurrentUser] = useState<User>(() => DailyStorageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => DailyStorageService.getAllUsers());
  const [groups, setGroups] = useState<Group[]>(() => DailyStorageService.getAllGroups());
  const [communities, setCommunities] = useState<Community[]>(() => DailyStorageService.getAllCommunities());
  const [posts, setPosts] = useState<Post[]>(() => DailyStorageService.getAllPosts());
  const [messages, setMessages] = useState<Message[]>(() => DailyStorageService.getAllMessages());
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => DailyStorageService.getSavedPostIds());
  const [reportedPostIds, setReportedPostIds] = useState<string[]>(() => DailyStorageService.getReportedPostIds());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => DailyStorageService.getAllNotifications());
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => DailyStorageService.isOnboarded());
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState<boolean>(false);

  // UI Navigation & Modals
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('daily_active_tab') as NavigationTab;
        if (stored && ['home', 'streak', 'discover', 'messages', 'profile', 'dossier'].includes(stored)) {
          return stored;
        }
      } catch (e) {
        // ignore
      }
    }
    return 'home';
  });
  const [previousTab, setPreviousTab] = useState<NavigationTab>('home');
  const [isCohortDiscussionsOpen, setIsCohortDiscussionsOpen] = useState(false);
  const [activeChallengeScreen, setActiveChallengeScreen] = useState<Challenge | null>(null);
  const [showJoinedCommunities, setShowJoinedCommunities] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [isAppExited, setIsAppExited] = useState(false);

  // Centralized Tab Navigation that persists state across tab changes and browser focus
  const handleSelectTab = (tab: NavigationTab) => {
    if (tab !== 'messages') {
      setActiveChatUserId(null);
      setActiveGroupId(null);
    }
    setPreviousTab(currentTab);
    setCurrentTab(tab);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('daily_active_tab', tab);
      }
    } catch (e) {
      // ignore
    }
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [searchInitialTab, setSearchInitialTab] = useState<SearchWish>('all');
  const [feedSortFilters, setFeedSortFilters] = useState<string[]>([
    'proofs:all',
    'tweets:all',
  ]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [selectedPostForCollection, setSelectedPostForCollection] = useState<Post | null>(null);

  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [universalShareItem, setUniversalShareItem] = useState<UniversalShareItem | null>(null);
  const [insightsPost, setInsightsPost] = useState<Post | null>(null);
  const [postPendingDelete, setPostPendingDelete] = useState<Post | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [communityInitialTag, setCommunityInitialTag] = useState<string>('');
  const [activeCommunityHub, setActiveCommunityHub] = useState<Community | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeProfileUser, setActiveProfileUser] = useState<User | null>(null);
  const [activeDossierUser, setActiveDossierUser] = useState<User | null>(null);
  const [activeDraftToEdit, setActiveDraftToEdit] = useState<PostDraft | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => DailyStorageService.getTheme());

  // Initialize and synchronize global theme preference with OS preference
  useEffect(() => {
    // Apply current effective theme to DOM
    const currentTheme = DailyStorageService.getTheme();
    DailyStorageService.applyThemeToDOM(currentTheme);
    setTheme(currentTheme);

    // Synchronize with user's OS preference using window.matchMedia('(prefers-color-scheme: dark)')
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleOSThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const mode = DailyStorageService.getThemeMode();
      if (mode === 'system') {
        const osTheme: 'dark' | 'light' = e.matches ? 'dark' : 'light';
        DailyStorageService.applyThemeToDOM(osTheme);
        setTheme(osTheme);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleOSThemeChange);
    } else if ((mediaQuery as any).addListener) {
      (mediaQuery as any).addListener(handleOSThemeChange);
    }

    // Synchronize with in-app theme changes
    const handleThemeChange = (e: any) => {
      if (e.detail?.theme) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('daily:theme-changed', handleThemeChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleOSThemeChange);
      } else if ((mediaQuery as any).removeListener) {
        (mediaQuery as any).removeListener(handleOSThemeChange);
      }
      window.removeEventListener('daily:theme-changed', handleThemeChange);
    };
  }, []);

  // Background processor for auto-publishing scheduled posts when due
  useEffect(() => {
    const checkScheduledPosts = () => {
      const allDrafts = DailyStorageService.getAllDrafts(currentUser.id);
      const nowIso = new Date().toISOString();
      const dueDrafts = allDrafts.filter(
        (d) => d.isScheduled && d.scheduledAt && d.scheduledAt <= nowIso
      );

      if (dueDrafts.length > 0) {
        dueDrafts.forEach((draft) => {
          const res = DailyStorageService.publishDraftNow(currentUser.id, draft.id);
          if (res.success) {
            setPosts(DailyStorageService.getAllPosts());
            setCurrentUser(DailyStorageService.getCurrentUser());
          }
        });
      }
    };

    checkScheduledPosts();
    const interval = setInterval(checkScheduledPosts, 15000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Streak celebration modal state
  const [celebrationState, setCelebrationState] = useState<{
    isOpen: boolean;
    streakCount: number;
    isNewStreakDay: boolean;
  }>({
    isOpen: false,
    streakCount: currentUser.currentStreak,
    isNewStreakDay: false,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      setNotifications(DailyStorageService.getAllNotifications());
    };

    window.addEventListener('daily:notification-added', handleNotificationsUpdated);
    return () => {
      window.removeEventListener('daily:notification-added', handleNotificationsUpdated);
    };
  }, []);

  // Calculate unread counts
  const unreadMessagesCount = messages.filter(
    (m) => (m.receiverId === currentUser.id || (m.groupId && m.senderId !== currentUser.id)) && !m.isRead
  ).length;

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Intercept phone hardware/gesture back button to match app's back button
  usePhoneBackButton(
    {
      universalShareItem,
      activeProfileUser,
      activeCommunityHub,
      commentsPost,
      reportingPost,
      sharingPost,
      insightsPost,
      isNotificationsOpen,
      isSearchOpen,
      isCreateOpen,
      isEditProfileOpen,
      isCreateGroupOpen,
      isCreateCommunityOpen,
      isCreateCollectionOpen,
      selectedPostForCollection,
      postPendingDelete,
      celebrationOpen: celebrationState.isOpen,
      currentTab,
      previousTab,
      activeChatUserId,
      activeGroupId,
      activeDossierUser,
      currentUser,
      isCohortDiscussionsOpen,
      activeChallengeScreen,
      showJoinedCommunities,
      isQuitModalOpen,
    },
    {
      closeUniversalShare: () => setUniversalShareItem(null),
      closeProfile: () => setActiveProfileUser(null),
      closeCommunityHub: () => setActiveCommunityHub(null),
      closeComments: () => setCommentsPost(null),
      closeReport: () => setReportingPost(null),
      closeShare: () => setSharingPost(null),
      closeInsights: () => setInsightsPost(null),
      closeNotifications: () => setIsNotificationsOpen(false),
      closeSearch: () => setIsSearchOpen(false),
      closeCreate: () => setIsCreateOpen(false),
      closeEditProfile: () => setIsEditProfileOpen(false),
      closeCreateGroup: () => setIsCreateGroupOpen(false),
      closeCreateCommunity: () => setIsCreateCommunityOpen(false),
      closeCreateCollection: () => setIsCreateCollectionOpen(false),
      closeAddToCollection: () => setSelectedPostForCollection(null),
      closeDeletePost: () => setPostPendingDelete(null),
      closeCelebration: () => setCelebrationState((prev) => ({ ...prev, isOpen: false })),
      closeCohortDiscussions: () => setIsCohortDiscussionsOpen(false),
      closeChallengeScreen: () => setActiveChallengeScreen(null),
      closeJoinedCommunities: () => setShowJoinedCommunities(false),
      promptQuitApp: () => setIsQuitModalOpen(true),
      closeQuitModal: () => setIsQuitModalOpen(false),
      closeActiveChat: () => {
        setActiveChatUserId(null);
        setActiveGroupId(null);
      },
      closeDossier: () => {
        if (activeDossierUser && activeDossierUser.id !== currentUser.id) {
          setActiveProfileUser(activeDossierUser);
          setActiveDossierUser(null);
        } else {
          handleSelectTab('profile');
        }
      },
      goToTab: (tab) => handleSelectTab(tab),
    }
  );

  // Handle Quit App Confirmation
  const handleConfirmQuitApp = () => {
    setIsQuitModalOpen(false);
    vibrateLight();
    try {
      window.close();
    } catch (e) {
      console.warn('window.close notice:', e);
    }
    setIsAppExited(true);
  };

  // Onboarding & Account Switcher completion handler
  const handleCompleteOnboarding = (updatedUserProps: Partial<User>) => {
    const updated = { ...currentUser, ...updatedUserProps };
    setCurrentUser(updated);
    DailyStorageService.saveCurrentUser(updated);
    DailyStorageService.savePreviousAccount(updated);
    DailyStorageService.setOnboarded(true);
    setIsOnboarded(true);
    setIsAccountSwitcherOpen(false);
    handleSelectTab('home');
  };

  // Switch Account Trigger from Profile Settings
  const handleSwitchAccount = () => {
    DailyStorageService.savePreviousAccount(currentUser);
    setIsAccountSwitcherOpen(true);
  };

  // Sync Supabase Auth session if redirected via OAuth or active token, with direct production routing
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const client = getSupabaseClient();
    if (!client?.auth) return;

    // Handle OAuth redirect callback directly (both PKCE ?code= and Implicit hash #access_token=)
    // Ensures immediate routing to the home feed in the production environment without manual localhost redirects
    const handleOAuthCallback = async () => {
      if (typeof window === 'undefined') return;

      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      const code = url.searchParams.get('code');
      let errorParam = url.searchParams.get('error') || url.searchParams.get('error_description');

      // Also check hash for errors returned by Supabase OAuth redirect
      if (!errorParam && window.location.hash.includes('error=')) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        errorParam = hashParams.get('error_description') || hashParams.get('error');
      }

      const hasAuthHash = window.location.hash.includes('access_token') || window.location.hash.includes('refresh_token');

      if (errorParam) {
        console.warn('OAuth callback error parameter received:', errorParam);
        showToast(`Google Sign-In notice: ${decodeURIComponent(errorParam)}`);
        window.history.replaceState(null, document.title, window.location.pathname);
        return;
      }

      // Handle PKCE code callback
      if (code) {
        try {
          const { data, error } = await client.auth.exchangeCodeForSession(code);
          if (!error && data?.session?.user) {
            setIsOnboarded(true);
            setIsAccountSwitcherOpen(false);
            handleSelectTab('home');
            window.history.replaceState(null, document.title, window.location.pathname);
          }
        } catch (codeErr) {
          console.warn('Code exchange notice:', codeErr);
        }
      }

      // Handle implicit hash callback
      if (hasAuthHash) {
        try {
          const res = await supabaseSetSessionFromUrl(currentUrl);
          if (res.success && res.user) {
            setIsOnboarded(true);
            setIsAccountSwitcherOpen(false);
            handleSelectTab('home');
            window.history.replaceState(null, document.title, window.location.pathname);
          }
        } catch (err) {
          console.warn('OAuth URL session parse notice:', err);
        }
      }
    };

    handleOAuthCallback();

    // Check initial session on boot
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        logAuthStateChangeDiagnostic({
          event: 'INITIAL_SESSION',
          session,
          notes: 'Found existing Supabase session on app initialization',
        });
      }
    }).catch((err) => {
      console.warn('Initial session check notice:', err);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const userEmail = session.user.email || '';
        const rawName = meta.full_name || meta.name || userEmail.split('@')[0] || '';
        const rawUsername = (meta.username || meta.preferred_username || userEmail.split('@')[0] || '')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '');
        const avatar = meta.avatar_url || meta.picture || DEFAULT_USER_AVATAR;
        const provider = (session.user.app_metadata?.provider as any) || 'google';

        // Check if a saved profile already exists in Supabase 'profiles' table to retain rich data
        let existingProfile: any = null;
        try {
          const { data, error } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
          if (data && !error) {
            existingProfile = data;
          }
        } catch (fetchErr) {
          console.warn('Profile fetch notice in onAuthStateChange:', fetchErr);
        }

        const baseUser = DailyStorageService.getCurrentUser();
        const updated: User = {
          ...baseUser,
          id: session.user.id,
          name: existingProfile?.name || existingProfile?.full_name || rawName || 'Daily Creator',
          username: existingProfile?.username || rawUsername || 'creator',
          avatar: existingProfile?.avatar || existingProfile?.avatar_url || avatar || DEFAULT_USER_AVATAR,
          email: userEmail,
          bio: existingProfile?.bio || meta.bio || baseUser.bio || 'Showing the daily receipts & staying consistent 🔥',
          currentStreak: existingProfile?.current_streak ?? baseUser.currentStreak ?? 1,
          longestStreak: existingProfile?.longest_streak ?? existingProfile?.highest_streak ?? baseUser.longestStreak ?? 1,
          level: existingProfile?.level ?? baseUser.level ?? 1,
          rank: existingProfile?.rank || baseUser.rank || 'Bronze',
          totalPosts: existingProfile?.total_proofs ?? existingProfile?.total_posts ?? baseUser.totalPosts ?? 0,
          streakFreezesLeft: existingProfile?.streak_freezes_left ?? baseUser.streakFreezesLeft ?? 2,
          interests: existingProfile?.interests || baseUser.interests || ['Coding', 'AI & Tech'],
          habits: existingProfile?.habits || baseUser.habits || ['Build Daily', 'Exercise'],
          authProvider: provider,
        };

        // Persist to Supabase database ('profiles' table)
        let syncResult: any = null;
        try {
          syncResult = await syncUserToSupabase(updated);
        } catch (syncErr: any) {
          console.warn('Session user sync to Supabase notice:', syncErr);
          syncResult = { success: false, error: syncErr?.message, action: 'failed' };
        }

        // Diagnostic Log for Auth state change
        logAuthStateChangeDiagnostic({
          event,
          session,
          mappedUser: updated,
          databasePayload: syncResult?.databasePayload,
          syncResult: {
            success: syncResult?.success ?? false,
            error: syncResult?.error,
            action: syncResult?.action,
            durationMs: syncResult?.durationMs,
          },
          notes: `User signed in via ${provider}. Profile ${syncResult?.action || 'synced'}.`,
        });

        DailyStorageService.saveCurrentUser(updated);
        DailyStorageService.savePreviousAccount(updated);
        DailyStorageService.setOnboarded(true);
        setCurrentUser(updated);
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
        setIsOnboarded(true);
        setIsAccountSwitcherOpen(false);
        // Only route to home if the user was just onboarded or was actively in the account switcher
        if (!DailyStorageService.isOnboarded() || isAccountSwitcherOpen) {
          handleSelectTab('home');
        }

        // Clean URL hash or search params if they contain OAuth / confirmation tokens
        if (
          typeof window !== 'undefined' &&
          (window.location.hash.includes('access_token') ||
            window.location.hash.includes('type=') ||
            window.location.search.includes('code=') ||
            window.location.search.includes('error='))
        ) {
          window.history.replaceState(null, document.title, window.location.pathname);
        }
      } else if (event === 'SIGNED_OUT') {
        logAuthStateChangeDiagnostic({
          event: 'SIGNED_OUT',
          session: null,
          notes: 'User session terminated (SIGNED_OUT event received)',
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Toggle Like on a Post
  const handleToggleLike = (postId: string) => {
    const updatedPosts = DailyStorageService.toggleLikePost(postId);
    setPosts(updatedPosts);
    if (commentsPost && commentsPost.id === postId) {
      const match = updatedPosts.find((p) => p.id === postId);
      if (match) setCommentsPost(match);
    }
  };

  // Add Comment on a Post
  const handleAddComment = (postId: string, content: string) => {
    const { posts: updatedPosts } = DailyStorageService.addComment(postId, content);
    setPosts(updatedPosts);
    const updatedPost = updatedPosts.find((p) => p.id === postId);
    if (updatedPost) setCommentsPost(updatedPost);
  };

  // Toggle Follow on User
  const handleToggleFollow = (userId: string) => {
    const { currentUser: updatedMe, updatedUsers } = DailyStorageService.toggleFollowUser(userId);
    setCurrentUser(updatedMe);
    setUsers(updatedUsers);
  };

  // Toggle Block on User
  const handleToggleBlock = (userId: string) => {
    const { updatedUser, isBlocked } = DailyStorageService.toggleBlockUser(userId);
    setCurrentUser(updatedUser);
    setUsers(DailyStorageService.getAllUsers());
    showToast(isBlocked ? 'User blocked — posts hidden from HomeFeed' : 'User unblocked');
  };

  // Toggle Mute on User
  const handleToggleMute = (userId: string) => {
    const { updatedUser, isMuted } = DailyStorageService.toggleMuteUser(userId);
    setCurrentUser(updatedUser);
    showToast(isMuted ? 'User muted — posts hidden from HomeFeed' : 'User unmuted');
  };

  // Create Post Handler with Streak and Confetti Animation
  const handleCreatePost = (payload: {
    content: string;
    imageUrl?: string;
    imageUrls?: string[];
    photoCaptions?: string[];
    tags: string[];
    isMainPost?: boolean;
    communityId?: string;
    communityName?: string;
    isCollage?: boolean;
  }) => {
    // Guardrail: Ensure someone's proof doesn't get posted directly into community or challenges
    const safePayload = {
      ...payload,
      isMainPost: true,
      communityId: undefined,
      communityName: undefined,
    };
    try {
      const result = DailyStorageService.createPost(safePayload);
      if (result.error) {
        showToast(result.error);
        return;
      }
      setPosts(DailyStorageService.getAllPosts());
      setCurrentUser(result.updatedUser);
      setIsCreateOpen(false);

      // Tactile haptic vibration feedback on submission
      vibratePostSubmit();

      // Trigger post celebration modal (Nice Post !! Great Proofs!!)
      setCelebrationState({
        isOpen: true,
        streakCount: result.updatedUser.currentStreak,
        isNewStreakDay: result.isNewStreakDay,
      });
    } catch (err) {
      console.error('Failed to create post:', err);
      showToast('Could not save post. Please try with fewer photos or smaller images.');
    }
  };

  // Append infinite photos to today's proof without feed spam
  const handleAppendPhotosToTodayPost = (newImageUrls: string[]) => {
    const { posts: updatedPosts } = DailyStorageService.appendPhotosToTodayPost(currentUser.id, newImageUrls);
    setPosts(updatedPosts);
    vibratePostSubmit();
  };

  // Send Message (Direct 1:1 or Group Chat)
  const handleSendMessage = (params: {
    receiverId?: string;
    groupId?: string;
    text: string;
    imageUrl?: string;
    audioUrl?: string;
    audioDuration?: number;
    communityShare?: CommunitySharePreview;
    challengeInvite?: ChallengeInvitePreview;
    sharedPost?: SharedPostPreview;
    userProfileShare?: UserProfileSharePreview;
  }) => {
    const newMsg = DailyStorageService.sendMessage(params);
    setMessages((prev) => [...prev, newMsg]);

    // Simulated friendly reply for 1:1 DMs
    if (params.receiverId) {
      const receiverId = params.receiverId;
      setTimeout(() => {
        const target = users.find((u) => u.id === receiverId);
        if (target) {
          const replyResponses = [
            `Hey! Great to connect. Loving the daily consistency 🔥`,
            `Thanks for reaching out! Let’s keep crushing our goals today.`,
            `Awesome update! How is your current project coming along?`,
            `Let's go! Staying locked in together 🚀`,
          ];
          const randomReply = replyResponses[Math.floor(Math.random() * replyResponses.length)];
          const replyMsg: Message = {
            id: `msg_reply_${Date.now()}`,
            conversationId: `conv_${[currentUser.id, receiverId].sort().join('_')}`,
            senderId: receiverId,
            receiverId: currentUser.id,
            text: randomReply,
            timestamp: 'Just now',
            isRead: currentTab === 'messages' && activeChatUserId === receiverId,
          };
          const allMsg = DailyStorageService.getAllMessages();
          DailyStorageService.saveAllMessages([...allMsg, replyMsg]);
          setMessages((prev) => [...prev, replyMsg]);
        }
      }, 1400);
    } else if (params.groupId) {
      // Group reply simulation
      const groupId = params.groupId;
      const group = groups.find((g) => g.id === groupId);
      if (group && group.memberIds.length > 1) {
        const otherMembers = group.memberIds.filter((memberId) => memberId !== currentUser.id);
        const randomMemberId = otherMembers[Math.floor(Math.random() * otherMembers.length)] || otherMembers[0];
        setTimeout(() => {
          const groupReplies = [
            `Strong progress! Keep the fire burning 🔥`,
            `Appreciate the share! Let's keep our streaks alive.`,
            `Inspiring update! 🙌`,
            `Let's go! Checking in my progress too 💯`,
          ];
          const randomReply = groupReplies[Math.floor(Math.random() * groupReplies.length)];
          const replyMsg: Message = {
            id: `msg_grp_reply_${Date.now()}`,
            conversationId: `conv_${groupId}`,
            senderId: randomMemberId,
            groupId: groupId,
            text: randomReply,
            timestamp: 'Just now',
            isRead: currentTab === 'messages' && activeGroupId === groupId,
          };
          const allMsg = DailyStorageService.getAllMessages();
          DailyStorageService.saveAllMessages([...allMsg, replyMsg]);
          setMessages((prev) => [...prev, replyMsg]);
        }, 1600);
      }
    }
  };

  // Toggle emoji reaction on message and persist
  const handleToggleReaction = (messageId: string, emoji: string) => {
    const updated = DailyStorageService.toggleMessageReaction(messageId, emoji, currentUser.id);
    if (updated) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
    }
  };

  // Toggle pin on message or photo and persist
  const handleTogglePinMessage = (messageId: string) => {
    const updated = DailyStorageService.togglePinMessage(messageId, currentUser.id);
    if (updated) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
    }
  };

  // Create Private Group Chat (in DMs)
  const handleCreateGroup = (params: {
    name: string;
    category: string;
    description: string;
    avatar?: string;
    memberIds: string[];
  }) => {
    const group = DailyStorageService.createGroup(params);
    setGroups(DailyStorageService.getAllGroups());
    setIsCreateGroupOpen(false);
    showToast(`Created group "${group.name}"!`);
    handleOpenDMs(null, group.id);
  };

  // Create Community (in Explore/Discover)
  const handleCreateCommunity = (params: {
    name: string;
    category: string;
    description: string;
    accessType: 'public' | 'moderated';
    rules?: string[];
    avatar?: string;
    coverImage?: string;
    themeColor?: string;
  }) => {
    const community = DailyStorageService.createCommunity({
      name: params.name,
      description: params.description,
      category: params.category,
      accessType: params.accessType,
      avatar: params.avatar || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
      coverImage: params.coverImage,
      themeColor: params.themeColor,
      rules: params.rules,
    });
    setCommunities(DailyStorageService.getAllCommunities());
    setIsCreateCommunityOpen(false);

    // Open hub for newly created community
    setActiveCommunityHub(community);
  };

  // Toggle Join Community (or Request Access if private)
  const handleToggleJoinCommunity = (communityId: string) => {
    const { communities: updatedCommunities } = DailyStorageService.toggleJoinCommunity(communityId);
    setCommunities(updatedCommunities);
    if (activeCommunityHub && activeCommunityHub.id === communityId) {
      const match = updatedCommunities.find((c) => c.id === communityId);
      if (match) setActiveCommunityHub(match);
    }
  };

  // Approve Pending Member Request (by Moderator)
  const handleApproveCommunityMember = (communityId: string, memberId: string) => {
    const updatedCommunities = DailyStorageService.approveCommunityMember(communityId, memberId);
    setCommunities(updatedCommunities);
    if (activeCommunityHub && activeCommunityHub.id === communityId) {
      const match = updatedCommunities.find((c) => c.id === communityId);
      if (match) setActiveCommunityHub(match);
    }
  };

  // Proof Collections Handlers
  const handleCreateCollection = (params: {
    name: string;
    description?: string;
    icon?: string;
    coverImageUrl?: string;
    initialPostIds?: string[];
  }) => {
    const { currentUser: updatedUser } = DailyStorageService.createProofCollection(params);
    setCurrentUser(updatedUser);
    setIsCreateCollectionOpen(false);
  };

  const handleDeleteCollection = (collectionId: string) => {
    const updatedUser = DailyStorageService.deleteProofCollection(collectionId);
    setCurrentUser(updatedUser);
  };

  const handleRemovePostFromCollection = (collectionId: string, postId: string) => {
    const updatedUser = DailyStorageService.removePostFromCollection(collectionId, postId);
    setCurrentUser(updatedUser);
  };

  const handleTogglePostInCollection = (collectionId: string, postId: string) => {
    const updatedUser = DailyStorageService.togglePostInCollection(collectionId, postId);
    setCurrentUser(updatedUser);
  };

  // Notification Handlers
  const handleMarkNotificationAsRead = (id: string) => {
    const updated = DailyStorageService.markNotificationAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllNotificationsAsRead = () => {
    const updated = DailyStorageService.markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleClearAllNotifications = () => {
    const updated = DailyStorageService.clearAllNotifications();
    setNotifications(updated);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    handleMarkNotificationAsRead(notification.id);
    if (notification.targetId) {
      const match = posts.find((p) => p.id === notification.targetId);
      if (match) {
        setIsNotificationsOpen(false);
        setCommentsPost(match);
      }
    } else if (notification.actorId) {
      const userMatch = users.find((u) => u.id === notification.actorId);
      if (userMatch) {
        setIsNotificationsOpen(false);
        setActiveProfileUser(userMatch);
      }
    }
  };

  // Edit Profile Save
  const handleSaveProfile = async (updatedProps: Partial<User>) => {
    const updated = { ...currentUser, ...updatedProps };
    setCurrentUser(updated);
    DailyStorageService.saveCurrentUser(updated);
    DailyStorageService.savePreviousAccount(updated);

    // Update in memory users list as well
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));

    // Sync directly to Supabase
    try {
      await syncUserToSupabase(updated);
    } catch (err) {
      console.warn('Supabase profile sync notice:', err);
    }

    setIsEditProfileOpen(false);
  };

  // Delete Post
  const handleRequestDeletePost = (postId: string) => {
    const postToDelete = posts.find((p) => p.id === postId);
    if (postToDelete) {
      setPostPendingDelete(postToDelete);
    }
  };

  const executeDeletePost = (postId: string) => {
    vibrateStreakMilestone();
    const { posts: updatedPosts, updatedUser } = DailyStorageService.deletePost(postId);
    const filtered = (updatedPosts || []).filter((p) => p.id !== postId);
    setPosts(filtered);
    setCurrentUser(updatedUser);
    setSavedPostIds(DailyStorageService.getSavedPostIds());
    setPostPendingDelete(null);
    if (commentsPost && commentsPost.id === postId) {
      setCommentsPost(null);
    }
    if (insightsPost && insightsPost.id === postId) {
      setInsightsPost(null);
    }
  };

  // Open Post Analytics/Insights
  const handleOpenInsights = (post: Post) => {
    setInsightsPost(post);
  };

  // Feed Refresh Handler
  const handleFeedRefresh = () => {
    setPosts(DailyStorageService.getAllPosts());
    setNotifications(DailyStorageService.getAllNotifications());
  };

  // Share post modal trigger
  const handleOpenShare = (post: Post) => {
    setSharingPost(post);
  };

  // Send shared post in direct or group message
  const handleSendSharedPost = (
    post: Post,
    recipientUserIds: string[],
    recipientGroupIds: string[],
    note?: string
  ) => {
    const postLinkUrl = `${window.location.origin}#post-${post.id}`;
    const messageText = `Check out this proof from ${post.name} (🔥 ${post.userStreak}d streak):\n"${post.content.slice(0, 100)}${post.content.length > 100 ? '...' : ''}"${note ? `\n\n${note}` : ''}\n${postLinkUrl}`;

    // Send to direct message recipients
    recipientUserIds.forEach((userId) => {
      handleSendMessage({
        receiverId: userId,
        text: messageText,
        imageUrl: post.imageUrl,
      });
    });

    // Send to group recipients
    recipientGroupIds.forEach((groupId) => {
      handleSendMessage({
        groupId: groupId,
        text: messageText,
        imageUrl: post.imageUrl,
      });
    });

    setSharingPost(null);
    if (recipientUserIds.length > 0) {
      handleOpenDMs(recipientUserIds[0], null);
    } else if (recipientGroupIds.length > 0) {
      handleOpenDMs(null, recipientGroupIds[0]);
    }
  };

  const handleUniversalSendToUser = (userId: string, note?: string) => {
    if (!universalShareItem) return;
    if (universalShareItem.type === 'community' && universalShareItem.community) {
      const comm = universalShareItem.community;
      handleSendMessage({
        receiverId: userId,
        text: note?.trim() || `Check out the ${comm.name} community on Daily!`,
        communityShare: {
          communityId: comm.id,
          communityName: comm.name,
          communityDescription: comm.description,
          communityAvatar: comm.avatar,
          communityCategory: comm.category,
          memberCount: comm.memberCount || 1,
          sharedByName: currentUser.name,
          sharedByAvatar: currentUser.avatar,
        },
      });
    } else if (universalShareItem.type === 'challenge' && universalShareItem.challenge) {
      const ch = universalShareItem.challenge;
      handleSendMessage({
        receiverId: userId,
        text: note?.trim() || `Join me in the ${ch.title} challenge on Daily!`,
        challengeInvite: {
          challengeId: ch.id,
          challengeTitle: ch.title,
          tag: ch.tag,
          durationDays: ch.durationDays,
          invitedByName: currentUser.name,
          invitedByAvatar: currentUser.avatar,
        },
      });
    } else if (universalShareItem.type === 'post' && universalShareItem.post) {
      const post = universalShareItem.post;
      handleSendMessage({
        receiverId: userId,
        text: note?.trim() || `Check out this proof by ${post.name} on Daily!`,
        imageUrl: post.imageUrl,
      });
    } else if (universalShareItem.type === 'user' && universalShareItem.user) {
      const u = universalShareItem.user;
      handleSendMessage({
        receiverId: userId,
        text: note?.trim() || `Check out @${u.username}'s profile on Daily!`,
      });
    }
  };

  const handleUniversalSendToGroup = (groupId: string, note?: string) => {
    if (!universalShareItem) return;
    if (universalShareItem.type === 'community' && universalShareItem.community) {
      const comm = universalShareItem.community;
      handleSendMessage({
        groupId,
        text: note?.trim() || `Check out the ${comm.name} community on Daily!`,
        communityShare: {
          communityId: comm.id,
          communityName: comm.name,
          communityDescription: comm.description,
          communityAvatar: comm.avatar,
          communityCategory: comm.category,
          memberCount: comm.memberCount || 1,
          sharedByName: currentUser.name,
          sharedByAvatar: currentUser.avatar,
        },
      });
    } else if (universalShareItem.type === 'challenge' && universalShareItem.challenge) {
      const ch = universalShareItem.challenge;
      handleSendMessage({
        groupId,
        text: note?.trim() || `Join me in the ${ch.title} challenge on Daily!`,
        challengeInvite: {
          challengeId: ch.id,
          challengeTitle: ch.title,
          tag: ch.tag,
          durationDays: ch.durationDays,
          invitedByName: currentUser.name,
          invitedByAvatar: currentUser.avatar,
        },
      });
    } else if (universalShareItem.type === 'post' && universalShareItem.post) {
      const post = universalShareItem.post;
      handleSendMessage({
        groupId,
        text: note?.trim() || `Check out this proof by ${post.name} on Daily!`,
        imageUrl: post.imageUrl,
      });
    } else if (universalShareItem.type === 'user' && universalShareItem.user) {
      const u = universalShareItem.user;
      handleSendMessage({
        groupId,
        text: note?.trim() || `Check out @${u.username}'s profile on Daily!`,
      });
    }
  };

  // View full profile of another user
  const handleViewUser = (user: User) => {
    const isMe =
      user.id === currentUser.id ||
      user.id === 'user_me' ||
      (Boolean(user.username && currentUser.username) && user.username.toLowerCase() === currentUser.username.toLowerCase());

    if (isMe) {
      setActiveProfileUser(null);
      handleSelectTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveProfileUser(user);
  };

  // View user from simplified user object (from notifications/DMs/etc)
  const handleViewSimplifiedUser = (user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    streak?: number;
    currentStreak?: number;
  }) => {
    const isMe =
      user.id === currentUser.id ||
      user.id === 'user_me' ||
      (Boolean(user.username && currentUser.username) && user.username.toLowerCase() === currentUser.username.toLowerCase());

    if (isMe) {
      setActiveProfileUser(null);
      handleSelectTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const fullUser = users.find(
      (u) =>
        u.id === user.id ||
        (Boolean(u.username && user.username) && u.username.toLowerCase() === user.username.toLowerCase())
    );
    if (fullUser) {
      setActiveProfileUser(fullUser);
    } else {
      setActiveProfileUser({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: 'Daily member and creator.',
        interests: ['Building', 'Fitness'],
        habits: [],
        activityDates: [],
        currentStreak: 0,
        longestStreak: 0,
        totalPosts: 0,
        followersCount: 1,
        followingCount: 1,
        followedUserIds: [],
        lastPostedDate: null,
        joinedDate: new Date().toISOString().slice(0, 10),
      });
    }
  };

  // View single post by ID (e.g. From chat shared card or community receipts)
  const handleViewPostFromId = (postId: string) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (targetPost) {
      setCommentsPost(targetPost);
    }
  };

  // Start DM from profile or card
  const handleStartDMWithUser = (target: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    streak: number;
  }) => {
    if (activeProfileUser) {
      setActiveProfileUser(null);
    }
    handleOpenDMs(target.id, null);

    const existingUser = users.find((u) => u.id === target.id);
    if (!existingUser) {
      setUsers((prev) => [
        ...prev,
        {
          id: target.id,
          name: target.name,
          username: target.username,
          avatar: target.avatar,
          bio: 'Building consistent daily habits.',
          interests: [],
          habits: [],
          currentStreak: target.streak || 1,
          longestStreak: target.streak || 1,
          totalPosts: 1,
          activityDates: [],
          followersCount: 1,
          followingCount: 1,
          followedUserIds: [],
          lastPostedDate: null,
          joinedDate: new Date().toISOString().split('T')[0],
          isCurrentUser: false,
        },
      ]);
    }
  };

  // Toggle Save on a Post
  const handleToggleSave = (postId: string) => {
    const { savedPostIds: updatedSaved } = DailyStorageService.toggleSavePost(postId);
    setSavedPostIds(updatedSaved);
  };

  // Start reporting a post
  const handleStartReport = (post: Post) => {
    setReportingPost(post);
  };

  // Confirm reporting a post
  const handleConfirmReport = (postId: string, reason: ReportReason) => {
    const { reportedPostIds: updatedReported } = DailyStorageService.reportPost(postId, reason);
    setReportedPostIds(updatedReported);
  };

  // Reset demo data
  const handleResetData = () => {
    DailyStorageService.resetToDefault();
    setCurrentUser(DailyStorageService.getCurrentUser());
    setUsers(DailyStorageService.getAllUsers());
    setGroups(DailyStorageService.getAllGroups());
    setCommunities(DailyStorageService.getAllCommunities());
    setPosts(DailyStorageService.getAllPosts());
    setMessages(DailyStorageService.getAllMessages());
    setSavedPostIds(DailyStorageService.getSavedPostIds());
    setReportedPostIds(DailyStorageService.getReportedPostIds());
    setNotifications(DailyStorageService.getAllNotifications());
  };

  // State for navigating directly to a challenge from DMs / Squad chats
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  // Dedicated Messages Screen Navigation
  const handleOpenDMs = (userId?: string | null, groupId?: string | null) => {
    setGroups(DailyStorageService.getAllGroups());
    setMessages(DailyStorageService.getAllMessages());
    handleSelectTab('messages');
    setActiveChatUserId(userId || null);
    setActiveGroupId(groupId || null);
  };

  const handleOpenChallenge = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    handleSelectTab('streak');
  };

  const handleOpenDMWithGroup = (groupId: string) => {
    handleOpenDMs(null, groupId);
  };

  if (isAppExited) {
    return (
      <div className={`min-h-screen ${theme === 'light' ? 'bg-[#f8fafc] text-[#0f172a]' : 'bg-[#050505] text-white'} flex flex-col items-center justify-center p-6 text-center select-none`}>
        <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-3xl mb-4 shadow-lg">
          ⚡
        </div>
        <h1 className="text-2xl font-black mb-2 tracking-tight">Daily App Closed</h1>
        <p className="text-xs text-white/50 max-w-xs mb-6 leading-relaxed">
          You exited the app. Keep your streaks and daily progress intact when you come back!
        </p>
        <button
          type="button"
          onClick={() => {
            setIsAppExited(false);
            handleSelectTab('home');
          }}
          className="py-3 px-6 rounded-2xl bg-[#2F6FED] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
        >
          Re-open Daily
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#f8fafc] text-[#0f172a]' : 'bg-[#050505] text-white'} flex justify-center font-sans antialiased selection:bg-[#2F6FED] selection:text-white`}>
      {/* Mobile-first centered frame container */}
      <div className={`w-full max-w-lg ${currentTab === 'messages' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'} ${theme === 'light' ? 'bg-[#f8fafc] border-slate-200' : 'bg-[#050505] border-white/5'} flex flex-col shadow-2xl relative border-x`}>
        {/* Top Header - Hidden when on dedicated messages screen */}
        {currentTab !== 'messages' && (
          <TopHeader
            currentUser={currentUser}
            onOpenDMs={() => handleOpenDMs()}
            unreadCount={unreadMessagesCount}
            onSelectTab={handleSelectTab}
            unreadNotificationsCount={unreadNotificationsCount}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenSearch={() => {
              setSearchInitialQuery('');
              setSearchInitialTab('all');
              setIsSearchOpen(true);
            }}
            isHomeScreen={currentTab === 'home'}
          />
        )}

        {/* Main Tab Screens */}
        <main className={`flex-1 flex flex-col ${currentTab === 'messages' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden min-h-0' : ''}`}>
          {currentTab === 'home' && (
            <HomeFeed
              posts={posts}
              currentUser={currentUser}
              onToggleLike={handleToggleLike}
              onOpenComments={(post) => setCommentsPost(post)}
              onToggleFollow={handleToggleFollow}
              onSendDM={handleStartDMWithUser}
              onOpenCreate={() => setIsCreateOpen(true)}
              onSelectTab={handleSelectTab}
              onViewUser={handleViewSimplifiedUser}
              savedPostIds={savedPostIds}
              reportedPostIds={reportedPostIds}
              onToggleSave={handleToggleSave}
              onReportPost={handleStartReport}
              onSharePost={handleOpenShare}
              onRefresh={handleFeedRefresh}
              onOpenInsights={handleOpenInsights}
              onDeletePost={handleRequestDeletePost}
              onOpenAddToCollection={(post) => setSelectedPostForCollection(post)}
              onOpenCreateCommunity={(tag) => {
                setCommunityInitialTag(tag || '');
                setIsCreateCommunityOpen(true);
              }}
              selectedSortFilters={feedSortFilters}
              onSelectSortFilters={setFeedSortFilters}
              onOpenSearchWithTag={(tag, tab) => {
                const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
                setSearchInitialQuery(formattedTag);
                setSearchInitialTab((tab as SearchWish) || 'all');
                setIsSearchOpen(true);
              }}
            />
          )}

          {currentTab === 'streak' && (
            <ChallengesScreen
              currentUser={currentUser}
              posts={posts}
              onOpenCreate={() => setIsCreateOpen(true)}
              onToggleLike={handleToggleLike}
              onOpenComments={(post) => setCommentsPost(post)}
              savedPostIds={savedPostIds}
              reportedPostIds={reportedPostIds}
              onToggleSave={handleToggleSave}
              onReportPost={handleStartReport}
              onSharePost={handleOpenShare}
              onOpenInsights={handleOpenInsights}
              onDeletePost={handleRequestDeletePost}
              onOpenGroupChat={handleOpenDMWithGroup}
              initialChallengeId={selectedChallengeId}
              onClearInitialChallenge={() => setSelectedChallengeId(null)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onUserUpdated={setCurrentUser}
              isCohortDiscussionsView={isCohortDiscussionsOpen}
              onSetIsCohortDiscussionsView={setIsCohortDiscussionsOpen}
              activeChallengeScreen={activeChallengeScreen}
              onSetActiveChallengeScreen={setActiveChallengeScreen}
            />
          )}

          {currentTab === 'discover' && (
            <DiscoverScreen
              users={users}
              currentUser={currentUser}
              communities={communities}
              onToggleFollow={handleToggleFollow}
              onSendDM={handleStartDMWithUser}
              onViewUser={handleViewUser}
              onOpenCommunity={(comm) => setActiveCommunityHub(comm)}
              onToggleJoinCommunity={handleToggleJoinCommunity}
              onCreateCommunity={() => setIsCreateCommunityOpen(true)}
              onRefresh={handleFeedRefresh}
              showJoinedCommunities={showJoinedCommunities}
              onSetShowJoinedCommunities={setShowJoinedCommunities}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              currentUser={currentUser}
              posts={posts}
              savedPostIds={savedPostIds}
              reportedPostIds={reportedPostIds}
              onToggleLike={handleToggleLike}
              onOpenComments={(post) => setCommentsPost(post)}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onResetData={handleResetData}
              onToggleSave={handleToggleSave}
              onReportPost={handleStartReport}
              onToggleFollow={handleToggleFollow}
              onSendDM={handleStartDMWithUser}
              onSharePost={handleOpenShare}
              onOpenInsights={handleOpenInsights}
              onDeletePost={handleRequestDeletePost}
              onOpenCreateCollection={() => setIsCreateCollectionOpen(true)}
              onDeleteCollection={handleDeleteCollection}
              onRemovePostFromCollection={handleRemovePostFromCollection}
              onOpenAddToCollection={(post) => setSelectedPostForCollection(post)}
              onOpenResumeDraft={(draft) => {
                setActiveDraftToEdit(draft);
                setIsCreateOpen(true);
              }}
              onOpenCreateDraft={() => {
                setActiveDraftToEdit(null);
                setIsCreateOpen(true);
              }}
              onOpenCreatePost={() => {
                setActiveDraftToEdit(null);
                setIsCreateOpen(true);
              }}
              onPublishDraftDirectly={(draftId) => {
                const res = DailyStorageService.publishDraftNow(currentUser.id, draftId);
                if (res.success) {
                  setPosts(DailyStorageService.getAllPosts());
                  setCurrentUser(DailyStorageService.getCurrentUser());
                  if (res.post) {
                    setCelebrationState({
                      isOpen: true,
                      streakCount: currentUser.currentStreak,
                      isNewStreakDay: false,
                    });
                  }
                }
              }}
              onOpenDossier={() => {
                setActiveDossierUser(currentUser);
                handleSelectTab('dossier');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onUserUpdated={(u) => setCurrentUser(u)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onSwitchAccount={handleSwitchAccount}
            />
          )}

          {currentTab === 'dossier' && (
            <PersonProfileDossierScreen
              targetUser={activeDossierUser || currentUser}
              currentUser={currentUser}
              onBack={() => {
                if (activeDossierUser && activeDossierUser.id !== currentUser.id) {
                  setActiveProfileUser(activeDossierUser);
                  setActiveDossierUser(null);
                } else {
                  handleSelectTab('profile');
                }
              }}
              onSendMessage={(target) => {
                handleStartDMWithUser({
                  id: target.id,
                  name: target.name,
                  username: target.username,
                  avatar: target.avatar,
                  streak: target.currentStreak || 0,
                });
              }}
              onOpenCreatePost={() => setIsCreateOpen(true)}
              onOpenCommunity={(community) => setActiveCommunityHub(community)}
              onShareCommunity={(community) => {
                setUniversalShareItem({
                  type: 'community',
                  community,
                });
              }}
              onShareChallenge={(challenge) => {
                setUniversalShareItem({
                  type: 'challenge',
                  challenge,
                });
              }}
            />
          )}

          {currentTab === 'messages' && (
            <DirectMessagesScreen
              currentUser={currentUser}
              allUsers={users}
              allGroups={groups}
              messages={messages}
              onSendMessage={handleSendMessage}
              onToggleReaction={handleToggleReaction}
              onTogglePinMessage={handleTogglePinMessage}
              onGroupsUpdated={() => setGroups(DailyStorageService.getAllGroups())}
              initialChatUserId={activeChatUserId}
              initialGroupId={activeGroupId}
              onActiveChatChange={(userId, groupId) => {
                setActiveChatUserId(userId);
                setActiveGroupId(groupId);
              }}
              onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
              onViewPost={handleViewPostFromId}
              onViewUser={handleViewSimplifiedUser}
              onOpenChallenge={handleOpenChallenge}
              onOpenCommunity={(communityId) => {
                const comm = DailyStorageService.getAllCommunities().find((c) => c.id === communityId);
                if (comm) {
                  setActiveCommunityHub(comm);
                }
              }}
              onBack={() => {
                handleSelectTab(previousTab === 'messages' ? 'home' : previousTab);
                setActiveChatUserId(null);
                setActiveGroupId(null);
              }}
            />
          )}
        </main>

        {/* Bottom Navigation Bar - Hidden on dedicated messages screen so chat bar is unobstructed */}
        {currentTab !== 'messages' && (
          <BottomNavigation
            currentTab={currentTab}
            onSelectTab={(tab) => handleSelectTab(tab)}
            currentUser={currentUser}
            onOpenDMs={() => handleOpenDMs()}
            unreadMessagesCount={unreadMessagesCount}
            onOpenCreate={() => setIsCreateOpen(true)}
          />
        )}

        {/* Modals */}
        {/* Notifications Modal */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          currentUser={currentUser}
          onMarkAsRead={handleMarkNotificationAsRead}
          onMarkAllAsRead={handleMarkAllNotificationsAsRead}
          onClearAll={handleClearAllNotifications}
          onOpenChallenge={handleOpenChallenge}
        />

        {/* Create Proof Collection Modal */}
        <CreateCollectionModal
          isOpen={isCreateCollectionOpen}
          onClose={() => setIsCreateCollectionOpen(false)}
          userPosts={posts.filter((p) => p.userId === currentUser.id)}
          onCreateCollection={handleCreateCollection}
        />

        {/* Add Post to Collection Modal */}
        <AddToCollectionModal
          isOpen={!!selectedPostForCollection}
          onClose={() => setSelectedPostForCollection(null)}
          post={selectedPostForCollection}
          currentUserId={currentUser.id}
          collections={currentUser.proofCollections || []}
          onTogglePostInCollection={handleTogglePostInCollection}
          onOpenCreateCollection={() => {
            setSelectedPostForCollection(null);
            setIsCreateCollectionOpen(true);
          }}
        />

        {/* Social Share Modal */}
        <ShareModal
          isOpen={!!sharingPost}
          post={sharingPost}
          currentUser={currentUser}
          allUsers={users}
          allGroups={groups}
          onClose={() => setSharingPost(null)}
          onSendShare={handleSendSharedPost}
          onCreateGroup={() => {
            setSharingPost(null);
            setIsCreateGroupOpen(true);
          }}
          onOpenDirectChat={(userId) => {
            setSharingPost(null);
            handleOpenDMs(userId, null);
          }}
          onOpenGroupChat={(groupId) => {
            setSharingPost(null);
            handleOpenDMs(null, groupId);
          }}
        />

        {/* Create Private Group Modal (in DMs) */}
        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          currentUser={currentUser}
          allUsers={users}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreateGroup={handleCreateGroup}
        />

        {/* Create Community Modal (in Explore) */}
        <CreateCommunityModal
          isOpen={isCreateCommunityOpen}
          currentUser={currentUser}
          onClose={() => {
            setIsCreateCommunityOpen(false);
            setCommunityInitialTag('');
          }}
          onCreateCommunity={handleCreateCommunity}
          initialTag={communityInitialTag}
          initialName={communityInitialTag ? `${communityInitialTag.charAt(0).toUpperCase() + communityInitialTag.slice(1)} Club` : ''}
        />

        {/* Explore Community Hub Modal */}
        {activeCommunityHub && (
          <CommunityHubModal
            community={activeCommunityHub}
            currentUser={currentUser}
            allUsers={users}
            posts={posts}
            isOpen={!!activeCommunityHub}
            onClose={() => setActiveCommunityHub(null)}
            onToggleJoin={handleToggleJoinCommunity}
            onApproveMember={handleApproveCommunityMember}
            onViewUser={handleViewUser}
            onViewPost={handleViewPostFromId}
          />
        )}

        {/* Report Post Modal */}
        <ReportModal
          isOpen={!!reportingPost}
          post={reportingPost}
          onClose={() => setReportingPost(null)}
          onConfirmReport={handleConfirmReport}
        />

        {/* User Profile Modal */}
        {activeProfileUser && (
          <UserProfileModal
            isOpen={!!activeProfileUser}
            user={activeProfileUser}
            currentUser={currentUser}
            posts={posts}
            onClose={() => setActiveProfileUser(null)}
            onToggleFollow={handleToggleFollow}
            onToggleBlock={handleToggleBlock}
            onToggleMute={handleToggleMute}
            isBlocked={activeProfileUser ? (currentUser.blockedUserIds?.includes(activeProfileUser.id) || DailyStorageService.isUserBlocked(activeProfileUser.id)) : false}
            isMuted={activeProfileUser ? (currentUser.mutedUserIds?.includes(activeProfileUser.id) || DailyStorageService.isUserMuted(activeProfileUser.id)) : false}
            onSendDM={handleStartDMWithUser}
            onToggleLike={handleToggleLike}
            onOpenComments={(post) => setCommentsPost(post)}
            onOpenDossier={(targetUser) => {
              setActiveDossierUser(targetUser || activeProfileUser || currentUser);
              setActiveProfileUser(null);
              handleSelectTab('dossier');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenCommunity={(community) => {
              setActiveProfileUser(null);
              setActiveCommunityHub(community);
            }}
            onViewUser={handleViewUser}
            onShareCommunity={(community) => {
              setUniversalShareItem({
                type: 'community',
                community,
              });
            }}
            onShareUser={(targetUser) => {
              setUniversalShareItem({
                type: 'user',
                user: targetUser,
              });
            }}
          />
        )}

        {/* Universal Share Modal (Communities, Challenges, Posts, Users) - Rendered on top of all modals */}
        {universalShareItem && (
          <UniversalShareModal
            isOpen={!!universalShareItem}
            item={universalShareItem}
            currentUser={currentUser}
            allUsers={users}
            allGroups={groups}
            onClose={() => setUniversalShareItem(null)}
            onSendToUser={handleUniversalSendToUser}
            onSendToGroup={handleUniversalSendToGroup}
            onOpenDirectChat={(userId) => {
              setActiveChatUserId(userId);
              setActiveGroupId(null);
              setActiveProfileUser(null);
              handleSelectTab('messages');
              setUniversalShareItem(null);
            }}
            onOpenGroupChat={(groupId) => {
              setActiveGroupId(groupId);
              setActiveChatUserId(null);
              setActiveProfileUser(null);
              handleSelectTab('messages');
              setUniversalShareItem(null);
            }}
          />
        )}

        {/* Onboarding & Account Switcher Modal */}
        {(isAccountSwitcherOpen || !isOnboarded) && (
          <OnboardingModal
            isOpen={true}
            initialUser={currentUser}
            forceSignInView={isAccountSwitcherOpen}
            onClose={isOnboarded ? () => setIsAccountSwitcherOpen(false) : undefined}
            onComplete={handleCompleteOnboarding}
          />
        )}

        {/* Create Post Modal with Local Draft Saving, Schedule Queue & Draft Editor */}
        <CreatePostModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setActiveDraftToEdit(null);
          }}
          currentUser={currentUser}
          posts={posts}
          communities={communities}
          initialDraftId={activeDraftToEdit?.id}
          initialContent={activeDraftToEdit?.content}
          initialImageUrl={activeDraftToEdit?.imageUrl}
          initialTags={activeDraftToEdit?.tags}
          initialScheduledAt={activeDraftToEdit?.scheduledAt}
          initialIsScheduled={activeDraftToEdit?.isScheduled}
          onSubmitPost={handleCreatePost}
          onAppendPhotosToTodayPost={handleAppendPhotosToTodayPost}
          onViewMyPost={handleViewPostFromId}
        />

        {/* Streak Celebration Modal */}
        <StreakCelebrationModal
          isOpen={celebrationState.isOpen}
          streakCount={celebrationState.streakCount}
          isNewStreakDay={celebrationState.isNewStreakDay}
          onClose={() => setCelebrationState((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Comments Modal */}
        <CommentsModal
          post={commentsPost}
          currentUser={currentUser}
          onClose={() => setCommentsPost(null)}
          onAddComment={handleAddComment}
          onViewUser={handleViewSimplifiedUser}
        />



        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={currentUser}
          onSave={handleSaveProfile}
        />

        {/* Post Engagement Insights Modal */}
        <PostInsightsModal
          isOpen={!!insightsPost}
          post={insightsPost}
          onClose={() => setInsightsPost(null)}
          onSharePost={handleOpenShare}
        />

        {/* Global Search Modal */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchInitialQuery('');
          }}
          users={users}
          communities={communities}
          groups={groups}
          posts={posts}
          currentUser={currentUser}
          onToggleFollow={handleToggleFollow}
          onSelectUser={(user) => {
            handleViewUser(user);
          }}
          onSelectCommunity={(comm) => {
            setActiveCommunityHub(comm);
          }}
          onSelectGroup={(group) => {
            handleOpenDMWithGroup(group.id);
          }}
          onSelectPost={(post) => {
            handleViewPostFromId(post.id);
          }}
          onSelectTag={(tag) => {
            const formattedTag = tag.startsWith('#') ? tag : `#${tag}`;
            setSearchInitialQuery(formattedTag);
            setSearchInitialTab('all');
            setIsSearchOpen(true);
          }}
          onCreateCommunity={(tag) => {
            setCommunityInitialTag(tag || '');
            setIsCreateCommunityOpen(true);
          }}
          initialQuery={searchInitialQuery}
          initialTab={searchInitialTab}
          onSelectChallenge={(challengeId) => {
            setSelectedChallengeId(challengeId);
            handleSelectTab('streak');
          }}
        />

        {/* Delete Confirmation Alert Modal */}
        <DeleteConfirmModal
          isOpen={!!postPendingDelete}
          post={postPendingDelete}
          onClose={() => setPostPendingDelete(null)}
          onConfirm={() => {
            if (postPendingDelete) {
              executeDeletePost(postPendingDelete.id);
            }
          }}
        />

        {/* Quit Confirmation Dialog on Mobile Back Button at Home Screen */}
        {isQuitModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#121216] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto text-2xl">
                👋
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white tracking-tight">Do you want to quit?</h3>
                <p className="text-xs text-white/60">
                  Are you sure you want to quit the app? Your active streaks and daily receipts are safely saved.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    vibrateLight();
                    setIsQuitModalOpen(false);
                  }}
                  className="py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                >
                  No, Stay
                </button>
                <button
                  type="button"
                  onClick={handleConfirmQuitApp}
                  className="py-2.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 cursor-pointer active:scale-95"
                >
                  Yes, Quit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-black/90 border border-white/20 text-white text-xs font-semibold shadow-2xl backdrop-blur-md max-w-sm text-center animate-in fade-in slide-in-from-bottom-3 duration-200">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
