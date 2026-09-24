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
  Message,
  AppNotification,
  PostDraft,
  ReportReason,
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

// 12. REPORTS
export async function syncReportToSupabase(
  reporterId: string,
  entityType: 'post' | 'user' | 'message' | 'comment',
  entityId: string,
  reason: ReportReason | string,
  details?: string
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    await client.from('reports').insert({
      reporter_id: reporterId,
      entity_type: entityType,
      entity_id: entityId,
      reason: String(reason),
      details: details || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Supabase report sync notice:', err);
  }
}
