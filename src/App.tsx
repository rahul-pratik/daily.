/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Post, Message, Group, Community, NavigationTab, ReportReason, AppNotification, ProofCollection, PostDraft } from './types';
import { DailyStorageService } from './services/storage';
import { TopHeader, BottomNavigation } from './components/Navigation';
import { HomeFeed } from './components/HomeFeed';
import { ChallengesScreen } from './components/ChallengesScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { CreatePostModal } from './components/CreatePostModal';
import { StreakCelebrationModal } from './components/StreakCelebrationModal';
import { CommentsModal } from './components/CommentsModal';
import { DirectMessagesModal } from './components/DirectMessagesModal';
import { OnboardingModal } from './components/OnboardingModal';
import { EditProfileModal } from './components/EditProfileModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ReportModal } from './components/ReportModal';
import { ShareModal } from './components/ShareModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { CreateCommunityModal } from './components/CreateCommunityModal';
import { CommunityHubModal } from './components/CommunityHubModal';
import { PostInsightsModal } from './components/PostInsightsModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CreateCollectionModal } from './components/CreateCollectionModal';
import { AddToCollectionModal } from './components/AddToCollectionModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { StreakFreezeAlertModal } from './components/StreakFreezeAlertModal';
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

  // UI Navigation & Modals
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDMsOpen, setIsDMsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [selectedPostForCollection, setSelectedPostForCollection] = useState<Post | null>(null);

  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [insightsPost, setInsightsPost] = useState<Post | null>(null);
  const [postPendingDelete, setPostPendingDelete] = useState<Post | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [activeCommunityHub, setActiveCommunityHub] = useState<Community | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeProfileUser, setActiveProfileUser] = useState<User | null>(null);
  const [activeDraftToEdit, setActiveDraftToEdit] = useState<PostDraft | null>(null);

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

  // Streak freeze used notification alert modal state
  const [isStreakFreezeAlertOpen, setIsStreakFreezeAlertOpen] = useState(false);

  useEffect(() => {
    const handleFreezeUsed = () => {
      setCurrentUser(DailyStorageService.getCurrentUser());
      setNotifications(DailyStorageService.getAllNotifications());
      setIsStreakFreezeAlertOpen(true);
    };

    window.addEventListener('daily:streak-freeze-used', handleFreezeUsed);
    return () => {
      window.removeEventListener('daily:streak-freeze-used', handleFreezeUsed);
    };
  }, []);

  // Calculate unread counts
  const unreadMessagesCount = messages.filter(
    (m) => (m.receiverId === currentUser.id || (m.groupId && m.senderId !== currentUser.id)) && !m.isRead
  ).length;

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  // Onboarding completion handler
  const handleCompleteOnboarding = (updatedUserProps: Partial<User>) => {
    const updated = { ...currentUser, ...updatedUserProps };
    setCurrentUser(updated);
    DailyStorageService.saveCurrentUser(updated);
    DailyStorageService.setOnboarded(true);
    setIsOnboarded(true);
  };

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

  // Create Post Handler with Streak and Confetti Animation
  const handleCreatePost = (payload: {
    content: string;
    imageUrl?: string;
    tags: string[];
    isMainPost?: boolean;
    communityId?: string;
    communityName?: string;
    isCollage?: boolean;
  }) => {
    const result = DailyStorageService.createPost(payload);
    if (result.error) {
      return;
    }
    setPosts((prev) => [result.post, ...prev]);
    setCurrentUser(result.updatedUser);
    setIsCreateOpen(false);

    // Tactile haptic vibration feedback on submission
    vibratePostSubmit();

    // Show celebration modal only if it was a new main streak day
    if (result.isNewStreakDay) {
      setCelebrationState({
        isOpen: true,
        streakCount: result.updatedUser.currentStreak,
        isNewStreakDay: result.isNewStreakDay,
      });
    }
  };

  // Update 3 discipline milestones
  const handleUpdateMilestones = (milestoneIds: string[]) => {
    const updated = DailyStorageService.updateDisciplineMilestones(milestoneIds);
    setCurrentUser(updated);
  };

  // Send Message (Direct 1:1 or Group Chat)
  const handleSendMessage = (params: {
    receiverId?: string;
    groupId?: string;
    text: string;
    imageUrl?: string;
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
            isRead: isDMsOpen && activeChatUserId === receiverId,
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
            isRead: isDMsOpen && activeGroupId === groupId,
          };
          const allMsg = DailyStorageService.getAllMessages();
          DailyStorageService.saveAllMessages([...allMsg, replyMsg]);
          setMessages((prev) => [...prev, replyMsg]);
        }, 1600);
      }
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

    // Open chat for newly created group
    setActiveGroupId(group.id);
    setActiveChatUserId(null);
    setIsDMsOpen(true);
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
  }) => {
    const community = DailyStorageService.createCommunity({
      name: params.name,
      description: params.description,
      category: params.category,
      accessType: params.accessType,
      avatar: params.avatar || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
      coverImage: params.coverImage,
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
  const handleSaveProfile = (updatedProps: Partial<User>) => {
    const updated = { ...currentUser, ...updatedProps };
    setCurrentUser(updated);
    DailyStorageService.saveCurrentUser(updated);
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
    const { posts: updatedPosts, updatedUser } = DailyStorageService.deletePost(postId);
    setPosts(updatedPosts);
    setCurrentUser(updatedUser);
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
      setActiveChatUserId(recipientUserIds[0]);
      setActiveGroupId(null);
    } else if (recipientGroupIds.length > 0) {
      setActiveGroupId(recipientGroupIds[0]);
      setActiveChatUserId(null);
    }
    setIsDMsOpen(true);
  };

  // View full profile of another user
  const handleViewUser = (user: User) => {
    setActiveProfileUser(user);
  };

  // View user from simplified user object (from notifications/DMs/etc)
  const handleViewSimplifiedUser = (user: { id: string; name: string; username: string; avatar: string; streak: number }) => {
    const fullUser = users.find((u) => u.id === user.id);
    if (fullUser) {
      setActiveProfileUser(fullUser);
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
    setActiveChatUserId(target.id);
    setActiveGroupId(null);
    setIsDMsOpen(true);
    if (activeProfileUser) {
      setActiveProfileUser(null);
    }

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

  const handleOpenChallenge = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setCurrentTab('streak');
    setIsDMsOpen(false);
  };

  const handleOpenDMWithGroup = (groupId: string) => {
    setGroups(DailyStorageService.getAllGroups());
    setMessages(DailyStorageService.getAllMessages());
    setActiveGroupId(groupId);
    setActiveChatUserId(null);
    setIsDMsOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex justify-center font-sans antialiased selection:bg-[#D4AF37] selection:text-black">
      {/* Mobile-first centered frame container */}
      <div className="w-full max-w-lg min-h-screen bg-[#050505] flex flex-col shadow-2xl relative border-x border-white/5">
        {/* Top Header */}
        <TopHeader
          currentUser={currentUser}
          onOpenDMs={() => {
            setGroups(DailyStorageService.getAllGroups());
            setMessages(DailyStorageService.getAllMessages());
            setActiveChatUserId(null);
            setActiveGroupId(null);
            setIsDMsOpen(true);
          }}
          unreadCount={unreadMessagesCount}
          onSelectTab={setCurrentTab}
          unreadNotificationsCount={unreadNotificationsCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        {/* Main Tab Screens */}
        <main className="flex-1 flex flex-col">
          {currentTab === 'home' && (
            <HomeFeed
              posts={posts}
              currentUser={currentUser}
              onToggleLike={handleToggleLike}
              onOpenComments={(post) => setCommentsPost(post)}
              onToggleFollow={handleToggleFollow}
              onSendDM={handleStartDMWithUser}
              onOpenCreate={() => setIsCreateOpen(true)}
              onSelectTab={setCurrentTab}
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
              onUpdateMilestones={handleUpdateMilestones}
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
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNavigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          onOpenDMs={() => {
            setActiveChatUserId(null);
            setActiveGroupId(null);
            setIsDMsOpen(true);
          }}
          unreadMessagesCount={unreadMessagesCount}
          onOpenCreate={() => setIsCreateOpen(true)}
        />

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
          onOpenStreakFreezeAlert={() => setIsStreakFreezeAlertOpen(true)}
        />

        {/* Create Proof Collection Modal */}
        <CreateCollectionModal
          isOpen={isCreateCollectionOpen}
          onClose={() => setIsCreateCollectionOpen(false)}
          userPosts={posts}
          onCreateCollection={handleCreateCollection}
        />

        {/* Add Post to Collection Modal */}
        <AddToCollectionModal
          isOpen={!!selectedPostForCollection}
          onClose={() => setSelectedPostForCollection(null)}
          post={selectedPostForCollection}
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
            setActiveChatUserId(userId);
            setActiveGroupId(null);
            setIsDMsOpen(true);
          }}
          onOpenGroupChat={(groupId) => {
            setSharingPost(null);
            setActiveGroupId(groupId);
            setActiveChatUserId(null);
            setIsDMsOpen(true);
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
          onClose={() => setIsCreateCommunityOpen(false)}
          onCreateCommunity={handleCreateCommunity}
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
        <UserProfileModal
          isOpen={!!activeProfileUser}
          user={activeProfileUser}
          currentUser={currentUser}
          posts={posts}
          onClose={() => setActiveProfileUser(null)}
          onToggleFollow={handleToggleFollow}
          onSendDM={handleStartDMWithUser}
          onToggleLike={handleToggleLike}
          onOpenComments={(post) => setCommentsPost(post)}
        />

        {/* Onboarding modal if not onboarded */}
        <OnboardingModal
          isOpen={!isOnboarded}
          initialUser={currentUser}
          onComplete={handleCompleteOnboarding}
        />

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
        />

        {/* Direct Messages & Group Chat Modal */}
        <DirectMessagesModal
          isOpen={isDMsOpen}
          onClose={() => {
            setIsDMsOpen(false);
            setActiveChatUserId(null);
            setActiveGroupId(null);
          }}
          currentUser={currentUser}
          allUsers={users}
          allGroups={groups}
          messages={messages}
          onSendMessage={handleSendMessage}
          initialChatUserId={activeChatUserId}
          initialGroupId={activeGroupId}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          onViewPost={handleViewPostFromId}
          onViewUser={handleViewSimplifiedUser}
          onOpenChallenge={handleOpenChallenge}
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
          onClose={() => setIsSearchOpen(false)}
          users={users}
          communities={communities}
          posts={posts}
          onSelectUser={(user) => {
            handleViewUser(user);
          }}
          onSelectCommunity={(comm) => {
            setActiveCommunityHub(comm);
          }}
          onSelectPost={(post) => {
            handleViewPostFromId(post.id);
          }}
          onSelectTag={(tag) => {
            setCurrentTab('discover');
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

        {/* Global Streak Freeze Used Notification Alert Modal */}
        <StreakFreezeAlertModal
          isOpen={isStreakFreezeAlertOpen}
          onClose={() => setIsStreakFreezeAlertOpen(false)}
          currentUser={currentUser}
          streakCount={currentUser.currentStreak}
          onOpenNotifications={() => {
            setIsStreakFreezeAlertOpen(false);
            setIsNotificationsOpen(true);
          }}
          onOpenChallenges={() => {
            setIsStreakFreezeAlertOpen(false);
            setCurrentTab('streak');
          }}
        />
      </div>
    </div>
  );
}
