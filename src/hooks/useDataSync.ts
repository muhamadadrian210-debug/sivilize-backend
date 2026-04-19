/**
 * Hook untuk sinkronisasi data proyek antara Zustand (lokal) dan server
 * Memastikan data tidak hilang saat ganti HP atau clear browser
 */
import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { projectService } from '../services/api';

export function useDataSync() {
  const { projects, setProjects, isAuthenticated, user } = useStore();
  const syncedRef = useRef(false);
  const lastSyncRef = useRef<number>(0);

  // Pull data dari server saat pertama login
  const pullFromServer = useCallback(async () => {
    if (!isAuthenticated || syncedRef.current) return;
    try {
      const response = await projectService.getProjects();
      if (response.success && response.data && response.data.length > 0) {
        // Merge: server data lebih prioritas, tapi jangan hapus data lokal yang belum di-sync
        const serverIds = new Set(response.data.map((p: { id: string }) => p.id));
        const localOnly = projects.filter(p => !serverIds.has(p.id));
        setProjects([...response.data, ...localOnly]);
      }
      syncedRef.current = true;
      lastSyncRef.current = Date.now();
    } catch {
      // Gagal sync — tetap pakai data lokal
      console.log('ℹ️ Menggunakan data lokal (server tidak tersedia)');
    }
  }, [isAuthenticated, projects, setProjects]);

  // Sync saat login
  useEffect(() => {
    if (isAuthenticated && user) {
      syncedRef.current = false;
      pullFromServer();
    }
  }, [isAuthenticated, user?.id]);

  // Re-sync setiap 5 menit jika ada perubahan
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSyncRef.current > 5 * 60 * 1000) {
        syncedRef.current = false;
        pullFromServer();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, pullFromServer]);

  return { pullFromServer };
}
