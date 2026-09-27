import { User, Post, Message, Group, PersonalHabit, Community, AppNotification, UserNote, DEFAULT_USER_AVATAR } from '../types';

// Helper to generate past dates
export const getPastDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_USER_NOTES: UserNote[] = [];

export const INITIAL_CURRENT_USER: User = {
  id: 'user_me',
  name: '',
  username: '',
  avatar: DEFAULT_USER_AVATAR,
  bio: '',
  interests: [],
  habits: [],
  currentStreak: 0,
  longestStreak: 0,
  totalPosts: 0,
  activityDates: [],
  followersCount: 0,
  followingCount: 0,
  followedUserIds: [],
  blockedUserIds: [],
  mutedUserIds: [],
  lastPostedDate: null,
  joinedDate: new Date().toISOString().split('T')[0],
  proofCollections: [],
  isCurrentUser: true,
};

export const INITIAL_PERSONAL_HABITS: PersonalHabit[] = [];

export const SAMPLE_USERS: User[] = [];

export const INITIAL_POSTS: Post[] = [];

export const SAMPLE_GROUPS: Group[] = [];

export const INITIAL_COMMUNITIES: Community[] = [];

export const INITIAL_MESSAGES: Message[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];
