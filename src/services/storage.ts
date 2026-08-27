import { User, Post, Message, Comment } from '../types';
import { INITIAL_CURRENT_USER, SAMPLE_USERS, INITIAL_POSTS, INITIAL_MESSAGES } from '../data/mockData';

const STORAGE_KEYS = {
  CURRENT_USER: 'daily_app_current_user_v1',
  USERS: 'daily_app_users_v1',
  POSTS: 'daily_app_posts_v1',
  MESSAGES: 'daily_app_messages_v1',
  ONBOARDED: 'daily_app_onboarded_v1',
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

  static getAllPosts(): Post[] {
    const data = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!data) {
      this.saveAllPosts(INITIAL_POSTS);
      return INITIAL_POSTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_POSTS;
    }
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

  // Create New Post with Streak Logic
  static createPost(payload: {
    content: string;
    imageUrl?: string;
    tags: string[];
  }): { post: Post; updatedUser: User; isNewStreakDay: boolean } {
    const currentUser = this.getCurrentUser();
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    const hasPostedToday = currentUser.lastPostedDate === today;
    const isConsecutive = currentUser.lastPostedDate === yesterday || hasPostedToday;

    let newCurrentStreak = currentUser.currentStreak;
    let newActivityDates = [...currentUser.activityDates];

    if (!hasPostedToday) {
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
      comments: [],
      createdAt: 'Just now',
      isDailyStreakPost: !hasPostedToday,
    };

    const posts = this.getAllPosts();
    this.saveAllPosts([newPost, ...posts]);

    return {
      post: newPost,
      updatedUser,
      isNewStreakDay: !hasPostedToday,
    };
  }

  // Send Direct Message
  static sendMessage(receiverId: string, text: string): Message {
    const currentUser = this.getCurrentUser();
    const convId = `conv_${[currentUser.id, receiverId].sort().join('_')}`;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: convId,
      senderId: currentUser.id,
      receiverId,
      text,
      timestamp: 'Just now',
      isRead: true,
    };

    const messages = this.getAllMessages();
    this.saveAllMessages([...messages, newMsg]);

    return newMsg;
  }

  // Reset demo data
  static resetToDefault(): void {
    localStorage.clear();
    this.saveCurrentUser(INITIAL_CURRENT_USER);
    this.saveAllUsers(SAMPLE_USERS);
    this.saveAllPosts(INITIAL_POSTS);
    this.saveAllMessages(INITIAL_MESSAGES);
    this.setOnboarded(true);
  }
}
