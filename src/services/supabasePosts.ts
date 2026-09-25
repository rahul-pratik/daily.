/**
 * Real Supabase Posts Service
 * Handles production-grade posting flow:
 * 1. Client-side input & file validation
 * 2. Supabase Storage image upload
 * 3. Supabase Database post insertion
 * 4. Error handling with retry safety
 * 5. Feed loading from Supabase
 * 6. Real delete operations
 */

import { getSupabaseClient } from './supabase';
import { Post, User, DEFAULT_USER_AVATAR } from '../types';

export const MAX_POST_CONTENT_LENGTH = 2000;
export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface CreatePostParams {
  userId: string;
  user: User;
  content: string;
  imageInput?: File | string; // Primary image File or base64/URL
  imageUrls?: string[]; // Multiple photos if attached
  photoCaptions?: string[];
  category?: string;
  tags?: string[];
  challengeTitle?: string;
  communityId?: string;
  communityName?: string;
  isCollage?: boolean;
}

export interface PostOperationResult {
  success: boolean;
  post?: Post;
  error?: string;
  isRetryable?: boolean;
}

/**
 * Validate post text & image requirements
 */
export function validatePost(content: string, hasImage: boolean): { valid: boolean; error?: string } {
  const trimmed = content.trim();

  // Rule: Empty post (neither text nor image)
  if (!trimmed && !hasImage) {
    return {
      valid: false,
      error: 'Please add some text or select a photo to publish your post.',
    };
  }

  // Rule: Character length limit
  if (trimmed.length > MAX_POST_CONTENT_LENGTH) {
    return {
      valid: false,
      error: `Post exceeds character limit of ${MAX_POST_CONTENT_LENGTH.toLocaleString()} characters (currently ${trimmed.length.toLocaleString()}).`,
    };
  }

  return { valid: true };
}

/**
 * Convert base64 data URL to Blob
 */
export function dataURLToBlob(dataURL: string): Blob {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1] || 'image/jpeg';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Upload an image to Supabase Storage with bucket discovery and user-scoped paths
 */
export async function uploadPostImage(
  imageInput: File | string,
  userId: string
): Promise<{ success: boolean; publicUrl?: string; storagePath?: string; bucket?: string; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase client is not configured or offline. Please check your connection.',
    };
  }

  let blob: Blob;
  let fileExt = 'jpg';
  let mimeType = 'image/jpeg';

  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('data:')) {
      try {
        blob = dataURLToBlob(imageInput);
        const match = imageInput.match(/data:(image\/[a-zA-Z0-9+.-]+);/);
        if (match && match[1]) {
          mimeType = match[1];
          fileExt = mimeType.split('/')[1] || 'jpg';
        }
      } catch (e: any) {
        return { success: false, error: 'Failed to process image data: ' + (e?.message || 'Invalid data') };
      }
    } else if (imageInput.startsWith('http')) {
      // Already an online URL (e.g. from existing storage or external source)
      return { success: true, publicUrl: imageInput };
    } else {
      return { success: false, error: 'Invalid image format provided.' };
    }
  } else if (imageInput instanceof File) {
    if (!ALLOWED_IMAGE_TYPES.includes(imageInput.type)) {
      return {
        success: false,
        error: `Unsupported image format (${imageInput.type || 'unknown'}). Please choose a JPEG, PNG, or WebP photo.`,
      };
    }
    if (imageInput.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: `Image size is too large (${(imageInput.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is 10MB.`,
      };
    }
    blob = imageInput;
    fileExt = imageInput.name.split('.').pop()?.toLowerCase() || 'jpg';
    mimeType = imageInput.type || 'image/jpeg';
  } else {
    return { success: false, error: 'No valid image provided.' };
  }

  // Generate unique collision-free storage path: {userId}/{timestamp}-{random}.{ext}
  const cleanUserId = (userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '');
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const filePath = `${cleanUserId}/${uniqueId}.${fileExt}`;

  // Try candidate buckets in order of preference
  const candidateBuckets = ['posts', 'media', 'proofs'];
  let lastError: any = null;

  for (const bucketName of candidateBuckets) {
    try {
      const { data, error } = await client.storage
        .from(bucketName)
        .upload(filePath, blob, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: urlData } = client.storage.from(bucketName).getPublicUrl(filePath);
        return {
          success: true,
          publicUrl: urlData.publicUrl,
          storagePath: filePath,
          bucket: bucketName,
        };
      }
      if (error) {
        lastError = error;
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  console.error('Supabase Storage upload error:', lastError);
  return {
    success: false,
    error: lastError?.message || 'Could not upload photo to Supabase Storage. Check network connection and try again.',
  };
}

/**
 * Real Supabase Post Creation Flow:
 * 1. Validate inputs
 * 2. Upload image to Supabase Storage (if photo present)
 * 3. Ensure author profile exists
 * 4. Insert record into Supabase `posts` table
 * 5. Verify confirmation
 * 6. Return genuine Post object
 */
export async function createRealPost(params: CreatePostParams): Promise<PostOperationResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase is not configured or offline. Please check your network connection.',
      isRetryable: true,
    };
  }

  const rawImages = params.imageUrls && params.imageUrls.length > 0
    ? params.imageUrls
    : (params.imageInput ? [params.imageInput] : []);

  const hasImage = rawImages.length > 0;
  const validation = validatePost(params.content, hasImage);
  if (!validation.valid) {
    return { success: false, error: validation.error, isRetryable: false };
  }

  // Resolve authenticated user ID
  let effectiveUserId = params.userId;
  try {
    const { data: authData } = await client.auth.getUser();
    if (authData?.user?.id) {
      effectiveUserId = authData.user.id;
    }
  } catch (authErr) {
    console.warn('Auth user resolution notice:', authErr);
  }

  const uploadedUrls: string[] = [];
  const uploadedPaths: { bucket: string; path: string }[] = [];

  // Step 1: Upload images if present
  if (rawImages.length > 0) {
    for (let i = 0; i < rawImages.length; i++) {
      const img = rawImages[i];
      const uploadResult = await uploadPostImage(img, effectiveUserId);
      if (!uploadResult.success || !uploadResult.publicUrl) {
        // Cleanup already uploaded files if one failed
        for (const up of uploadedPaths) {
          try {
            await client.storage.from(up.bucket).remove([up.path]);
          } catch {}
        }
        return {
          success: false,
          error: uploadResult.error || `Failed to upload photo #${i + 1}. Please try again.`,
          isRetryable: true,
        };
      }
      uploadedUrls.push(uploadResult.publicUrl);
      if (uploadResult.bucket && uploadResult.storagePath) {
        uploadedPaths.push({ bucket: uploadResult.bucket, path: uploadResult.storagePath });
      }
    }
  }

  const primaryUploadedUrl = uploadedUrls[0] || '';

  // Step 2: Ensure profile row exists in public.profiles to satisfy foreign key constraint
  try {
    await client.from('profiles').upsert(
      {
        id: effectiveUserId,
        username: params.user.username || 'creator',
        name: params.user.name || 'Creator',
        full_name: params.user.name || 'Creator',
        avatar: params.user.avatar || DEFAULT_USER_AVATAR,
        avatar_url: params.user.avatar || DEFAULT_USER_AVATAR,
        current_streak: params.user.currentStreak || 1,
        email: params.user.email || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  } catch (profileErr) {
    console.warn('Profile upsert notice:', profileErr);
  }

  // Step 3: Insert into Supabase `posts` table
  const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const finalCategory = params.category || (params.tags && params.tags[0]) || 'General';
  const finalCaption = params.content.trim();

  const postPayload: Record<string, any> = {
    id: postId,
    user_id: effectiveUserId,
    caption: finalCaption,
    content: finalCaption,
    image: primaryUploadedUrl,
    image_url: primaryUploadedUrl,
    category: finalCategory,
    challenge_title: params.challengeTitle || null,
    streak_day: params.user.currentStreak || 1,
    day_number: params.user.currentStreak || 1,
    likes_count: 0,
    comments_count: 0,
    verified: true,
    author_name: params.user.name || 'Creator',
    author_username: params.user.username || 'creator',
    author_avatar: params.user.avatar || DEFAULT_USER_AVATAR,
    created_at: new Date().toISOString(),
  };

  try {
    // Attempt insert with select
    const { data, error } = await client
      .from('posts')
      .insert(postPayload)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase DB post insert error:', error);

      // Best-effort cleanup of orphaned storage images if database insertion fails
      for (const up of uploadedPaths) {
        try {
          await client.storage.from(up.bucket).remove([up.path]);
        } catch (cleanupErr) {
          console.warn('Storage cleanup notice:', cleanupErr);
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message || 'Could not save post record'}. Please retry.`,
        isRetryable: true,
      };
    }

    // Step 4: Construct confirmed Post object from database record
    const record = data || postPayload;

    const confirmedPost: Post = {
      id: record.id || postId,
      userId: record.user_id || effectiveUserId,
      name: record.author_name || params.user.name || 'Creator',
      username: record.author_username || params.user.username || 'creator',
      userAvatar: record.author_avatar || params.user.avatar || DEFAULT_USER_AVATAR,
      userStreak: record.streak_day || params.user.currentStreak || 1,
      content: record.caption || record.content || finalCaption,
      imageUrl: primaryUploadedUrl || undefined,
      imageUrls: uploadedUrls.length > 0 ? uploadedUrls : (primaryUploadedUrl ? [primaryUploadedUrl] : undefined),
      photoCaptions: params.photoCaptions,
      tags: params.tags && params.tags.length > 0 ? params.tags : [finalCategory],
      likesCount: record.likes_count || 0,
      likedByMe: false,
      comments: [],
      createdAt: 'Just now',
      isDailyStreakPost: true,
      challengeName: record.challenge_title || params.challengeTitle || undefined,
      communityId: params.communityId,
      communityName: params.communityName,
      isCollage: params.isCollage,
    };

    return {
      success: true,
      post: confirmedPost,
    };
  } catch (err: any) {
    console.error('Network / unexpected error during post creation:', err);

    for (const up of uploadedPaths) {
      try {
        await client.storage.from(up.bucket).remove([up.path]);
      } catch {}
    }

    return {
      success: false,
      error: err?.message || "Couldn't publish your post to Supabase. Check your connection and try again.",
      isRetryable: true,
    };
  }
}

/**
 * Fetch real feed posts from Supabase database
 */
export async function fetchFeedPostsFromSupabase(): Promise<{
  success: boolean;
  posts: Post[];
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      posts: [],
      error: 'Supabase client is not available. Please check configuration.',
    };
  }

  try {
    // Try query with profile relationship; fallback to direct select if relation join is unavailable
    let data: any[] | null = null;
    let queryError: any = null;

    try {
      const res = await client
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });
      data = res.data;
      queryError = res.error;
    } catch (joinErr) {
      queryError = joinErr;
    }

    if (queryError) {
      // Fallback query without relation join
      const res = await client
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      data = res.data;
      queryError = res.error;
    }

    if (queryError) {
      console.error('Failed to fetch posts from Supabase:', queryError);
      return {
        success: false,
        posts: [],
        error: queryError.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        posts: [], // Genuinely empty feed if no posts exist in Supabase
      };
    }

    const posts: Post[] = data.map((row: any) => {
      const profile = row.profiles || {};
      const img = row.image_url || row.image || '';

      return {
        id: row.id,
        userId: row.user_id,
        name: profile.name || profile.full_name || row.author_name || 'Creator',
        username: profile.username || row.author_username || 'creator',
        userAvatar: profile.avatar || profile.avatar_url || row.author_avatar || DEFAULT_USER_AVATAR,
        userStreak: profile.current_streak || row.streak_day || 1,
        content: row.caption || row.content || '',
        imageUrl: img ? img : undefined,
        imageUrls: img ? [img] : undefined,
        tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : [row.category || 'General'].filter(Boolean),
        likesCount: row.likes_count || 0,
        likedByMe: false,
        comments: [],
        createdAt: formatPostDate(row.created_at),
        isDailyStreakPost: true,
        challengeName: row.challenge_title || undefined,
        verified: row.verified ?? true,
      };
    });

    return {
      success: true,
      posts,
    };
  } catch (err: any) {
    console.error('Unexpected error fetching feed posts:', err);
    return {
      success: false,
      posts: [],
      error: err?.message || 'Network error while loading feed.',
    };
  }
}

/**
 * Real Supabase Post Deletion
 */
export async function deleteRealPost(postId: string, userId: string, postImageUrl?: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured or offline.' };
  }

  try {
    const { error } = await client
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase delete post error:', error);
      return { success: false, error: error.message || 'Could not delete post from database.' };
    }

    // Optional: remove media from storage if path can be extracted
    if (postImageUrl && postImageUrl.includes('/storage/v1/object/public/')) {
      try {
        const parts = postImageUrl.split('/storage/v1/object/public/');
        if (parts[1]) {
          const [bucket, ...pathParts] = parts[1].split('/');
          const objectPath = pathParts.join('/');
          if (bucket && objectPath) {
            await client.storage.from(bucket).remove([objectPath]);
          }
        }
      } catch (storageErr) {
        console.warn('Storage image cleanup on delete notice:', storageErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete post:', err);
    return { success: false, error: err?.message || 'Failed to delete post. Check connection.' };
  }
}

function formatPostDate(isoString: string): string {
  if (!isoString) return 'Today';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}
