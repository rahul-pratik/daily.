import { useState, useEffect, useRef, useCallback } from 'react';
import { PostDraft } from '../types';
import { DailyStorageService } from '../services/storage';

interface UseAutoSaveDraftOptions {
  userId: string;
  initialDraftId?: string;
  initialContent?: string;
  initialImageUrl?: string;
  initialTags?: string[];
  initialScheduledAt?: string;
  initialIsScheduled?: boolean;
  communityId?: string;
  communityName?: string;
  isCollage?: boolean;
  enabled?: boolean;
}

const AUTOSAVE_STORAGE_KEY = 'daily_app_autosave_in_progress_v1';

export function useAutoSaveDraft({
  userId,
  initialDraftId,
  initialContent = '',
  initialImageUrl = '',
  initialTags = ['Building'],
  initialScheduledAt,
  initialIsScheduled = false,
  communityId,
  communityName,
  isCollage = false,
  enabled = true,
}: UseAutoSaveDraftOptions) {
  // Check if there is an autosaved draft in localStorage
  const getInitialState = () => {
    if (initialDraftId) {
      const existing = DailyStorageService.getDraftById(userId, initialDraftId);
      if (existing) {
        return {
          draftId: existing.id,
          content: existing.content || '',
          imageUrl: existing.imageUrl || '',
          tags: existing.tags && existing.tags.length > 0 ? existing.tags : ['Building'],
          isScheduled: Boolean(existing.isScheduled),
          scheduledAt: existing.scheduledAt,
          communityId: existing.communityId,
          communityName: existing.communityName,
          isCollage: existing.isCollage || false,
        };
      }
    }

    if (initialContent || initialImageUrl) {
      return {
        draftId: initialDraftId,
        content: initialContent,
        imageUrl: initialImageUrl,
        tags: initialTags,
        isScheduled: initialIsScheduled,
        scheduledAt: initialScheduledAt,
        communityId,
        communityName,
        isCollage,
      };
    }

    // Try reading active autosave cache
    try {
      const cached = localStorage.getItem(`${AUTOSAVE_STORAGE_KEY}_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.content || parsed.imageUrl)) {
          return {
            draftId: parsed.id,
            content: parsed.content || '',
            imageUrl: parsed.imageUrl || '',
            tags: parsed.tags || ['Building'],
            isScheduled: Boolean(parsed.isScheduled),
            scheduledAt: parsed.scheduledAt,
            communityId: parsed.communityId,
            communityName: parsed.communityName,
            isCollage: Boolean(parsed.isCollage),
          };
        }
      }
    } catch {
      // ignore
    }

    return {
      draftId: initialDraftId,
      content: initialContent,
      imageUrl: initialImageUrl,
      tags: initialTags,
      isScheduled: initialIsScheduled,
      scheduledAt: initialScheduledAt,
      communityId,
      communityName,
      isCollage,
    };
  };

  const initialState = getInitialState();

  const [draftId, setDraftId] = useState<string | undefined>(initialState.draftId);
  const [content, setContent] = useState<string>(initialState.content);
  const [imageUrl, setImageUrl] = useState<string>(initialState.imageUrl);
  const [tags, setTags] = useState<string[]>(initialState.tags);
  const [isScheduled, setIsScheduled] = useState<boolean>(initialState.isScheduled);
  const [scheduledAt, setScheduledAt] = useState<string | undefined>(initialState.scheduledAt);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Save draft worker
  const performSave = useCallback(
    (currentContent: string, currentImageUrl: string, currentTags: string[], sched: boolean, schedAt?: string) => {
      if (!enabled) return;

      const hasContent = Boolean(currentContent.trim() || currentImageUrl.trim());
      if (!hasContent) {
        // Clear autosave cache if empty
        localStorage.removeItem(`${AUTOSAVE_STORAGE_KEY}_${userId}`);
        return;
      }

      setIsSaving(true);

      const targetId = draftId || `draft_auto_${Date.now()}`;
      if (!draftId) {
        setDraftId(targetId);
      }

      const draftPayload: PostDraft = {
        id: targetId,
        title: currentContent.trim().slice(0, 30) || 'Untitled Draft',
        content: currentContent,
        imageUrl: currentImageUrl || undefined,
        tags: currentTags,
        updatedAt: Date.now(),
        scheduledAt: sched ? schedAt : undefined,
        isScheduled: sched,
        communityId,
        communityName,
        isCollage,
      };

      // Persist in local storage autosave buffer
      try {
        localStorage.setItem(`${AUTOSAVE_STORAGE_KEY}_${userId}`, JSON.stringify(draftPayload));
      } catch {
        // fallback
      }

      // Also persist to formal drafts in DailyStorageService
      DailyStorageService.saveDraft(userId, {
        id: targetId,
        title: draftPayload.title,
        content: draftPayload.content,
        imageUrl: draftPayload.imageUrl,
        tags: draftPayload.tags,
        scheduledAt: draftPayload.scheduledAt,
        isScheduled: draftPayload.isScheduled,
        communityId: draftPayload.communityId,
        communityName: draftPayload.communityName,
        isCollage: draftPayload.isCollage,
      });

      setTimeout(() => {
        if (isMountedRef.current) {
          setIsSaving(false);
          setLastSavedAt(Date.now());
          setHasUnsavedChanges(false);
        }
      }, 300);
    },
    [userId, draftId, enabled, communityId, communityName, isCollage]
  );

  // Trigger debounced autosave on state changes
  useEffect(() => {
    if (!enabled) return;

    const hasAnyContent = Boolean(content.trim() || imageUrl.trim());
    if (!hasAnyContent) return;

    setHasUnsavedChanges(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave(content, imageUrl, tags, isScheduled, scheduledAt);
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, imageUrl, tags, isScheduled, scheduledAt, enabled, performSave]);

  // Immediate save on demand
  const saveNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    performSave(content, imageUrl, tags, isScheduled, scheduledAt);
  }, [content, imageUrl, tags, isScheduled, scheduledAt, performSave]);

  // Clear current draft and autosave buffer (e.g. after successful post)
  const clearDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    localStorage.removeItem(`${AUTOSAVE_STORAGE_KEY}_${userId}`);
    if (draftId) {
      DailyStorageService.deleteDraft(userId, draftId);
    }
    setContent('');
    setImageUrl('');
    setTags(['Building']);
    setIsScheduled(false);
    setScheduledAt(undefined);
    setDraftId(undefined);
    setHasUnsavedChanges(false);
    setLastSavedAt(null);
  }, [userId, draftId]);

  // Discard draft without saving
  const discardDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    localStorage.removeItem(`${AUTOSAVE_STORAGE_KEY}_${userId}`);
    if (draftId) {
      DailyStorageService.deleteDraft(userId, draftId);
    }
    setContent('');
    setImageUrl('');
    setTags(['Building']);
    setIsScheduled(false);
    setDraftId(undefined);
    setHasUnsavedChanges(false);
  }, [userId, draftId]);

  return {
    content,
    setContent,
    imageUrl,
    setImageUrl,
    tags,
    setTags,
    isScheduled,
    setIsScheduled,
    scheduledAt,
    setScheduledAt,
    draftId,
    setDraftId,
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
    saveNow,
    clearDraft,
    discardDraft,
  };
}
