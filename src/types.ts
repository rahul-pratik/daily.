export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  interests: string[];
  habits: string[];
  currentStreak: number;
  longestStreak: number;
  totalPosts: number;
  activityDates: string[]; // ['2026-08-27', '2026-08-26', ...]
  followersCount: number;
  followingCount: number;
  followedUserIds: string[];
  lastPostedDate: string | null; // YYYY-MM-DD
  joinedDate: string;
  isCurrentUser?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  userStreak: number;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  name: string;
  username: string;
  userAvatar: string;
  userStreak: number;
  content: string;
  imageUrl?: string;
  tags: string[];
  likesCount: number;
  likedByMe: boolean;
  comments: Comment[];
  createdAt: string;
  isDailyStreakPost: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: Message;
  unreadCount: number;
}

export const AVAILABLE_INTERESTS = [
  'Coding',
  'AI',
  'Startups',
  'Fitness',
  'Reading',
  'Design',
  'Music',
  'Movies',
  'Photography',
  'Gaming',
  'Writing',
  'Crypto',
] as const;

export const AVAILABLE_HABITS = [
  'Gym',
  'Study',
  'Build Projects',
  'Read',
  'Run',
  'Meditate',
  'Cook Healthy',
  'Early Rise',
] as const;

export type NavigationTab = 'home' | 'streak' | 'create' | 'discover' | 'profile';
