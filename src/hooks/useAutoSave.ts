import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';
import type { ProjectVersion } from '../store/useStore';

interface UseAutoSaveOptions {
  projectId: string | null;
  data: Partial<ProjectVersion> | null;
  intervalMs?: number;
  enabled?: boolean;
}

export const useAutoSave = ({
  projectId,
  data,
  intervalMs = 30000,
  enabled = true,
}: UseAutoSaveOptions) => {
  const { saveAutoSaveDraft, clearAutoSaveDraft } = useStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number>(0);

  const save = useCallback(() => {
    if (!projectId || !data || !enabled) return;
    saveAutoSaveDraft(projectId, data);
    setLastSavedAt(Date.now());
  }, [projectId, data, enabled, saveAutoSaveDraft]);

  useEffect(() => {
    if (!enabled || !projectId) return;
    timerRef.current = setInterval(save, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [save, intervalMs, enabled, projectId]);

  useEffect(() => {
    const handleUnload = () => save();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [save]);

  const clearDraft = useCallback(() => {
    if (projectId) clearAutoSaveDraft(projectId);
  }, [projectId, clearAutoSaveDraft]);

  return { save, clearDraft, lastSavedAt };
};
