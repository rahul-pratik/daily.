import { useEffect, useRef } from 'react';
import { NavigationTab, User, Post, Community, Challenge } from '../types';
import { UniversalShareItem } from '../components/UniversalShareModal';

export interface BackButtonState {
  universalShareItem: UniversalShareItem | null;
  activeProfileUser: User | null;
  activeCommunityHub: Community | null;
  commentsPost: Post | null;
  reportingPost: Post | null;
  sharingPost: Post | null;
  insightsPost: Post | null;
  isNotificationsOpen: boolean;
  isSearchOpen: boolean;
  isCreateOpen: boolean;
  isEditProfileOpen: boolean;
  isCreateGroupOpen: boolean;
  isCreateCommunityOpen: boolean;
  isCreateCollectionOpen: boolean;
  selectedPostForCollection: Post | null;
  postPendingDelete: Post | null;
  celebrationOpen: boolean;
  currentTab: NavigationTab;
  previousTab: NavigationTab;
  activeChatUserId: string | null;
  activeGroupId: string | null;
  activeDossierUser: User | null;
  currentUser: User;
  // Sub-screen and Exit Confirmation states
  isCohortDiscussionsOpen?: boolean;
  activeChallengeScreen?: Challenge | null;
  showJoinedCommunities?: boolean;
  isQuitModalOpen?: boolean;
}

export interface BackButtonActions {
  closeUniversalShare: () => void;
  closeProfile: () => void;
  closeCommunityHub: () => void;
  closeComments: () => void;
  closeReport: () => void;
  closeShare: () => void;
  closeInsights: () => void;
  closeNotifications: () => void;
  closeSearch: () => void;
  closeCreate: () => void;
  closeEditProfile: () => void;
  closeCreateGroup: () => void;
  closeCreateCommunity: () => void;
  closeCreateCollection: () => void;
  closeAddToCollection: () => void;
  closeDeletePost: () => void;
  closeCelebration: () => void;
  closeActiveChat: () => void;
  closeDossier: () => void;
  goToTab: (tab: NavigationTab) => void;
  // Sub-screen & Exit Actions
  closeCohortDiscussions?: () => void;
  closeChallengeScreen?: () => void;
  closeJoinedCommunities?: () => void;
  promptQuitApp: () => void;
  closeQuitModal: () => void;
}

function getActiveLayers(s: BackButtonState): string[] {
  const layers: string[] = [];
  // Notice: Tabs (home, streak, discover, messages, profile, dossier) are parallel top-level
  // destinations, NOT back-stack layers. Do not push tab as a layer to avoid jumping back to home
  // or resetting when switching browser tabs.
  if (s.currentTab === 'streak') {
    if (s.activeChallengeScreen) {
      layers.push(`challenge_details_${s.activeChallengeScreen.id}`);
    }
    if (s.isCohortDiscussionsOpen) {
      layers.push('cohort_discussions');
    }
  }
  if (s.currentTab === 'discover' && s.showJoinedCommunities) {
    layers.push('joined_communities');
  }
  if (s.currentTab === 'messages' && (s.activeChatUserId || s.activeGroupId)) {
    layers.push(`chat_${s.activeChatUserId || s.activeGroupId}`);
  }
  if (s.currentTab === 'dossier') {
    layers.push('dossier');
  }
  if (s.isCreateOpen) layers.push('create');
  if (s.isNotificationsOpen) layers.push('notifications');
  if (s.isSearchOpen) layers.push('search');
  if (s.isEditProfileOpen) layers.push('edit_profile');
  if (s.isCreateGroupOpen) layers.push('create_group');
  if (s.isCreateCommunityOpen) layers.push('create_community');
  if (s.isCreateCollectionOpen) layers.push('create_collection');
  if (s.selectedPostForCollection) layers.push('add_collection');
  if (s.postPendingDelete) layers.push('delete_post');
  if (s.celebrationOpen) layers.push('celebration');
  if (s.insightsPost) layers.push('insights');
  if (s.sharingPost) layers.push('share_post');
  if (s.reportingPost) layers.push('report_post');
  if (s.commentsPost) layers.push('comments');
  if (s.activeCommunityHub) layers.push('community_hub');
  if (s.activeProfileUser) layers.push(`profile_${s.activeProfileUser.id}`);
  if (s.universalShareItem) layers.push('universal_share');
  if (s.isQuitModalOpen) layers.push('quit_modal');
  return layers;
}

export function usePhoneBackButton(
  state: BackButtonState,
  actions: BackButtonActions
) {
  const stateRef = useRef(state);
  const actionsRef = useRef(actions);
  const historyDepthRef = useRef(0);
  const isProgrammaticBackRef = useRef(false);
  const prevLayersCountRef = useRef(0);

  stateRef.current = state;
  actionsRef.current = actions;

  // Initialize base and home guard history state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.history.state || !window.history.state.__daily_root) {
      window.history.replaceState({ __daily_root: true, depth: 0 }, '');
      window.history.pushState({ __daily_guard: true, depth: 1 }, '');
      historyDepthRef.current = 1;
    }

    const handlePopState = () => {
      // Ignore spurious popstate events when tab/document is not visible
      if (document.visibilityState !== 'visible') {
        return;
      }

      // If triggered programmatically by in-app back/close, consume and ignore
      if (isProgrammaticBackRef.current) {
        isProgrammaticBackRef.current = false;
        return;
      }

      const s = stateRef.current;
      const act = actionsRef.current;

      // Close topmost layer in precise priority order
      if (s.isQuitModalOpen) {
        // If quit confirmation modal is already open, pressing back dismisses it and stays in the app
        act.closeQuitModal();
        window.history.pushState({ __daily_guard: true, depth: historyDepthRef.current }, '');
        return;
      }

      if (s.universalShareItem) {
        act.closeUniversalShare();
      } else if (s.activeProfileUser) {
        act.closeProfile();
      } else if (s.activeCommunityHub) {
        act.closeCommunityHub();
      } else if (s.commentsPost) {
        act.closeComments();
      } else if (s.reportingPost) {
        act.closeReport();
      } else if (s.sharingPost) {
        act.closeShare();
      } else if (s.insightsPost) {
        act.closeInsights();
      } else if (s.isNotificationsOpen) {
        act.closeNotifications();
      } else if (s.isSearchOpen) {
        act.closeSearch();
      } else if (s.isCreateOpen) {
        act.closeCreate();
      } else if (s.isEditProfileOpen) {
        act.closeEditProfile();
      } else if (s.isCreateGroupOpen) {
        act.closeCreateGroup();
      } else if (s.isCreateCommunityOpen) {
        act.closeCreateCommunity();
      } else if (s.isCreateCollectionOpen) {
        act.closeCreateCollection();
      } else if (s.selectedPostForCollection) {
        act.closeAddToCollection();
      } else if (s.postPendingDelete) {
        act.closeDeletePost();
      } else if (s.celebrationOpen) {
        act.closeCelebration();
      } else if (s.currentTab === 'streak' && s.isCohortDiscussionsOpen) {
        // Return to Challenges screen from cohort discussions
        if (act.closeCohortDiscussions) {
          act.closeCohortDiscussions();
        }
      } else if (s.currentTab === 'streak' && s.activeChallengeScreen) {
        // Return to Challenges screen from challenge details
        if (act.closeChallengeScreen) {
          act.closeChallengeScreen();
        }
      } else if (s.currentTab === 'discover' && s.showJoinedCommunities) {
        // Return to Discover/Explore communities screen from joined communities
        if (act.closeJoinedCommunities) {
          act.closeJoinedCommunities();
        }
      } else if (s.currentTab === 'messages' && (s.activeChatUserId || s.activeGroupId)) {
        // Return to Messages inbox list from active conversation
        act.closeActiveChat();
      } else if (s.currentTab === 'dossier') {
        act.closeDossier();
      } else {
        // User is at a root screen with no open sub-screens or modals
        // Prompt quit confirmation modal: "Do you wanna quit? Yes / No"
        act.promptQuitApp();
        // Restore guard state so if user chooses "No, Stay", subsequent back press prompts again
        window.history.pushState({ __daily_guard: true, depth: historyDepthRef.current }, '');
      }

      historyDepthRef.current = Math.max(0, historyDepthRef.current - 1);
      prevLayersCountRef.current = Math.max(0, prevLayersCountRef.current - 1);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize history entries as layers open
  const currentLayers = getActiveLayers(state);
  const currentLayersCount = currentLayers.length;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (currentLayersCount > prevLayersCountRef.current) {
      // Pushed new layer(s)
      const diff = currentLayersCount - prevLayersCountRef.current;
      for (let i = 0; i < diff; i++) {
        historyDepthRef.current += 1;
        window.history.pushState(
          {
            __daily_layer: currentLayers[currentLayers.length - 1],
            depth: historyDepthRef.current,
          },
          ''
        );
      }
    } else if (currentLayersCount < prevLayersCountRef.current) {
      // Layer(s) closed via in-app action
      const diff = prevLayersCountRef.current - currentLayersCount;
      if (historyDepthRef.current >= diff && diff > 0) {
        for (let i = 0; i < diff; i++) {
          if (historyDepthRef.current > 0) {
            historyDepthRef.current -= 1;
            isProgrammaticBackRef.current = true;
            window.history.back();
          }
        }
      }
    }

    prevLayersCountRef.current = currentLayersCount;
  }, [currentLayersCount]);
}
