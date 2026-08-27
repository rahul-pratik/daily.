/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Post, Message, Group, NavigationTab, ReportReason } from './types';
import { DailyStorageService } from './services/storage';
import { TopHeader, BottomNavigation } from './components/Navigation';
import { HomeFeed } from './components/HomeFeed';
import { StreakScreen } from './components/StreakScreen';
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
import { vibratePostSubmit, vibrateLight } from './services/haptics';

export default function App() {
  // Main Data States
  const [currentUser, setCurrentUser] = useState<User>(() => DailyStorageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => DailyStorageService.getAllUsers());
  const [groups, setGroups] = useState<Group[]>(() => DailyStorageService.getAllGroups());
  const [posts, setPosts] = useState<Post[]>(() => DailyStorageService.getAllPosts());
  const [messages, setMessages] = useState<Message[]>(() => DailyStorageService.getAllMessages());
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => DailyStorageService.getSavedPostIds());
  const [reportedPostIds, setReportedPostIds] = useState<string[]>(() => DailyStorageService.getReportedPostIds());
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => DailyStorageService.isOnboarded());

  // UI Navigation & Modals
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDMsOpen, setIsDMsOpen] = useState(false);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [sharingPost, setSharingPost] = useState<Post | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeProfileUser, setActiveProfileUser] = useState<User | null>(null);

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

  // Calculate unread direct messages count
  const unreadMessagesCount = messages.filter(
    (m) => (m.receiverId === currentUser.id || (m.groupId && m.senderId !== currentUser.id)) && !m.isRead
  ).length;

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
    // Also update active comments post if open
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
  const handleCreatePost = (payload: { content: string; imageUrl?: string; tags: string[] }) => {
    const result = DailyStorageService.createPost(payload);
    if (result.error) {
      return;
    }
    setPosts((prev) => [result.post, ...prev]);
    setCurrentUser(result.updatedUser);
    setIsCreateOpen(false);

    // Tactile haptic vibration feedback on submission
    vibratePostSubmit();

    // Show celebration modal
    setCelebrationState({
      isOpen: true,
      streakCount: result.updatedUser.currentStreak,
      isNewStreakDay: result.isNewStreakDay,
    });
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
          const memberUser = users.find((u) => u.id === randomMemberId);
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
        }, 1500);
      }
    }
  };

  // Open Direct Message modal with a specific user
  const handleStartDMWithUser = (targetUser: { id: string }) => {
    setActiveChatUserId(targetUser.id);
    setActiveGroupId(null);
    setIsDMsOpen(true);
  };

  // Open Direct Message modal with a specific group
  const handleStartGroupChat = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveChatUserId(null);
    setIsDMsOpen(true);
  };

  // Create new Group
  const handleCreateGroup = (groupData: {
    name: string;
    description: string;
    category: string;
    avatar?: string;
    memberIds: string[];
  }) => {
    const newGroup = DailyStorageService.createGroup(groupData);
    setGroups((prev) => [newGroup, ...prev]);
    setIsCreateGroupOpen(false);
    // Automatically open chat with the new group
    setActiveGroupId(newGroup.id);
    setActiveChatUserId(null);
    setIsDMsOpen(true);
  };

  // Open Share modal for a post
  const handleOpenShare = (post: Post) => {
    vibrateLight();
    setSharingPost(post);
  };

  // Send shared post to friends & groups
  const handleSendSharedPost = (
    postOrParams: any,
    recipientUserIds?: string[],
    recipientGroupIds?: string[],
    note?: string
  ) => {
    let postToShare = sharingPost;
    let uIds: string[] = [];
    let gIds: string[] = [];
    let nText: string | undefined = undefined;

    if (postOrParams && postOrParams.id && postOrParams.content !== undefined) {
      postToShare = postOrParams;
      uIds = recipientUserIds || [];
      gIds = recipientGroupIds || [];
      nText = note;
    } else if (postOrParams && postOrParams.post) {
      postToShare = postOrParams.post;
      uIds = postOrParams.recipientUserIds || [];
      gIds = postOrParams.recipientGroupIds || [];
      nText = postOrParams.note;
    } else if (postOrParams && postOrParams.recipientUserIds) {
      uIds = postOrParams.recipientUserIds || [];
      gIds = postOrParams.recipientGroupIds || [];
      nText = postOrParams.note;
    }

    if (!postToShare) return;

    DailyStorageService.sharePostToRecipients(
      postToShare,
      uIds,
      gIds,
      nText
    );
    // Synchronize latest messages state
    setMessages(DailyStorageService.getAllMessages());
    setSharingPost(null);
  };

  // View post details
  const handleViewPostFromId = (postId: string) => {
    const found = posts.find((p) => p.id === postId);
    if (found) {
      setCommentsPost(found);
    }
  };

  // Edit Profile save
  const handleSaveProfile = (updatedProps: Partial<User>) => {
    const updated = { ...currentUser, ...updatedProps };
    setCurrentUser(updated);
    DailyStorageService.saveCurrentUser(updated);
  };

  // View specific user profile modal
  const handleViewUser = (target: { id: string; name?: string; username?: string; avatar?: string; streak?: number }) => {
    if (target.id === currentUser.id) {
      setCurrentTab('profile');
      return;
    }
    const found = users.find((u) => u.id === target.id);
    if (found) {
      setActiveProfileUser(found);
    } else {
      // Fallback
      setActiveProfileUser({
        id: target.id,
        name: target.name || 'User',
        username: target.username || 'user',
        avatar: target.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        bio: 'Daily habit builder',
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
      });
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
    setPosts(DailyStorageService.getAllPosts());
    setMessages(DailyStorageService.getAllMessages());
    setSavedPostIds(DailyStorageService.getSavedPostIds());
    setReportedPostIds(DailyStorageService.getReportedPostIds());
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex justify-center font-sans antialiased selection:bg-[#FF4D00] selection:text-black">
      {/* Mobile-first centered frame container */}
      <div className="w-full max-w-lg min-h-screen bg-[#050505] flex flex-col shadow-2xl relative border-x border-white/5">
        {/* Top Header */}
        <TopHeader
          currentUser={currentUser}
          onOpenDMs={() => {
            setActiveChatUserId(null);
            setActiveGroupId(null);
            setIsDMsOpen(true);
          }}
          unreadCount={unreadMessagesCount}
          onSelectTab={setCurrentTab}
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
              onViewUser={handleViewUser}
              savedPostIds={savedPostIds}
              reportedPostIds={reportedPostIds}
              onToggleSave={handleToggleSave}
              onReportPost={handleStartReport}
              onSharePost={handleOpenShare}
            />
          )}

          {currentTab === 'streak' && (
            <StreakScreen
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
            />
          )}

          {currentTab === 'discover' && (
            <DiscoverScreen
              users={users}
              currentUser={currentUser}
              onToggleFollow={handleToggleFollow}
              onSendDM={handleStartDMWithUser}
              onViewUser={handleViewUser}
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

        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={isCreateGroupOpen}
          currentUser={currentUser}
          allUsers={users}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreateGroup={handleCreateGroup}
        />

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

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          currentUser={currentUser}
          posts={posts}
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
          onViewUser={handleViewUser}
        />

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={currentUser}
          onSave={handleSaveProfile}
        />
      </div>
    </div>
  );
}
