import { useEffect, useRef, useCallback, useState } from 'react';
import { blogsControllerUpdate } from '@services/generated/blogs/blogs';

const DRAFT_PREFIX = 'blog-draft-';
const AUTO_SAVE_DELAY = 3000;

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DraftData {
  title: string;
  content: string;
  tags: string[];
  cover: string;
  mdTheme: string;
  category: string;
  summary: string;
  timestamp: number;
}

function getDraftKey(blogId?: string): string {
  return `${DRAFT_PREFIX}${blogId || 'new'}`;
}

function saveDraftToStorage(key: string, data: Omit<DraftData, 'timestamp'>) {
  const draft: DraftData = {
    ...data,
    timestamp: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(draft));
}

function loadDraftFromStorage(key: string): DraftData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

function removeDraftFromStorage(key: string) {
  localStorage.removeItem(key);
}

interface UseAutoSaveDraftOptions {
  blogId?: string;
  title: string;
  content: string;
  tags: string[];
  cover: string;
  mdTheme: string;
  category: string;
  summary?: string;
  enabled?: boolean;
}

interface UseAutoSaveDraftReturn {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  restoreDraft: () => DraftData | null;
  clearDraft: () => void;
  hasDraft: boolean;
}

export function useAutoSaveDraft({
  blogId,
  title,
  content,
  tags,
  cover,
  mdTheme,
  category,
  summary = '',
  enabled = true,
}: UseAutoSaveDraftOptions): UseAutoSaveDraftReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);
  const skipNextSave = useRef(false);
  const statusRef = useRef<AutoSaveStatus>('idle');

  const draftKey = getDraftKey(blogId);
  const isEditMode = !!blogId;

  const doSave = useCallback(async () => {
    const data = { title, content, tags, cover, mdTheme, category, summary };

    if (!title.trim() && !content.trim()) {
      setStatus('idle');
      statusRef.current = 'idle';
      return;
    }

    setStatus('saving');
    statusRef.current = 'saving';

    try {
      if (isEditMode) {
        await blogsControllerUpdate(blogId!, {
          title: title.trim() || undefined,
          content: content.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          cover: cover.trim() || undefined,
          mdTheme: mdTheme !== 'default' ? mdTheme : undefined,
          summary: summary.trim() || undefined,
        } as Parameters<typeof blogsControllerUpdate>[1]);
        removeDraftFromStorage(draftKey);
        setHasDraft(false);
      } else {
        saveDraftToStorage(draftKey, data);
        setHasDraft(true);
      }

      setStatus('saved');
      statusRef.current = 'saved';
      setLastSavedAt(new Date());
    } catch {
      setStatus('error');
      statusRef.current = 'error';
    }
  }, [blogId, isEditMode, title, content, tags, cover, mdTheme, category, summary, draftKey]);

  useEffect(() => {
    if (!enabled) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      const existing = loadDraftFromStorage(draftKey);
      setHasDraft(!!existing);
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      doSave();
    }, AUTO_SAVE_DELAY);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [title, content, tags, cover, mdTheme, category, summary, enabled, draftKey, doSave]);

  const restoreDraft = useCallback((): DraftData | null => {
    const draft = loadDraftFromStorage(draftKey);
    if (draft) {
      skipNextSave.current = true;
      setHasDraft(true);
    }
    return draft;
  }, [draftKey]);

  const clearDraft = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    removeDraftFromStorage(draftKey);
    setHasDraft(false);
    setStatus('idle');
    statusRef.current = 'idle';
  }, [draftKey]);

  return {
    status,
    lastSavedAt,
    restoreDraft,
    clearDraft,
    hasDraft,
  };
}

export function checkDraftExists(blogId?: string): boolean {
  const key = getDraftKey(blogId);
  return loadDraftFromStorage(key) !== null;
}

export function getDraft(blogId?: string): DraftData | null {
  return loadDraftFromStorage(getDraftKey(blogId));
}
