import { User, Post, Message, Comment, Group, SharedPostPreview } from '../types';
import { INITIAL_CURRENT_USER, SAMPLE_USERS, INITIAL_POSTS, INITIAL_MESSAGES, SAMPLE_GROUPS } from '../data/mockData';

const STORAGE_KEYS = {
  CURRENT_USER: 'daily_app_current_user_v1',
  USERS: 'daily_app_users_v1',
  POSTS: 'daily_app_posts_v1',
  MESSAGES: 'daily_app_messages_v1',
  GROUPS: 'daily_app_groups_v1',
  ONBOARDED: 'daily_app_onboarded_v1',
  SAVED_POSTS: 'daily_app_saved_posts_v1',
  REPORTED_POSTS: 'daily_app_reported_posts_v1',
};

// Current reference date (today in the app context)
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export class DailyStorageService {
  static getCurrentUser(): User {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) {
      this.saveCurrentUser(INITIAL_CURRENT_USER);
      return INITIAL_CURRENT_USER;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CURRENT_USER;
    }
  }

  static saveCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  static getAllUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      this.saveAllUsers(SAMPLE_USERS);
      return SAMPLE_USERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return SAMPLE_USERS;
    }
  }

  static saveAllUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static ensurePostEngagement(post: Post): Post {
    const defaultViews = Math.max((post.likesCount || 0) * 6 + (post.comments?.length || 0) * 8 + 35, 12);
    const defaultShares = Math.max(Math.floor((post.likesCount || 0) * 0.25), 1);
    return {
      ...post,
      viewsCount: typeof post.viewsCount === 'number' ? post.viewsCount : defaultViews,
      sharesCount: typeof post.sharesCount === 'number' ? post.sharesCount : defaultShares,
    };
  }

  static getAllPosts(): Post[] {
    const data = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!data) {
      this.saveAllPosts(INITIAL_POSTS);
      return INITIAL_POSTS;
    }
    try {
      const parsed: Post[] = JSON.parse(data);
      return parsed.map((p) => this.ensurePostEngagement(p));
    } catch {
      return INITIAL_POSTS;
    }
  }

  static incrementPostViews(postId: string, amount: number = 1): Post[] {
    const posts = this.getAllPosts();
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          viewsCount: (p.viewsCount || 0) + amount,
        };
      }
      return p;
    });
    this.saveAllPosts(updated);
    return updated;
  }

  static saveAllPosts(posts: Post[]): void {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  }

  static getAllMessages(): Message[] {
    const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!data) {
      this.saveAllMessages(INITIAL_MESSAGES);
      return INITIAL_MESSAGES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MESSAGES;
    }
  }

  static saveAllMessages(messages: Message[]): void {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }

  static isOnboarded(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.ONBOARDED);
    return val === 'true';
  }

  static setOnboarded(status: boolean): void {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, status ? 'true' : 'false');
  }

  // Toggle follow
  static toggleFollowUser(targetUserId: string): { currentUser: User; updatedUsers: User[] } {
    const currentUser = this.getCurrentUser();
    const users = this.getAllUsers();
    const isFollowing = currentUser.followedUserIds.includes(targetUserId);

    let updatedFollowed: string[];
    let updatedFollowingCount: number;

    if (isFollowing) {
      updatedFollowed = currentUser.followedUserIds.filter(id => id !== targetUserId);
      updatedFollowingCount = Math.max(0, currentUser.followingCount - 1);
    } else {
      updatedFollowed = [...currentUser.followedUserIds, targetUserId];
      updatedFollowingCount = currentUser.followingCount + 1;
    }

    const updatedCurrentUser: User = {
      ...currentUser,
      followedUserIds: updatedFollowed,
      followingCount: updatedFollowingCount,
    };
    this.saveCurrentUser(updatedCurrentUser);

    const updatedUsers = users.map(u => {
      if (u.id === targetUserId) {
        return {
          ...u,
          followersCount: isFollowing ? Math.max(0, u.followersCount - 1) : u.followersCount + 1,
        };
      }
      return u;
    });
    this.saveAllUsers(updatedUsers);

    return { currentUser: updatedCurrentUser, updatedUsers };
  }

  // Toggle Like on Post
  static toggleLikePost(postId: string): Post[] {
    const posts = this.getAllPosts();
    const updated = posts.map(post => {
      if (post.id === postId) {
        const liked = !post.likedByMe;
        return {
          ...post,
          likedByMe: liked,
          likesCount: liked ? post.likesCount + 1 : Math.max(0, post.likesCount - 1),
        };
      }
      return post;
    });
    this.saveAllPosts(updated);
    return updated;
  }

  // Add Comment
  static addComment(postId: string, content: string): { posts: Post[]; comment: Comment } {
    const user = this.getCurrentUser();
    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      postId,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      userStreak: user.currentStreak,
      content,
      createdAt: 'Just now',
    };

    const posts = this.getAllPosts();
    const updated = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [newComment, ...(post.comments || [])],
        };
      }
      return post;
    });

    this.saveAllPosts(updated);
    return { posts: updated, comment: newComment };
  }

  // Check if user has already posted today (strictly 1 photo/tweet of the day limit)
  static hasUserPostedToday(userId?: string): boolean {
    const currentUser = this.getCurrentUser();
    const targetId = userId || currentUser.id;
    const today = getTodayDateString();
    if (targetId === currentUser.id && currentUser.lastPostedDate === today) {
      return true;
    }
    const posts = this.getAllPosts();
    return posts.some((p) => p.userId === targetId && p.postDate === today);
  }

  static getTodayPostForUser(userId?: string): Post | undefined {
    const currentUser = this.getCurrentUser();
    const targetId = userId || currentUser.id;
    const today = getTodayDateString();
    const posts = this.getAllPosts();
    return posts.find((p) => p.userId === targetId && p.postDate === today);
  }

  // Create New Post with 1-post-per-day limit and Streak Logic
  static createPost(payload: {
    content: string;
    imageUrl?: string;
    tags: string[];
  }): { post: Post; updatedUser: User; isNewStreakDay: boolean; error?: string } {
    const currentUser = this.getCurrentUser();
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    const alreadyPostedToday = this.hasUserPostedToday(currentUser.id);
    if (alreadyPostedToday) {
      const existing = this.getTodayPostForUser(currentUser.id);
      if (existing) {
        return {
          post: existing,
          updatedUser: currentUser,
          isNewStreakDay: false,
          error: 'You have already uploaded today, please upload tomorrow',
        };
      }
    }

    const isConsecutive = currentUser.lastPostedDate === yesterday || currentUser.lastPostedDate === today;

    let newCurrentStreak = currentUser.currentStreak;
    let newActivityDates = [...currentUser.activityDates];

    if (!alreadyPostedToday) {
      if (isConsecutive || currentUser.currentStreak === 0) {
        newCurrentStreak = currentUser.currentStreak + 1;
      } else {
        // Streak was broken if more than 1 day passed, start fresh at 1
        newCurrentStreak = 1;
      }
      if (!newActivityDates.includes(today)) {
        newActivityDates = [today, ...newActivityDates];
      }
    }

    const newLongestStreak = Math.max(currentUser.longestStreak, newCurrentStreak);
    const newTotalPosts = currentUser.totalPosts + 1;

    const updatedUser: User = {
      ...currentUser,
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalPosts: newTotalPosts,
      activityDates: newActivityDates,
      lastPostedDate: today,
    };

    this.saveCurrentUser(updatedUser);

    const newPost: Post = {
      id: `post_${Date.now()}`,
      userId: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      userAvatar: updatedUser.avatar,
      userStreak: newCurrentStreak,
      content: payload.content,
      imageUrl: payload.imageUrl,
      tags: payload.tags,
      likesCount: 0,
      likedByMe: false,
      viewsCount: 1,
      sharesCount: 0,
      comments: [],
      createdAt: 'Just now',
      isDailyStreakPost: true,
      postDate: today,
    };

    const posts = this.getAllPosts();
    this.saveAllPosts([newPost, ...posts]);

    return {
      post: newPost,
      updatedUser,
      isNewStreakDay: true,
    };
  }

  // Saved Posts
  static getSavedPostIds(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_POSTS);
    if (!data) {
      const initial = ['post_1', 'post_3'];
      this.saveSavedPostIds(initial);
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return ['post_1', 'post_3'];
    }
  }

  static saveSavedPostIds(ids: string[]): void {
    localStorage.setItem(STORAGE_KEYS.SAVED_POSTS, JSON.stringify(ids));
  }

  static toggleSavePost(postId: string): { savedPostIds: string[]; isSaved: boolean } {
    const current = this.getSavedPostIds();
    const isSaved = current.includes(postId);
    const updated = isSaved ? current.filter((id) => id !== postId) : [postId, ...current];
    this.saveSavedPostIds(updated);
    return { savedPostIds: updated, isSaved: !isSaved };
  }

  // Reported Posts
  static getReportedPostIds(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTED_POSTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveReportedPostIds(ids: string[]): void {
    localStorage.setItem(STORAGE_KEYS.REPORTED_POSTS, JSON.stringify(ids));
  }

  static reportPost(postId: string, reason: string): { reportedPostIds: string[]; success: boolean } {
    const current = this.getReportedPostIds();
    const updated = Array.from(new Set([...current, postId]));
    this.saveReportedPostIds(updated);
    return { reportedPostIds: updated, success: true };
  }

  // Groups
  static getAllGroups(): Group[] {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (!data) {
      this.saveAllGroups(SAMPLE_GROUPS);
      return SAMPLE_GROUPS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return SAMPLE_GROUPS;
    }
  }

  static saveAllGroups(groups: Group[]): void {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }

  static createGroup(params: {
    name: string;
    description: string;
    avatar?: string;
    category: string;
    memberIds: string[];
  }): Group {
    const currentUser = this.getCurrentUser();
    const newGroup: Group = {
      id: `group_${Date.now()}`,
      name: params.name,
      description: params.description || 'Daily accountability and motivation group',
      avatar:
        params.avatar ||
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
      category: params.category || 'General',
      memberIds: Array.from(new Set([currentUser.id, ...params.memberIds])),
      memberCount: Array.from(new Set([currentUser.id, ...params.memberIds])).length,
      lastActivity: 'Just now',
      createdBy: currentUser.id,
      createdAt: getTodayDateString(),
    };

    const groups = this.getAllGroups();
    this.saveAllGroups([newGroup, ...groups]);

    // Send an initial system/intro message to the new group
    this.sendMessage({
      groupId: newGroup.id,
      text: `🎉 Created the group "${newGroup.name}"! Start sharing your daily habits and wins!`,
    });

    return newGroup;
  }

  static toggleJoinGroup(groupId: string): { groups: Group[]; isMember: boolean } {
    const currentUser = this.getCurrentUser();
    const groups = this.getAllGroups();
    let isMember = false;

    const updated = groups.map((g) => {
      if (g.id === groupId) {
        const hasJoined = (g.memberIds || []).includes(currentUser.id);
        const nextMemberIds = hasJoined
          ? (g.memberIds || []).filter((id) => id !== currentUser.id)
          : [...(g.memberIds || []), currentUser.id];
        isMember = !hasJoined;
        return {
          ...g,
          memberIds: nextMemberIds,
          memberCount: nextMemberIds.length,
        };
      }
      return g;
    });

    this.saveAllGroups(updated);
    return { groups: updated, isMember };
  }

  // Send Direct or Group Message (with optional photo / shared post attachment)
  static sendMessage(params: {
    receiverId?: string;
    groupId?: string;
    text: string;
    imageUrl?: string;
    sharedPost?: SharedPostPreview;
  }): Message {
    const currentUser = this.getCurrentUser();
    let convId = '';

    if (params.groupId) {
      convId = `conv_${params.groupId}`;
    } else if (params.receiverId) {
      convId = `conv_${[currentUser.id, params.receiverId].sort().join('_')}`;
    } else {
      convId = `conv_general_${Date.now()}`;
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: convId,
      senderId: currentUser.id,
      receiverId: params.receiverId,
      groupId: params.groupId,
      text: params.text,
      imageUrl: params.imageUrl,
      sharedPost: params.sharedPost,
      timestamp: 'Just now',
      isRead: true,
    };

    const messages = this.getAllMessages();
    this.saveAllMessages([...messages, newMsg]);

    // Update group last activity if applicable
    if (params.groupId) {
      const groups = this.getAllGroups();
      const updated = groups.map((g) =>
        g.id === params.groupId ? { ...g, lastActivity: 'Just now' } : g
      );
      this.saveAllGroups(updated);
    }

    return newMsg;
  }

  // Share a Post to multiple friends and groups in one go
  static sharePostToRecipients(
    postOrParams:
      | Post
      | {
          post: Post;
          recipientUserIds: string[];
          recipientGroupIds: string[];
          note?: string;
        },
    recipientUserIds?: string[],
    recipientGroupIds?: string[],
    note?: string
  ): Message[] {
    let post: Post;
    let userIds: string[] = [];
    let groupIds: string[] = [];
    let noteText: string | undefined;

    if ('post' in postOrParams && postOrParams.post) {
      post = postOrParams.post;
      userIds = postOrParams.recipientUserIds || [];
      groupIds = postOrParams.recipientGroupIds || [];
      noteText = postOrParams.note;
    } else {
      post = postOrParams as Post;
      userIds = recipientUserIds || [];
      groupIds = recipientGroupIds || [];
      noteText = note;
    }

    const sharedPreview: SharedPostPreview = {
      id: post.id,
      userId: post.userId,
      authorName: post.name || 'User',
      authorUsername: post.username || 'user',
      authorAvatar: post.userAvatar || (post as any).avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      authorStreak: post.userStreak ?? (post as any).streak ?? 1,
      content: post.content || '',
      imageUrl: post.imageUrl,
      tags: post.tags || [],
    };

    const createdMessages: Message[] = [];
    const textMessage =
      noteText && noteText.trim()
        ? noteText.trim()
        : `Shared a post from @${post.username} ⚡️`;

    // Send to each friend
    for (const uId of userIds) {
      const msg = this.sendMessage({
        receiverId: uId,
        text: textMessage,
        sharedPost: sharedPreview,
      });
      createdMessages.push(msg);
    }

    // Send to each group
    for (const gId of groupIds) {
      const msg = this.sendMessage({
        groupId: gId,
        text: textMessage,
        sharedPost: sharedPreview,
      });
      createdMessages.push(msg);
    }

    // Increment shares count on the post
    const totalRecipients = userIds.length + groupIds.length;
    if (totalRecipients > 0) {
      const allPosts = this.getAllPosts();
      const updatedPosts = allPosts.map((p) => {
        if (p.id === post.id) {
          return {
            ...p,
            sharesCount: (p.sharesCount || 0) + totalRecipients,
          };
        }
        return p;
      });
      this.saveAllPosts(updatedPosts);
    }

    return createdMessages;
  }

  // Reset demo data
  static resetToDefault(): void {
    localStorage.clear();
    this.saveCurrentUser(INITIAL_CURRENT_USER);
    this.saveAllUsers(SAMPLE_USERS);
    this.saveAllPosts(INITIAL_POSTS);
    this.saveAllMessages(INITIAL_MESSAGES);
    this.saveAllGroups(SAMPLE_GROUPS);
    this.saveSavedPostIds(['post_1', 'post_3']);
    this.saveReportedPostIds([]);
    this.setOnboarded(true);
  }
}
