/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSupabaseClient } from './supabase';
import {
  User,
  Post,
  Comment,
  Community,
  Challenge,
  ChallengeProgressPost,
  Message,
  AppNotification,
  PostDraft,
  ReportReason,
  DEFAULT_USER_AVATAR,
} from '../types';

/**
 * Robust synchronization layer for all 15 Supabase tables:
 * users, profiles, posts, challenges, challenges_members,
 * saves, drafts, likes, comments, follows,
 * communities, community_members, messages, notifications, reports.
 */

// 1. USERS & PROFILES
export async function syncUserAndProfileToSupabase(user: User): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const cleanUsername = (user.username || user.name || 'creator')
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9_]/g, '');

  try {
    // Sync users table
    await client.from('users').upsert(
      {
        id: user.id,
        email: user.email || `${cleanUsername}@dailyapp.io`,
        name: user.name || 'Daily Creator',
        username: cleanUsername,
        avatar: user.avatar,
        bio: user.bio || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    // Sync profiles table
    await client.from('profiles').upsert(
      {
        id: user.id,
        username: cleanUsername,
        name: user.name || 'Daily Creator',
        full_name: user.name || 'Daily Creator',
        avatar: user.avatar,
        avatar_url: user.avatar,
        bio: user.bio || '',
        email: user.email || `${cleanUsername}@dailyapp.io`,
        current_streak: user.currentStreak || 1,
        highest_streak: user.longestStreak || 1,
        longest_streak: user.longestStreak || 1,
        total_proofs: user.totalPosts || 0,
        total_posts: user.totalPosts || 0,
        interests: user.interests || [],
        habits: user.habits || [],
        auth_provider: user.authProvider || 'email',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Supabase users/profiles sync notice:', err);
  }
}

// 2. POSTS
export async function syncPostToSupabase(post: Post): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('posts').upsert(
      {
        id: post.id,
        user_id: post.userId,
        image_url: post.imageUrl || (post.imageUrls && post.imageUrls[0]) || '',
        caption: post.content || '',
        challenge_title: post.challengeName || null,
        category: (post.tags && post.tags[0]) || 'General',
        habit_tag: post.communityName || (post.tags && post.tags[1]) || null,
        streak_day: post.userStreak || 1,
        day_number: post.userStreak || 1,
        likes_count: post.likesCount || 0,
        comments_count: post.comments ? post.comments.length : 0,
        verified: true,
        author_name: post.name,
        author_username: post.username,
        author_avatar: post.userAvatar,
        created_at: post.createdAt || new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Supabase post sync notice:', err);
  }
}

export async function deletePostFromSupabase(postId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('posts').delete().eq('id', postId);
  } catch (err) {
    console.warn('Supabase post delete notice:', err);
  }
}

// 3. CHALLENGES & CHALLENGES_MEMBERS
export async function syncChallengeToSupabase(challenge: Challenge): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('challenges').upsert(
      {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category || 'General',
        creator_id: challenge.createdBy || 'user_me',
        duration_days: challenge.durationDays || 30,
        start_date: challenge.createdAt || null,
        end_date: challenge.deadlineDate || null,
        image_url: challenge.icon || null,
        members_count: challenge.participantsCount || (challenge.participantIds ? challenge.participantIds.length : 1),
        is_official: false,
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Supabase challenge sync notice:', err);
  }
}

export async function syncChallengeMemberToSupabase(
  challengeId: string,
  userId: string,
  currentStreak: number = 1
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('challenges_members').upsert(
      {
        challenge_id: challengeId,
        user_id: userId,
        current_streak: currentStreak,
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'challenge_id,user_id' }
    );
  } catch (err) {
    console.warn('Supabase challenge member sync notice:', err);
  }
}

export async function removeChallengeMemberFromSupabase(
  challengeId: string,
  userId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client
      .from('challenges_members')
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Supabase challenge member remove notice:', err);
  }
}

// 4. SAVES
export async function syncSaveToSupabase(userId: string, postId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('saves').upsert(
      {
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,post_id' }
    );
  } catch (err) {
    console.warn('Supabase save sync notice:', err);
  }
}

export async function removeSaveFromSupabase(userId: string, postId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('saves').delete().eq('user_id', userId).eq('post_id', postId);
  } catch (err) {
    console.warn('Supabase save remove notice:', err);
  }
}

// 5. DRAFTS
export async function syncDraftToSupabase(draft: PostDraft, userId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('drafts').upsert(
      {
        id: draft.id,
        user_id: userId,
        caption: draft.content || '',
        media_url: draft.imageUrl || (draft.imageUrls && draft.imageUrls[0]) || null,
        challenge_id: draft.communityId || null,
        habit_tag: (draft.tags && draft.tags[0]) || null,
        updated_at: new Date(draft.updatedAt || Date.now()).toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Supabase draft sync notice:', err);
  }
}

export async function deleteDraftFromSupabase(draftId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('drafts').delete().eq('id', draftId);
  } catch (err) {
    console.warn('Supabase draft delete notice:', err);
  }
}

// 6. LIKES
export async function syncLikeToSupabase(userId: string, postId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('likes').upsert(
      {
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'post_id,user_id' }
    );
  } catch (err) {
    console.warn('Supabase like sync notice:', err);
  }
}

export async function removeLikeFromSupabase(userId: string, postId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
  } catch (err) {
    console.warn('Supabase like remove notice:', err);
  }
}

// 7. COMMENTS
export async function syncCommentToSupabase(
  postId: string,
  comment: Comment
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('comments').upsert(
      {
        id: comment.id,
        post_id: postId,
        user_id: comment.userId,
        content: comment.content,
        author_name: comment.username,
        author_username: comment.username,
        author_avatar: comment.userAvatar,
        created_at: comment.createdAt || new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Supabase comment sync notice:', err);
  }
}

export async function deleteCommentFromSupabase(commentId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('comments').delete().eq('id', commentId);
  } catch (err) {
    console.warn('Supabase comment delete notice:', err);
  }
}

// 8. FOLLOWS
export async function syncFollowToSupabase(
  followerId: string,
  followingId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('follows').upsert(
      {
        follower_id: followerId,
        following_id: followingId,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'follower_id,following_id' }
    );
  } catch (err) {
    console.warn('Supabase follow sync notice:', err);
  }
}

export async function removeFollowFromSupabase(
  followerId: string,
  followingId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
  } catch (err) {
    console.warn('Supabase follow remove notice:', err);
  }
}

// 9. COMMUNITIES & COMMUNITY_MEMBERS
export async function syncCommunityToSupabase(community: Community): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('communities').upsert(
      {
        id: community.id,
        name: community.name,
        description: community.description,
        category: community.category || 'General',
        image_url: community.avatar || null,
        banner_url: community.coverImage || null,
        creator_id: community.moderatorId || 'user_me',
        members_count: community.memberCount || 1,
        is_private: community.accessType === 'moderated',
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Supabase community sync notice:', err);
  }
}

export async function syncCommunityMemberToSupabase(
  communityId: string,
  userId: string,
  role: string = 'member'
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('community_members').upsert(
      {
        community_id: communityId,
        user_id: userId,
        role,
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'community_id,user_id' }
    );
  } catch (err) {
    console.warn('Supabase community member sync notice:', err);
  }
}

export async function removeCommunityMemberFromSupabase(
  communityId: string,
  userId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);
  } catch (err) {
    console.warn('Supabase community member remove notice:', err);
  }
}

// 10. MESSAGES
export async function syncMessageToSupabase(message: Message): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('messages').upsert(
      {
        id: message.id,
        sender_id: message.senderId,
        receiver_id: message.receiverId || null,
        group_id: message.groupId || null,
        text: message.text || '',
        media_url: message.imageUrl || message.audioUrl || null,
        is_read: message.isRead ?? false,
        created_at: message.timestamp || new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Supabase message sync notice:', err);
  }
}

export async function fetchMessagesFromSupabase(
  userId: string
): Promise<{ success: boolean; messages: Message[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, messages: [], error: 'Supabase client not configured' };
  }

  try {
    const { data, error } = await client
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Could not fetch messages from Supabase:', error);
      return { success: false, messages: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, messages: [] };
    }

    const messages: Message[] = data.map((r: any) => {
      const isVoice =
        r.media_url &&
        (r.media_url.startsWith('data:audio') ||
          r.media_url.includes('.webm') ||
          r.media_url.includes('.wav') ||
          r.media_url.includes('.mp4') ||
          r.text === '🎤 Voice message');
      const isImg = r.media_url && !isVoice;

      return {
        id: r.id,
        conversationId: `conv_${[r.sender_id, r.receiver_id || r.group_id].sort().join('_')}`,
        senderId: r.sender_id,
        receiverId: r.receiver_id || undefined,
        groupId: r.group_id || undefined,
        text: r.text || '',
        imageUrl: isImg ? r.media_url : undefined,
        audioUrl: isVoice ? r.media_url : undefined,
        timestamp: r.created_at
          ? new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Just now',
        isRead: r.is_read ?? false,
      };
    });

    return { success: true, messages };
  } catch (err: any) {
    console.warn('fetchMessagesFromSupabase exception:', err);
    return { success: false, messages: [], error: err?.message };
  }
}

// 11. NOTIFICATIONS
export async function syncNotificationToSupabase(
  notification: AppNotification,
  userId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('notifications').upsert(
      {
        id: notification.id,
        user_id: userId,
        actor_id: notification.actorId || null,
        actor_name: notification.actorName || null,
        actor_avatar: notification.actorAvatar || null,
        type: notification.type,
        message: notification.message || '',
        entity_id: notification.targetId || null,
        is_read: notification.isRead ?? false,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.warn('Supabase notification sync notice:', err);
  }
}

// 12. CONTENT SAFETY & REPORTS
export async function syncReportToSupabase(report: {
  id?: string;
  reporter_id: string;
  post_id?: string;
  reported_user_id?: string;
  reason: ReportReason | string;
  description?: string;
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at?: string;
  entityType?: 'post' | 'user' | 'message' | 'comment';
  entityId?: string;
  details?: string;
}): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    const payload = {
      id: report.id || `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      reporter_id: report.reporter_id,
      post_id: report.post_id || (report.entityType === 'post' ? report.entityId : null),
      reported_user_id: report.reported_user_id || (report.entityType === 'user' ? report.entityId : null),
      reason: String(report.reason),
      description: report.description || report.details || '',
      status: report.status || 'pending',
      created_at: report.created_at || new Date().toISOString(),
      entity_type: report.entityType || (report.post_id ? 'post' : 'user'),
      entity_id: report.entityId || report.post_id || report.reported_user_id || '',
      details: report.description || report.details || null,
    };
    await client.from('reports').insert(payload);
  } catch (err) {
    console.warn('Supabase report sync notice:', err);
  }
}

// 13. POST MODERATION
export async function syncPostModerationToSupabase(
  postId: string,
  status: 'published' | 'under_review' | 'removed',
  reason?: string,
  moderatorId?: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('posts').update({
      moderation_status: status,
      moderation_reason: reason || null,
      moderated_at: new Date().toISOString(),
      moderated_by: moderatorId || null,
    }).eq('id', postId);
  } catch (err) {
    console.warn('Supabase post moderation sync notice:', err);
  }
}

// 14. REAL USERS FETCHING FROM SUPABASE
export async function fetchUsersFromSupabase(): Promise<{ success: boolean; users: User[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, users: [], error: 'Supabase client not configured' };
  }

  try {
    // Try fetching from profiles first, fallback to users table
    let rows: any[] | null = null;
    let queryError: any = null;

    try {
      const res = await client.from('profiles').select('*').order('created_at', { ascending: false });
      rows = res.data;
      queryError = res.error;
    } catch (e) {
      queryError = e;
    }

    if (queryError || !rows) {
      const res = await client.from('users').select('*').order('created_at', { ascending: false });
      rows = res.data;
      queryError = res.error;
    }

    if (queryError) {
      console.warn('Could not fetch users from Supabase:', queryError);
      return { success: false, users: [], error: queryError.message };
    }

    if (!rows || rows.length === 0) {
      return { success: true, users: [] };
    }

    const users: User[] = rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.full_name || 'Daily Creator',
      username: (r.username || 'creator').toLowerCase().replace(/^@/, ''),
      avatar: r.avatar || r.avatar_url || DEFAULT_USER_AVATAR,
      bio: r.bio || '',
      interests: Array.isArray(r.interests) ? r.interests : [],
      habits: Array.isArray(r.habits) ? r.habits : [],
      currentStreak: Number(r.current_streak) || 1,
      longestStreak: Number(r.longest_streak || r.highest_streak) || 1,
      totalPosts: Number(r.total_posts || r.total_proofs) || 0,
      activityDates: [],
      followersCount: 0,
      followingCount: 0,
      followedUserIds: [],
      blockedUserIds: [],
      mutedUserIds: [],
      lastPostedDate: null,
      joinedDate: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      proofCollections: [],
      email: r.email || undefined,
      authProvider: r.auth_provider || 'email',
    }));

    return { success: true, users };
  } catch (err: any) {
    console.warn('fetchUsersFromSupabase exception:', err);
    return { success: false, users: [], error: err?.message };
  }
}

// 15. REAL COMMUNITIES FETCHING FROM SUPABASE
export async function fetchCommunitiesFromSupabase(): Promise<{ success: boolean; communities: Community[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, communities: [], error: 'Supabase client not configured' };
  }

  try {
    const { data, error } = await client.from('communities').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Could not fetch communities from Supabase:', error);
      return { success: false, communities: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, communities: [] };
    }

    // Also fetch members if possible to populate memberIds
    let membersMap: Record<string, string[]> = {};
    try {
      const { data: memberRows } = await client.from('community_members').select('community_id, user_id');
      if (memberRows) {
        memberRows.forEach((m: any) => {
          if (!membersMap[m.community_id]) membersMap[m.community_id] = [];
          membersMap[m.community_id].push(m.user_id);
        });
      }
    } catch {}

    const communities: Community[] = data.map((r: any) => {
      const mIds = membersMap[r.id] || (r.creator_id ? [r.creator_id] : []);
      return {
        id: r.id,
        name: r.name,
        description: r.description || '',
        category: r.category || 'General',
        accessType: r.is_private ? 'moderated' : 'public',
        moderatorId: r.creator_id || 'creator',
        moderatorName: 'Community Creator',
        moderatorUsername: 'creator',
        moderatorAvatar: DEFAULT_USER_AVATAR,
        avatar: r.image_url || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
        coverImage: r.banner_url || undefined,
        themeColor: '#2F6FED',
        memberCount: Math.max(r.members_count || 1, mIds.length),
        memberIds: mIds,
        pendingRequestUserIds: [],
        rules: ['Be respectful and post daily progress'],
        tags: [r.category || 'Community'],
        createdAt: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        lastActivity: 'Active',
      };
    });

    return { success: true, communities };
  } catch (err: any) {
    console.warn('fetchCommunitiesFromSupabase exception:', err);
    return { success: false, communities: [], error: err?.message };
  }
}

// 16. REAL CHALLENGES FETCHING FROM SUPABASE
export async function fetchChallengesFromSupabase(): Promise<{ success: boolean; challenges: Challenge[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, challenges: [], error: 'Supabase client not configured' };
  }

  try {
    const { data, error } = await client.from('challenges').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Could not fetch challenges from Supabase:', error);
      return { success: false, challenges: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: true, challenges: [] };
    }

    // Also fetch members if possible
    let participantsMap: Record<string, string[]> = {};
    try {
      const { data: memberRows } = await client.from('challenges_members').select('challenge_id, user_id');
      if (memberRows) {
        memberRows.forEach((m: any) => {
          if (!participantsMap[m.challenge_id]) participantsMap[m.challenge_id] = [];
          participantsMap[m.challenge_id].push(m.user_id);
        });
      }
    } catch {}

    const challenges: Challenge[] = data.map((r: any) => {
      const pIds = participantsMap[r.id] || (r.creator_id ? [r.creator_id] : []);
      return {
        id: r.id,
        title: r.title,
        description: r.description || '',
        icon: r.image_url || '🎯',
        category: r.category || 'General',
        durationDays: r.duration_days || 30,
        participantsCount: Math.max(r.members_count || 1, pIds.length),
        participantIds: pIds,
        completedUserIds: [],
        createdAt: r.start_date || r.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        deadlineDate: r.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        createdBy: r.creator_id,
        createdByName: 'Creator',
        tag: r.category || 'Challenge',
        challengeType: 'individual' as const,
        teams: [],
        userPostDates: {},
      };
    });

    return { success: true, challenges };
  } catch (err: any) {
    console.warn('fetchChallengesFromSupabase exception:', err);
    return { success: false, challenges: [], error: err?.message };
  }
}

// 17. CHALLENGE PROGRESS POSTS FETCH & SYNC
export async function fetchChallengeProgressPostsFromSupabase(
  challengeId: string,
  challengeTitle?: string
): Promise<{ success: boolean; posts: ChallengeProgressPost[]; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, posts: [], error: 'Supabase client not configured' };
  }

  try {
    let data: any[] | null = null;
    let queryError: any = null;

    // First attempt: try joined query with profiles
    try {
      const orFilters: string[] = [];
      if (challengeId) orFilters.push(`challenge_id.eq."${challengeId}"`);
      if (challengeTitle) {
        orFilters.push(`challenge_title.eq."${challengeTitle}"`);
        orFilters.push(`category.eq."${challengeTitle}"`);
        orFilters.push(`caption.ilike."%${challengeTitle}%"`);
      }

      let res = await client
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (orFilters.length > 0) {
        res = await client
          .from('posts')
          .select('*, profiles(*)')
          .or(orFilters.join(','))
          .order('created_at', { ascending: false });
      }

      if (!res.error && res.data) {
        data = res.data;
      } else {
        queryError = res.error;
      }
    } catch (e) {
      queryError = e;
    }

    // Fallback attempt: simple select without join and filter in memory if needed
    if (!data) {
      const fallbackRes = await client
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fallbackRes.error && fallbackRes.data) {
        const cId = (challengeId || '').toLowerCase();
        const cTitle = (challengeTitle || '').toLowerCase();
        data = fallbackRes.data.filter((r: any) => {
          const matchId = r.challenge_id && r.challenge_id.toLowerCase() === cId;
          const matchTitle = r.challenge_title && r.challenge_title.toLowerCase() === cTitle;
          const matchCat = r.category && r.category.toLowerCase() === cTitle;
          const matchCap = r.caption && cTitle && r.caption.toLowerCase().includes(cTitle);
          return matchId || matchTitle || matchCat || matchCap;
        });
      } else {
        return { success: false, posts: [], error: fallbackRes.error?.message || queryError?.message };
      }
    }

    if (!data || data.length === 0) {
      return { success: true, posts: [] };
    }

    const posts: ChallengeProgressPost[] = data.map((r: any) => {
      const prof = r.profiles || {};
      const img = r.image_url || r.image || '';
      return {
        id: r.id,
        challengeId,
        userId: r.user_id,
        userName: prof.name || prof.full_name || r.author_name || 'Creator',
        userUsername: prof.username || r.author_username || 'creator',
        userAvatar: prof.avatar || prof.avatar_url || r.author_avatar || DEFAULT_USER_AVATAR,
        userStreak: prof.current_streak || r.streak_day || 1,
        dayNumber: r.day_number || r.streak_day || 1,
        imageUrl: img,
        text: r.caption || r.content || '',
        createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Just now',
        postDate: r.created_at ? r.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        cheersCount: r.likes_count || 0,
        cheeredByMe: false,
        challengeType: 'individual' as const,
      };
    }).filter((p) => Boolean(p.imageUrl));

    return { success: true, posts };
  } catch (err: any) {
    console.warn('fetchChallengeProgressPostsFromSupabase exception:', err);
    return { success: false, posts: [], error: err?.message };
  }
}

export async function syncChallengeProgressPostToSupabase(
  post: ChallengeProgressPost,
  challenge: Challenge
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const payload: any = {
    id: post.id,
    user_id: post.userId,
    image_url: post.imageUrl,
    caption: post.text || `Day ${post.dayNumber} proof for ${challenge.title}`,
    challenge_id: challenge.id,
    challenge_title: challenge.title,
    category: challenge.category || challenge.title,
    streak_day: post.dayNumber || 1,
    day_number: post.dayNumber || 1,
    likes_count: post.cheersCount || 0,
    comments_count: 0,
    verified: true,
    author_name: post.userName,
    author_username: post.userUsername,
    author_avatar: post.userAvatar,
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await client.from('posts').upsert(payload, { onConflict: 'id' });
    if (error) {
      // If error might be missing challenge_id column, retry without challenge_id
      delete payload.challenge_id;
      await client.from('posts').upsert(payload, { onConflict: 'id' });
    }

    // Upsert challenges_members record
    await syncChallengeMemberToSupabase(challenge.id, post.userId, post.dayNumber);
  } catch (err) {
    console.warn('syncChallengeProgressPostToSupabase error:', err);
  }
}

// 18. HASHTAGS & TAGS SYNCING
export async function syncHashtagToSupabase(tag: string, userId?: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const clean = tag.replace(/^#/, '').trim().toLowerCase();
  if (!clean) return;

  try {
    await client.from('tags').upsert(
      {
        name: clean,
        created_by: userId || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'name' }
    );
  } catch (err) {
    console.warn('Supabase tag sync notice:', err);
  }
}

export async function fetchHashtagsFromSupabase(): Promise<string[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const foundTags = new Set<string>();

  try {
    const { data: tagRows } = await client.from('tags').select('name');
    if (tagRows) {
      tagRows.forEach((r: any) => {
        if (r.name) foundTags.add(r.name.toLowerCase().trim());
      });
    }
  } catch {}

  try {
    const { data: postRows } = await client.from('posts').select('category, habit_tag, tags, caption');
    if (postRows) {
      postRows.forEach((r: any) => {
        if (r.category && r.category !== 'General') foundTags.add(r.category.toLowerCase().trim());
        if (r.habit_tag) foundTags.add(r.habit_tag.toLowerCase().trim());
        if (Array.isArray(r.tags)) {
          r.tags.forEach((t: string) => foundTags.add(t.replace(/^#/, '').toLowerCase().trim()));
        }
        if (typeof r.caption === 'string') {
          const matches = r.caption.match(/#[a-zA-Z0-9_\u0080-\uFFFF]+/g);
          if (matches) {
            matches.forEach((m: string) => foundTags.add(m.replace(/^#/, '').toLowerCase().trim()));
          }
        }
      });
    }
  } catch {}

  return Array.from(foundTags).filter(Boolean);
}
