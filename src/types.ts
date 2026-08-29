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
  savedPostIds?: string[];
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
  postDate?: string; // YYYY-MM-DD format
  isReported?: boolean;
  viewsCount?: number;
  sharesCount?: number;
}

export type ReportReason =
  | 'spam'
  | 'inappropriate'
  | 'harassment'
  | 'misleading'
  | 'other';

export interface SharedPostPreview {
  id: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorStreak: number;
  content: string;
  imageUrl?: string;
  tags?: string[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  memberCount: number;
  memberIds: string[];
  category: string;
  lastActivity?: string;
  createdBy: string;
  createdAt: string;
  rules?: string[];
  pinnedTopic?: string;
  coverImage?: string;
}

export interface CommunityMemberRanking {
  user: User;
  rank: number;
  postsCount: number;
  messagesCount: number;
  streak: number;
  score: number;
  badgeTitle: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  text: string;
  imageUrl?: string;
  sharedPost?: SharedPostPreview;
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
