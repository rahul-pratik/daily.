export interface ProofCollection {
  id: string;
  name: string; // e.g. "Running", "Coding", "Gym", "Design"
  description?: string;
  icon?: string; // emoji or icon
  coverImageUrl?: string;
  postIds: string[];
  createdAt: string;
  updatedAt: string;
}

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
  blockedUserIds?: string[];
  proofCollections?: ProofCollection[];
  isCurrentUser?: boolean;
  streakFreezes?: number; // Available streak freezes earned through challenges
  streakFreezeActive?: boolean; // Whether active streak protection is equipped for next missed day
  lastStreakFreezeUsedDate?: string; // Date streak freeze was last consumed
}

export interface PersonalHabit {
  id: string;
  title: string;
  category: 'Fitness' | 'Productivity' | 'Mindfulness' | 'Learning' | 'Health' | 'Creativity';
  icon: string;
  color: string;
  targetDaysPerWeek: number;
  completedDates: string[]; // ['2026-08-29', ...]
  streak: number;
  createdAt: string;
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

export interface ChallengeWeeklyRecap {
  id: string;
  challengeId: string;
  challengeTitle: string;
  challengeIcon: string;
  challengeType: ChallengeType;
  weekNumber: number;
  startDate: string; // e.g. "2026-08-27"
  endDate: string; // e.g. "2026-09-02"
  totalCollectiveCheckins: number;
  activeSquadsCount: number;
  cohortConsistencyRate: number; // percentage e.g. 92
  topSquad?: {
    id: string;
    name: string;
    motto?: string;
    checkinsCount: number;
    memberCount: number;
  };
  mvpContributor: {
    userId: string;
    userName: string;
    userUsername: string;
    userAvatar: string;
    userStreak: number;
    weeklyCheckins: number;
    cheersReceived: number;
    teamName?: string;
    mvpTitle: string; // e.g. "👑 Iron Consistency MVP"
    accolade: string; // e.g. "Submitted 7/7 verified photo proofs & earned 38 cheers!"
  };
  highlights: string[];
  generatedAt: string;
  isPublished?: boolean;
  publishedPostId?: string;
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
  imageUrls?: string[]; // Multiple photos bundled in 1 post to prevent feed spam
  tags: string[];
  likesCount: number;
  likedByMe: boolean;
  comments: Comment[];
  createdAt: string;
  isDailyStreakPost: boolean;
  postDate?: string; // YYYY-MM-DD format
  communityId?: string; // Optional community target
  communityName?: string; // Community name display
  isMainPost?: boolean; // Whether this is user's 1 Main Post for the day
  isCollage?: boolean; // If generated via multi-post collab photo stitch
  isReported?: boolean;
  viewsCount?: number;
  sharesCount?: number;
  isChallengeRecap?: boolean;
  challengeRecapData?: ChallengeWeeklyRecap;
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

export interface UserNote {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  text: string; // Words only, no photos, no videos, max 60 chars
  musicTitle?: string; // Optional song/audio title e.g. "Faasla • Madhur Sharma"
  musicArtist?: string;
  createdAt: number;
  expiresAt?: number;
}

export interface PostDraft {
  id: string;
  title?: string;
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  tags: string[];
  updatedAt: number;
  scheduledAt?: string; // ISO string e.g. "2026-09-01T09:00"
  isScheduled?: boolean;
  communityId?: string;
  communityName?: string;
  isCollage?: boolean;
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
  isPrivateGroup?: boolean;
  rules?: string[];
  pinnedTopic?: string;
  coverImage?: string;
  challengeId?: string;
  teamId?: string;
  isChallengeGroup?: boolean;
  challengeTitle?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage?: string;
  category: string;
  accessType: 'public' | 'moderated'; // 'public': anyone can join instantly; 'moderated': requires moderator approval
  moderatorId: string;
  moderatorName: string;
  moderatorUsername?: string;
  moderatorAvatar?: string;
  memberCount: number;
  memberIds: string[];
  pendingRequestUserIds?: string[];
  rules?: string[];
  tags?: string[];
  createdAt: string;
  lastActivity?: string;
}

export type ChallengeType = 'individual' | 'group';

export interface ChallengeTeamMember {
  userId: string;
  userName: string;
  userUsername?: string;
  userAvatar: string;
  userStreak?: number;
  joinedAt: string;
  role?: 'leader' | 'member';
  checkinsCount?: number;
}

export interface ChallengeTeam {
  id: string;
  challengeId: string;
  name: string;
  motto?: string;
  teamAvatar?: string;
  leaderId: string;
  leaderName: string;
  maxMembers: number; // Configured team size e.g. 2, 3, 4, etc.
  memberIds: string[];
  members: ChallengeTeamMember[];
  createdAt: string;
  totalCheckinsCount?: number;
}

export interface ChallengeProgressPost {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  userStreak: number;
  dayNumber: number; // e.g. Day 1, Day 2 ... Day 30
  imageUrl: string; // MANDATORY photo proof
  text?: string; // Optional reflection/achievement notes
  createdAt: string;
  postDate: string; // YYYY-MM-DD
  cheersCount: number;
  cheeredByMe?: boolean;
  // Group challenge properties
  challengeType?: ChallengeType;
  teamId?: string;
  teamName?: string;
  teamMembers?: Array<{ userId: string; userName: string; userAvatar: string }>;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tag: string;
  durationDays: number; // e.g. 30
  deadlineDate: string; // YYYY-MM-DD
  createdBy: string;
  createdByName: string;
  createdAt: string;
  participantsCount: number;
  participantIds: string[];
  completedUserIds: string[]; // Users who completed all durationDays or finished
  userPostDates: Record<string, string[]>; // { [userId]: ["2026-08-25", ...] }
  // Group / Individual Challenge configurations
  challengeType: ChallengeType; // 'individual' | 'group'
  teamSize?: number; // Number of members allowed per team (e.g. 2 for Duo, 3 for Trio, 4, 5, etc.)
  teams?: ChallengeTeam[];
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

export interface ChallengeInvitePreview {
  challengeId: string;
  challengeTitle: string;
  challengeIcon: string;
  challengeType: ChallengeType;
  durationDays: number;
  category: string;
  tag: string;
  deadlineDate: string;
  teamId?: string;
  teamName?: string;
  invitedByName: string;
  invitedByAvatar: string;
  note?: string;
}

export interface ChallengeLeaderboardIndividual {
  rank: number;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    currentStreak: number;
  };
  daysCompleted: number;
  totalDays: number;
  totalCheckins: number;
  completionPercentage: number;
  currentStreak: number;
  consistencyRate: number; // percentage (0 - 100)
  consistencyScore: number;
  streakInChallenge: number;
  totalCheers: number;
  score: number;
  badgeTitle: string;
  latestProofImageUrl?: string;
  teamName?: string;
  hasPostedToday: boolean;
  isCurrentUser: boolean;
}

export interface ChallengeLeaderboardSquad {
  rank: number;
  team: ChallengeTeam;
  teamId: string;
  teamName: string;
  motto?: string;
  totalCheckins: number;
  memberCount: number;
  maxMembers: number;
  consistencyRate: number; // percentage (0 - 100)
  averageCheckinsPerMember: number;
  squadScore: number;
  score: number;
  topContributorName: string;
  topContributorAvatar: string;
  topContributorCheckins: number;
  topContributors: {
    id: string;
    name: string;
    avatar: string;
    checkinsCount: number;
  }[];
  totalCheers: number;
  isUserSquad: boolean;
}

export interface ChallengeLeaderboard {
  individuals: ChallengeLeaderboardIndividual[];
  squads: ChallengeLeaderboardSquad[];
  summary: {
    totalParticipants: number;
    totalCheckins: number;
    cohortActiveStreakRate: number;
    averageDaysCompleted: number;
    topStreak: number;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  challengeId?: string;
  text: string;
  imageUrl?: string;
  sharedPost?: SharedPostPreview;
  challengeInvite?: ChallengeInvitePreview;
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
  'AI & Tech',
  'Startups',
  'Fitness & Gym',
  'Running',
  'Reading',
  'Design & UI/UX',
  'Gardening',
  'Singing & Vocals',
  'Dancing',
  'Storytelling & Writing',
  'Cooking & Culinary',
  'Baking & Pastry',
  'Photography',
  'Filmmaking & Video',
  'Music Production',
  'Gaming',
  'Digital Art & Illustration',
  'Pottery & Ceramics',
  'Woodworking',
  'Martial Arts',
  'Yoga & Mobility',
  'Meditation & Mindfulness',
  'Language Learning',
  'Chess & Strategy',
  'Astronomy',
  'Journaling',
  'Calligraphy',
  'Hiking & Outdoors',
  'Public Speaking',
  'Robotics & Hardware',
  'Crypto & Web3',
  'Philosophy & Stoicism',
  'Book Club',
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

export type NavigationTab = 'home' | 'streak' | 'create' | 'discover' | 'profile' | 'dossier';

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'community_request'
  | 'community_approved'
  | 'streak_milestone'
  | 'challenge_invite'
  | 'cheer'
  | 'streak_freeze_earned'
  | 'streak_freeze_used'
  | 'challenge_badge';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actorId: string;
  actorName: string;
  actorUsername: string;
  actorAvatar: string;
  actorStreak?: number;
  targetId?: string; // postId or communityId
  targetPreview?: string; // post content snippet or community name
  targetImage?: string; // post thumbnail
  message: string;
  createdAt: string; // e.g. "5m ago"
  timestamp?: number;
  isRead: boolean;
}
