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
  disciplineMilestones?: string[]; // Array of up to 3 applied milestone IDs
  isCurrentUser?: boolean;
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
  communityId?: string; // Optional community target
  communityName?: string; // Community name display
  isMainPost?: boolean; // Whether this is user's 1 Main Post for the day
  isCollage?: boolean; // If generated via multi-post collab photo stitch
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
  challengeId?: string;
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

export interface DisciplineMilestone {
  id: string;
  title: string;
  category: 'Focus' | 'Physical' | 'Creative' | 'Mindset' | 'Craft';
  icon: string;
  badgeColor: string;
  headline: string;
  description: string;
}

export const AVAILABLE_DISCIPLINE_MILESTONES: DisciplineMilestone[] = [
  {
    id: 'dawn_riser',
    title: 'Dawn Riser',
    category: 'Focus',
    icon: '🌅',
    badgeColor: '#D4AF37',
    headline: '5:00 AM Dawn Protocol',
    description: 'Relentless morning execution before the rest of the world wakes up.',
  },
  {
    id: 'deep_work',
    title: 'Deep Work Titan',
    category: 'Focus',
    icon: '⚡',
    badgeColor: '#3B82F6',
    headline: '4+ Hours Distraction-Free Flow',
    description: 'Submerging completely into hard, uninterrupted problem solving.',
  },
  {
    id: 'iron_will',
    title: 'Iron Will',
    category: 'Mindset',
    icon: '🛡️',
    badgeColor: '#10B981',
    headline: '30-Day Zero Excuses Chain',
    description: 'Never skipping a day, regardless of weather, mood, or schedule.',
  },
  {
    id: 'code_ship',
    title: 'Code & Ship Titan',
    category: 'Craft',
    icon: '💻',
    badgeColor: '#8B5CF6',
    headline: 'Daily Public Builds & Commits',
    description: 'Shipping working software, algorithms, and real features every single day.',
  },
  {
    id: 'physical_grit',
    title: 'Iron Resilience',
    category: 'Physical',
    icon: '🏋️‍♂️',
    badgeColor: '#EF4444',
    headline: 'Daily Heavy Conditioning',
    description: 'Forging physical discipline through resistance, strength, and form.',
  },
  {
    id: 'endurance_runner',
    title: 'Endurance Athlete',
    category: 'Physical',
    icon: '🏃‍♂️',
    badgeColor: '#F59E0B',
    headline: 'Daily Outdoor Distance & Pacing',
    description: 'Pounding the pavement mile after mile with unbroken stamina.',
  },
  {
    id: 'storyteller_scribe',
    title: 'Master Storyteller',
    category: 'Creative',
    icon: '📖',
    badgeColor: '#EC4899',
    headline: 'Daily Narrative & Prose Craft',
    description: 'Writing, journaling, and weaving compelling prose every day.',
  },
  {
    id: 'mindful_stoic',
    title: 'Mindful Stoic',
    category: 'Mindset',
    icon: '🧘‍♂️',
    badgeColor: '#06B6D4',
    headline: 'Daily Stillness & Breath Control',
    description: 'Calm under pressure, daily meditation, and emotional mastery.',
  },
  {
    id: 'botanical_grower',
    title: 'Green Cultivator',
    category: 'Craft',
    icon: '🌿',
    badgeColor: '#22C55E',
    headline: 'Daily Plant & Garden Mastery',
    description: 'Nurturing growth with patience, soil care, and daily botanical dedication.',
  },
  {
    id: 'vocal_harmony',
    title: 'Vocal Virtuoso',
    category: 'Creative',
    icon: '🎤',
    badgeColor: '#A855F7',
    headline: 'Daily Singing & Vocal Training',
    description: 'Refining pitch, breath, dynamic range, and acoustic expression.',
  },
  {
    id: 'rhythmic_mover',
    title: 'Rhythmic Mover',
    category: 'Physical',
    icon: '💃',
    badgeColor: '#F43F5E',
    headline: 'Daily Dance & Coordination Flow',
    description: 'Expressing discipline through movement, choreo, and rhythmic flow.',
  },
  {
    id: 'grandmaster_tactics',
    title: 'Grandmaster Tactics',
    category: 'Focus',
    icon: '♟️',
    badgeColor: '#6366F1',
    headline: 'Daily Chess Strategy & Calculation',
    description: 'Sharpening tactical calculation, foresight, and strategic depth.',
  },
  {
    id: 'lifelong_scholar',
    title: 'Lifelong Scholar',
    category: 'Mindset',
    icon: '📚',
    badgeColor: '#14B8A6',
    headline: '1 Chapter & Note Taken Daily',
    description: 'Expanding mental models through deliberate reading and synthesis.',
  },
  {
    id: 'culinary_craft',
    title: 'Culinary Craftsman',
    category: 'Craft',
    icon: '🍳',
    badgeColor: '#FB923C',
    headline: 'Daily Whole-Food Creation',
    description: 'Crafting nourishing, deliberate cuisine with precision and care.',
  },
];

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

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'community_request'
  | 'community_approved'
  | 'streak_milestone';

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
