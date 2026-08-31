import { User, Post, Message, Comment, Group, SharedPostPreview, CommunityMemberRanking, PersonalHabit, Community, PostDraft, AppNotification, ProofCollection, Challenge, ChallengeProgressPost } from '../types';
import { INITIAL_CURRENT_USER, SAMPLE_USERS, INITIAL_POSTS, INITIAL_MESSAGES, SAMPLE_GROUPS, INITIAL_PERSONAL_HABITS, INITIAL_COMMUNITIES, INITIAL_NOTIFICATIONS, getPastDate } from '../data/mockData';

const STORAGE_KEYS = {
  CURRENT_USER: 'daily_app_current_user_v1',
  USERS: 'daily_app_users_v1',
  POSTS: 'daily_app_posts_v1',
  MESSAGES: 'daily_app_messages_v1',
  GROUPS: 'daily_app_groups_v1',
  COMMUNITIES: 'daily_app_communities_v1',
  CHALLENGES: 'daily_app_challenges_v1',
  CHALLENGE_PROGRESS_POSTS: 'daily_app_challenge_progress_posts_v1',
  POST_DRAFT: 'daily_app_post_draft_v1',
  DRAFTS: 'daily_app_post_drafts_v2',
  ONBOARDED: 'daily_app_onboarded_v1',
  SAVED_POSTS: 'daily_app_saved_posts_v1',
  REPORTED_POSTS: 'daily_app_reported_posts_v1',
  HABITS: 'daily_app_personal_habits_v1',
  BLOCKED_USERS: 'daily_app_blocked_users_v1',
  NOTIFICATIONS: 'daily_app_notifications_v1',
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

  // Update 3 discipline milestones
  static updateDisciplineMilestones(milestoneIds: string[]): User {
    const currentUser = this.getCurrentUser();
    const safeMilestones = milestoneIds.slice(0, 3);
    const updatedUser = {
      ...currentUser,
      disciplineMilestones: safeMilestones,
    };
    this.saveCurrentUser(updatedUser);
    return updatedUser;
  }

  // Create New Post: Main Daily Post (Limit 1 per day) OR Community Post (Unlimited)
  static createPost(payload: {
    content: string;
    imageUrl?: string;
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
        imageUrl: payload.imageUrl,
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
        imageUrl: payload.imageUrl,
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
      return JSON.parse(data);
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
      return JSON.parse(data);
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
          const nextMemberIds = comm.memberIds.filter((id) => id !== currentUser.id);
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
      return JSON.parse(data);
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
      return JSON.parse(data);
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
      color: params.color || '#D4AF37',
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
      return JSON.parse(data);
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
        id: 'challenge_build_30',
        title: '30 Days of Building',
        description: 'Build and ship real working software every single day for 30 consecutive days. Insert photo proof.',
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
        id: 'cpost_1',
        challengeId: 'challenge_build_30',
        userId: 'user_sarah',
        userName: 'Sarah Chen',
        userUsername: 'sarahcodes',
        userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        userStreak: 21,
        dayNumber: 21,
        imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
        text: 'Day 21 of 30! Built out token authentication, rate-limiting, and error toast alerts.',
        createdAt: '2h ago',
        postDate: getTodayDateString(),
        cheersCount: 28,
        cheeredByMe: true,
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
  }): Challenge {
    const currentUser = this.getCurrentUser();
    const today = getTodayDateString();
    const cleanTag = payload.tag?.trim() || payload.category || 'Challenge';

    const newChallenge: Challenge = {
      id: `challenge_${Date.now()}`,
      title: payload.title.trim(),
      description: payload.description.trim(),
      icon: payload.icon || '🔥',
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
          const nextParticipants = c.participantIds.filter((id) => id !== currentUser.id);
          // If user had completed, keep them in completedUserIds so if they rejoin, they cannot post
          const nextCompleted = isMarkedCompleted
            ? Array.from(new Set([...(c.completedUserIds || []), currentUser.id]))
            : c.completedUserIds || [];

          return {
            ...c,
            participantIds: nextParticipants,
            participantsCount: Math.max(0, nextParticipants.length),
            completedUserIds: nextCompleted,
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
    reason?: string;
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
      };
    }

    const isJoined = (challenge.participantIds || []).includes(targetUserId);
    const postDates = challenge.userPostDates?.[targetUserId] || [];
    const daysCompleted = postDates.length;
    const hasPostedToday = postDates.includes(today);
    
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
      reason,
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

    const currentDates = targetChallenge.userPostDates?.[currentUser.id] || [];
    const nextDates = [...currentDates, today];
    const newDayNumber = nextDates.length;
    const isNowFinished = newDayNumber >= targetChallenge.durationDays;

    const nextCompletedUserIds = isNowFinished
      ? Array.from(new Set([...(targetChallenge.completedUserIds || []), currentUser.id]))
      : targetChallenge.completedUserIds || [];

    const updatedChallenges = allChallenges.map((c) => {
      if (c.id === challengeId) {
        return {
          ...c,
          completedUserIds: nextCompletedUserIds,
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
    };

    const allPosts = this.getAllChallengeProgressPosts();
    this.saveAllChallengeProgressPosts([newProgressPost, ...allPosts]);

    const updatedChallenge = updatedChallenges.find((c) => c.id === challengeId);

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
}

