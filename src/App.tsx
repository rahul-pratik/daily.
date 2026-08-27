/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Post, Message, NavigationTab } from './types';
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
import { vibratePostSubmit } from './services/haptics';

export default function App() {
  // Main Data States
  const [currentUser, setCurrentUser] = useState<User>(() => DailyStorageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => DailyStorageService.getAllUsers());
  const [posts, setPosts] = useState<Post[]>(() => DailyStorageService.getAllPosts());
  const [messages, setMessages] = useState<Message[]>(() => DailyStorageService.getAllMessages());
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => DailyStorageService.isOnboarded());

  // UI Navigation & Modals
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDMsOpen, setIsDMsOpen] = useState(false);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
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
    (m) => m.receiverId === currentUser.id && !m.isRead
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
    const { post: newPost, updatedUser, isNewStreakDay } = DailyStorageService.createPost(payload);
    setPosts((prev) => [newPost, ...prev]);
    setCurrentUser(updatedUser);
    setIsCreateOpen(false);

    // Tactile haptic vibration feedback on submission
    vibratePostSubmit();

    // Show celebration modal
    setCelebrationState({
      isOpen: true,
      streakCount: updatedUser.currentStreak,
      isNewStreakDay,
    });
  };

  // Send Direct Message & Simulate Friendly Reply
  const handleSendMessage = (receiverId: string, text: string) => {
    const newMsg = DailyStorageService.sendMessage(receiverId, text);
    setMessages((prev) => [...prev, newMsg]);

    // Simulated reply from recipient after 1.4 seconds
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
  };

  // Open Direct Message modal with a specific user
  const handleStartDMWithUser = (targetUser: { id: string }) => {
    setActiveChatUserId(targetUser.id);
    setIsDMsOpen(true);
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

  // Reset demo data
  const handleResetData = () => {
    DailyStorageService.resetToDefault();
    setCurrentUser(DailyStorageService.getCurrentUser());
    setUsers(DailyStorageService.getAllUsers());
    setPosts(DailyStorageService.getAllPosts());
    setMessages(DailyStorageService.getAllMessages());
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
            />
          )}

          {currentTab === 'streak' && (
            <StreakScreen
              currentUser={currentUser}
              posts={posts}
              onOpenCreate={() => setIsCreateOpen(true)}
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
              onToggleLike={handleToggleLike}
              onOpenComments={(post) => setCommentsPost(post)}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              onResetData={handleResetData}
            />
          )}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNavigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          currentUser={currentUser}
          onOpenDMs={() => setIsDMsOpen(true)}
          unreadMessagesCount={unreadMessagesCount}
          onOpenCreate={() => setIsCreateOpen(true)}
        />

        {/* Modals */}
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
          onSubmitPost={handleCreatePost}
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

        {/* Direct Messages Modal */}
        <DirectMessagesModal
          isOpen={isDMsOpen}
          onClose={() => {
            setIsDMsOpen(false);
            setActiveChatUserId(null);
          }}
          currentUser={currentUser}
          allUsers={users}
          messages={messages}
          onSendMessage={handleSendMessage}
          initialChatUserId={activeChatUserId}
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
