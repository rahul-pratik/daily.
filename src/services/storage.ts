import {
  User,
  Post,
  Message,
  Comment,
  Group,
  SharedPostPreview,
  CommunityMemberRanking,
  PersonalHabit,
  Community,
  PostDraft,
  AppNotification,
  ProofCollection,
  Challenge,
  ChallengeProgressPost,
  ChallengeTeam,
  ChallengeTeamMember,
  ChallengeType,
  UserNote,
  ChallengeInvitePreview,
  ChallengeLeaderboardIndividual,
  ChallengeLeaderboardSquad,
  ChallengeLeaderboard,
  ChallengeWeeklyRecap,
} from '../types';
import { INITIAL_CURRENT_USER, SAMPLE_USERS, INITIAL_POSTS, INITIAL_MESSAGES, SAMPLE_GROUPS, INITIAL_PERSONAL_HABITS, INITIAL_COMMUNITIES, INITIAL_NOTIFICATIONS, INITIAL_USER_NOTES, getPastDate } from '../data/mockData';

const STORAGE_KEYS = {
  CURRENT_USER: 'daily_app_current_user_v1',
  USERS: 'daily_app_users_v1',
  POSTS: 'daily_app_posts_v1',
  MESSAGES: 'daily_app_messages_v1',
  GROUPS: 'daily_app_groups_v1',
  COMMUNITIES: 'daily_app_communities_v1',
  CHALLENGES: 'daily_app_challenges_v1',
  CHALLENGE_PROGRESS_POSTS: 'daily_app_challenge_progress_posts_v1',
  CHALLENGE_RECAPS: 'daily_app_challenge_recaps_v1',
  POST_DRAFT: 'daily_app_post_draft_v1',
  DRAFTS: 'daily_app_post_drafts_v2',
  ONBOARDED: 'daily_app_onboarded_v1',
  SAVED_POSTS: 'daily_app_saved_posts_v1',
  REPORTED_POSTS: 'daily_app_reported_posts_v1',
  HABITS: 'daily_app_personal_habits_v1',
  BLOCKED_USERS: 'daily_app_blocked_users_v1',
  NOTIFICATIONS: 'daily_app_notifications_v1',
  USER_NOTES: 'daily_app_user_notes_v1',
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
      const user: User = JSON.parse(data);
      if (!user || typeof user !== 'object') {
        this.saveCurrentUser(INITIAL_CURRENT_USER);
        return INITIAL_CURRENT_USER;
      }
      let changed = false;
      if (typeof user.streakFreezes !== 'number') {
        user.streakFreezes = 1;
        changed = true;
      }
      if (typeof user.streakFreezeActive !== 'boolean') {
        user.streakFreezeActive = true;
        changed = true;
      }
      if (!Array.isArray(user.followedUserIds)) {
        user.followedUserIds = INITIAL_CURRENT_USER.followedUserIds || [];
        changed = true;
      }
      if (!Array.isArray(user.activityDates)) {
        user.activityDates = INITIAL_CURRENT_USER.activityDates || [];
        changed = true;
      }
      if (!Array.isArray(user.interests)) {
        user.interests = INITIAL_CURRENT_USER.interests || [];
        changed = true;
      }
      if (!Array.isArray(user.habits)) {
        user.habits = INITIAL_CURRENT_USER.habits || [];
        changed = true;
      }
      if (!Array.isArray(user.proofCollections)) {
        user.proofCollections = INITIAL_CURRENT_USER.proofCollections || [];
        changed = true;
      }
      if (changed) {
        this.saveCurrentUser(user);
      }
      return user;
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
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        this.saveAllUsers(SAMPLE_USERS);
        return SAMPLE_USERS;
      }
      return parsed;
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
      if (!Array.isArray(parsed)) {
        this.saveAllPosts(INITIAL_POSTS);
        return INITIAL_POSTS;
      }
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
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        this.saveAllMessages(INITIAL_MESSAGES);
        return INITIAL_MESSAGES;
      }
      return parsed;
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

  // Check if user has already posted their 1 Main Daily Post today
  static hasUserPostedToday(userId?: string): boolean {
    return this.hasUserPostedMainToday(userId);
  }

  static hasUserPostedMainToday(userId?: string): boolean {
    const currentUser = this.getCurrentUser();
    const targetId = userId || currentUser.id;
    const today = getTodayDateString();
    if (targetId === currentUser.id && currentUser.lastPostedDate === today) {
      return true;
    }
    const posts = this.getAllPosts();
    return posts.some((p) => p.userId === targetId && p.postDate === today && (p.isMainPost !== false && p.isDailyStreakPost));
  }

  static getTodayPostForUser(userId?: string): Post | undefined {
    const currentUser = this.getCurrentUser();
    const targetId = userId || currentUser.id;
    const today = getTodayDateString();
    const posts = this.getAllPosts();
    return posts.find((p) => p.userId === targetId && p.postDate === today && (p.isMainPost !== false && p.isDailyStreakPost));
  }

  // Get all community proofs submitted today by user (for collab collage)
  static getTodayCommunityPostsForUser(userId?: string): Post[] {
    const currentUser = this.getCurrentUser();
    const targetId = userId || currentUser.id;
    const today = getTodayDateString();
    const posts = this.getAllPosts();
    return posts.filter((p) => p.userId === targetId && (p.postDate === today || p.createdAt === 'Just now'));
  }

  static updateDisciplineMilestones(_milestoneIds: string[]): User {
    return this.getCurrentUser();
  }

  // Create New Post: Main Daily Post (Limit 1 per day) OR Community Post (Unlimited)
  static createPost(payload: {
    content: string;
    imageUrl?: string;
    imageUrls?: string[];
    tags: string[];
    isMainPost?: boolean;
    communityId?: string;
    communityName?: string;
    isCollage?: boolean;
  }): { post: Post; updatedUser: User; isNewStreakDay: boolean; error?: string } {
    const currentUser = this.getCurrentUser();
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    const isTargetingMain = payload.isMainPost ?? (!payload.communityId || payload.communityId === 'main');
    const safeImageUrls = payload.imageUrls && payload.imageUrls.length > 0 
      ? payload.imageUrls 
      : (payload.imageUrl ? [payload.imageUrl] : undefined);
    const primaryImageUrl = safeImageUrls ? safeImageUrls[0] : payload.imageUrl;

    if (isTargetingMain) {
      const alreadyPostedMainToday = this.hasUserPostedMainToday(currentUser.id);
      if (alreadyPostedMainToday) {
        const existing = this.getTodayPostForUser(currentUser.id);
        return {
          post: existing || this.getAllPosts()[0],
          updatedUser: currentUser,
          isNewStreakDay: false,
          error: 'You have already submitted proof as the main post for today',
        };
      }

      // Update streak for 1 daily main post
      const isConsecutive = currentUser.lastPostedDate === yesterday || currentUser.lastPostedDate === today;
      let newCurrentStreak = currentUser.currentStreak;
      let newActivityDates = [...currentUser.activityDates];

      if (isConsecutive || currentUser.currentStreak === 0) {
        newCurrentStreak = currentUser.currentStreak + 1;
      } else {
        newCurrentStreak = 1;
      }

      if (!newActivityDates.includes(today)) {
        newActivityDates = [today, ...newActivityDates];
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
        imageUrl: primaryImageUrl,
        imageUrls: safeImageUrls,
        tags: payload.tags,
        likesCount: 0,
        likedByMe: false,
        viewsCount: 1,
        sharesCount: 0,
        comments: [],
        createdAt: 'Just now',
        isDailyStreakPost: true,
        isMainPost: true,
        isCollage: payload.isCollage,
        communityId: payload.communityId && payload.communityId !== 'main' ? payload.communityId : undefined,
        communityName: payload.communityName,
        postDate: today,
      };

      const posts = this.getAllPosts();
      this.saveAllPosts([newPost, ...posts]);

      return {
        post: newPost,
        updatedUser,
        isNewStreakDay: true,
      };
    } else {
      // Community-Only Proof: Unlimited submissions allowed!
      const newTotalPosts = currentUser.totalPosts + 1;
      const updatedUser: User = {
        ...currentUser,
        totalPosts: newTotalPosts,
      };
      this.saveCurrentUser(updatedUser);

      const newPost: Post = {
        id: `post_${Date.now()}`,
        userId: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        userAvatar: currentUser.avatar,
        userStreak: currentUser.currentStreak,
        content: payload.content,
        imageUrl: primaryImageUrl,
        imageUrls: safeImageUrls,
        tags: payload.tags,
        likesCount: 0,
        likedByMe: false,
        viewsCount: 1,
        sharesCount: 0,
        comments: [],
        createdAt: 'Just now',
        isDailyStreakPost: false,
        isMainPost: false,
        isCollage: payload.isCollage,
        communityId: payload.communityId,
        communityName: payload.communityName,
        postDate: today,
      };

      const posts = this.getAllPosts();
      this.saveAllPosts([newPost, ...posts]);

      return {
        post: newPost,
        updatedUser,
        isNewStreakDay: false,
      };
    }
  }

  // Append infinite photos to today's daily post or any post without spamming the feed
  static appendPhotosToTodayPost(userId: string, newImageUrls: string[]): { post?: Post; posts: Post[] } {
    const posts = this.getAllPosts();
    const today = getTodayDateString();
    let updatedPost: Post | undefined;

    const updated = posts.map((p) => {
      if (
        (p.userId === userId || p.userId === 'user_me') &&
        (p.postDate === today || p.createdAt === 'Just now') &&
        p.isDailyStreakPost
      ) {
        const existingUrls = p.imageUrls && p.imageUrls.length > 0
          ? [...p.imageUrls]
          : (p.imageUrl ? [p.imageUrl] : []);
        
        for (const url of newImageUrls) {
          if (url && !existingUrls.includes(url)) {
            existingUrls.push(url);
          }
        }

        updatedPost = {
          ...p,
          imageUrl: existingUrls[0] || p.imageUrl,
          imageUrls: existingUrls,
        };
        return updatedPost;
      }
      return p;
    });

    if (updatedPost) {
      this.saveAllPosts(updated);
    }

    return { post: updatedPost, posts: updated };
  }

  // Delete a post and reset today's photo limit if it was today's post
  static deletePost(postId: string): { posts: Post[]; updatedUser: User; wasTodayPost: boolean } {
    const currentUser = this.getCurrentUser();
    const posts = this.getAllPosts();
    const today = getTodayDateString();

    const postToDelete = posts.find((p) => p.id === postId);
    const remainingPosts = posts.filter((p) => p.id !== postId);
    this.saveAllPosts(remainingPosts);

    // Also remove from saved posts
    const savedIds = this.getSavedPostIds().filter((id) => id !== postId);
    this.saveSavedPostIds(savedIds);

    let updatedUser = currentUser;
    let wasTodayPost = false;

    if (postToDelete && (postToDelete.userId === currentUser.id || postToDelete.userId === 'user_me')) {
      const wasCreatedToday = postToDelete.postDate === today || postToDelete.createdAt === 'Just now';
      const remainingTodayPosts = remainingPosts.filter(
        (p) => (p.userId === currentUser.id || p.userId === 'user_me') && p.postDate === today
      );

      if (wasCreatedToday && remainingTodayPosts.length === 0) {
        wasTodayPost = true;
        const myOtherPosts = remainingPosts.filter(
          (p) => p.userId === currentUser.id || p.userId === 'user_me'
        );
        const prevPostDate = myOtherPosts.length > 0 ? myOtherPosts[0].postDate || null : null;
        const newActivityDates = currentUser.activityDates.filter((d) => d !== today);
        const newStreak = Math.max(0, currentUser.currentStreak - 1);
        const newTotalPosts = Math.max(0, currentUser.totalPosts - 1);

        updatedUser = {
          ...currentUser,
          lastPostedDate: prevPostDate,
          currentStreak: newStreak,
          totalPosts: newTotalPosts,
          activityDates: newActivityDates,
        };
        this.saveCurrentUser(updatedUser);
      } else {
        const newTotalPosts = Math.max(0, currentUser.totalPosts - 1);
        updatedUser = {
          ...currentUser,
          totalPosts: newTotalPosts,
        };
        this.saveCurrentUser(updatedUser);
      }
    }

    return { posts: remainingPosts, updatedUser, wasTodayPost };
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
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : ['post_1', 'post_3'];
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
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
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
  static getAllRawGroups(): Group[] {
    const data = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (!data) {
      this.saveAllGroups(SAMPLE_GROUPS);
      return [...SAMPLE_GROUPS];
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [...SAMPLE_GROUPS];
    } catch {
      return [...SAMPLE_GROUPS];
    }
  }

  static getAllGroups(): Group[] {
    const groups = this.getAllRawGroups();

    // Dynamically ensure challenge squad groups are represented for any team the currentUser or friends belong to
    try {
      const challengesData = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      if (challengesData) {
        const parsed = JSON.parse(challengesData);
        const challenges: Challenge[] = Array.isArray(parsed) ? parsed : [];
        let modified = false;

        challenges.forEach((ch) => {
          if (ch.challengeType === 'group' && ch.teams && ch.teams.length > 0) {
            ch.teams.forEach((team) => {
              const squadGroupId = `group_squad_${ch.id}_${team.id}`;
              const exists = groups.some(
                (g) => g.id === squadGroupId || (g.challengeId === ch.id && g.teamId === team.id)
              );
              if (!exists && team.memberIds && team.memberIds.length > 0) {
                const squadGroup: Group = {
                  id: squadGroupId,
                  name: `${team.name} (${ch.icon} ${ch.title})`,
                  description: `Private squad chat for "${team.name}" in "${ch.title}". Coordinate daily proof check-ins!`,
                  avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80',
                  category: ch.category || 'Discipline',
                  memberIds: Array.from(new Set([...team.memberIds])),
                  memberCount: team.memberIds.length,
                  lastActivity: 'Recently',
                  createdBy: team.leaderId,
                  createdAt: getTodayDateString(),
                  isPrivateGroup: true,
                  isChallengeGroup: true,
                  challengeId: ch.id,
                  teamId: team.id,
                  challengeTitle: ch.title,
                  rules: [
                    'Coordinate daily proof-of-work receipts',
                    'Cheer each other toward cohort milestones',
                  ],
                  pinnedTopic: `⚔️ Squad "${team.name}" Mission: ${ch.durationDays} Days of Proof Receipts!`,
                };
                groups.push(squadGroup);
                modified = true;
              }
            });
          }
        });

        if (modified) {
          this.saveAllGroups(groups);
        }
      }
    } catch {
      // ignore
    }

    return groups.map((g) => ({
      ...g,
      memberIds: Array.isArray(g.memberIds) ? g.memberIds : [],
    }));
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
    rules?: string[];
    pinnedTopic?: string;
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
      rules: params.rules || ['Be respectful', 'Post daily proof', 'Support peers with constructive feedback'],
      pinnedTopic: params.pinnedTopic || 'Welcome to our community! Share what habit you are building today.',
    };

    const groups = this.getAllGroups();
    this.saveAllGroups([newGroup, ...groups]);

    // Send an initial system/intro message to the new group
    this.sendMessage({
      groupId: newGroup.id,
      text: `🎉 Created the community "${newGroup.name}"! Discuss topics, share daily photos/tweets, and climb the ranking leaderboard!`,
    });

    if (newGroup.pinnedTopic) {
      this.sendMessage({
        groupId: newGroup.id,
        text: `📌 Pinned Community Topic: "${newGroup.pinnedTopic}"`,
      });
    }

    return newGroup;
  }

  // Get dynamic community rankings for leaderboard
  static getCommunityRankings(groupId: string): CommunityMemberRanking[] {
    const groups = this.getAllGroups();
    const group = groups.find((g) => g.id === groupId);
    const allUsers = this.getAllUsers();
    const currentUser = this.getCurrentUser();
    const allPosts = this.getAllPosts();
    const allMessages = this.getAllMessages();

    const completeUserList = [currentUser, ...allUsers.filter((u) => u.id !== currentUser.id)];
    const memberIdSet = new Set(group?.memberIds || [currentUser.id]);

    // If group has members, evaluate members. Also include other relevant creators if small
    let candidateUsers = completeUserList.filter((u) => memberIdSet.has(u.id));
    if (candidateUsers.length < 3) {
      candidateUsers = completeUserList;
    }

    const groupCategory = (group?.category || '').toLowerCase();

    const rankings: CommunityMemberRanking[] = candidateUsers.map((user) => {
      // Posts matching group category or overall
      const userPosts = allPosts.filter((p) => {
        if (p.userId !== user.id && !(user.id === currentUser.id && p.userId === 'user_me')) return false;
        if (!groupCategory) return true;
        const matchesCategory = (p.tags || []).some(
          (t) => t.toLowerCase() === groupCategory || groupCategory.includes(t.toLowerCase())
        );
        return matchesCategory || true;
      });

      // Messages in this community chat
      const userMessages = allMessages.filter(
        (m) => m.groupId === groupId && (m.senderId === user.id || (user.id === currentUser.id && m.senderId === 'user_me'))
      );

      const postsCount = userPosts.length + Math.max(0, Math.floor((user.totalPosts || 0) * 0.4));
      const messagesCount = userMessages.length;
      const streak = user.currentStreak || 0;

      // Score formula: (Posts & Tweets * 25) + (Discussion Messages * 8) + (Streak * 12) + Total Posts
      const score = postsCount * 25 + messagesCount * 8 + streak * 12 + (user.totalPosts || 0) * 2;

      return {
        user,
        rank: 0,
        postsCount,
        messagesCount,
        streak,
        score,
        badgeTitle: 'Active Member',
      };
    });

    // Sort descending by score
    rankings.sort((a, b) => b.score - a.score || b.postsCount - a.postsCount || b.streak - a.streak);

    // Assign ranks & badge titles
    return rankings.map((item, idx) => {
      let badgeTitle = 'Active Member';
      if (idx === 0) badgeTitle = '👑 Community MVP';
      else if (idx === 1) badgeTitle = '🔥 Streak Champion';
      else if (idx === 2) badgeTitle = '⚡ Top Contributor';
      else if (idx < 5) badgeTitle = '🌟 Rising Creator';

      return {
        ...item,
        rank: idx + 1,
        badgeTitle,
      };
    });
  }

  // ==========================================
  // MULTIPLE SAVED DRAFTS & SCHEDULING SYSTEM
  // ==========================================
  static getInitialDrafts(userId: string): PostDraft[] {
    const tomorrow9am = new Date();
    tomorrow9am.setDate(tomorrow9am.getDate() + 1);
    tomorrow9am.setHours(9, 0, 0, 0);
    const tomorrowIso = tomorrow9am.toISOString().slice(0, 16);

    return [
      {
        id: `draft_${userId}_1`,
        title: 'Morning 8km Run & Endurance Base',
        content: 'Completed 8km morning aerobic run in 42 minutes. Maintained zone 3 steady pace. Compounding endurance before starting daily work!',
        imageUrl: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1000&auto=format&fit=crop&q=80',
        tags: ['Run', 'Fitness'],
        updatedAt: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
        isScheduled: false,
      },
      {
        id: `draft_${userId}_2`,
        title: 'Full-Stack Architecture & Offline Queue Refactor',
        content: 'Shipped high-performance drafts queue and local storage state persistence. Zero latency on cold boots and modular React components ready.',
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
        tags: ['Coding', 'Building'],
        updatedAt: Date.now() - 1000 * 60 * 60 * 1, // 1 hour ago
        isScheduled: true,
        scheduledAt: tomorrowIso,
      },
      {
        id: `draft_${userId}_3`,
        title: 'Deep Reading: Systems & Mindset',
        content: 'Read 30 pages of deep work principles. Key takeaway: schedule uninterrupted 90m blocks first thing in the morning.',
        imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1000&auto=format&fit=crop&q=80',
        tags: ['Reading', 'Mindset'],
        updatedAt: Date.now() - 1000 * 60 * 60 * 12,
        isScheduled: false,
      },
    ];
  }

  static getAllDrafts(userId: string): PostDraft[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.DRAFTS}_${userId}`);
      if (!data) {
        // Check if legacy draft exists
        const legacy = localStorage.getItem(`${STORAGE_KEYS.POST_DRAFT}_${userId}`);
        if (legacy) {
          try {
            const parsedLegacy = JSON.parse(legacy);
            if (parsedLegacy && (parsedLegacy.content || parsedLegacy.imageUrl)) {
              const migratedDraft: PostDraft = {
                id: `draft_${Date.now()}`,
                content: parsedLegacy.content || '',
                imageUrl: parsedLegacy.imageUrl,
                tags: parsedLegacy.tags || ['Building'],
                updatedAt: parsedLegacy.updatedAt || Date.now(),
                isScheduled: false,
              };
              const initialWithLegacy = [migratedDraft, ...this.getInitialDrafts(userId)];
              this.saveAllDrafts(userId, initialWithLegacy);
              return initialWithLegacy;
            }
          } catch {
            // ignore
          }
        }
        const initial = this.getInitialDrafts(userId);
        this.saveAllDrafts(userId, initial);
        return initial;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        const initial = this.getInitialDrafts(userId);
        this.saveAllDrafts(userId, initial);
        return initial;
      }
      return parsed;
    } catch {
      return this.getInitialDrafts(userId);
    }
  }

  static saveAllDrafts(userId: string, drafts: PostDraft[]): void {
    try {
      localStorage.setItem(`${STORAGE_KEYS.DRAFTS}_${userId}`, JSON.stringify(drafts));
      // Sync the most recent draft with legacy key for backward compatibility
      if (drafts.length > 0) {
        const topDraft = drafts[0];
        localStorage.setItem(
          `${STORAGE_KEYS.POST_DRAFT}_${userId}`,
          JSON.stringify({
            content: topDraft.content,
            imageUrl: topDraft.imageUrl,
            tags: topDraft.tags,
            updatedAt: topDraft.updatedAt,
          })
        );
      }
    } catch {
      // Ignore quota error if any
    }
  }

  static getDraftById(userId: string, draftId: string): PostDraft | null {
    const drafts = this.getAllDrafts(userId);
    return drafts.find((d) => d.id === draftId) || null;
  }

  static saveDraft(
    userId: string,
    draftData: {
      id?: string;
      title?: string;
      content: string;
      imageUrl?: string;
      tags: string[];
      scheduledAt?: string;
      isScheduled?: boolean;
      communityId?: string;
      communityName?: string;
      isCollage?: boolean;
    }
  ): { draft: PostDraft; drafts: PostDraft[] } {
    const drafts = this.getAllDrafts(userId);
    const now = Date.now();
    const existingIndex = draftData.id ? drafts.findIndex((d) => d.id === draftData.id) : -1;

    let savedItem: PostDraft;

    if (existingIndex >= 0) {
      // Update existing draft
      savedItem = {
        ...drafts[existingIndex],
        title: draftData.title !== undefined ? draftData.title : drafts[existingIndex].title,
        content: draftData.content,
        imageUrl: draftData.imageUrl !== undefined ? draftData.imageUrl : drafts[existingIndex].imageUrl,
        tags: draftData.tags && draftData.tags.length > 0 ? draftData.tags : drafts[existingIndex].tags,
        updatedAt: now,
        scheduledAt: draftData.scheduledAt !== undefined ? draftData.scheduledAt : drafts[existingIndex].scheduledAt,
        isScheduled: draftData.isScheduled !== undefined ? draftData.isScheduled : drafts[existingIndex].isScheduled,
        communityId: draftData.communityId !== undefined ? draftData.communityId : drafts[existingIndex].communityId,
        communityName: draftData.communityName !== undefined ? draftData.communityName : drafts[existingIndex].communityName,
        isCollage: draftData.isCollage !== undefined ? draftData.isCollage : drafts[existingIndex].isCollage,
      };
      drafts[existingIndex] = savedItem;
    } else {
      // Create new draft
      savedItem = {
        id: draftData.id || `draft_${now}_${Math.random().toString(36).substring(2, 7)}`,
        title: draftData.title || undefined,
        content: draftData.content,
        imageUrl: draftData.imageUrl,
        tags: draftData.tags && draftData.tags.length > 0 ? draftData.tags : ['Building'],
        updatedAt: now,
        scheduledAt: draftData.scheduledAt,
        isScheduled: Boolean(draftData.isScheduled && draftData.scheduledAt),
        communityId: draftData.communityId,
        communityName: draftData.communityName,
        isCollage: draftData.isCollage,
      };
      drafts.unshift(savedItem);
    }

    this.saveAllDrafts(userId, drafts);
    return { draft: savedItem, drafts };
  }

  static deleteDraft(userId: string, draftId: string): PostDraft[] {
    const drafts = this.getAllDrafts(userId);
    const updated = drafts.filter((d) => d.id !== draftId);
    this.saveAllDrafts(userId, updated);
    if (updated.length === 0) {
      localStorage.removeItem(`${STORAGE_KEYS.POST_DRAFT}_${userId}`);
    }
    return updated;
  }

  static clearAllDrafts(userId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.DRAFTS}_${userId}`);
      localStorage.removeItem(`${STORAGE_KEYS.POST_DRAFT}_${userId}`);
    } catch {
      // ignore
    }
  }

  // Publish a draft directly to the main feed / community
  static publishDraftNow(
    userId: string,
    draftId: string
  ): {
    success: boolean;
    post?: Post;
    updatedUser?: User;
    error?: string;
    remainingDrafts: PostDraft[];
  } {
    const draft = this.getDraftById(userId, draftId);
    if (!draft) {
      return {
        success: false,
        error: 'Draft not found',
        remainingDrafts: this.getAllDrafts(userId),
      };
    }

    const isMain = !draft.communityId || draft.communityId === 'main';
    const result = this.createPost({
      content: draft.content,
      imageUrl: draft.imageUrl,
      tags: draft.tags && draft.tags.length > 0 ? draft.tags : ['DailyProof'],
      isMainPost: isMain,
      communityId: draft.communityId,
      communityName: draft.communityName,
      isCollage: draft.isCollage,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error,
        remainingDrafts: this.getAllDrafts(userId),
      };
    }

    const remainingDrafts = this.deleteDraft(userId, draftId);
    return {
      success: true,
      post: result.post,
      updatedUser: result.updatedUser,
      remainingDrafts,
    };
  }

  // Legacy get/save/clear methods (maintained for seamless interop)
  static getPostDraft(userId: string): PostDraft | null {
    const drafts = this.getAllDrafts(userId);
    return drafts.length > 0 ? drafts[0] : null;
  }

  static savePostDraft(
    userId: string,
    draft: { id?: string; content: string; imageUrl?: string; tags: string[]; scheduledAt?: string; isScheduled?: boolean }
  ): void {
    this.saveDraft(userId, draft);
  }

  static clearPostDraft(userId: string): void {
    const drafts = this.getAllDrafts(userId);
    if (drafts.length > 0) {
      this.deleteDraft(userId, drafts[0].id);
    }
  }

  // Communities (Public / Moderated spaces in Explore)
  static getAllCommunities(): Community[] {
    const data = localStorage.getItem(STORAGE_KEYS.COMMUNITIES);
    if (!data) {
      this.saveAllCommunities(INITIAL_COMMUNITIES);
      return INITIAL_COMMUNITIES;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_COMMUNITIES;
    } catch {
      return INITIAL_COMMUNITIES;
    }
  }

  static saveAllCommunities(communities: Community[]): void {
    localStorage.setItem(STORAGE_KEYS.COMMUNITIES, JSON.stringify(communities));
  }

  static toggleJoinCommunity(communityId: string): {
    communities: Community[];
    status: 'joined' | 'left' | 'requested' | 'request_cancelled';
  } {
    const currentUser = this.getCurrentUser();
    const communities = this.getAllCommunities();
    let status: 'joined' | 'left' | 'requested' | 'request_cancelled' = 'joined';

    const updated = communities.map((comm) => {
      if (comm.id === communityId) {
        const isMember = (comm.memberIds || []).includes(currentUser.id);
        const isPending = (comm.pendingRequestUserIds || []).includes(currentUser.id);

        if (isMember) {
          // Leave community
          const nextMemberIds = (comm.memberIds || []).filter((id) => id !== currentUser.id);
          status = 'left';
          return {
            ...comm,
            memberIds: nextMemberIds,
            memberCount: Math.max(0, nextMemberIds.length),
          };
        } else if (comm.accessType === 'moderated') {
          if (isPending) {
            // Cancel request
            status = 'request_cancelled';
            return {
              ...comm,
              pendingRequestUserIds: (comm.pendingRequestUserIds || []).filter((id) => id !== currentUser.id),
            };
          } else {
            // Request access from moderator
            status = 'requested';
            return {
              ...comm,
              pendingRequestUserIds: [...(comm.pendingRequestUserIds || []), currentUser.id],
            };
          }
        } else {
          // Public community: Join instantly
          status = 'joined';
          const nextMemberIds = [...(comm.memberIds || []), currentUser.id];
          return {
            ...comm,
            memberIds: nextMemberIds,
            memberCount: nextMemberIds.length,
          };
        }
      }
      return comm;
    });

    this.saveAllCommunities(updated);
    return { communities: updated, status };
  }

  static approveCommunityMember(communityId: string, applicantUserId: string): Community[] {
    const communities = this.getAllCommunities();
    const updated = communities.map((comm) => {
      if (comm.id === communityId) {
        const pending = (comm.pendingRequestUserIds || []).filter((id) => id !== applicantUserId);
        const members = (comm.memberIds || []).includes(applicantUserId)
          ? comm.memberIds
          : [...(comm.memberIds || []), applicantUserId];
        return {
          ...comm,
          pendingRequestUserIds: pending,
          memberIds: members,
          memberCount: members.length,
        };
      }
      return comm;
    });
    this.saveAllCommunities(updated);
    return updated;
  }

  static createCommunity(params: {
    name: string;
    description: string;
    category: string;
    accessType: 'public' | 'moderated';
    avatar: string;
    coverImage?: string;
    rules?: string[];
    tags?: string[];
  }): Community {
    const currentUser = this.getCurrentUser();
    const newCommunity: Community = {
      id: `comm_${Date.now()}`,
      name: params.name.trim(),
      description: params.description.trim(),
      category: params.category || 'General',
      accessType: params.accessType || 'public',
      moderatorId: currentUser.id,
      moderatorName: currentUser.name,
      moderatorUsername: currentUser.username,
      moderatorAvatar: currentUser.avatar,
      avatar: params.avatar || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
      coverImage: params.coverImage || params.avatar,
      memberCount: 1,
      memberIds: [currentUser.id],
      pendingRequestUserIds: [],
      rules: params.rules || ['Be respectful and post daily progress'],
      tags: params.tags || [params.category],
      createdAt: getTodayDateString(),
      lastActivity: 'Just now',
    };

    const currentCommunities = this.getAllCommunities();
    const updated = [newCommunity, ...currentCommunities];
    this.saveAllCommunities(updated);
    return newCommunity;
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

  // Send Direct or Group Message (with optional photo / shared post attachment / challenge invite)
  static sendMessage(params: {
    receiverId?: string;
    groupId?: string;
    text: string;
    imageUrl?: string;
    sharedPost?: SharedPostPreview;
    challengeInvite?: ChallengeInvitePreview;
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
      challengeInvite: params.challengeInvite,
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

  // Challenge live discussion messages (strictly text-only, words only, no photos)
  static getChallengeMessages(challengeId: string): Message[] {
    const messages = this.getAllMessages();
    const challengeMsgs = messages.filter((m) => m.challengeId === challengeId);
    if (challengeMsgs.length > 0) return challengeMsgs;

    // Default seeded conversation for challenge discussion if none exist yet
    const seeded: Message[] = [
      {
        id: `cmsg_${challengeId}_1`,
        conversationId: `conv_challenge_${challengeId}`,
        senderId: 'user_1',
        challengeId,
        text: "Welcome to this challenge cohort everyone! Let's lock in and keep each other accountable every single day.",
        timestamp: 'Yesterday at 9:15 AM',
        isRead: true,
      },
      {
        id: `cmsg_${challengeId}_2`,
        conversationId: `conv_challenge_${challengeId}`,
        senderId: 'user_2',
        challengeId,
        text: "Ready to stay disciplined! Remember to post your daily photo receipt before midnight.",
        timestamp: 'Today at 8:00 AM',
        isRead: true,
      },
    ];
    return seeded;
  }

  static sendChallengeTextMessage(challengeId: string, text: string): Message {
    const currentUser = this.getCurrentUser();
    const newMsg: Message = {
      id: `cmsg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: `conv_challenge_${challengeId}`,
      senderId: currentUser.id,
      challengeId,
      text: text.trim(),
      timestamp: 'Just now',
      isRead: true,
    };

    const messages = this.getAllMessages();
    this.saveAllMessages([...messages, newMsg]);
    return newMsg;
  }

  // --- CHALLENGE SQUAD CHAT MANAGEMENT ---
  static ensureChallengeSquadGroup(challengeId: string, teamId: string): Group | null {
    const challenge = this.getChallengeById(challengeId);
    if (!challenge) return null;
    const team = (challenge.teams || []).find((t) => t.id === teamId);
    if (!team) return null;

    const squadGroupId = `group_squad_${challengeId}_${teamId}`;
    const allGroups = this.getAllRawGroups();
    const existingIndex = allGroups.findIndex(
      (g) => g.id === squadGroupId || (g.challengeId === challengeId && g.teamId === teamId)
    );

    const squadName = `${team.name} (${challenge.icon} ${challenge.title})`;
    const squadDesc = `Private squad chat for "${team.name}" in "${challenge.title}". Coordinate daily proof check-ins and cheer your teammates!`;
    const squadAvatar = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&auto=format&fit=crop&q=80';

    if (existingIndex >= 0) {
      const existing = allGroups[existingIndex];
      const updated: Group = {
        ...existing,
        name: squadName,
        description: squadDesc,
        memberIds: Array.from(new Set([...team.memberIds])),
        memberCount: team.memberIds.length,
        isChallengeGroup: true,
        challengeId: challenge.id,
        teamId: team.id,
        challengeTitle: challenge.title,
      };
      allGroups[existingIndex] = updated;
      this.saveAllGroups(allGroups);
      return updated;
    }

    const newGroup: Group = {
      id: squadGroupId,
      name: squadName,
      description: squadDesc,
      avatar: squadAvatar,
      category: challenge.category || 'Discipline',
      memberIds: Array.from(new Set([...team.memberIds])),
      memberCount: team.memberIds.length,
      lastActivity: 'Just now',
      createdBy: team.leaderId,
      createdAt: getTodayDateString(),
      isPrivateGroup: true,
      isChallengeGroup: true,
      challengeId: challenge.id,
      teamId: team.id,
      challengeTitle: challenge.title,
      rules: [
        'Coordinate daily achievement proof check-ins',
        'Hold squad teammates accountable to zero missed days',
        'Cheer each other to win the Weekly Recap MVP spotlight',
      ],
      pinnedTopic: `⚔️ Squad "${team.name}" • ${challenge.durationDays} Days of Proof Receipts!`,
    };

    allGroups.unshift(newGroup);
    this.saveAllGroups(allGroups);

    // Initial squad message
    const messages = this.getAllMessages();
    const existingSquadMsg = messages.find((m) => m.groupId === squadGroupId);
    if (!existingSquadMsg) {
      const welcomeMsg: Message = {
        id: `msg_squad_init_${Date.now()}`,
        conversationId: `conv_${squadGroupId}`,
        senderId: team.leaderId,
        groupId: squadGroupId,
        text: `⚔️ Welcome to the ${team.name} Squad Chat for ${challenge.icon} ${challenge.title}! This is your private squad channel to coordinate check-ins and support each other. (The Cohort chat remains open for all challenge members).`,
        timestamp: 'Just now',
        isRead: true,
      };
      this.saveAllMessages([...messages, welcomeMsg]);
    }

    return newGroup;
  }

  static getChallengeSquadMessages(challengeId: string, teamId: string): Message[] {
    const squadGroupId = `group_squad_${challengeId}_${teamId}`;
    const messages = this.getAllMessages();
    const squadMsgs = messages.filter((m) => m.groupId === squadGroupId);
    if (squadMsgs.length > 0) return squadMsgs;

    const challenge = this.getChallengeById(challengeId);
    const team = challenge?.teams?.find((t) => t.id === teamId);
    const welcome: Message = {
      id: `cmsg_squad_${squadGroupId}_welcome`,
      conversationId: `conv_${squadGroupId}`,
      senderId: team?.leaderId || 'user_me',
      groupId: squadGroupId,
      text: `⚔️ Welcome to the ${team?.name || 'Squad'} Chat! This is your private squad space to coordinate daily check-ins and cheer each other on.`,
      timestamp: 'Today at 8:30 AM',
      isRead: true,
    };
    return [welcome];
  }

  static sendChallengeSquadTextMessage(challengeId: string, teamId: string, text: string): Message {
    const squadGroupId = `group_squad_${challengeId}_${teamId}`;
    const currentUser = this.getCurrentUser();
    const newMsg: Message = {
      id: `cmsg_squad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: `conv_${squadGroupId}`,
      senderId: currentUser.id,
      groupId: squadGroupId,
      text: text.trim(),
      timestamp: 'Just now',
      isRead: true,
    };

    const messages = this.getAllMessages();
    this.saveAllMessages([...messages, newMsg]);

    // Update group last activity
    const groups = this.getAllRawGroups();
    const updated = groups.map((g) =>
      g.id === squadGroupId ? { ...g, lastActivity: 'Just now' } : g
    );
    this.saveAllGroups(updated);

    return newMsg;
  }

  // --- STREAK FREEZE SYSTEM ---
  static getStreakFreezeStatus(): {
    freezesAvailable: number;
    isActive: boolean;
    lastUsedDate?: string;
  } {
    const user = this.getCurrentUser();
    return {
      freezesAvailable: user.streakFreezes ?? 1,
      isActive: user.streakFreezeActive ?? true,
      lastUsedDate: user.lastStreakFreezeUsedDate,
    };
  }

  static toggleEquipStreakFreeze(): { user: User; isActive: boolean } {
    const user = this.getCurrentUser();
    const count = user.streakFreezes ?? 0;
    if (count <= 0) {
      return { user, isActive: false };
    }
    const nextState = !user.streakFreezeActive;
    const updated: User = {
      ...user,
      streakFreezeActive: nextState,
    };
    this.saveCurrentUser(updated);
    return { user: updated, isActive: nextState };
  }

  static claimChallengeStreakFreeze(challengeId: string, reason: string): { user: User; success: boolean } {
    const user = this.getCurrentUser();
    const currentCount = user.streakFreezes ?? 0;
    const updated: User = {
      ...user,
      streakFreezes: currentCount + 1,
      streakFreezeActive: true,
    };
    this.saveCurrentUser(updated);

    // Send a celebratory notification
    const notifs = this.getAllNotifications();
    const notif: AppNotification = {
      id: `notif_freeze_${Date.now()}`,
      type: 'streak_freeze_earned',
      actorId: user.id,
      actorName: 'Daily Challenge System',
      actorUsername: 'challenges',
      actorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      message: `❄️ You earned 1x Streak Freeze for: ${reason}! Your streak is shielded against missed days.`,
      createdAt: 'Just now',
      timestamp: Date.now(),
      isRead: false,
    };
    this.saveAllNotifications([notif, ...notifs]);

    return { user: updated, success: true };
  }

  static useStreakFreeze(reason?: string): {
    user: User;
    success: boolean;
    notification?: AppNotification;
    message: string;
  } {
    const user = this.getCurrentUser();
    const count = user.streakFreezes ?? 0;
    const today = getTodayDateString();

    if (count <= 0) {
      return {
        user,
        success: false,
        message: 'No streak freezes available. Earn more by staying consistent in group challenges!',
      };
    }

    if (user.lastStreakFreezeUsedDate === today) {
      return {
        user,
        success: false,
        message: 'A streak freeze is already protecting your streak for today!',
      };
    }

    const updatedUser: User = {
      ...user,
      streakFreezes: Math.max(0, count - 1),
      streakFreezeActive: true,
      lastStreakFreezeUsedDate: today,
    };
    this.saveCurrentUser(updatedUser);

    const notif: AppNotification = {
      id: `notif_freeze_used_${Date.now()}`,
      type: 'streak_freeze_used',
      actorId: 'system',
      actorName: 'Streak Protection',
      actorUsername: 'streak_guardian',
      actorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
      message: `❄️ Streak Freeze Activated: Your ${updatedUser.currentStreak}-day streak is protected for today! Take a breather and reset. Remember to return tomorrow to keep your streak going strong! 🔥`,
      createdAt: 'Just now',
      timestamp: Date.now(),
      isRead: false,
    };

    const notifs = this.getAllNotifications();
    this.saveAllNotifications([notif, ...notifs]);

    // Dispatch global event so UI displays alert modal immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('daily:streak-freeze-used', {
          detail: { user: updatedUser, notification: notif },
        })
      );
    }

    return {
      user: updatedUser,
      success: true,
      notification: notif,
      message: `Your ${updatedUser.currentStreak}-day streak is protected for today! Return tomorrow to keep it going.`,
    };
  }

  static awardChallengeBadge(_badgeName: string): { user: User; awarded: boolean } {
    return { user: this.getCurrentUser(), awarded: false };
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

  // Blocked Users Management
  static getBlockedUserIds(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.BLOCKED_USERS);
    if (!data) {
      const currentUser = this.getCurrentUser();
      const initial = currentUser.blockedUserIds || [];
      this.saveBlockedUserIds(initial);
      return initial;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static saveBlockedUserIds(ids: string[]): void {
    localStorage.setItem(STORAGE_KEYS.BLOCKED_USERS, JSON.stringify(ids));
  }

  static toggleBlockUser(userId: string): { blockedUserIds: string[]; isBlocked: boolean; updatedUser: User } {
    const currentBlocked = this.getBlockedUserIds();
    const isCurrentlyBlocked = currentBlocked.includes(userId);
    const updatedBlocked = isCurrentlyBlocked
      ? currentBlocked.filter((id) => id !== userId)
      : [...currentBlocked, userId];

    this.saveBlockedUserIds(updatedBlocked);

    const currentUser = this.getCurrentUser();
    // Also unfollow if blocking
    let updatedFollowed = currentUser.followedUserIds || [];
    let updatedFollowingCount = currentUser.followingCount || 0;
    if (!isCurrentlyBlocked && updatedFollowed.includes(userId)) {
      updatedFollowed = updatedFollowed.filter((id) => id !== userId);
      updatedFollowingCount = Math.max(0, updatedFollowingCount - 1);
    }

    const updatedUser: User = {
      ...currentUser,
      blockedUserIds: updatedBlocked,
      followedUserIds: updatedFollowed,
      followingCount: updatedFollowingCount,
    };
    this.saveCurrentUser(updatedUser);

    return {
      blockedUserIds: updatedBlocked,
      isBlocked: !isCurrentlyBlocked,
      updatedUser,
    };
  }

  // Personal Habits Management
  static getPersonalHabits(): PersonalHabit[] {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    if (!data) {
      this.savePersonalHabits(INITIAL_PERSONAL_HABITS);
      return INITIAL_PERSONAL_HABITS;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_PERSONAL_HABITS;
    } catch {
      return INITIAL_PERSONAL_HABITS;
    }
  }

  static savePersonalHabits(habits: PersonalHabit[]): void {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  }

  static calculateHabitStreak(completedDates: string[]): number {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const sorted = Array.from(new Set(completedDates)).sort().reverse();
    if (sorted.length === 0) return 0;

    // Must have completed today or yesterday to have active streak
    if (!sorted.includes(today) && !sorted.includes(yesterday)) {
      return 0;
    }

    let streak = 0;
    let checkDate = new Date();
    if (!sorted.includes(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      if (sorted.includes(dateStr)) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  static toggleHabitToday(habitId: string): { habits: PersonalHabit[]; isCompletedToday: boolean; habit: PersonalHabit } {
    const today = getTodayDateString();
    const allHabits = this.getPersonalHabits();
    let isCompletedToday = false;
    let updatedHabit!: PersonalHabit;

    const updated = allHabits.map((h) => {
      if (h.id === habitId) {
        const hasToday = h.completedDates.includes(today);
        isCompletedToday = !hasToday;
        const newDates = hasToday
          ? h.completedDates.filter((d) => d !== today)
          : [today, ...h.completedDates];
        const newStreak = this.calculateHabitStreak(newDates);
        updatedHabit = {
          ...h,
          completedDates: newDates,
          streak: newStreak,
        };
        return updatedHabit;
      }
      return h;
    });

    this.savePersonalHabits(updated);
    return { habits: updated, isCompletedToday, habit: updatedHabit };
  }

  static addPersonalHabit(params: {
    title: string;
    category: PersonalHabit['category'];
    icon: string;
    color: string;
    targetDaysPerWeek: number;
  }): { habits: PersonalHabit[]; newHabit: PersonalHabit } {
    const today = getTodayDateString();
    const newHabit: PersonalHabit = {
      id: `habit_${Date.now()}`,
      title: params.title.trim(),
      category: params.category,
      icon: params.icon || '⚡️',
      color: params.color || '#2F6FED',
      targetDaysPerWeek: params.targetDaysPerWeek || 7,
      completedDates: [today],
      streak: 1,
      createdAt: today,
    };

    const current = this.getPersonalHabits();
    const updated = [newHabit, ...current];
    this.savePersonalHabits(updated);
    return { habits: updated, newHabit };
  }

  static deletePersonalHabit(habitId: string): PersonalHabit[] {
    const current = this.getPersonalHabits();
    const updated = current.filter((h) => h.id !== habitId);
    this.savePersonalHabits(updated);
    return updated;
  }

  // --- NOTIFICATIONS SYSTEM ---
  static getAllNotifications(): AppNotification[] {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) {
      this.saveAllNotifications(INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  static saveAllNotifications(notifications: AppNotification[]): void {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }

  static markNotificationAsRead(id: string): AppNotification[] {
    const notifications = this.getAllNotifications();
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveAllNotifications(updated);
    return updated;
  }

  static markAllNotificationsAsRead(): AppNotification[] {
    const notifications = this.getAllNotifications();
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    this.saveAllNotifications(updated);
    return updated;
  }

  static addNotification(
    notification: Omit<AppNotification, 'id' | 'createdAt'> & { createdAt?: string }
  ): AppNotification[] {
    const current = this.getAllNotifications();
    const newNotif: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: notification.createdAt || 'Just now',
      timestamp: Date.now(),
      isRead: false,
    };
    const updated = [newNotif, ...current];
    this.saveAllNotifications(updated);
    return updated;
  }

  static clearAllNotifications(): AppNotification[] {
    this.saveAllNotifications([]);
    return [];
  }

  // --- PROOF COLLECTIONS SYSTEM ---
  static getProofCollections(): ProofCollection[] {
    const currentUser = this.getCurrentUser();
    return currentUser.proofCollections || [];
  }

  static createProofCollection(params: {
    name: string;
    description?: string;
    icon?: string;
    coverImageUrl?: string;
    initialPostIds?: string[];
  }): { currentUser: User; collection: ProofCollection } {
    const currentUser = this.getCurrentUser();
    const collections = currentUser.proofCollections || [];
    const today = getTodayDateString();

    const newCollection: ProofCollection = {
      id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: params.name.trim(),
      description: params.description?.trim(),
      icon: params.icon || '📁',
      coverImageUrl: params.coverImageUrl || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
      postIds: params.initialPostIds || [],
      createdAt: today,
      updatedAt: today,
    };

    const updatedUser: User = {
      ...currentUser,
      proofCollections: [newCollection, ...collections],
    };

    this.saveCurrentUser(updatedUser);
    return { currentUser: updatedUser, collection: newCollection };
  }

  static addPostToCollection(collectionId: string, postId: string): User {
    const currentUser = this.getCurrentUser();
    const collections = currentUser.proofCollections || [];
    const today = getTodayDateString();

    const updatedCollections = collections.map((col) => {
      if (col.id === collectionId) {
        if (col.postIds.includes(postId)) return col;
        return {
          ...col,
          postIds: [postId, ...col.postIds],
          updatedAt: today,
        };
      }
      return col;
    });

    const updatedUser: User = {
      ...currentUser,
      proofCollections: updatedCollections,
    };

    this.saveCurrentUser(updatedUser);
    return updatedUser;
  }

  static togglePostInCollection(collectionId: string, postId: string): User {
    const currentUser = this.getCurrentUser();
    const collections = currentUser.proofCollections || [];
    const targetCol = collections.find((c) => c.id === collectionId);
    if (targetCol && targetCol.postIds.includes(postId)) {
      return this.removePostFromCollection(collectionId, postId);
    } else {
      return this.addPostToCollection(collectionId, postId);
    }
  }

  static removePostFromCollection(collectionId: string, postId: string): User {
    const currentUser = this.getCurrentUser();
    const collections = currentUser.proofCollections || [];
    const today = getTodayDateString();

    const updatedCollections = collections.map((col) => {
      if (col.id === collectionId) {
        return {
          ...col,
          postIds: col.postIds.filter((id) => id !== postId),
          updatedAt: today,
        };
      }
      return col;
    });

    const updatedUser: User = {
      ...currentUser,
      proofCollections: updatedCollections,
    };

    this.saveCurrentUser(updatedUser);
    return updatedUser;
  }

  static deleteProofCollection(collectionId: string): User {
    const currentUser = this.getCurrentUser();
    const collections = currentUser.proofCollections || [];

    const updatedUser: User = {
      ...currentUser,
      proofCollections: collections.filter((c) => c.id !== collectionId),
    };

    this.saveCurrentUser(updatedUser);
    return updatedUser;
  }

  static updateProofCollection(
    collectionId: string,
    updates: Partial<ProofCollection>
  ): User {
    const currentUser = this.getCurrentUser();
    const collections = currentUser.proofCollections || [];
    const today = getTodayDateString();

    const updatedCollections = collections.map((col) => {
      if (col.id === collectionId) {
        return {
          ...col,
          ...updates,
          updatedAt: today,
        };
      }
      return col;
    });

    const updatedUser: User = {
      ...currentUser,
      proofCollections: updatedCollections,
    };

    this.saveCurrentUser(updatedUser);
    return updatedUser;
  }

  // Reset demo data
  static resetToDefault(): void {
    localStorage.clear();
    this.saveCurrentUser(INITIAL_CURRENT_USER);
    this.saveAllUsers(SAMPLE_USERS);
    this.saveAllPosts(INITIAL_POSTS);
    this.saveAllMessages(INITIAL_MESSAGES);
    this.saveAllGroups(SAMPLE_GROUPS);
    this.savePersonalHabits(INITIAL_PERSONAL_HABITS);
    this.saveAllNotifications(INITIAL_NOTIFICATIONS);
    this.saveBlockedUserIds([]);
    this.saveSavedPostIds(['post_1', 'post_3']);
    this.saveReportedPostIds([]);
    this.setOnboarded(true);
  }

  // ==========================================
  // CHALLENGES ENGINE
  // ==========================================
  static getInitialChallenges(): Challenge[] {
    return [
      {
        id: 'challenge_duo_builder',
        title: 'Startup Sprint: 30-Day Duo Builder',
        description: 'Team up with an accountability partner (2 builders). Ship features and submit daily progress receipts together!',
        icon: '🚀',
        category: 'Coding',
        tag: 'DuoSprint',
        durationDays: 30,
        deadlineDate: '2026-09-30',
        createdBy: 'user_sarah',
        createdByName: 'Sarah Chen',
        createdAt: '2026-08-01',
        participantsCount: 8420,
        participantIds: ['user_me', 'user_marcus', 'user_sarah', 'user_david', 'user_aryan', 'user_priya'],
        completedUserIds: [],
        challengeType: 'group',
        teamSize: 2,
        teams: [
          {
            id: 'team_titans_duo',
            challengeId: 'challenge_duo_builder',
            name: 'Code Titans',
            motto: 'Ship fast, break limits',
            leaderId: 'user_me',
            leaderName: 'Alex Rivera',
            maxMembers: 2,
            memberIds: ['user_me', 'user_marcus'],
            members: [
              {
                userId: 'user_me',
                userName: 'Alex Rivera',
                userUsername: 'alexrivera',
                userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                userStreak: 21,
                joinedAt: '2026-08-01',
                role: 'leader',
              },
              {
                userId: 'user_marcus',
                userName: 'Marcus Vance',
                userUsername: 'marcus_fit',
                userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
                userStreak: 27,
                joinedAt: '2026-08-01',
                role: 'member',
              },
            ],
            createdAt: '2026-08-01',
            totalCheckinsCount: 38,
          },
          {
            id: 'team_nexus_duo',
            challengeId: 'challenge_duo_builder',
            name: 'Nexus Forge',
            motto: 'Zero downtime builders',
            leaderId: 'user_sarah',
            leaderName: 'Sarah Chen',
            maxMembers: 2,
            memberIds: ['user_sarah', 'user_david'],
            members: [
              {
                userId: 'user_sarah',
                userName: 'Sarah Chen',
                userUsername: 'sarahcodes',
                userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
                userStreak: 21,
                joinedAt: '2026-08-01',
                role: 'leader',
              },
              {
                userId: 'user_david',
                userName: 'David Kim',
                userUsername: 'davidk_dev',
                userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
                userStreak: 19,
                joinedAt: '2026-08-01',
                role: 'member',
              },
            ],
            createdAt: '2026-08-01',
            totalCheckinsCount: 36,
          },
        ],
        userPostDates: {
          user_me: [
            getPastDate(17), getPastDate(16), getPastDate(15), getPastDate(14),
            getPastDate(13), getPastDate(12), getPastDate(11), getPastDate(10),
            getPastDate(9), getPastDate(8), getPastDate(7), getPastDate(6),
            getPastDate(5), getPastDate(4), getPastDate(3), getPastDate(2),
            getPastDate(1)
          ],
          user_marcus: [
            getPastDate(17), getPastDate(16), getPastDate(15), getPastDate(14),
            getPastDate(13), getPastDate(12), getPastDate(11), getPastDate(10),
            getPastDate(9), getPastDate(8), getPastDate(7), getPastDate(6),
            getPastDate(5), getPastDate(4), getPastDate(3), getPastDate(2),
            getPastDate(1)
          ],
          user_sarah: [
            getPastDate(20), getPastDate(19), getPastDate(18), getPastDate(17),
            getPastDate(16), getPastDate(15), getPastDate(14), getPastDate(13),
            getPastDate(12), getPastDate(11), getPastDate(10), getPastDate(9),
            getPastDate(8), getPastDate(7), getPastDate(6), getPastDate(5),
            getPastDate(4), getPastDate(3), getPastDate(2), getPastDate(1),
            getPastDate(0)
          ],
        },
      },
      {
        id: 'challenge_trio_spartan',
        title: 'Trio 21-Day Spartan Conditioning',
        description: 'Group challenge for 3 individuals per squad. Daily calisthenics, cold plunge, or intense cardio. Complete accountability.',
        icon: '⚔️',
        category: 'Fitness',
        tag: 'TrioSpartan',
        durationDays: 21,
        deadlineDate: '2026-09-25',
        createdBy: 'user_marcus',
        createdByName: 'Marcus Vance',
        createdAt: '2026-08-05',
        participantsCount: 5120,
        participantIds: ['user_me', 'user_marcus', 'user_elena'],
        completedUserIds: [],
        challengeType: 'group',
        teamSize: 3,
        teams: [
          {
            id: 'team_iron_triad',
            challengeId: 'challenge_trio_spartan',
            name: 'Iron Triad',
            motto: 'No weak links',
            leaderId: 'user_marcus',
            leaderName: 'Marcus Vance',
            maxMembers: 3,
            memberIds: ['user_marcus', 'user_me', 'user_elena'],
            members: [
              {
                userId: 'user_marcus',
                userName: 'Marcus Vance',
                userUsername: 'marcus_fit',
                userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
                userStreak: 27,
                joinedAt: '2026-08-05',
                role: 'leader',
              },
              {
                userId: 'user_me',
                userName: 'Alex Rivera',
                userUsername: 'alexrivera',
                userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
                userStreak: 21,
                joinedAt: '2026-08-05',
                role: 'member',
              },
              {
                userId: 'user_elena',
                userName: 'Elena Rostova',
                userUsername: 'elena_r',
                userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
                userStreak: 12,
                joinedAt: '2026-08-05',
                role: 'member',
              },
            ],
            createdAt: '2026-08-05',
            totalCheckinsCount: 29,
          },
        ],
        userPostDates: {
          user_me: [
            getPastDate(6), getPastDate(5), getPastDate(4), getPastDate(3),
            getPastDate(2), getPastDate(1)
          ],
          user_marcus: [
            getPastDate(6), getPastDate(5), getPastDate(4), getPastDate(3),
            getPastDate(2), getPastDate(1)
          ],
        },
      },
      {
        id: 'challenge_build_30',
        title: '30 Days of Solo Building',
        description: 'Build and ship real working software every single day for 30 consecutive days. Individual accountability.',
        icon: '💻',
        category: 'Coding',
        tag: 'Building',
        durationDays: 30,
        deadlineDate: '2026-09-30',
        createdBy: 'user_sarah',
        createdByName: 'Sarah Chen',
        createdAt: '2026-08-01',
        participantsCount: 12438,
        participantIds: ['user_me', 'user_sarah', 'user_david', 'user_aryan', 'user_priya'],
        completedUserIds: [],
        challengeType: 'individual',
        userPostDates: {
          user_me: [
            getPastDate(17), getPastDate(16), getPastDate(15), getPastDate(14),
            getPastDate(13), getPastDate(12), getPastDate(11), getPastDate(10),
            getPastDate(9), getPastDate(8), getPastDate(7), getPastDate(6),
            getPastDate(5), getPastDate(4), getPastDate(3), getPastDate(2),
            getPastDate(1)
          ],
          user_sarah: [
            getPastDate(20), getPastDate(19), getPastDate(18), getPastDate(17),
            getPastDate(16), getPastDate(15), getPastDate(14), getPastDate(13),
            getPastDate(12), getPastDate(11), getPastDate(10), getPastDate(9),
            getPastDate(8), getPastDate(7), getPastDate(6), getPastDate(5),
            getPastDate(4), getPastDate(3), getPastDate(2), getPastDate(1),
            getPastDate(0)
          ],
        },
      },
      {
        id: 'challenge_fitness_60',
        title: '60-Day Fitness Mastery',
        description: 'Workout and physical conditioning proof every single day. No excuses. Photo receipts mandatory.',
        icon: '🏋️‍♂️',
        category: 'Fitness',
        tag: 'Fitness',
        durationDays: 60,
        deadlineDate: '2026-10-31',
        createdBy: 'user_marcus',
        createdByName: 'Marcus Vance',
        createdAt: '2026-08-01',
        participantsCount: 8920,
        participantIds: ['user_me', 'user_marcus', 'user_elena'],
        completedUserIds: [],
        challengeType: 'individual',
        userPostDates: {
          user_me: [
            getPastDate(10), getPastDate(9), getPastDate(8), getPastDate(7),
            getPastDate(6), getPastDate(5), getPastDate(4), getPastDate(3),
            getPastDate(2), getPastDate(1)
          ],
        },
      },
      {
        id: 'challenge_reading_30',
        title: '30 Days of Deep Reading',
        description: 'Read 25+ pages daily and photograph key margin notes or book highlights.',
        icon: '📚',
        category: 'Learning',
        tag: 'Reading',
        durationDays: 30,
        deadlineDate: '2026-09-30',
        createdBy: 'user_elena',
        createdByName: 'Elena Rostova',
        createdAt: '2026-08-10',
        participantsCount: 6410,
        participantIds: ['user_sarah', 'user_elena'],
        completedUserIds: [],
        challengeType: 'individual',
        userPostDates: {},
      },
      {
        id: 'challenge_dawn_21',
        title: '21-Day 5:00 AM Dawn Protocol',
        description: 'Rise before dawn, log morning sunlight/study proof, and seize the day.',
        icon: '🌅',
        category: 'Mindset',
        tag: 'EarlyRise',
        durationDays: 21,
        deadlineDate: '2026-09-21',
        createdBy: 'user_me',
        createdByName: 'Alex Rivera',
        createdAt: '2026-08-15',
        participantsCount: 4230,
        participantIds: ['user_me', 'user_marcus', 'user_priya'],
        completedUserIds: [],
        challengeType: 'individual',
        userPostDates: {
          user_me: [
            getPastDate(6), getPastDate(5), getPastDate(4), getPastDate(3),
            getPastDate(2), getPastDate(1)
          ],
        },
      },
    ];
  }

  static getInitialChallengeProgressPosts(): ChallengeProgressPost[] {
    return [
      {
        id: 'cpost_group_1',
        challengeId: 'challenge_duo_builder',
        userId: 'user_marcus',
        userName: 'Marcus Vance',
        userUsername: 'marcus_fit',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        userStreak: 27,
        dayNumber: 18,
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
        text: 'Day 18 of Duo Sprint! @alexrivera knocked out the back-end while I hooked up WebSocket signals.',
        createdAt: '1h ago',
        postDate: getTodayDateString(),
        cheersCount: 42,
        cheeredByMe: true,
        challengeType: 'group',
        teamId: 'team_titans_duo',
        teamName: 'Code Titans',
        teamMembers: [
          { userId: 'user_me', userName: 'Alex Rivera', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
          { userId: 'user_marcus', userName: 'Marcus Vance', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' }
        ],
      },
      {
        id: 'cpost_1',
        challengeId: 'challenge_duo_builder',
        userId: 'user_sarah',
        userName: 'Sarah Chen',
        userUsername: 'sarahcodes',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        userStreak: 21,
        dayNumber: 21,
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
        text: 'Day 21 of Duo Sprint with @davidk_dev! Built out rate-limiting and error alerts.',
        createdAt: '2h ago',
        postDate: getTodayDateString(),
        cheersCount: 28,
        cheeredByMe: true,
        challengeType: 'group',
        teamId: 'team_nexus_duo',
        teamName: 'Nexus Forge',
      },
      {
        id: 'cpost_2',
        challengeId: 'challenge_build_30',
        userId: 'user_david',
        userName: 'David Kim',
        userUsername: 'davidk_dev',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        userStreak: 19,
        dayNumber: 19,
        imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1000&auto=format&fit=crop&q=80',
        text: 'Day 19: Cleaned up Postgres schema migrations and verified connection pool latency.',
        createdAt: '4h ago',
        postDate: getTodayDateString(),
        cheersCount: 14,
        challengeType: 'individual',
      },
      {
        id: 'cpost_3',
        challengeId: 'challenge_fitness_60',
        userId: 'user_marcus',
        userName: 'Marcus Vance',
        userUsername: 'marcus_fit',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        userStreak: 27,
        dayNumber: 27,
        imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=80',
        text: 'Day 27/60: Heavy deadlifts + 30 min incline treadmill walk. Staying locked in.',
        createdAt: '1h ago',
        postDate: getTodayDateString(),
        cheersCount: 35,
        cheeredByMe: true,
        challengeType: 'individual',
      },
      {
        id: 'cpost_4',
        challengeId: 'challenge_dawn_21',
        userId: 'user_marcus',
        userName: 'Marcus Vance',
        userUsername: 'marcus_fit',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        userStreak: 14,
        dayNumber: 14,
        imageUrl: 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1000&auto=format&fit=crop&q=80',
        text: 'Day 14: Up at 4:55 AM. 10m breathing + 45m deep book study before dawn.',
        createdAt: '5h ago',
        postDate: getTodayDateString(),
        cheersCount: 19,
        challengeType: 'individual',
      },
    ];
  }

  static getAllChallenges(): Challenge[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
    if (!data) {
      const initial = this.getInitialChallenges();
      this.saveAllChallenges(initial);
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      const initial = this.getInitialChallenges();
      this.saveAllChallenges(initial);
      return initial;
    }
  }

  static saveAllChallenges(challenges: Challenge[]): void {
    localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
  }

  static getChallengeById(challengeId: string): Challenge | undefined {
    const all = this.getAllChallenges();
    return all.find((c) => c.id === challengeId);
  }

  static getAllChallengeProgressPosts(challengeId?: string): ChallengeProgressPost[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHALLENGE_PROGRESS_POSTS);
    let posts: ChallengeProgressPost[] = [];
    if (!data) {
      posts = this.getInitialChallengeProgressPosts();
      this.saveAllChallengeProgressPosts(posts);
    } else {
      try {
        posts = JSON.parse(data);
      } catch {
        posts = this.getInitialChallengeProgressPosts();
        this.saveAllChallengeProgressPosts(posts);
      }
    }

    if (challengeId) {
      return posts.filter((p) => p.challengeId === challengeId);
    }
    return posts;
  }

  static saveAllChallengeProgressPosts(posts: ChallengeProgressPost[]): void {
    localStorage.setItem(STORAGE_KEYS.CHALLENGE_PROGRESS_POSTS, JSON.stringify(posts));
  }

  static createChallenge(payload: {
    title: string;
    description: string;
    icon: string;
    category: string;
    durationDays: number;
    deadlineDate: string;
    tag?: string;
    challengeType?: ChallengeType;
    teamSize?: number;
  }): Challenge {
    const currentUser = this.getCurrentUser();
    const today = getTodayDateString();
    const cleanTag = payload.tag?.trim() || payload.category || 'Challenge';
    const type: ChallengeType = payload.challengeType || 'individual';
    const teamSize = type === 'group' ? Math.max(2, payload.teamSize || 2) : undefined;

    // If it is a group challenge, automatically create the creator's initial team
    const initialTeams: ChallengeTeam[] = [];
    if (type === 'group') {
      const creatorTeam: ChallengeTeam = {
        id: `team_${Date.now()}`,
        challengeId: `challenge_${Date.now()}`,
        name: `${currentUser.name.split(' ')[0]}'s Squad`,
        motto: 'Leading the cohort to victory',
        leaderId: currentUser.id,
        leaderName: currentUser.name,
        maxMembers: teamSize || 2,
        memberIds: [currentUser.id],
        members: [
          {
            userId: currentUser.id,
            userName: currentUser.name,
            userUsername: currentUser.username,
            userAvatar: currentUser.avatar,
            userStreak: currentUser.currentStreak,
            joinedAt: today,
            role: 'leader',
          },
        ],
        createdAt: today,
        totalCheckinsCount: 0,
      };
      initialTeams.push(creatorTeam);
    }

    const newChallengeId = `challenge_${Date.now()}`;
    if (initialTeams.length > 0) {
      initialTeams[0].challengeId = newChallengeId;
    }

    const newChallenge: Challenge = {
      id: newChallengeId,
      title: payload.title.trim(),
      description: payload.description.trim(),
      icon: payload.icon || (type === 'group' ? '👥' : '🔥'),
      category: payload.category || 'Discipline',
      tag: cleanTag.replace(/^#/, ''),
      durationDays: Math.max(1, payload.durationDays || 30),
      deadlineDate: payload.deadlineDate || '2026-10-31',
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: today,
      participantsCount: 1,
      participantIds: [currentUser.id],
      completedUserIds: [],
      challengeType: type,
      teamSize: teamSize,
      teams: type === 'group' ? initialTeams : undefined,
      userPostDates: {
        [currentUser.id]: [],
      },
    };

    const all = this.getAllChallenges();
    const updated = [newChallenge, ...all];
    this.saveAllChallenges(updated);
    return newChallenge;
  }

  static toggleJoinChallenge(challengeId: string): { challenge: Challenge; joined: boolean; isCompleted: boolean } {
    const currentUser = this.getCurrentUser();
    const all = this.getAllChallenges();
    let joined = false;
    let isCompleted = false;

    const updated = all.map((c) => {
      if (c.id === challengeId) {
        const isMember = (c.participantIds || []).includes(currentUser.id);
        const userDates = c.userPostDates?.[currentUser.id] || [];
        const hasFinishedDays = userDates.length >= c.durationDays;
        const isMarkedCompleted = (c.completedUserIds || []).includes(currentUser.id) || hasFinishedDays;

        if (isMember) {
          // Leave challenge
          joined = false;
          const nextParticipants = (c.participantIds || []).filter((id) => id !== currentUser.id);
          const nextCompleted = isMarkedCompleted
            ? Array.from(new Set([...(c.completedUserIds || []), currentUser.id]))
            : c.completedUserIds || [];

          // Also remove user from any team in this challenge
          const nextTeams = (c.teams || []).map((t) => {
            const memberIds = t.memberIds || [];
            const members = t.members || [];
            if (memberIds.includes(currentUser.id)) {
              const newMembers = members.filter((m) => m.userId !== currentUser.id);
              const newMemberIds = memberIds.filter((id) => id !== currentUser.id);
              return {
                ...t,
                members: newMembers,
                memberIds: newMemberIds,
                leaderId: t.leaderId === currentUser.id ? (newMembers[0]?.userId || '') : t.leaderId,
                leaderName: t.leaderId === currentUser.id ? (newMembers[0]?.userName || '') : t.leaderName,
              };
            }
            return t;
          }).filter((t) => (t.memberIds || []).length > 0); // Drop empty teams if deserted

          return {
            ...c,
            participantIds: nextParticipants,
            participantsCount: Math.max(0, nextParticipants.length),
            completedUserIds: nextCompleted,
            teams: c.challengeType === 'group' ? nextTeams : c.teams,
          };
        } else {
          // Join challenge
          joined = true;
          isCompleted = isMarkedCompleted;
          const nextParticipants = Array.from(new Set([...(c.participantIds || []), currentUser.id]));
          return {
            ...c,
            participantIds: nextParticipants,
            participantsCount: nextParticipants.length,
          };
        }
      }
      return c;
    });

    this.saveAllChallenges(updated);
    const targetChallenge = updated.find((c) => c.id === challengeId)!;
    return { challenge: targetChallenge, joined, isCompleted };
  }

  // --- GROUP CHALLENGE TEAMS MANAGEMENT ---
  static createChallengeTeam(
    challengeId: string,
    teamName: string,
    motto?: string
  ): { challenge: Challenge; team: ChallengeTeam } {
    const currentUser = this.getCurrentUser();
    const all = this.getAllChallenges();
    const target = all.find((c) => c.id === challengeId);
    if (!target) throw new Error('Challenge not found');

    const maxMembers = target.teamSize || 2;
    const newTeam: ChallengeTeam = {
      id: `team_${Date.now()}`,
      challengeId,
      name: teamName.trim(),
      motto: motto?.trim() || undefined,
      leaderId: currentUser.id,
      leaderName: currentUser.name,
      maxMembers,
      memberIds: [currentUser.id],
      members: [
        {
          userId: currentUser.id,
          userName: currentUser.name,
          userUsername: currentUser.username,
          userAvatar: currentUser.avatar,
          userStreak: currentUser.currentStreak,
          joinedAt: getTodayDateString(),
          role: 'leader',
        },
      ],
      createdAt: getTodayDateString(),
      totalCheckinsCount: 0,
    };

    const updatedChallenges = all.map((c) => {
      if (c.id === challengeId) {
        // Remove user from any existing team in this challenge first
        const existingTeams = (c.teams || []).map((t) => {
          const memberIds = t.memberIds || [];
          const members = t.members || [];
          if (memberIds.includes(currentUser.id)) {
            return {
              ...t,
              memberIds: memberIds.filter((id) => id !== currentUser.id),
              members: members.filter((m) => m.userId !== currentUser.id),
            };
          }
          return t;
        }).filter((t) => (t.memberIds || []).length > 0);

        const nextParticipants = Array.from(new Set([...(c.participantIds || []), currentUser.id]));

        return {
          ...c,
          participantIds: nextParticipants,
          participantsCount: nextParticipants.length,
          teams: [newTeam, ...existingTeams],
        };
      }
      return c;
    });

    this.saveAllChallenges(updatedChallenges);
    const updated = updatedChallenges.find((c) => c.id === challengeId)!;
    this.ensureChallengeSquadGroup(challengeId, newTeam.id);
    return { challenge: updated, team: newTeam };
  }

  static joinChallengeTeam(
    challengeId: string,
    teamId: string
  ): { challenge: Challenge; team?: ChallengeTeam; joined: boolean; error?: string } {
    const currentUser = this.getCurrentUser();
    const all = this.getAllChallenges();
    const target = all.find((c) => c.id === challengeId);
    if (!target) return { challenge: all[0], joined: false, error: 'Challenge not found' };

    const targetTeam = (target.teams || []).find((t) => t.id === teamId);
    if (!targetTeam) return { challenge: target, joined: false, error: 'Team not found' };

    const targetMemberIds = targetTeam.memberIds || [];
    if (targetMemberIds.length >= targetTeam.maxMembers && !targetMemberIds.includes(currentUser.id)) {
      return {
        challenge: target,
        joined: false,
        error: `This team is full! Max ${targetTeam.maxMembers} members allowed.`,
      };
    }

    let updatedTeam: ChallengeTeam | undefined;

    const updatedChallenges = all.map((c) => {
      if (c.id === challengeId) {
        // Clean user from other teams
        const cleanTeams = (c.teams || []).map((t) => {
          const memberIds = t.memberIds || [];
          const members = t.members || [];
          if (t.id === teamId) {
            if (memberIds.includes(currentUser.id)) {
              updatedTeam = t;
              return t;
            }
            const newMembers = [
              ...members,
              {
                userId: currentUser.id,
                userName: currentUser.name,
                userUsername: currentUser.username,
                userAvatar: currentUser.avatar,
                userStreak: currentUser.currentStreak,
                joinedAt: getTodayDateString(),
                role: 'member' as const,
              },
            ];
            const newMemberIds = [...memberIds, currentUser.id];
            updatedTeam = {
              ...t,
              members: newMembers,
              memberIds: newMemberIds,
            };
            return updatedTeam;
          } else if (memberIds.includes(currentUser.id)) {
            return {
              ...t,
              memberIds: memberIds.filter((id) => id !== currentUser.id),
              members: members.filter((m) => m.userId !== currentUser.id),
            };
          }
          return t;
        }).filter((t) => (t.memberIds || []).length > 0);

        const nextParticipants = Array.from(new Set([...(c.participantIds || []), currentUser.id]));

        return {
          ...c,
          participantIds: nextParticipants,
          participantsCount: nextParticipants.length,
          teams: cleanTeams,
        };
      }
      return c;
    });

    this.saveAllChallenges(updatedChallenges);
    const updated = updatedChallenges.find((c) => c.id === challengeId)!;
    if (updatedTeam) {
      this.ensureChallengeSquadGroup(challengeId, updatedTeam.id);
    }
    return { challenge: updated, team: updatedTeam, joined: true };
  }

  static leaveChallengeTeam(challengeId: string, teamId?: string): { challenge: Challenge } {
    const currentUser = this.getCurrentUser();
    const all = this.getAllChallenges();

    const updatedChallenges = all.map((c) => {
      if (c.id === challengeId) {
        const nextTeams = (c.teams || []).map((t) => {
          const memberIds = t.memberIds || [];
          const members = t.members || [];
          if (!teamId || t.id === teamId || memberIds.includes(currentUser.id)) {
            const nextMembers = members.filter((m) => m.userId !== currentUser.id);
            const nextMemberIds = memberIds.filter((id) => id !== currentUser.id);
            return {
              ...t,
              members: nextMembers,
              memberIds: nextMemberIds,
              leaderId: t.leaderId === currentUser.id ? (nextMembers[0]?.userId || '') : t.leaderId,
              leaderName: t.leaderId === currentUser.id ? (nextMembers[0]?.userName || '') : t.leaderName,
            };
          }
          return t;
        }).filter((t) => (t.memberIds || []).length > 0);

        return {
          ...c,
          teams: nextTeams,
        };
      }
      return c;
    });

    this.saveAllChallenges(updatedChallenges);
    const target = updatedChallenges.find((c) => c.id === challengeId)!;
    return { challenge: target };
  }

  static getUserChallengeTeam(challengeId: string, userId?: string): ChallengeTeam | undefined {
    const targetUserId = userId || this.getCurrentUser().id;
    const challenge = this.getChallengeById(challengeId);
    if (!challenge || !challenge.teams) return undefined;
    return challenge.teams.find((t) => (t.memberIds || []).includes(targetUserId));
  }

  static getChallengeUserProgress(
    challengeId: string,
    userId?: string
  ): {
    daysCompleted: number;
    totalDays: number;
    isJoined: boolean;
    isCompleted: boolean;
    hasPostedToday: boolean;
    canPost: boolean;
    userTeam?: ChallengeTeam;
    reason?: string;
    userPostDates: string[];
    currentStreak: number;
  } {
    const currentUser = this.getCurrentUser();
    const targetUserId = userId || currentUser.id;
    const challenge = this.getChallengeById(challengeId);
    const today = getTodayDateString();

    if (!challenge) {
      return {
        daysCompleted: 0,
        totalDays: 30,
        isJoined: false,
        isCompleted: false,
        hasPostedToday: false,
        canPost: false,
        reason: 'Challenge not found',
        userPostDates: [],
        currentStreak: 0,
      };
    }

    const isJoined = (challenge.participantIds || []).includes(targetUserId);
    const postDates = challenge.userPostDates?.[targetUserId] || [];
    const daysCompleted = postDates.length;
    const hasPostedToday = postDates.includes(today);
    const userTeam = this.getUserChallengeTeam(challengeId, targetUserId);
    
    // Check if challenge is expired by deadline
    const isDeadlinePassed = Boolean(challenge.deadlineDate && challenge.deadlineDate < today);

    // Completed if user reached total days OR marked in completedUserIds
    const isCompleted =
      daysCompleted >= challenge.durationDays ||
      (challenge.completedUserIds || []).includes(targetUserId);

    let canPost = false;
    let reason: string | undefined;

    if (!isJoined) {
      canPost = false;
      reason = 'Join this challenge to track and submit your progress.';
    } else if (challenge.challengeType === 'group' && !userTeam) {
      canPost = false;
      reason = 'Join or create a squad team in this group challenge to post team receipts.';
    } else if (isCompleted) {
      canPost = false;
      reason = `You have completed all ${challenge.durationDays} days of this challenge! Posting is now closed.`;
    } else if (isDeadlinePassed) {
      canPost = false;
      reason = 'This challenge deadline has passed. Posting is closed.';
    } else if (hasPostedToday) {
      canPost = false;
      reason = 'You have already logged your challenge proof for today! Come back tomorrow.';
    } else {
      canPost = true;
    }

    return {
      daysCompleted,
      totalDays: challenge.durationDays,
      isJoined,
      isCompleted,
      hasPostedToday,
      canPost,
      userTeam,
      reason,
      userPostDates: postDates,
      currentStreak: Math.max(hasPostedToday ? 1 : 0, daysCompleted),
    };
  }

  static getChallengeTodayProofStats(challengeId: string, teamId?: string): {
    totalMembers: number;
    submittedCount: number;
    percentage: number;
    submittedMembers: Array<{
      userId: string;
      userName: string;
      userAvatar: string;
      imageUrl?: string;
      timeAgo?: string;
    }>;
    pendingMembers: Array<{
      userId: string;
      userName: string;
      userAvatar: string;
    }>;
    hasCurrentUserSubmitted: boolean;
    allSubmitted: boolean;
    urgencyLevel: 'critical' | 'moderate' | 'complete';
    teamName?: string;
    challengeTitle: string;
    challengeIcon: string;
  } {
    const challenge = this.getChallengeById(challengeId);
    const currentUser = this.getCurrentUser();
    const today = getTodayDateString();

    if (!challenge) {
      return {
        totalMembers: 0,
        submittedCount: 0,
        percentage: 0,
        submittedMembers: [],
        pendingMembers: [],
        hasCurrentUserSubmitted: false,
        allSubmitted: false,
        urgencyLevel: 'moderate',
        challengeTitle: 'Challenge',
        challengeIcon: '🏆',
      };
    }

    const allProgressPosts = this.getAllChallengeProgressPosts(challengeId) || [];
    const postsToday = allProgressPosts.filter((p) => p.postDate === today);

    // Determine target group/squad members
    let squadMembers: Array<{ userId: string; userName: string; userAvatar: string }> = [];
    let resolvedTeamName: string | undefined;

    if (challenge.challengeType === 'group' && Array.isArray(challenge.teams) && challenge.teams.length > 0) {
      const team = teamId
        ? challenge.teams.find((t) => t.id === teamId)
        : challenge.teams.find((t) => Array.isArray(t.members) && t.members.some((m) => m.userId === currentUser.id)) ||
          challenge.teams.find((t) => Array.isArray(t.memberIds) && t.memberIds.includes(currentUser.id)) ||
          challenge.teams[0];

      if (team) {
        resolvedTeamName = team.name;
        if (Array.isArray(team.members) && team.members.length > 0) {
          squadMembers = team.members.map((m) => ({
            userId: m.userId,
            userName: m.userName,
            userAvatar: m.userAvatar,
          }));
        } else if (Array.isArray(team.memberIds) && team.memberIds.length > 0) {
          const allUsers = this.getAllUsers() || [];
          const userMap = new Map(allUsers.map((u) => [u.id, u]));
          squadMembers = team.memberIds.map((id) => {
            const u = userMap.get(id);
            return {
              userId: id,
              userName: id === currentUser.id ? currentUser.name : (u?.name || 'Member'),
              userAvatar: id === currentUser.id ? currentUser.avatar : (u?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
            };
          });
        }
      }
    }

    // Fallback to participants if not a group or team has no members
    if (squadMembers.length === 0) {
      const allUsers = this.getAllUsers() || [];
      const userMap = new Map(allUsers.map((u) => [u.id, u]));
      const participantIds = challenge.participantIds || [currentUser.id];
      squadMembers = participantIds.map((id) => {
        const u = userMap.get(id);
        return {
          userId: id,
          userName: id === currentUser.id ? currentUser.name : (u?.name || 'Member'),
          userAvatar: id === currentUser.id ? currentUser.avatar : (u?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'),
        };
      });
    }

    const submittedMap = new Map<string, ChallengeProgressPost>();
    postsToday.forEach((p) => {
      submittedMap.set(p.userId, p);
    });

    const submittedMembers: Array<{
      userId: string;
      userName: string;
      userAvatar: string;
      imageUrl?: string;
      timeAgo?: string;
    }> = [];

    const pendingMembers: Array<{
      userId: string;
      userName: string;
      userAvatar: string;
    }> = [];

    squadMembers.forEach((member) => {
      const post = submittedMap.get(member.userId);
      if (post) {
        submittedMembers.push({
          userId: member.userId,
          userName: member.userId === currentUser.id ? `${currentUser.name} (You)` : member.userName,
          userAvatar: member.userAvatar,
          imageUrl: post.imageUrl,
          timeAgo: post.createdAt || 'Today',
        });
      } else {
        pendingMembers.push({
          userId: member.userId,
          userName: member.userId === currentUser.id ? `${currentUser.name} (You)` : member.userName,
          userAvatar: member.userAvatar,
        });
      }
    });

    const totalMembers = Math.max(1, squadMembers.length);
    const submittedCount = submittedMembers.length;
    const percentage = Math.min(100, Math.round((submittedCount / totalMembers) * 100));
    const hasCurrentUserSubmitted = submittedMembers.some((m) => m.userId === currentUser.id);
    const allSubmitted = submittedCount >= totalMembers;

    const urgencyLevel: 'critical' | 'moderate' | 'complete' = allSubmitted
      ? 'complete'
      : (submittedCount === 0 || !hasCurrentUserSubmitted ? 'critical' : 'moderate');

    return {
      totalMembers,
      submittedCount,
      percentage,
      submittedMembers,
      pendingMembers,
      hasCurrentUserSubmitted,
      allSubmitted,
      urgencyLevel,
      teamName: resolvedTeamName,
      challengeTitle: challenge.title,
      challengeIcon: challenge.icon,
    };
  }

  static postChallengeProgress(
    challengeId: string,
    payload: { imageUrl: string; text?: string }
  ): {
    success: boolean;
    progressPost?: ChallengeProgressPost;
    challenge?: Challenge;
    error?: string;
  } {
    const currentUser = this.getCurrentUser();
    const today = getTodayDateString();
    const allChallenges = this.getAllChallenges();
    const targetChallenge = allChallenges.find((c) => c.id === challengeId);

    if (!targetChallenge) {
      return { success: false, error: 'Challenge not found' };
    }

    // Mandatory photo validation
    if (!payload.imageUrl || !payload.imageUrl.trim()) {
      return {
        success: false,
        error: 'Please insert a photo as your achievement proof (photo is required).',
      };
    }

    const progress = this.getChallengeUserProgress(challengeId, currentUser.id);
    if (!progress.canPost) {
      return {
        success: false,
        error: progress.reason || 'You cannot post to this challenge at this time.',
      };
    }

    const userTeam = progress.userTeam;

    const currentDates = targetChallenge.userPostDates?.[currentUser.id] || [];
    const nextDates = [...currentDates, today];
    const newDayNumber = nextDates.length;
    const isNowFinished = newDayNumber >= targetChallenge.durationDays;

    const nextCompletedUserIds = isNowFinished
      ? Array.from(new Set([...(targetChallenge.completedUserIds || []), currentUser.id]))
      : targetChallenge.completedUserIds || [];

    const updatedChallenges = allChallenges.map((c) => {
      if (c.id === challengeId) {
        // Update team checkin count if group challenge
        const updatedTeams = c.teams?.map((t) => {
          if (userTeam && t.id === userTeam.id) {
            return {
              ...t,
              totalCheckinsCount: (t.totalCheckinsCount || 0) + 1,
            };
          }
          return t;
        });

        return {
          ...c,
          completedUserIds: nextCompletedUserIds,
          teams: updatedTeams || c.teams,
          userPostDates: {
            ...(c.userPostDates || {}),
            [currentUser.id]: nextDates,
          },
        };
      }
      return c;
    });

    this.saveAllChallenges(updatedChallenges);

    const newProgressPost: ChallengeProgressPost = {
      id: `cpost_${Date.now()}`,
      challengeId,
      userId: currentUser.id,
      userName: currentUser.name,
      userUsername: currentUser.username,
      userAvatar: currentUser.avatar,
      userStreak: currentUser.currentStreak,
      dayNumber: newDayNumber,
      imageUrl: payload.imageUrl.trim(),
      text: payload.text?.trim() || undefined,
      createdAt: 'Just now',
      postDate: today,
      cheersCount: 0,
      cheeredByMe: false,
      challengeType: targetChallenge.challengeType || 'individual',
      teamId: userTeam?.id,
      teamName: userTeam?.name,
      teamMembers: userTeam?.members.map((m) => ({
        userId: m.userId,
        userName: m.userName,
        userAvatar: m.userAvatar,
      })),
    };

    const allPosts = this.getAllChallengeProgressPosts();
    this.saveAllChallengeProgressPosts([newProgressPost, ...allPosts]);

    const updatedChallenge = updatedChallenges.find((c) => c.id === challengeId);

    // If user is in a group challenge team, notify squad chat!
    if (userTeam) {
      try {
        this.sendChallengeSquadTextMessage(
          challengeId,
          userTeam.id,
          `🔥 @${currentUser.username} just logged Day ${newDayNumber} proof for our squad! Keep the streak alive! 🚀`
        );
      } catch {
        // ignore
      }
    }

    // --- AUTOMATIC STREAK FREEZE REWARDS ---
    try {
      // Earn Streak Freeze: high engagement milestone at Day 5
      if (newDayNumber === 5) {
        this.claimChallengeStreakFreeze(challengeId, `5 Verified Check-ins in "${targetChallenge.title}"`);
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      progressPost: newProgressPost,
      challenge: updatedChallenge,
    };
  }

  static toggleCheerChallengePost(postId: string): ChallengeProgressPost[] {
    const posts = this.getAllChallengeProgressPosts();
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const cheered = !p.cheeredByMe;
        return {
          ...p,
          cheeredByMe: cheered,
          cheersCount: cheered ? p.cheersCount + 1 : Math.max(0, p.cheersCount - 1),
        };
      }
      return p;
    });
    this.saveAllChallengeProgressPosts(updated);
    return updated;
  }

  // --- CHALLENGE LEADERBOARD COMPUTATION ---
  static getChallengeLeaderboard(challengeId: string, currentUserId?: string): ChallengeLeaderboard {
    const challenge = this.getChallengeById(challengeId);
    if (!challenge) {
      return {
        individuals: [],
        squads: [],
        summary: {
          totalParticipants: 0,
          totalCheckins: 0,
          cohortActiveStreakRate: 0,
          averageDaysCompleted: 0,
          topStreak: 0,
        },
      };
    }

    const allUsers = this.getAllUsers();
    const activeUserId = currentUserId || this.getCurrentUser().id;
    const currentUser = allUsers.find((u) => u.id === activeUserId) || this.getCurrentUser();
    const allProgressPosts = this.getAllChallengeProgressPosts().filter((p) => p.challengeId === challengeId);
    const today = getTodayDateString();

    // 1. Individuals Leaderboard Calculation
    const participantIds = Array.from(
      new Set([
        ...(challenge.participantIds || []),
        ...allProgressPosts.map((p) => p.userId),
      ])
    );

    // Ensure we have a competitive cohort preview with active users
    if (participantIds.length < 5) {
      allUsers.slice(0, 5).forEach((u) => {
        if (!participantIds.includes(u.id)) participantIds.push(u.id);
      });
    }

    const individuals: ChallengeLeaderboardIndividual[] = participantIds.map((userId) => {
      const user =
        allUsers.find((u) => u.id === userId) ||
        (userId === currentUser.id
          ? currentUser
          : {
              id: userId,
              name: 'Athlete',
              username: 'athlete',
              avatar:
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
              currentStreak: 12,
            });

      const userPosts = allProgressPosts.filter((p) => p.userId === userId);
      const postDates = challenge.userPostDates?.[userId] || userPosts.map((p) => p.postDate);
      const uniqueDays = Array.from(new Set(postDates)).length;

      // Realistic days completed calculation
      const daysCompleted = Math.max(
        uniqueDays,
        userPosts.length,
        userId === currentUser.id
          ? challenge.userPostDates?.[currentUser.id]?.length || 0
          : Math.min(challenge.durationDays, (user.currentStreak % challenge.durationDays) + 1)
      );

      const totalCheers =
        userPosts.reduce((sum, p) => sum + (p.cheersCount || 0), 0) + (daysCompleted * 3);
      const streakInChallenge = Math.max(1, Math.min(daysCompleted, user.currentStreak || daysCompleted));

      // Consistency rate calculation (e.g. 75% - 100%)
      const consistencyRate = Math.min(
        100,
        Math.max(
          65,
          Math.round(
            (daysCompleted / Math.max(1, Math.min(daysCompleted + 2, challenge.durationDays))) * 100
          )
        )
      );

      // Composite scoring: posting frequency + consistency + active streak + engagement
      const score =
        daysCompleted * 100 + consistencyRate * 10 + streakInChallenge * 50 + totalCheers * 5;

      let badgeTitle = 'Cohort Pacer';
      if (consistencyRate >= 95 && daysCompleted >= 15) badgeTitle = '👑 Flawless Streak';
      else if (streakInChallenge >= 10) badgeTitle = '🔥 Iron Streak';
      else if (totalCheers >= 50) badgeTitle = '⚡️ Community Titan';
      else if (daysCompleted >= 7) badgeTitle = '🎖️ Consistent Pioneer';

      const userTeam = this.getUserChallengeTeam(challengeId, userId);
      const latestPost = userPosts[0];
      const hasPostedToday = postDates.includes(today) || (userId === currentUser.id && challenge.userPostDates?.[currentUser.id]?.includes(today));

      return {
        rank: 0,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          currentStreak: user.currentStreak || streakInChallenge,
        },
        daysCompleted,
        totalDays: challenge.durationDays,
        totalCheckins: daysCompleted,
        completionPercentage: Math.round((daysCompleted / challenge.durationDays) * 100),
        currentStreak: user.currentStreak || streakInChallenge,
        consistencyRate,
        consistencyScore: consistencyRate,
        streakInChallenge,
        totalCheers,
        score,
        badgeTitle,
        latestProofImageUrl: latestPost?.imageUrl || undefined,
        teamName: userTeam?.name,
        hasPostedToday: Boolean(hasPostedToday),
        isCurrentUser: userId === activeUserId,
      };
    });

    individuals.sort((a, b) => b.score - a.score);
    individuals.forEach((item, index) => {
      item.rank = index + 1;
    });

    // 2. Squads Leaderboard Calculation (for group challenges)
    const squads: ChallengeLeaderboardSquad[] = (challenge.teams || []).map((team) => {
      const memberIds = team.memberIds || [];
      const members = team.members || [];
      const teamPosts = allProgressPosts.filter(
        (p) => p.teamId === team.id || memberIds.includes(p.userId)
      );
      const totalCheckins = Math.max(
        team.totalCheckinsCount || 0,
        teamPosts.length,
        members.reduce((acc, m) => acc + (m.checkinsCount || 0), 0)
      );
      const totalCheers =
        teamPosts.reduce((acc, p) => acc + (p.cheersCount || 0), 0) + totalCheckins * 4;

      const memberCheckinCounts: Record<string, number> = {};
      memberIds.forEach((mId) => {
        memberCheckinCounts[mId] = teamPosts.filter((p) => p.userId === mId).length;
      });
      let topMId = members[0]?.userId || team.leaderId;
      let maxC = 0;
      Object.entries(memberCheckinCounts).forEach(([mId, count]) => {
        if (count >= maxC) {
          maxC = count;
          topMId = mId;
        }
      });
      const topMember = members.find((m) => m.userId === topMId) || members[0];

      const expectedCheckins = Math.max(1, members.length * 10);
      const consistencyRate = Math.min(
        100,
        Math.max(60, Math.round((totalCheckins / expectedCheckins) * 100))
      );
      const score = totalCheckins * 120 + consistencyRate * 15 + totalCheers * 5;

      const topContributors = members.map((m) => ({
        id: m.userId,
        name: m.userName,
        avatar: m.userAvatar,
        checkinsCount: m.checkinsCount || 1,
      }));

      const isUserSquad = memberIds.includes(activeUserId);

      return {
        rank: 0,
        team,
        teamId: team.id,
        teamName: team.name,
        motto: team.motto,
        totalCheckins,
        memberCount: memberIds.length,
        maxMembers: team.maxMembers,
        consistencyRate,
        averageCheckinsPerMember: Math.round((totalCheckins / Math.max(1, memberIds.length)) * 10) / 10,
        squadScore: score,
        score,
        topContributorName: topMember?.userName || 'Member',
        topContributorAvatar: topMember?.userAvatar || '',
        topContributorCheckins: Math.max(
          maxC,
          Math.round(totalCheckins / Math.max(1, members.length))
        ),
        topContributors,
        totalCheers,
        isUserSquad,
      };
    });

    squads.sort((a, b) => b.score - a.score);
    squads.forEach((item, index) => {
      item.rank = index + 1;
    });

    const totalCheckinsAll = individuals.reduce((acc, i) => acc + i.daysCompleted, 0);
    const avgDays = individuals.length > 0 ? Math.round((totalCheckinsAll / individuals.length) * 10) / 10 : 0;
    const topStreakVal = individuals.reduce((max, i) => Math.max(max, i.streakInChallenge), 0);

    return {
      individuals,
      squads,
      summary: {
        totalParticipants: individuals.length,
        totalCheckins: totalCheckinsAll,
        cohortActiveStreakRate: Math.round((individuals.filter((i) => i.hasPostedToday || i.daysCompleted > 0).length / Math.max(1, individuals.length)) * 100),
        averageDaysCompleted: avgDays,
        topStreak: topStreakVal,
      },
    };
  }

  // --- DIRECT CHALLENGE INVITE ---
  static sendChallengeInvite(params: {
    challengeId: string;
    targetUserId?: string;
    targetGroupId?: string;
    teamId?: string;
    note?: string;
  }): { message: Message; challenge: Challenge } {
    const currentUser = this.getCurrentUser();
    const challenge = this.getChallengeById(params.challengeId);
    if (!challenge) throw new Error('Challenge not found');

    const targetTeam = params.teamId
      ? (challenge.teams || []).find((t) => t.id === params.teamId)
      : undefined;

    const challengeInvite: ChallengeInvitePreview = {
      challengeId: challenge.id,
      challengeTitle: challenge.title,
      challengeIcon: challenge.icon,
      challengeType: challenge.challengeType,
      durationDays: challenge.durationDays,
      category: challenge.category,
      tag: challenge.tag,
      deadlineDate: challenge.deadlineDate,
      teamId: targetTeam?.id,
      teamName: targetTeam?.name,
      invitedByName: currentUser.name,
      invitedByAvatar: currentUser.avatar,
      note: params.note?.trim() || undefined,
    };

    const inviteText =
      params.note?.trim() ||
      `🎯 I'm challenging you to join "${challenge.title}" (${challenge.durationDays} Days)! Let's conquer this streak together.`;

    const message = this.sendMessage({
      receiverId: params.targetUserId,
      groupId: params.targetGroupId,
      text: inviteText,
      challengeInvite,
    });

    // Also dispatch an AppNotification if inviting a single user
    if (params.targetUserId) {
      const notifs = this.getAllNotifications();
      const newNotif: AppNotification = {
        id: `notif_invite_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'challenge_invite',
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorUsername: currentUser.username,
        actorAvatar: currentUser.avatar,
        actorStreak: currentUser.currentStreak,
        targetId: challenge.id,
        targetPreview: challenge.title,
        message: targetTeam
          ? `invited you to join squad "${targetTeam.name}" in challenge "${challenge.title}"`
          : `invited you to join challenge "${challenge.title}" (${challenge.durationDays} Days)`,
        createdAt: 'Just now',
        timestamp: Date.now(),
        isRead: false,
      };
      this.saveAllNotifications([newNotif, ...notifs]);
    }

    return { message, challenge };
  }

  static acceptChallengeInvite(
    challengeId: string,
    teamId?: string
  ): { challenge: Challenge; joinedTeam?: ChallengeTeam } {
    const currentUser = this.getCurrentUser();
    const joinResult = this.toggleJoinChallenge(challengeId);
    let joinedTeam: ChallengeTeam | undefined;

    if (teamId) {
      const teamResult = this.joinChallengeTeam(challengeId, teamId);
      joinedTeam = teamResult.team;
      return { challenge: teamResult.challenge, joinedTeam };
    }

    return { challenge: joinResult.challenge, joinedTeam };
  }

  // --- CHALLENGE COMMITMENT CALENDAR HELPERS ---
  static getUserChallengePostDates(userId?: string): string[] {
    const activeUserId = userId || this.getCurrentUser().id;
    const allChallenges = this.getAllChallenges();
    const allProgressPosts = this.getAllChallengeProgressPosts();
    const dateSet = new Set<string>();

    // 1. From progress posts
    allProgressPosts
      .filter((p) => p.userId === activeUserId)
      .forEach((p) => {
        if (p.postDate) dateSet.add(p.postDate);
      });

    // 2. From challenge userPostDates maps
    allChallenges.forEach((c) => {
      const dates = c.userPostDates?.[activeUserId] || [];
      dates.forEach((d) => dateSet.add(d));
    });

    return Array.from(dateSet).sort();
  }

  static getChallengePostsByDate(
    dateStr: string,
    userId?: string
  ): Array<{ post: ChallengeProgressPost; challenge: Challenge }> {
    const activeUserId = userId || this.getCurrentUser().id;
    const allChallenges = this.getAllChallenges();
    const allProgressPosts = this.getAllChallengeProgressPosts();
    const results: Array<{ post: ChallengeProgressPost; challenge: Challenge }> = [];

    const matchingPosts = allProgressPosts.filter(
      (p) => p.postDate === dateStr && (!userId || p.userId === activeUserId)
    );

    matchingPosts.forEach((post) => {
      const challenge = allChallenges.find((c) => c.id === post.challengeId);
      if (challenge) {
        results.push({ post, challenge });
      }
    });

    return results;
  }

  // --- WEEKLY CHALLENGE RECAP & MVP GENERATOR ---
  static getAllChallengeWeeklyRecaps(challengeId?: string): ChallengeWeeklyRecap[] {
    const data = localStorage.getItem(STORAGE_KEYS.CHALLENGE_RECAPS);
    if (!data) return [];
    try {
      const parsed: ChallengeWeeklyRecap[] = JSON.parse(data);
      if (challengeId) {
        return parsed.filter((r) => r.challengeId === challengeId);
      }
      return parsed;
    } catch {
      return [];
    }
  }

  static saveChallengeWeeklyRecap(recap: ChallengeWeeklyRecap): void {
    const all = this.getAllChallengeWeeklyRecaps();
    const existingIdx = all.findIndex((r) => r.id === recap.id);
    if (existingIdx >= 0) {
      all[existingIdx] = recap;
    } else {
      all.unshift(recap);
    }
    localStorage.setItem(STORAGE_KEYS.CHALLENGE_RECAPS, JSON.stringify(all));
  }

  static generateWeeklyChallengeRecap(
    challengeId: string,
    targetWeekNumber?: number
  ): ChallengeWeeklyRecap {
    const challenge = this.getChallengeById(challengeId);
    if (!challenge) throw new Error('Challenge not found');

    const allUsers = this.getAllUsers();
    const allProgressPosts = this.getAllChallengeProgressPosts().filter(
      (p) => p.challengeId === challengeId
    );

    const todayStr = getTodayDateString();
    const weekNum = targetWeekNumber || Math.max(1, Math.ceil(challenge.durationDays / 7) - 1 || 1);
    
    // Compute date window (e.g. past 7 days)
    const endD = new Date();
    const startD = new Date();
    startD.setDate(startD.getDate() - 6);

    const startDateStr = startD.toISOString().split('T')[0];
    const endDateStr = todayStr;

    // Filter posts for this challenge
    const weekPosts = allProgressPosts.filter((p) => {
      if (!p.postDate) return true;
      return p.postDate >= startDateStr && p.postDate <= endDateStr;
    });

    const totalCollectiveCheckins = Math.max(weekPosts.length, challenge.teams ? challenge.teams.reduce((acc, t) => acc + (t.totalCheckinsCount || 0), 0) : allProgressPosts.length);
    const activeSquadsCount = challenge.teams?.length || 1;
    const participantCount = Math.max(1, challenge.participantIds?.length || 1);
    const cohortConsistencyRate = Math.min(100, Math.max(72, Math.round((totalCollectiveCheckins / (participantCount * 7)) * 100)));

    // Determine Top Squad
    let topSquad: ChallengeWeeklyRecap['topSquad'] | undefined = undefined;
    if (challenge.teams && challenge.teams.length > 0) {
      const sortedTeams = [...challenge.teams].sort(
        (a, b) => (b.totalCheckinsCount || 0) - (a.totalCheckinsCount || 0)
      );
      const topT = sortedTeams[0];
      topSquad = {
        id: topT.id,
        name: topT.name,
        motto: topT.motto,
        checkinsCount: topT.totalCheckinsCount || totalCollectiveCheckins,
        memberCount: topT.members.length,
      };
    }

    // Determine MVP Contributor for the week
    const userCheckinCounts: Record<string, { checkins: number; cheers: number }> = {};
    weekPosts.forEach((p) => {
      if (!userCheckinCounts[p.userId]) {
        userCheckinCounts[p.userId] = { checkins: 0, cheers: 0 };
      }
      userCheckinCounts[p.userId].checkins += 1;
      userCheckinCounts[p.userId].cheers += p.cheersCount || 0;
    });

    // Also include check-in records from challenge.userPostDates
    if (challenge.userPostDates) {
      Object.entries(challenge.userPostDates).forEach(([uId, dates]) => {
        const countInWeek = dates.filter((d) => d >= startDateStr && d <= endDateStr).length;
        if (!userCheckinCounts[uId]) {
          userCheckinCounts[uId] = { checkins: 0, cheers: 0 };
        }
        userCheckinCounts[uId].checkins = Math.max(userCheckinCounts[uId].checkins, countInWeek || dates.length);
      });
    }

    let topUserId = challenge.createdBy || 'user_1';
    let maxUserScore = -1;

    Object.entries(userCheckinCounts).forEach(([uId, data]) => {
      const score = data.checkins * 10 + data.cheers;
      if (score > maxUserScore) {
        maxUserScore = score;
        topUserId = uId;
      }
    });

    const mvpUserObj = allUsers.find((u) => u.id === topUserId) || allUsers[0] || this.getCurrentUser();
    const userTeam = this.getUserChallengeTeam(challengeId, topUserId);
    const mvpWeeklyCheckins = Math.max(5, userCheckinCounts[topUserId]?.checkins || 7);
    const mvpCheers = Math.max(18, userCheckinCounts[topUserId]?.cheers || 24);

    const mvpTitles = [
      '👑 Iron Consistency MVP',
      '⚡ Pace Setter of the Week',
      '🔥 Unbreakable Finisher',
      '🛡️ Squad Anchor MVP',
      '⭐ High Velocity Champion',
    ];
    const chosenTitle = mvpTitles[(weekNum - 1) % mvpTitles.length];

    const highlights = [
      topSquad
        ? `Squad "${topSquad.name}" led the leaderboard with ${topSquad.checkinsCount} verified proof receipts.`
        : `Cohort achieved ${totalCollectiveCheckins} verified proof receipts this week.`,
      `${mvpUserObj.name} clinched Week ${weekNum} MVP with ${mvpWeeklyCheckins} check-ins and ${mvpCheers} cheers.`,
      `Collective commitment pace held strong at ${cohortConsistencyRate}% across all active squads.`,
      `Zero missed check-in penalties logged during peak accountability hours.`,
    ];

    const recap: ChallengeWeeklyRecap = {
      id: `recap_${challengeId}_w${weekNum}_${Date.now()}`,
      challengeId,
      challengeTitle: challenge.title,
      challengeIcon: challenge.icon,
      challengeType: challenge.challengeType,
      weekNumber: weekNum,
      startDate: startDateStr,
      endDate: endDateStr,
      totalCollectiveCheckins,
      activeSquadsCount,
      cohortConsistencyRate,
      topSquad,
      mvpContributor: {
        userId: mvpUserObj.id,
        userName: mvpUserObj.name,
        userUsername: mvpUserObj.username,
        userAvatar: mvpUserObj.avatar,
        userStreak: mvpUserObj.currentStreak || 7,
        weeklyCheckins: mvpWeeklyCheckins,
        cheersReceived: mvpCheers,
        teamName: userTeam?.name,
        mvpTitle: chosenTitle,
        accolade: `Submitted ${mvpWeeklyCheckins}/7 verified receipts with ${mvpCheers} community cheers!`,
      },
      highlights,
      generatedAt: new Date().toISOString(),
    };

    this.saveChallengeWeeklyRecap(recap);
    return recap;
  }

  static publishChallengeRecapPost(
    challengeId: string,
    recap: ChallengeWeeklyRecap,
    customCommentary?: string
  ): { post: Post; updatedPosts: Post[] } {
    const currentUser = this.getCurrentUser();
    const challenge = this.getChallengeById(challengeId);
    const challengeTitle = challenge?.title || recap.challengeTitle;

    const commentary = customCommentary?.trim() ? `\n\n"${customCommentary.trim()}"` : '';
    const squadShoutout = recap.topSquad
      ? `\n🏆 Top Squad: ${recap.topSquad.name} (${recap.topSquad.checkinsCount} receipts)`
      : '';

    const postContent = `📊 WEEK ${recap.weekNumber} CHALLENGE RECAP: ${recap.challengeIcon} ${challengeTitle}

Collective Progress:
• ${recap.totalCollectiveCheckins} Verified Proofs Logged
• ${recap.cohortConsistencyRate}% Cohort Consistency Rate
• ${recap.activeSquadsCount} Competing Squads${squadShoutout}

👑 Week ${recap.weekNumber} MVP: ${recap.mvpContributor.userName} (@${recap.mvpContributor.userUsername})
${recap.mvpContributor.mvpTitle} — ${recap.mvpContributor.accolade}${commentary}

Keep the momentum alive squads! Let's lock in for next week 🔥`;

    // Cover image fallback
    const recapImage =
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=80';

    const newPost: Post = {
      id: `post_recap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      userStreak: currentUser.currentStreak,
      content: postContent,
      imageUrl: recapImage,
      tags: ['ChallengeRecap', 'WeeklySummary', recap.challengeTitle.replace(/\s+/g, ''), 'MVP', 'Accountability'],
      likesCount: 14,
      likedByMe: true,
      comments: [
        {
          id: `comment_recap_${Date.now()}`,
          postId: '',
          userId: recap.mvpContributor.userId,
          username: recap.mvpContributor.userUsername,
          userAvatar: recap.mvpContributor.userAvatar,
          userStreak: recap.mvpContributor.userStreak,
          content: `Honored to take MVP for Week ${recap.weekNumber}! Let's keep pushing everyone 🚀`,
          createdAt: 'Just now',
        },
      ],
      createdAt: 'Just now',
      isDailyStreakPost: false,
      postDate: getTodayDateString(),
      viewsCount: 38,
      sharesCount: 5,
      isChallengeRecap: true,
      challengeRecapData: recap,
    };

    newPost.comments[0].postId = newPost.id;

    // Save post
    const allPosts = this.getAllPosts();
    const updatedPosts = [newPost, ...allPosts];
    this.saveAllPosts(updatedPosts);

    // Update recap record with published post ID
    const updatedRecap: ChallengeWeeklyRecap = {
      ...recap,
      isPublished: true,
      publishedPostId: newPost.id,
    };
    this.saveChallengeWeeklyRecap(updatedRecap);

    // Broadcast message to Challenge Discussion Chat
    this.sendChallengeTextMessage(
      challengeId,
      `📢 Official Week ${recap.weekNumber} Recap is published! Congratulations to our MVP @${recap.mvpContributor.userUsername} (${recap.mvpContributor.mvpTitle}) and all squads for ${recap.totalCollectiveCheckins} collective check-ins! 🏆 Check out the feed post.`
    );

    // Notify MVP user
    if (recap.mvpContributor.userId !== currentUser.id) {
      const notifs = this.getAllNotifications();
      const mvpNotif: AppNotification = {
        id: `notif_mvp_${Date.now()}`,
        type: 'cheer',
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorUsername: currentUser.username,
        actorAvatar: currentUser.avatar,
        actorStreak: currentUser.currentStreak,
        targetId: newPost.id,
        targetPreview: `Week ${recap.weekNumber} Challenge Recap`,
        message: `awarded you MVP of Week ${recap.weekNumber} in "${challengeTitle}"! 👑`,
        createdAt: 'Just now',
        timestamp: Date.now(),
        isRead: false,
      };
      this.saveAllNotifications([mvpNotif, ...notifs]);
    }

    return { post: newPost, updatedPosts };
  }

  // --- USER NOTES (DM SECTION - WORDS ONLY) ---
  static getAllUserNotes(): UserNote[] {
    const data = localStorage.getItem(STORAGE_KEYS.USER_NOTES);
    if (!data) {
      this.saveAllUserNotes(INITIAL_USER_NOTES);
      return INITIAL_USER_NOTES;
    }
    try {
      const parsed: UserNote[] = JSON.parse(data);
      // Clean expired notes older than 24 hours
      const now = Date.now();
      const valid = parsed.filter((n) => !n.expiresAt || n.expiresAt > now);
      return valid.length > 0 ? valid : INITIAL_USER_NOTES;
    } catch {
      this.saveAllUserNotes(INITIAL_USER_NOTES);
      return INITIAL_USER_NOTES;
    }
  }

  static saveAllUserNotes(notes: UserNote[]): void {
    localStorage.setItem(STORAGE_KEYS.USER_NOTES, JSON.stringify(notes));
  }

  static getCurrentUserNote(): UserNote | undefined {
    const currentUser = this.getCurrentUser();
    const notes = this.getAllUserNotes();
    return notes.find((n) => n.userId === currentUser.id);
  }

  static saveCurrentUserNote(text: string, musicTitle?: string, musicArtist?: string): UserNote {
    const currentUser = this.getCurrentUser();
    const trimmed = text.trim().slice(0, 60); // Strictly max 60 words/chars limit
    const notes = this.getAllUserNotes();
    const existingIndex = notes.findIndex((n) => n.userId === currentUser.id);

    const newNote: UserNote = {
      id: `note_${currentUser.id}_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userUsername: currentUser.username,
      userAvatar: currentUser.avatar,
      text: trimmed,
      musicTitle: musicTitle?.trim() || undefined,
      musicArtist: musicArtist?.trim() || undefined,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24h lifespan
    };

    let updated: UserNote[];
    if (existingIndex >= 0) {
      updated = [...notes];
      updated[existingIndex] = newNote;
    } else {
      updated = [newNote, ...notes];
    }

    this.saveAllUserNotes(updated);
    return newNote;
  }

  static deleteCurrentUserNote(): void {
    const currentUser = this.getCurrentUser();
    const notes = this.getAllUserNotes();
    const updated = notes.filter((n) => n.userId !== currentUser.id);
    this.saveAllUserNotes(updated);
  }

  // --- DAILY DIARY & NOTEBOOK AGGREGATION ---
  static getDayActivityData(dateStr: string, userId?: string) {
    const currentUser = this.getCurrentUser();
    const targetUserId = userId || currentUser.id;
    const allPosts = this.getAllPosts() || [];
    const allCommunities = this.getAllCommunities() || [];
    const allGroups = this.getAllGroups() || [];
    const allUsers = this.getAllUsers() || [];
    const allMessages = this.getAllMessages() || [];
    const allHabits = this.getPersonalHabits() || [];
    const allChallengePosts = this.getAllChallengeProgressPosts() || [];
    const allCollections = currentUser.proofCollections || [];

    // Check if target user has a post for this date
    const isTodayStr = dateStr === getTodayDateString();
    const userPostsOnDate = allPosts.filter((p) => {
      if (p.userId !== targetUserId) return false;
      if (isTodayStr && (p.createdAt === 'Just now' || p.createdAt.includes('m ago') || p.createdAt.includes('h ago') || p.createdAt.includes('11:'))) {
        return true;
      }
      return p.createdAt.includes(dateStr) || (p as any).postDate === dateStr;
    });

    // Check for community posts on date
    const communityPostsOnDate = allPosts.filter((p) => {
      const matchesDate = (p as any).postDate === dateStr || (isTodayStr && (p.createdAt === 'Just now' || p.createdAt.includes('m ago') || p.createdAt.includes('h ago')));
      return Boolean(p.communityId && matchesDate);
    });

    // Challenge posts on date
    const challengePostsOnDate = allChallengePosts.filter((cp) => {
      return (cp.userId === targetUserId || cp.userId === 'user_me') && (cp.postDate === dateStr || (isTodayStr && (cp.createdAt === 'Just now' || cp.createdAt.includes('m ago') || cp.createdAt.includes('h ago'))));
    });

    // Challenge chat messages on date
    const challengeChatsOnDate = allMessages.filter((m) => {
      return Boolean(m.challengeId && (m.senderId === targetUserId || isTodayStr));
    });

    // Contacts / Groups interacted with on date
    const conversationsOnDate: Array<{
      id: string;
      name: string;
      username?: string;
      avatar: string;
      isGroup: boolean;
      lastMessageText: string;
      time: string;
    }> = [];

    const messagesOnDate: Message[] = [];
    allMessages.forEach((msg) => {
      if (msg.senderId === targetUserId || msg.receiverId === targetUserId || msg.groupId) {
        messagesOnDate.push(msg);
      }
      if (msg.groupId) {
        const group = allGroups.find((g) => g.id === msg.groupId);
        if (group && !conversationsOnDate.some((c) => c.id === group.id)) {
          conversationsOnDate.push({
            id: group.id,
            name: group.name,
            avatar: group.avatar,
            isGroup: true,
            lastMessageText: msg.text,
            time: msg.timestamp,
          });
        }
      } else {
        const otherUserId = msg.senderId === targetUserId ? msg.receiverId : msg.senderId;
        if (otherUserId && !conversationsOnDate.some((c) => c.id === otherUserId)) {
          const otherUser = allUsers.find((u) => u.id === otherUserId);
          if (otherUser) {
            conversationsOnDate.push({
              id: otherUser.id,
              name: otherUser.name,
              username: otherUser.username,
              avatar: otherUser.avatar,
              isGroup: false,
              lastMessageText: msg.text,
              time: msg.timestamp,
            });
          }
        }
      }
    });

    // Habits completed on date
    const completedHabits = allHabits.filter((h) => h.completedDates?.includes(dateStr));

    // User note on date
    const allNotes = this.getAllUserNotes();
    const userNote = allNotes.find((n) => n.userId === targetUserId);

    // Saved posts / collections activity
    const savedPosts = allPosts.filter((p) => (p as any).isSaved);

    // Chronological Timeline Builder for complete diary record
    const timelineEvents: Array<{
      id: string;
      time: string;
      category: 'proof' | 'habit' | 'challenge' | 'chat' | 'note' | 'collection';
      title: string;
      description?: string;
      imageUrl?: string;
      tags?: string[];
      badge?: string;
    }> = [];

    // 1. Add Habit completions to timeline
    completedHabits.forEach((habit, idx) => {
      const habitStreak = habit.streak || habit.completedDates?.length || 1;
      timelineEvents.push({
        id: `tl_habit_${habit.id}_${idx}`,
        time: idx % 2 === 0 ? '07:30 AM' : '08:45 AM',
        category: 'habit',
        title: `Completed Habit: ${habit.title}`,
        description: `Maintained ${habitStreak}-day discipline streak for category #${habit.category}`,
        badge: `${habitStreak}d Streak`,
      });
    });

    // 2. Add User Note if present
    if (userNote) {
      timelineEvents.push({
        id: `tl_note_${userNote.id}`,
        time: '09:00 AM',
        category: 'note',
        title: `Shared 24h Note: "${userNote.text}"`,
        description: userNote.musicTitle ? `Audio attached: ${userNote.musicTitle}` : 'Floating thought shared with friends in Direct Messages',
        badge: 'DM Note',
      });
    }

    // 3. Add User Proofs
    userPostsOnDate.forEach((post, idx) => {
      timelineEvents.push({
        id: `tl_post_${post.id}`,
        time: idx === 0 ? '10:15 AM' : '04:30 PM',
        category: 'proof',
        title: `Published Daily Proof: "${post.content.substring(0, 45)}${post.content.length > 45 ? '...' : ''}"`,
        description: post.content,
        imageUrl: post.imageUrl,
        tags: post.tags,
        badge: post.communityName ? `Community: ${post.communityName}` : 'Daily Proof',
      });
    });

    // 4. Add Challenge Check-ins (Individual and Group Squad receipts)
    challengePostsOnDate.forEach((cp) => {
      const isGroup = cp.challengeType === 'group' || Boolean(cp.teamName);
      timelineEvents.push({
        id: `tl_cp_${cp.id}`,
        time: '02:15 PM',
        category: 'challenge',
        title: isGroup
          ? `👥 Squad Receipt Logged • ${cp.teamName || 'Team'} (Day ${cp.dayNumber})`
          : `🎯 Day ${cp.dayNumber} Photo Receipt in Solo Challenge`,
        description: cp.text || (isGroup ? `Submitted squad accountability checkpoint with team ${cp.teamName || ''}.` : 'Mandatory photo proof checkpoint validated and logged to cohort progress.'),
        imageUrl: cp.imageUrl,
        badge: isGroup ? `👥 ${cp.teamName || 'Squad'} Checkpoint` : `Day ${cp.dayNumber} Checkpoint`,
      });
    });

    // 5. Add Community or Direct Chats
    conversationsOnDate.forEach((conv, idx) => {
      timelineEvents.push({
        id: `tl_conv_${conv.id}_${idx}`,
        time: idx === 0 ? '11:40 AM' : '06:20 PM',
        category: 'chat',
        title: conv.isGroup ? `Active in Group: ${conv.name}` : `Direct Message with @${conv.username || conv.name}`,
        description: `Last exchange: "${conv.lastMessageText}"`,
        badge: conv.isGroup ? 'Group Chat' : 'Direct Message',
      });
    });

    // Calculate daily discipline score
    const totalGoals = 5;
    const completedScoreCount = (userPostsOnDate.length > 0 ? 2 : 0) +
      (completedHabits.length > 0 ? 1 : 0) +
      (challengePostsOnDate.length > 0 ? 1 : 0) +
      (userNote ? 1 : 0);
    const disciplineScore = Math.min(100, Math.round((completedScoreCount / totalGoals) * 100));

    // Format display date
    const parts = dateStr.split('-').map(Number);
    const dateObj = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      dateStr,
      formattedDate,
      dayOfWeek,
      isToday: isTodayStr,
      mainPost: userPostsOnDate[0],
      userPosts: userPostsOnDate,
      communityPosts: communityPostsOnDate,
      challengePosts: challengePostsOnDate,
      challengeChats: challengeChatsOnDate,
      conversations: conversationsOnDate,
      messages: messagesOnDate,
      completedHabits,
      userNote,
      savedPosts,
      collections: allCollections,
      milestones: [] as string[],
      timelineEvents,
      disciplineScore,
      totalActivityCount: userPostsOnDate.length +
        communityPostsOnDate.length +
        challengePostsOnDate.length +
        conversationsOnDate.length +
        completedHabits.length +
        (userNote ? 1 : 0),
    };
  }

  // --- DIARY BOOKMARKS & SEARCH HELPERS ---
  private static readonly DIARY_BOOKMARKS_KEY = 'daily_diary_bookmarked_days';

  static getBookmarkedDiaryDays(userId?: string): Array<{ dateStr: string; note?: string; formattedDate: string; createdAt: string }> {
    const targetUserId = userId || this.getCurrentUser().id;
    const raw = localStorage.getItem(`${this.DIARY_BOOKMARKS_KEY}_${targetUserId}`);
    if (!raw) {
      // Default sample bookmark for initial delight
      const today = getTodayDateString();
      const initial = [
        {
          dateStr: today,
          note: 'Current Streak Milestone Record 🔥',
          formattedDate: 'Today',
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(`${this.DIARY_BOOKMARKS_KEY}_${targetUserId}`, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  static isDiaryDayBookmarked(dateStr: string, userId?: string): boolean {
    const bookmarks = this.getBookmarkedDiaryDays(userId);
    return bookmarks.some((b) => b.dateStr === dateStr);
  }

  static toggleBookmarkDiaryDay(
    dateStr: string,
    note?: string,
    userId?: string
  ): { isBookmarked: boolean; allBookmarks: Array<{ dateStr: string; note?: string; formattedDate: string; createdAt: string }> } {
    const targetUserId = userId || this.getCurrentUser().id;
    const bookmarks = this.getBookmarkedDiaryDays(targetUserId);
    const existingIndex = bookmarks.findIndex((b) => b.dateStr === dateStr);

    let updated: Array<{ dateStr: string; note?: string; formattedDate: string; createdAt: string }>;
    let isBookmarked: boolean;

    if (existingIndex >= 0) {
      updated = bookmarks.filter((b) => b.dateStr !== dateStr);
      isBookmarked = false;
    } else {
      const parts = dateStr.split('-').map(Number);
      const dateObj = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      updated = [
        {
          dateStr,
          note: note || 'Bookmarked Milestone Day',
          formattedDate,
          createdAt: new Date().toISOString(),
        },
        ...bookmarks,
      ];
      isBookmarked = true;
    }

    localStorage.setItem(`${this.DIARY_BOOKMARKS_KEY}_${targetUserId}`, JSON.stringify(updated));
    return { isBookmarked, allBookmarks: updated };
  }

  static updateBookmarkNote(dateStr: string, newNote: string, userId?: string): void {
    const targetUserId = userId || this.getCurrentUser().id;
    const bookmarks = this.getBookmarkedDiaryDays(targetUserId);
    const updated = bookmarks.map((b) => (b.dateStr === dateStr ? { ...b, note: newNote } : b));
    localStorage.setItem(`${this.DIARY_BOOKMARKS_KEY}_${targetUserId}`, JSON.stringify(updated));
  }

  /**
   * Search through past diary days (last 60 days) by keywords, tags, habits, or interaction types
   */
  static searchDiaryEntries(
    query: string,
    userId?: string,
    filterType: 'all' | 'proofs' | 'habits' | 'community' | 'chats' | 'high_score' | 'challenges' | 'group_challenges' = 'all'
  ) {
    const targetUserId = userId || this.getCurrentUser().id;
    const cleanQuery = query.trim().toLowerCase();
    const today = new Date();
    const results: Array<{
      dateStr: string;
      formattedDate: string;
      dayOfWeek: string;
      dayData: ReturnType<typeof DailyStorageService.getDayActivityData>;
      matchedSnippets: string[];
      matchCategory: 'proof' | 'habit' | 'community' | 'chat' | 'checkpoint' | 'score' | 'squad';
    }> = [];

    // Scan last 60 days
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayData = this.getDayActivityData(dateStr, targetUserId);
      const matchedSnippets: string[] = [];
      let matchCategory: 'proof' | 'habit' | 'community' | 'chat' | 'checkpoint' | 'score' | 'squad' = 'proof';

      // 1. Proof content matching
      if (filterType === 'all' || filterType === 'proofs') {
        dayData.userPosts.forEach((p) => {
          if (!cleanQuery || p.content.toLowerCase().includes(cleanQuery) || p.tags?.some((t) => t.toLowerCase().includes(cleanQuery))) {
            matchedSnippets.push(`Proof: "${p.content.substring(0, 70)}${p.content.length > 70 ? '...' : ''}"`);
            matchCategory = 'proof';
          }
        });
      }

      // 2. Habits matching
      if (filterType === 'all' || filterType === 'habits') {
        dayData.completedHabits.forEach((h) => {
          if (!cleanQuery || h.title.toLowerCase().includes(cleanQuery) || h.category.toLowerCase().includes(cleanQuery)) {
            matchedSnippets.push(`Habit: ${h.icon || '✓'} ${h.title} (${h.category})`);
            matchCategory = 'habit';
          }
        });
      }

      // 3. Community posts matching
      if (filterType === 'all' || filterType === 'community') {
        dayData.communityPosts.forEach((cp) => {
          if (!cleanQuery || cp.content.toLowerCase().includes(cleanQuery) || cp.communityName?.toLowerCase().includes(cleanQuery)) {
            matchedSnippets.push(`Community (${cp.communityName || 'Hub'}): "${cp.content.substring(0, 60)}..."`);
            matchCategory = 'community';
          }
        });
      }

      // 4. Conversations matching
      if (filterType === 'all' || filterType === 'chats') {
        dayData.conversations.forEach((conv) => {
          if (!cleanQuery || conv.name.toLowerCase().includes(cleanQuery) || conv.lastMessageText.toLowerCase().includes(cleanQuery)) {
            matchedSnippets.push(`Chat with ${conv.name}: "${conv.lastMessageText.substring(0, 50)}..."`);
            matchCategory = 'chat';
          }
        });
      }

      // 5. Challenge & Group Squad Posts matching
      if (filterType === 'all' || filterType === 'challenges' || filterType === 'group_challenges') {
        dayData.challengePosts.forEach((cp) => {
          const isGroup = cp.challengeType === 'group' || Boolean(cp.teamName);
          if (filterType === 'group_challenges' && !isGroup) return;

          if (!cleanQuery || (cp.text && cp.text.toLowerCase().includes(cleanQuery)) || (cp.teamName && cp.teamName.toLowerCase().includes(cleanQuery))) {
            if (isGroup) {
              matchedSnippets.push(`👥 Squad Check-in [${cp.teamName || 'Squad'}]: Day ${cp.dayNumber} "${cp.text ? cp.text.substring(0, 60) : 'Photo Proof'}"`);
              matchCategory = 'squad';
            } else {
              matchedSnippets.push(`🎯 Challenge Check-in: Day ${cp.dayNumber} "${cp.text ? cp.text.substring(0, 60) : 'Photo Proof'}"`);
              matchCategory = 'checkpoint';
            }
          }
        });
      }

      // 6. High Score Filter
      if (filterType === 'high_score') {
        if (dayData.disciplineScore >= 80) {
          matchedSnippets.push(`High Discipline Score: ${dayData.disciplineScore}% with ${dayData.totalActivityCount} completed activities`);
          matchCategory = 'score';
        }
      }

      // If query is provided, only include if matchedSnippets is non-empty
      if (cleanQuery) {
        if (matchedSnippets.length > 0) {
          results.push({
            dateStr,
            formattedDate: dayData.formattedDate,
            dayOfWeek: dayData.dayOfWeek,
            dayData,
            matchedSnippets,
            matchCategory,
          });
        }
      } else {
        // If query is empty but filterType is specified and matchedSnippets exist
        if (filterType !== 'all' && matchedSnippets.length > 0) {
          results.push({
            dateStr,
            formattedDate: dayData.formattedDate,
            dayOfWeek: dayData.dayOfWeek,
            dayData,
            matchedSnippets,
            matchCategory,
          });
        }
      }
    }

    return results;
  }
}


